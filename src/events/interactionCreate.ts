import type { Interaction } from 'discord.js';
import type { Event } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { createErrorEmbed, createSuccessEmbed } from '../utils/embeds.js';
import { isOrganizerOrAdmin } from '../utils/permissions.js';
import { db, guilds } from '../db/index.js';
import { eq } from 'drizzle-orm';
import type { ExtendedClient } from '../client/ExtendedClient.js';

export const interactionCreateEvent: Event = {
  name: 'interactionCreate',
  async execute(client: ExtendedClient, interaction: Interaction) {
    try {
      // 1. Handle Slash Commands
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          logger.warn(`Unknown slash command attempted: ${interaction.commandName}`);
          return;
        }

        await command.execute(interaction, client);
        return;
      }

      // 2. Handle Buttons
      if (interaction.isButton()) {
        const customId = interaction.customId;
        const prefix = customId.split(':')[0];

        const handler = client.buttons.get(prefix);
        if (handler) {
          await handler.execute(interaction, client);
          return;
        } else {
          logger.debug(`No handler registered for button prefix: ${prefix}`);
        }
        return;
      }

      // 3. Handle Modal Submissions
      if (interaction.isModalSubmit()) {
        const customId = interaction.customId;
        const prefix = customId.split(':')[0];

        const handler = client.modals.get(prefix);
        if (handler) {
          await handler.execute(interaction, client);
          return;
        } else {
          logger.debug(`No handler registered for modal prefix: ${prefix}`);
        }
        return;
      }

      // 4. Handle Channel Select Menus (/setup wizard)
      if (interaction.isChannelSelectMenu()) {
        const customId = interaction.customId;
        if (!interaction.guildId) return;

        const isPermitted = await isOrganizerOrAdmin(interaction);
        if (!isPermitted) {
          await interaction.reply({
            embeds: [createErrorEmbed('Permission Denied', 'Only Server Administrators can modify server routing.')],
            ephemeral: true,
          });
          return;
        }

        const selectedChannelId = interaction.values[0];

        if (customId === 'setup_select_reg_channel') {
          await db.insert(guilds).values({
            guildId: interaction.guildId,
            name: interaction.guild?.name || 'Guild',
            registrationChannelId: selectedChannelId,
          }).onConflictDoUpdate({
            target: guilds.guildId,
            set: { registrationChannelId: selectedChannelId },
          });

          await interaction.reply({
            embeds: [createSuccessEmbed('Registration Channel Configured', `Lobby registration embeds will be posted in <#${selectedChannelId}>.`)],
            ephemeral: true,
          });
          return;
        }

        if (customId === 'setup_select_idp_channel') {
          await db.insert(guilds).values({
            guildId: interaction.guildId,
            name: interaction.guild?.name || 'Guild',
            idpChannelId: selectedChannelId,
          }).onConflictDoUpdate({
            target: guilds.guildId,
            set: { idpChannelId: selectedChannelId },
          });

          await interaction.reply({
            embeds: [createSuccessEmbed('IDP Channel Configured', `Room credentials (IDP) notifications will route to <#${selectedChannelId}>.`)],
            ephemeral: true,
          });
          return;
        }

        return;
      }

      // 5. Handle Role Select Menus (/setup wizard)
      if (interaction.isRoleSelectMenu()) {
        const customId = interaction.customId;
        if (!interaction.guildId) return;

        const isPermitted = await isOrganizerOrAdmin(interaction);
        if (!isPermitted) {
          await interaction.reply({
            embeds: [createErrorEmbed('Permission Denied', 'Only Server Administrators can designate staff roles.')],
            ephemeral: true,
          });
          return;
        }

        const selectedRoleId = interaction.values[0];

        if (customId === 'setup_select_organizer_role') {
          await db.insert(guilds).values({
            guildId: interaction.guildId,
            name: interaction.guild?.name || 'Guild',
            organizerRoleId: selectedRoleId,
          }).onConflictDoUpdate({
            target: guilds.guildId,
            set: { organizerRoleId: selectedRoleId },
          });

          await interaction.reply({
            embeds: [createSuccessEmbed('Organizer Role Configured', `Members with role <@&${selectedRoleId}> are now granted full organizer permissions.`)],
            ephemeral: true,
          });
          return;
        }

        return;
      }
    } catch (error: any) {
      logger.error('Error handling interaction:', error);

      const errorEmbed = createErrorEmbed('Execution Error', error?.message || 'An unexpected error occurred while executing this action.');

      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
        }
      }
    }
  },
};
