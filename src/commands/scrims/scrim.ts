import { 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import type { Command } from '../../types/index.js';
import { ScrimService } from '../../services/scrimService.js';
import { LiveLeaderboardService } from '../../services/liveLeaderboardService.js';
import { isOrganizerOrAdmin } from '../../utils/permissions.js';
import { createBaseEmbed, createSuccessEmbed, createErrorEmbed, COLORS } from '../../utils/embeds.js';
import { GAME_PRESETS } from '../../utils/presets.js';
import { db, guilds } from '../../db/index.js';
import { eq } from 'drizzle-orm';

export const scrimCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('scrim')
    .setDescription('Crystal Scrims Management suite')
    // 1. /scrim create
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new scrim lobby')
        .addStringOption((opt) =>
          opt.setName('title').setDescription('Title of the scrim lobby (e.g. Daily T3 BGMI Scrims)').setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('game')
            .setDescription('Select game preset')
            .addChoices(
              { name: 'BGMI / PUBG Mobile (Squad 25)', value: 'BGMI' },
              { name: 'Free Fire (Squad 12)', value: 'FREEFIRE' },
              { name: 'Valorant (Custom 5v5)', value: 'VALORANT' },
              { name: 'CODM (BR 25)', value: 'CODM' },
              { name: 'Apex Legends (Trios 20)', value: 'APEX' },
              { name: 'Custom Game / Slots', value: 'CUSTOM' }
            )
        )
        .addIntegerOption((opt) =>
          opt.setName('slots').setDescription('Override total confirmed slots').setMinValue(2).setMaxValue(100)
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
    )
    // 2. /scrim open
    .addSubcommand((sub) =>
      sub
        .setName('open')
        .setDescription('Open registration for a lobby with interactive buttons and live leaderboard channel')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
    )
    // 3. /scrim panel
    .addSubcommand((sub) =>
      sub
        .setName('panel')
        .setDescription('Open the Interactive Admin Control Panel for a lobby')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
    )
    // 4. /scrim close
    .addSubcommand((sub) =>
      sub
        .setName('close')
        .setDescription('Close registration for a lobby')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
    )
    // 5. /scrim slotlist
    .addSubcommand((sub) =>
      sub
        .setName('slotlist')
        .setDescription('Display the current confirmed and waitlist slotlist')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
    )
    // 6. /scrim reserve
    .addSubcommand((sub) =>
      sub
        .setName('reserve')
        .setDescription('Pre-reserve a slot for an invited/VIP team')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName('slot_number').setDescription('Slot number to reserve').setRequired(true).setMinValue(1)
        )
        .addStringOption((opt) =>
          opt.setName('team_name').setDescription('Invited Team Name').setRequired(true)
        )
        .addUserOption((opt) =>
          opt.setName('captain').setDescription('Team Captain (optional)')
        )
    )
    // 7. /scrim kick
    .addSubcommand((sub) =>
      sub
        .setName('kick')
        .setDescription('Kick a team from the lobby (auto-promotes Waitlist #1)')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('target').setDescription('Slot number (e.g. 5) or Team Name').setRequired(true)
        )
    )
    // 8. /scrim set-idp
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
    )
    // 9. /scrim cancel
    .addSubcommand((sub) =>
      sub
        .setName('cancel')
        .setDescription('Cancel an active scrim lobby')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('The 8-character ID of the lobby').setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    // /scrim slotlist is publicly accessible to all members; other subcommands require staff permissions
    if (subcommand !== 'slotlist') {
      const isPermitted = await isOrganizerOrAdmin(interaction);
      if (!isPermitted) {
        await interaction.reply({
          embeds: [createErrorEmbed('Permission Denied', 'Only Scrim Organizers or Administrators can use management commands.')],
          ephemeral: true,
        });
        return;
      }
    }

    const guildId = interaction.guildId!;
    const guildName = interaction.guild?.name || 'Unknown Guild';

    try {
      if (subcommand === 'create') {
        const title = interaction.options.getString('title', true).trim();
        const game = (interaction.options.getString('game') || 'BGMI').toUpperCase();

        // 1. Verify Allowed Games Policy for this server
        const guildConfig = await db.select().from(guilds).where(eq(guilds.guildId, guildId)).get();
        if (guildConfig?.allowedGames && guildConfig.allowedGames !== 'ALL') {
          const allowedList = guildConfig.allowedGames.split(',').map((s) => s.trim().toUpperCase());
          if (!allowedList.includes(game)) {
            await interaction.reply({
              embeds: [createErrorEmbed(
                'Game Discipline Not Allowed',
                `This server has restricted scrims to: **${guildConfig.allowedGames}**.\n\n` +
                `To enable **${game}**, a Server Administrator must update the policy with \`/setup games\`.`
              )],
              ephemeral: true,
            });
            return;
          }
        }

        const preset = GAME_PRESETS[game] || GAME_PRESETS.BGMI;
        const slots = interaction.options.getInteger('slots') || preset.defaultSlots;
        const tier = interaction.options.getString('tier') || 'T3';

        const lobbyId = await ScrimService.createLobby({
          guildId,
          guildName,
          title,
          tier,
          gameType: game,
          totalSlots: slots,
        });

        // Automatically provision dedicated live leaderboard channel in scrims category
        const liveLeaderboard = await LiveLeaderboardService.createOrAttachLiveChannel(client, lobbyId, guildId);

        const embed = createSuccessEmbed(
          'Scrim Lobby Created',
          `**Title**: ${title}\n` +
          `**Lobby ID**: \`${lobbyId}\`\n` +
          `**Game Preset**: \`${preset.name}\`\n` +
          `**Tier**: \`${tier}\`\n` +
          `**Total Slots**: \`${slots}\`\n` +
          (liveLeaderboard ? `📊 **Live Leaderboard**: <#${liveLeaderboard.channelId}>\n\n` : '\n') +
          `👉 Open registrations: \`/scrim open lobby_id:${lobbyId}\`\n` +
          `🎛️ Launch Admin Panel: \`/scrim panel lobby_id:${lobbyId}\``
        );

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'open') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        const lobby = await ScrimService.openRegistration(lobbyId, interaction.channelId);

        // Ensure live leaderboard channel exists and is attached
        const liveLeaderboard = await LiveLeaderboardService.createOrAttachLiveChannel(client, lobbyId, guildId);

        const embed = createBaseEmbed(`🏆 ${lobby.title} • REGISTRATIONS OPEN`)
          .setColor(COLORS.CRYSTAL)
          .setDescription(
            `Registration for **${lobby.title}** is officially **OPEN**!\n\n` +
            `🎮 **Game**: \`${lobby.gameType}\`\n` +
            `🎖️ **Tier**: \`${lobby.tier}\`\n` +
            `🔢 **Slots**: \`${lobby.totalSlots}\`\n` +
            `🔑 **Lobby ID**: \`${lobby.lobbyId}\`\n` +
            (liveLeaderboard ? `📊 **Live Standings Channel**: <#${liveLeaderboard.channelId}>\n\n` : '\n') +
            `Click **Register Team** below to register your squad via modal popup.`
          );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`scrim_reg_modal:${lobbyId}`)
            .setLabel('Register Team')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📝'),
          new ButtonBuilder()
            .setCustomId(`scrim_idp_view:${lobbyId}`)
            .setLabel('View Room IDP')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔑'),
          new ButtonBuilder()
            .setCustomId(`scrim_slotlist_view:${lobbyId}`)
            .setLabel('View Slotlist')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋'),
          new ButtonBuilder()
            .setCustomId(`scrim_leave:${lobbyId}`)
            .setLabel('Leave Slot')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🚪')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
        return;
      }

      if (subcommand === 'panel') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        const { lobby, confirmed, waitlist } = await ScrimService.getSlotlist(lobbyId);

        const embed = createBaseEmbed(`🎛️ Admin Control Panel: ${lobby.title}`)
          .setColor(COLORS.CRYSTAL)
          .setDescription(
            `**Lobby ID**: \`${lobby.lobbyId}\`\n` +
            `**Status**: \`${lobby.status}\`\n` +
            `**Confirmed Slots**: \`${confirmed.length}/${lobby.totalSlots}\`\n` +
            `**Waitlist Count**: \`${waitlist.length}\`\n` +
            `**Room Credentials**: ${lobby.roomId ? `ID \`${lobby.roomId}\`` : '*Not set yet*'}\n\n` +
            `Use the quick control buttons below to manage this scrim lobby:\n` +
            `⏱️ *Panel buttons will auto-expire in 3 minutes to prevent misclicks.*`
          );

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`panel_open:${lobbyId}`)
            .setLabel('Open Reg')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📢'),
          new ButtonBuilder()
            .setCustomId(`panel_close:${lobbyId}`)
            .setLabel('Lock Reg')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔒'),
          new ButtonBuilder()
            .setCustomId(`scrim_slotlist_view:${lobbyId}`)
            .setLabel('Live Slots')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋'),
          new ButtonBuilder()
            .setCustomId(`panel_cancel:${lobbyId}`)
            .setLabel('Cancel Lobby')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );

        const response = await interaction.reply({ embeds: [embed], components: [row1], ephemeral: true });

        // Auto-disable buttons after 3 minutes to prevent stale misclicks
        const collector = response.createMessageComponentCollector({
          time: 180000,
        });

        collector.on('end', async () => {
          row1.components.forEach((btn) => btn.setDisabled(true));
          await interaction.editReply({
            components: [row1],
          }).catch(() => {});
        });

        return;
      }

      if (subcommand === 'close') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        await ScrimService.closeRegistration(lobbyId);

        const embed = createSuccessEmbed(
          'Registration Closed',
          `Registration for lobby \`${lobbyId}\` is now locked.`
        );

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'slotlist') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
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

        const embed = createBaseEmbed(`📋 Slotlist: ${lobby.title} (\`${lobby.lobbyId}\`)`)
          .setColor(COLORS.CRYSTAL)
          .addFields(
            { name: `Confirmed Teams (${confirmed.length}/${lobby.totalSlots})`, value: confirmedText.slice(0, 1024) },
            { name: `Waitlist (${waitlist.length})`, value: waitlistText.slice(0, 1024) }
          );

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'reserve') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        const slotNumber = interaction.options.getInteger('slot_number', true);
        const teamName = interaction.options.getString('team_name', true).trim();
        const captain = interaction.options.getUser('captain') || interaction.user;

        const res = await ScrimService.reserveSlot({
          guildId,
          lobbyId,
          slotNumber,
          teamName,
          captainDiscordId: captain.id,
        });

        const embed = createSuccessEmbed(
          'Slot Reserved',
          `**Slot #${res.slotNumber}** has been pre-allocated to invited team **${res.teamName}** (<@${captain.id}>)!`
        );

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'kick') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        const target = interaction.options.getString('target', true).trim();

        const res = await ScrimService.kickTeam(lobbyId, target);

        let desc = `Team **${res.kickedTeamName}** has been removed from lobby \`${lobbyId}\`.`;
        if (res.promotedTeam) {
          desc += `\n\n🎉 **Auto-Promotion**: Waitlist team **${res.promotedTeam.name}** (<@${res.promotedTeam.captainId}>) has taken **Slot #${res.promotedTeam.slotNumber}**!`;
        }

        await interaction.reply({ embeds: [createSuccessEmbed('Team Kicked', desc)] });
        return;
      }

      if (subcommand === 'set-idp') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        const roomId = interaction.options.getString('room_id', true).trim();
        const password = interaction.options.getString('password', true).trim();

        await ScrimService.setRoomCredentials(lobbyId, roomId, password);

        const embed = createSuccessEmbed(
          'Room Credentials Saved',
          `Room credentials for lobby \`${lobbyId}\` have been stored securely.\n\n` +
          `**Room ID**: \`${roomId}\`\n` +
          `**Password**: \`${password}\`\n\n` +
          `*Captains can view credentials via the [🔑 View Room IDP] button!*`
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      if (subcommand === 'cancel') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        await ScrimService.cancelLobby(lobbyId);

        await interaction.reply({
          embeds: [createSuccessEmbed('Lobby Cancelled', `Lobby \`${lobbyId}\` has been marked as cancelled.`)],
        });
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
