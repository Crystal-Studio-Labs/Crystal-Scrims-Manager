import type { Interaction } from 'discord.js';
import type { Event } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { createErrorEmbed } from '../utils/embeds.js';
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
