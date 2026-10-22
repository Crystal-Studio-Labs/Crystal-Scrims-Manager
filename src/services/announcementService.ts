import { EmbedBuilder, type TextChannel } from 'discord.js';
import { db, guilds, scrimLobbies } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';
import { COLORS } from '../utils/embeds.js';
import type { ExtendedClient } from '../client/ExtendedClient.js';

export interface OutcomeParams {
  guildId: string;
  lobbyId?: string;
  outcome: 'WIN' | 'LOSS' | 'DRAW';
  teamA: string;
  teamB?: string;
  score?: string;
  kills?: number;
  mvp?: string;
  customImageUrl?: string;
}

export class AnnouncementService {
  /**
   * Broadcast an automated pre-defined match outcome announcement
   */
  public static async broadcastOutcome(client: ExtendedClient, params: OutcomeParams) {
    const guildConfig = await db.select().from(guilds).where(eq(guilds.guildId, params.guildId)).get();
    
    // Find target announcement channel
    let targetChannelId = guildConfig?.announcementsChannelId || guildConfig?.slotlistChannelId;
    let lobbyTitle = 'Competitive Match';
    let gameType = 'Esports Scrims';
    let tier = 'Open';

    if (params.lobbyId) {
      const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, params.lobbyId)).get();
      if (lobby) {
        lobbyTitle = lobby.title;
        gameType = lobby.gameType;
        tier = lobby.tier;
        if (!targetChannelId && lobby.registrationChannelId) {
          targetChannelId = lobby.registrationChannelId;
        }
      }
    }

    if (!targetChannelId) {
      throw new Error('No announcements or results channel configured. Run `/setup` first to set an announcement channel.');
    }

    const channel = await client.channels.fetch(targetChannelId) as TextChannel | null;
    if (!channel || !channel.isTextBased()) {
      throw new Error(`Target announcements channel \`${targetChannelId}\` not found or inaccessible.`);
    }

    const embed = new EmbedBuilder().setTimestamp();

    if (params.outcome === 'WIN') {
      embed
        .setColor(COLORS.SUCCESS)
        .setTitle(`🏆 WINNER WINNER CHICKEN DINNER! 🏆`)
        .setDescription(
          `Congratulations to **${params.teamA}** for conquering **${lobbyTitle}**!\n\n` +
          `🎮 **Game**: \`${gameType}\` (${tier})\n` +
          (params.score ? `📊 **Final Score / Round**: \`${params.score}\`\n` : '') +
          (params.kills !== undefined ? `🎯 **Finish Kills**: \`${params.kills}\`\n` : '') +
          (params.mvp ? `⭐ **Match MVP**: \`${params.mvp}\`\n` : '') +
          `\n*GGs to all competing rosters!*`
        )
        .setImage(params.customImageUrl || guildConfig?.winImageUrl || env.DEFAULT_WIN_GIF);
    } else if (params.outcome === 'LOSS') {
      embed
        .setColor(COLORS.WARNING)
        .setTitle(`⚔️ MATCH CONCLUSION: DEFEAT & RUNNER-UP ⚔️`)
        .setDescription(
          `**${params.teamA}** claimed the victory against **${params.teamB || 'their opponent'}** in **${lobbyTitle}**!\n\n` +
          `🎮 **Game**: \`${gameType}\`\n` +
          (params.score ? `📊 **Final Scoreline**: \`${params.score}\`\n` : '') +
          (params.mvp ? `⭐ **Standout Player**: \`${params.mvp}\`\n` : '') +
          `\nGreat effort displayed by **${params.teamB || 'the runner-up'}**!`
        )
        .setImage(params.customImageUrl || guildConfig?.lossImageUrl || env.DEFAULT_LOSS_GIF);
    } else {
      // DRAW
      embed
        .setColor(COLORS.PRIMARY)
        .setTitle(`🤝 STALEMATE • MATCH DRAW! 🤝`)
        .setDescription(
          `**${params.teamA}** and **${params.teamB || 'Opponent'}** have finished in a deadlock in **${lobbyTitle}**!\n\n` +
          (params.score ? `⚖️ **Tie Score**: \`${params.score}\`\n` : '') +
          `Points split evenly between both rosters.`
        )
        .setImage(params.customImageUrl || guildConfig?.drawImageUrl || env.DEFAULT_DRAW_GIF);
    }

    const message = await channel.send({ embeds: [embed] });
    return {
      channelId: channel.id,
      messageId: message.id,
    };
  }
}
