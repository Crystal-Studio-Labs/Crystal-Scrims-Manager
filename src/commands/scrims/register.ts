import { 
  SlashCommandBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import type { Command, ButtonHandler, ModalHandler } from '../../types/index.js';
import { ScrimService } from '../../services/scrimService.js';
import { createSuccessEmbed, createWarningEmbed, createErrorEmbed } from '../../utils/embeds.js';

/**
 * 1. Slash Command /register
 */
export const registerCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your team for an active scrim lobby')
    .addStringOption((opt) =>
      opt.setName('lobby_id').setDescription('The 8-character ID of the scrim lobby').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('team_name').setDescription('Your official team name').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('team_tag').setDescription('Short team tag (e.g. CRYS)')
    ),

  async execute(interaction) {
    const lobbyId = interaction.options.getString('lobby_id', true);
    const teamName = interaction.options.getString('team_name', true);
    const teamTag = interaction.options.getString('team_tag') || undefined;

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await ScrimService.registerTeam({
        guildId: interaction.guildId!,
        lobbyId,
        teamName,
        teamTag,
        captainDiscordId: interaction.user.id,
      });

      if (result.status === 'CONFIRMED') {
        const embed = createSuccessEmbed(
          'Registration Confirmed!',
          `Team **${result.teamName}** has been secured **Slot #${result.slotNumber}** for lobby \`${lobbyId}\`!`
        );
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createWarningEmbed(
          'Placed on Waitlist',
          `Main slots are currently full! Team **${result.teamName}** has been placed at **Waitlist Position #${result.waitlistPosition}**.\n` +
          `If a confirmed team drops out or misses check-in, you will be auto-promoted!`
        );
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Registration Failed', err.message)] });
    }
  },
};

/**
 * 2. Button Handler to spawn registration Modal
 */
export const registerButtonHandler: ButtonHandler = {
  customIdPrefix: 'scrim_reg_modal',

  async execute(interaction: ButtonInteraction) {
    const lobbyId = interaction.customId.split(':')[1];

    const modal = new ModalBuilder()
      .setCustomId(`scrim_reg_submit:${lobbyId}`)
      .setTitle(`Register for Lobby: ${lobbyId}`);

    const teamNameInput = new TextInputBuilder()
      .setCustomId('team_name')
      .setLabel('Team Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. Crystal Esports')
      .setRequired(true)
      .setMaxLength(64);

    const teamTagInput = new TextInputBuilder()
      .setCustomId('team_tag')
      .setLabel('Team Tag (Abbreviation)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. CRYS')
      .setRequired(false)
      .setMaxLength(10);

    const playersInput = new TextInputBuilder()
      .setCustomId('players_lineup')
      .setLabel('Player Lineup (IGNs / Mentions)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Player 1 (Captain)\nPlayer 2\nPlayer 3\nPlayer 4')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(teamNameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(teamTagInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(playersInput)
    );

    await interaction.showModal(modal);
  },
};

/**
 * 3. Modal Submission Handler
 */
export const registerModalHandler: ModalHandler = {
  customIdPrefix: 'scrim_reg_submit',

  async execute(interaction: ModalSubmitInteraction) {
    const lobbyId = interaction.customId.split(':')[1];
    const teamName = interaction.fields.getTextInputValue('team_name').trim();
    const teamTag = interaction.fields.getTextInputValue('team_tag').trim() || undefined;

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await ScrimService.registerTeam({
        guildId: interaction.guildId!,
        lobbyId,
        teamName,
        teamTag,
        captainDiscordId: interaction.user.id,
      });

      if (result.status === 'CONFIRMED') {
        const embed = createSuccessEmbed(
          'Registration Confirmed!',
          `Team **${result.teamName}** has secured **Slot #${result.slotNumber}** for lobby \`${lobbyId}\`!`
        );
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createWarningEmbed(
          'Placed on Waitlist',
          `Main slots are full. Team **${result.teamName}** is on **Waitlist Position #${result.waitlistPosition}**.\n` +
          `You will be auto-promoted if confirmed slots open up!`
        );
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Registration Failed', err.message)] });
    }
  },
};

/**
 * 4. Button Handler to view live slotlist
 */
export const viewSlotlistButtonHandler: ButtonHandler = {
  customIdPrefix: 'scrim_slotlist_view',

  async execute(interaction: ButtonInteraction) {
    const lobbyId = interaction.customId.split(':')[1];
    await interaction.deferReply({ ephemeral: true });

    try {
      const { lobby, confirmed, waitlist } = await ScrimService.getSlotlist(lobbyId);

      let confirmedText = '';
      if (confirmed.length === 0) {
        confirmedText = '*No teams confirmed yet.*';
      } else {
        confirmedText = confirmed
          .map((c) => `\`Slot #${c.slotNumber}\` **${c.teamName}** ${c.teamTag ? `[${c.teamTag}]` : ''} • <@${c.captainId}>`)
          .join('\n');
      }

      let waitlistText = '';
      if (waitlist.length === 0) {
        waitlistText = '*No teams on waitlist.*';
      } else {
        waitlistText = waitlist
          .map((w) => `\`Waitlist #${w.position}\` **${w.teamName}** • <@${w.captainId}>`)
          .join('\n');
      }

      const embed = createSuccessEmbed(
        `Live Slotlist: ${lobby.title}`,
        `**Lobby ID**: \`${lobby.lobbyId}\`\n\n` +
        `**Confirmed Teams (${confirmed.length}/${lobby.totalSlots})**\n${confirmedText}\n\n` +
        `**Waitlist (${waitlist.length})**\n${waitlistText}`
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Error', err.message)] });
    }
  },
};

