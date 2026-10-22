import { db, scrimLobbies } from '../db/index.js';
import { eq, and, sql, lte } from 'drizzle-orm';
import { ScrimService } from './scrimService.js';
import { logger } from '../utils/logger.js';
import type { ExtendedClient } from '../client/ExtendedClient.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type TextChannel } from 'discord.js';
import { createBaseEmbed, COLORS } from '../utils/embeds.js';

export class SchedulerService {
  private static timer: NodeJS.Timeout | null = null;

  public static start(client: ExtendedClient) {
    if (this.timer) return;

    logger.info('⏰ Starting Automated Scrim Scheduler (60s tick)...');

    this.timer = setInterval(async () => {
      try {
        const now = new Date().toISOString();

        // 1. Auto-Open Scheduled Lobbies
        const lobbiesToOpen = await db.select().from(scrimLobbies)
          .where(and(
            eq(scrimLobbies.status, 'SCHEDULED'),
            lte(scrimLobbies.autoOpenAt, now)
          ))
          .all();

        for (const lobby of lobbiesToOpen) {
          if (!lobby.registrationChannelId) continue;
          logger.info(`⏰ [Scheduler] Auto-opening registrations for lobby ${lobby.lobbyId} (${lobby.title})...`);
          
          await ScrimService.openRegistration(lobby.lobbyId, lobby.registrationChannelId);

          const channel = await client.channels.fetch(lobby.registrationChannelId) as TextChannel | null;
          if (channel && channel.isTextBased()) {
            const embed = createBaseEmbed(`🏆 ${lobby.title} • REGISTRATIONS OPEN`)
              .setColor(COLORS.CRYSTAL)
              .setDescription(
                `Registration for **${lobby.title}** is officially **OPEN**!\n\n` +
                `🎮 **Game**: \`${lobby.gameType}\`\n` +
                `🎖️ **Tier**: \`${lobby.tier}\`\n` +
                `🔢 **Slots**: \`${lobby.totalSlots}\`\n` +
                `🔑 **Lobby ID**: \`${lobby.lobbyId}\`\n\n` +
                `Click the button below to register your team before slots fill up!`
              );

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`scrim_reg_modal:${lobby.lobbyId}`)
                .setLabel('Register Team')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📝'),
              new ButtonBuilder()
                .setCustomId(`scrim_idp_view:${lobby.lobbyId}`)
                .setLabel('View Room IDP')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔑'),
              new ButtonBuilder()
                .setCustomId(`scrim_slotlist_view:${lobby.lobbyId}`)
                .setLabel('View Slotlist')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📋'),
              new ButtonBuilder()
                .setCustomId(`scrim_leave:${lobby.lobbyId}`)
                .setLabel('Leave Slot')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚪')
            );

            await channel.send({ embeds: [embed], components: [row] });
          }
        }

        // 2. Auto-Close Lobbies
        const lobbiesToClose = await db.select().from(scrimLobbies)
          .where(and(
            eq(scrimLobbies.status, 'OPEN'),
            lte(scrimLobbies.autoCloseAt, now)
          ))
          .all();

        for (const lobby of lobbiesToClose) {
          logger.info(`⏰ [Scheduler] Auto-closing registrations for lobby ${lobby.lobbyId}...`);
          await ScrimService.closeRegistration(lobby.lobbyId);
        }
      } catch (err) {
        logger.error('Error in Scrim Scheduler tick:', err);
      }
    }, 60000); // Check every minute
  }

  public static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
