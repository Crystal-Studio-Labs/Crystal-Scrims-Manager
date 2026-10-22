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
import { createSuccessEmbed, createWarningEmbed, createErrorEmbed, createBaseEmbed, COLORS } from '../../utils/embeds.js';

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
          `Team **${result.teamName}** has secured **Slot #${result.slotNumber}** for lobby \`${lobbyId}\`!`
        );
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createWarningEmbed(
          'Placed on Waitlist',
          `Main slots are currently full! Team **${result.teamName}** has been placed at **Waitlist Position #${result.waitlistPosition}**.\n` +
          `If a confirmed team drops out, you will be auto-promoted!`
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
 * 4. Button Handler: Ephemeral Room ID & Password Retrieval (Feature 1)
 */
export const viewIdpButtonHandler: ButtonHandler = {
  customIdPrefix: 'scrim_idp_view',

  async execute(interaction: ButtonInteraction) {
    const lobbyId = interaction.customId.split(':')[1];
    await interaction.deferReply({ ephemeral: true });

    try {
      const creds = await ScrimService.getRoomCredentialsForUser(lobbyId, interaction.user.id);

      const embed = createBaseEmbed('🔑 Custom Room Credentials')
        .setColor(COLORS.CRYSTAL)
        .setDescription(
          `**Lobby**: ${creds.lobbyTitle}\n` +
          `**Team**: **${creds.teamName}** (\`Slot #${creds.slotNumber}\`)\n\n` +
          `🔒 **Room ID**: \`${creds.roomId}\`\n` +
          `🔑 **Password**: \`${creds.roomPassword}\`\n\n` +
          `⚠️ *Do not share or leak credentials to unregistered teams.*`
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Access Denied', err.message)] });
    }
  },
};

/**
 * 5. Button Handler: Leave / Forfeit Slot (Auto-promotes Waitlist #1)
 */
export const leaveSlotButtonHandler: ButtonHandler = {
  customIdPrefix: 'scrim_leave',

  async execute(interaction: ButtonInteraction) {
    const lobbyId = interaction.customId.split(':')[1];
    await interaction.deferReply({ ephemeral: true });

    try {
      const res = await ScrimService.leaveTeam(lobbyId, interaction.user.id);

      let desc = `Your team **${res.leftTeamName}** has forfeited their slot in lobby \`${lobbyId}\`.`;
      if (res.promotedTeam) {
        desc += `\n\n🎉 **Auto-Promotion**: Waitlist team **${res.promotedTeam.name}** (<@${res.promotedTeam.captainId}>) has taken **Slot #${res.promotedTeam.slotNumber}**!`;
      }

      await interaction.editReply({ embeds: [createSuccessEmbed('Slot Released', desc)] });
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Action Failed', err.message)] });
    }
  },
};

/**
 * 6. Button Handler: Live Slotlist inspection
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
          .map((c) => `\`Slot #${c.slotNumber}\` ${c.isReserved ? '⭐ ' : ''}**${c.teamName}** ${c.teamTag ? `[${c.teamTag}]` : ''} • <@${c.captainId}>`)
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

      const embed = createBaseEmbed(`📋 Live Slotlist: ${lobby.title}`)
        .setColor(COLORS.CRYSTAL)
        .setDescription(
          `**Lobby ID**: \`${lobby.lobbyId}\`\n\n` +
          `**Confirmed Teams (${confirmed.length}/${lobby.totalSlots})**\n${confirmedText.slice(0, 1024)}\n\n` +
          `**Waitlist (${waitlist.length})**\n${waitlistText.slice(0, 1024)}`
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Error', err.message)] });
    }
  },
};

/**
 * 7. Admin Panel Buttons: Open, Close, Cancel
 */
export const panelOpenButtonHandler: ButtonHandler = {
  customIdPrefix: 'panel_open',
  async execute(interaction: ButtonInteraction) {
    const lobbyId = interaction.customId.split(':')[1];
    await interaction.deferReply({ ephemeral: true });
    try {
      await ScrimService.openRegistration(lobbyId, interaction.channelId);
      await interaction.editReply({ embeds: [createSuccessEmbed('Opened', `Registration for lobby \`${lobbyId}\` is now open.`)] });
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Error', err.message)] });
    }
  },
};

export const panelCloseButtonHandler: ButtonHandler = {
  customIdPrefix: 'panel_close',
  async execute(interaction: ButtonInteraction) {
    const lobbyId = interaction.customId.split(':')[1];
    await interaction.deferReply({ ephemeral: true });
    try {
      await ScrimService.closeRegistration(lobbyId);
      await interaction.editReply({ embeds: [createSuccessEmbed('Locked', `Registration for lobby \`${lobbyId}\` is now locked.`)] });
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Error', err.message)] });
    }
  },
};

export const panelCancelButtonHandler: ButtonHandler = {
  customIdPrefix: 'panel_cancel',
  async execute(interaction: ButtonInteraction) {
    const lobbyId = interaction.customId.split(':')[1];
    await interaction.deferReply({ ephemeral: true });
    try {
      await ScrimService.cancelLobby(lobbyId);
      await interaction.editReply({ embeds: [createSuccessEmbed('Cancelled', `Lobby \`${lobbyId}\` has been cancelled.`)] });
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Error', err.message)] });
    }
  },
};
