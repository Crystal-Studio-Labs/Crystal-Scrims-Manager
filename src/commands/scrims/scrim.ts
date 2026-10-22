import { 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import type { Command } from '../../types/index.js';
import { ScrimService } from '../../services/scrimService.js';
import { createBaseEmbed, createSuccessEmbed, createErrorEmbed, COLORS } from '../../utils/embeds.js';

export const scrimCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('scrim')
    .setDescription('Crystal Scrims Management suite')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    // 1. /scrim create
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new scrim lobby')
        .addStringOption((opt) =>
          opt.setName('title').setDescription('Title of the scrim lobby (e.g. Daily T3 BGMI Scrims)').setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName('slots').setDescription('Total confirmed slots (default: 25)').setMinValue(2).setMaxValue(100)
        )
        .addStringOption((opt) =>
          opt
            .setName('tier')
            .setDescription('Scrim Tier')
            .addChoices(
              { name: 'Tier 1 (Elite)', value: 'T1' },
              { name: 'Tier 2 (Challenger)', value: 'T2' },
              { name: 'Tier 3 (Open)', value: 'T3' }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('game')
            .setDescription('Game type')
            .addChoices(
              { name: 'BGMI / PUBG Mobile', value: 'BGMI' },
              { name: 'Free Fire', value: 'FREEFIRE' },
              { name: 'Valorant', value: 'VALORANT' },
              { name: 'Apex Legends', value: 'APEX' },
              { name: 'Other', value: 'OTHER' }
            )
        )
    )
    // 2. /scrim open
    .addSubcommand((sub) =>
      sub
        .setName('open')
        .setDescription('Open registration for a lobby and display the registration button')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
    )
    // 3. /scrim close
    .addSubcommand((sub) =>
      sub
        .setName('close')
        .setDescription('Close registration for a lobby')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
    )
    // 4. /scrim slotlist
    .addSubcommand((sub) =>
      sub
        .setName('slotlist')
        .setDescription('Display the current confirmed and waitlist slotlist')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
    )
    // 5. /scrim set-idp
    .addSubcommand((sub) =>
      sub
        .setName('set-idp')
        .setDescription('Store Room ID and Password for the scrim lobby')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('room_id').setDescription('Custom Room ID').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('password').setDescription('Custom Room Password').setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const guildName = interaction.guild?.name || 'Unknown Guild';

    try {
      if (subcommand === 'create') {
        const title = interaction.options.getString('title', true);
        const slots = interaction.options.getInteger('slots') || 25;
        const tier = interaction.options.getString('tier') || 'T3';
        const game = interaction.options.getString('game') || 'BGMI';

        const lobbyId = await ScrimService.createLobby({
          guildId,
          guildName,
          title,
          tier,
          gameType: game,
          totalSlots: slots,
        });

        const embed = createSuccessEmbed(
          'Scrim Lobby Created',
          `**Title**: ${title}\n**Lobby ID**: \`${lobbyId}\`\n**Tier**: \`${tier}\`\n**Game**: \`${game}\`\n**Total Slots**: \`${slots}\`\n\nTo open registrations for players, run:\n\`/scrim open lobby_id:${lobbyId}\``
        );

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'open') {
        const lobbyId = interaction.options.getString('lobby_id', true);
        const lobby = await ScrimService.openRegistration(lobbyId, interaction.channelId);

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
            .setCustomId(`scrim_reg_modal:${lobbyId}`)
            .setLabel('Register Team')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📝'),
          new ButtonBuilder()
            .setCustomId(`scrim_slotlist_view:${lobbyId}`)
            .setLabel('View Slotlist')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
        return;
      }

      if (subcommand === 'close') {
        const lobbyId = interaction.options.getString('lobby_id', true);
        await ScrimService.closeRegistration(lobbyId);

        const embed = createSuccessEmbed(
          'Registration Closed',
          `Registration for lobby \`${lobbyId}\` is now closed. Use \`/scrim slotlist lobby_id:${lobbyId}\` to review confirmed rosters.`
        );

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'slotlist') {
        const lobbyId = interaction.options.getString('lobby_id', true);
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

        const embed = createBaseEmbed(`📋 Slotlist: ${lobby.title} (\`${lobby.lobbyId}\`)`)
          .setColor(COLORS.CRYSTAL)
          .addFields(
            { name: `Confirmed Teams (${confirmed.length}/${lobby.totalSlots})`, value: confirmedText.slice(0, 1024) },
            { name: `Waitlist (${waitlist.length})`, value: waitlistText.slice(0, 1024) }
          );

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'set-idp') {
        const lobbyId = interaction.options.getString('lobby_id', true);
        const roomId = interaction.options.getString('room_id', true);
        const password = interaction.options.getString('password', true);

        await ScrimService.setRoomCredentials(lobbyId, roomId, password);

        const embed = createSuccessEmbed(
          'Room Credentials Saved',
          `Room credentials for lobby \`${lobbyId}\` have been securely stored.\n` +
          `**Room ID**: \`${roomId}\`\n**Password**: \`${password}\`\n\n` +
          `*Credentials will be dispatched to confirmed teams.*`
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
    } catch (err: any) {
      const errorEmbed = createErrorEmbed('Action Failed', err.message || 'An unexpected error occurred.');
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};
