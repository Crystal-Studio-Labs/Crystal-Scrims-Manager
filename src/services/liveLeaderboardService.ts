import { ChannelType, PermissionFlagsBits, EmbedBuilder, type TextChannel } from 'discord.js';
import { db, scrimLobbies, guilds } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { PointsService } from './pointsService.js';
import { createBaseEmbed, COLORS } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import type { ExtendedClient } from '../client/ExtendedClient.js';

export class LiveLeaderboardService {
  /**
   * Provision a dedicated event-specific leaderboard channel in the scrims category
   */
  public static async createOrAttachLiveChannel(
    client: ExtendedClient,
    lobbyId: string,
    guildId: string
  ): Promise<{ channelId: string; messageId: string } | null> {
    try {
      const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
      if (!lobby) return null;

      // If channel already exists and is valid, return it
      if (lobby.liveLeaderboardChannelId && lobby.liveLeaderboardMessageId) {
        return {
          channelId: lobby.liveLeaderboardChannelId,
          messageId: lobby.liveLeaderboardMessageId,
        };
      }

      const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
      if (!guild) return null;

      const guildConfig = await db.select().from(guilds).where(eq(guilds.guildId, guildId)).get();
      const parentCategory = guildConfig?.scrimCategoryId || undefined;

      const channelName = `📊・event-${lobbyId.toLowerCase()}-standings`;

      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: parentCategory,
        topic: `Live auto-updating points table for ${lobby.title} [${lobby.lobbyId}]`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
      });

      // Post initial embed
      const initialEmbed = createBaseEmbed(`📊 Live Standings: ${lobby.title}`)
        .setColor(COLORS.CRYSTAL)
        .setDescription(
          `🎮 **Game**: \`${lobby.gameType}\` (${lobby.tier})\n` +
          `🔑 **Lobby ID**: \`${lobby.lobbyId}\`\n` +
          `⚡ **Status**: \`${lobby.status}\`\n\n` +
          `*Waiting for match rounds to conclude. Standings will update here in real-time as scores are recorded.*`
        )
        .setFooter({ text: 'Auto-updating live board • Crystal Scrims Manager' })
        .setTimestamp();

      const message = await channel.send({ embeds: [initialEmbed] });

      // Save to database
      await db.update(scrimLobbies)
        .set({
          liveLeaderboardChannelId: channel.id,
          liveLeaderboardMessageId: message.id,
        })
        .where(eq(scrimLobbies.lobbyId, lobbyId));

      logger.info(`Provisioned live leaderboard channel for lobby ${lobbyId}: #${channel.name}`);

      return {
        channelId: channel.id,
        messageId: message.id,
      };
    } catch (err: any) {
      logger.error(`Failed to provision live leaderboard channel for ${lobbyId}:`, err);
      return null;
    }
  }

  /**
   * Recompute and edit the live leaderboard embed in real-time
   */
  public static async updateLiveLeaderboard(client: ExtendedClient, lobbyId: string) {
    try {
      const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
      if (!lobby || !lobby.liveLeaderboardChannelId || !lobby.liveLeaderboardMessageId) {
        return;
      }

      const channel = (await client.channels.fetch(lobby.liveLeaderboardChannelId).catch(() => null)) as TextChannel | null;
      if (!channel || !channel.isTextBased()) return;

      const message = await channel.messages.fetch(lobby.liveLeaderboardMessageId).catch(() => null);
      if (!message) return;

      const { results } = await PointsService.getLeaderboard(lobbyId);

      let tableText = '';
      if (results.length === 0) {
        tableText = '*No match results recorded yet for this event.*';
      } else {
        tableText = '```prolog\n';
        tableText += `${'Rank'.padEnd(5)} ${'Team'.padEnd(16)} ${'Plac'.padEnd(6)} ${'Kills'.padEnd(6)} ${'Total'.padEnd(6)}\n`;
        tableText += '-'.repeat(42) + '\n';

        const displayRows = results.slice(0, 20);
        displayRows.forEach((row, idx) => {
          const rank = `#${idx + 1}`.padEnd(5);
          const name = (row.teamName.length > 14 ? row.teamName.slice(0, 13) + '…' : row.teamName).padEnd(16);
          const plac = String(row.placementPoints).padEnd(6);
          const kills = String(row.kills).padEnd(6);
          const total = String(row.totalPoints).padEnd(6);
          tableText += `${rank} ${name} ${plac} ${kills} ${total}\n`;
        });

        if (results.length > 20) {
          tableText += `... +${results.length - 20} more teams in web dashboard\n`;
        }
        tableText += '```';
      }

      const embed = createBaseEmbed(`📊 Live Standings: ${lobby.title}`)
        .setColor(COLORS.CRYSTAL)
        .setDescription(
          `🎮 **Game**: \`${lobby.gameType}\` (${lobby.tier})\n` +
          `🔑 **Lobby ID**: \`${lobby.lobbyId}\` • **Status**: \`${lobby.status}\`\n\n` +
          `🏆 **Official Standings (Real-Time Auto-Refresh)**:\n` +
          tableText +
          `\n*Refreshed automatically when organizers submit round points.*`
        )
        .setFooter({ text: 'Live Auto-Sync • Crystal Scrims Manager' })
        .setTimestamp();

      await message.edit({ embeds: [embed] });
      logger.debug(`Updated live leaderboard message for lobby ${lobbyId}`);
    } catch (err: any) {
      logger.error(`Failed to update live leaderboard message for ${lobbyId}:`, err);
    }
  }

  /**
   * Start background sync interval to auto-refresh all live events
   */
  public static startPeriodicSync(client: ExtendedClient, intervalMs = 60000) {
    setInterval(async () => {
      try {
        const activeLobbies = await db.select().from(scrimLobbies)
          .where(and(eq(scrimLobbies.status, 'LIVE')))
          .all();

        for (const lobby of activeLobbies) {
          if (lobby.liveLeaderboardChannelId) {
            await this.updateLiveLeaderboard(client, lobby.lobbyId);
          }
        }
      } catch (err) {
        logger.error('Error during periodic live leaderboard sync:', err);
      }
    }, intervalMs);
  }
}
