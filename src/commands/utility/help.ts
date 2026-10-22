import { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
  ComponentType
} from 'discord.js';
import type { Command } from '../../types/index.js';
import { createBaseEmbed, COLORS } from '../../utils/embeds.js';

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Explore the Crystal Scrims Manager documentation and commands'),

  async execute(interaction) {
    const mainEmbed = createBaseEmbed('💎 Crystal Scrims Manager • Master Help Center')
      .setDescription(
        `Welcome to **Crystal Scrims Manager**, an enterprise-grade open-source esports tournament & scrims platform.\n\n` +
        `Select a category from the dropdown menu below to view detailed command guides, workflows, and permissions.`
      )
      .addFields(
        { name: '🎮 Scrims Management', value: 'Create, schedule, open/close lobbies, slotlists, and secure IDP reveals.', inline: true },
        { name: '📢 Match Announcements', value: 'Broadcast pre-defined Win, Loss, and Draw celebration cards with GIFs.', inline: true },
        { name: '📊 Points & Standings', value: 'Calculate placement points + finish kills and generate ranked leaderboards.', inline: true },
        { name: '⚙️ Server Setup & Config', value: '1-click auto-category setup, channel routing, and staff permissions.', inline: true },
        { name: '🏆 Tournaments & Brackets', value: 'Single/Double elimination trees, map vetos, and match channels.', inline: true },
        { name: 'ℹ️ Open Source & Hosting', value: 'Free-tier deployment guides for Render, Koyeb, and local SQLite.', inline: true }
      );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('Choose a help category to explore...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Scrims Management')
          .setValue('help_scrims')
          .setDescription('Lobbies, slotlists, auto-promotions, and IDP delivery')
          .setEmoji('🎮'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Match Announcements')
          .setValue('help_announcements')
          .setDescription('Pre-defined Win/Loss/Draw announcements & GIFs')
          .setEmoji('📢'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Points Table & Standings')
          .setValue('help_points')
          .setDescription('Score calculations, kills, and live leaderboards')
          .setEmoji('📊'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Server Setup & Structure')
          .setValue('help_setup')
          .setDescription('Channel routing, 1-click auto-category, roles')
          .setEmoji('⚙️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Tournaments & Brackets')
          .setValue('help_tournaments')
          .setDescription('Elimination brackets and match rooms')
          .setEmoji('🏆'),
        new StringSelectMenuOptionBuilder()
          .setLabel('System & Open Source')
          .setValue('help_system')
          .setDescription('Telemetry, ping, GitHub, and free cloud hosting')
          .setEmoji('ℹ️')
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const response = await interaction.reply({ embeds: [mainEmbed], components: [row] });

    // Component collector for interactive navigation
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000, // 2 minutes
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: 'Only the command invoker can use this menu.', ephemeral: true });
        return;
      }

      const selected = i.values[0];
      const categoryEmbed = createBaseEmbed();

      if (selected === 'help_scrims') {
        categoryEmbed
          .setTitle('🎮 Scrims Management Commands')
          .setDescription(
            `Comprehensive suite for running automated mobile and PC esports scrims.\n\n` +
            `• \`/scrim create <title> [slots] [tier] [game]\` — Provision a new scrim lobby.\n` +
            `• \`/scrim open <lobby_id>\` — Open registrations with interactive registration & IDP buttons.\n` +
            `• \`/scrim panel <lobby_id>\` — Open interactive Admin Dashboard with quick action buttons.\n` +
            `• \`/scrim close <lobby_id>\` — Lock registrations for a lobby.\n` +
            `• \`/scrim slotlist <lobby_id>\` — View live confirmed slots and waitlist.\n` +
            `• \`/scrim reserve <lobby_id> <slot> <team>\` — Pre-reserve slot for invited/VIP teams.\n` +
            `• \`/scrim kick <lobby_id> <slot_or_team>\` — Kick no-show team (auto-promotes Waitlist #1).\n` +
            `• \`/scrim set-idp <lobby_id> <room_id> <password>\` — Store credentials for secure dispatch.\n` +
            `• \`/register <lobby_id> <team_name> [tag]\` — Direct command registration.`
          );
      } else if (selected === 'help_announcements') {
        categoryEmbed
          .setTitle('📢 Pre-Defined Match Announcements')
          .setDescription(
            `Automate match victory, defeat, and draw announcements with custom celebratory GIFs/images.\n\n` +
            `• \`/announce result <lobby_id> outcome:<WIN|LOSS|DRAW> team_a:<Team> [team_b] [score] [mvp] [image_url]\`\n` +
            `Broadcasts the outcome embed to the server's configured results channel.\n\n` +
            `**Dynamic Variables**: \`{winner}\`, \`{loser}\`, \`{score}\`, \`{kills}\`, \`{mvp}\`, \`{game}\`.\n` +
            `Supports celebratory GIFs for Chicken Dinners, Flawless Sweeps, and Overtime Draws!`
          );
      } else if (selected === 'help_points') {
        categoryEmbed
          .setTitle('📊 Points Table & Standings')
          .setDescription(
            `Calculate placement points + finish kills across multiple matches.\n\n` +
            `• \`/points add <lobby_id> <team_name> <placement> <kills> [round]\` — Record a match round result.\n` +
            `• \`/points table <lobby_id> [round]\` — Display the sorted live points leaderboard embed.\n` +
            `• \`/points reset <lobby_id>\` — Reset points for a lobby.\n\n` +
            `*Uses official BGIS/PMGC standard scoring (10-6-5-4-3-2-1-1) with 1 point per kill.*`
          );
      } else if (selected === 'help_setup') {
        categoryEmbed
          .setTitle('⚙️ Server Setup & Customization')
          .setDescription(
            `Configure server channels, permissions, and structure.\n\n` +
            `• \`/setup autostructure [category_name]\` — **1-Click Magic**: Automatically spawns the category, #registration, #slotlist, #room-credentials, and #announcements channels with proper permissions!\n` +
            `• \`/setup wizard\` — Interactive channel and role select menus to bind existing server channels.\n` +
            `• \`/setup set-role <role>\` — Designate the Scrims Organizer / Event Manager role.`
          );
      } else if (selected === 'help_tournaments') {
        categoryEmbed
          .setTitle('🏆 Tournaments & Brackets')
          .setDescription(
            `Elimination brackets and match room management.\n\n` +
            `• \`/tournament create <name> <format> <teams>\` — Generate single or double elimination bracket.\n` +
            `• \`/tournament bracket <id>\` — View tournament bracket tree.\n` +
            `• \`/tournament match <id>\` — Provision private temporary match text & voice channels.`
          );
      } else if (selected === 'help_system') {
        categoryEmbed
          .setTitle('ℹ️ System Telemetry & Open Source')
          .setDescription(
            `• \`/ping\` — Real-time bot latency, WebSocket heartbeat, uptime, and RAM usage in MB.\n\n` +
            `**Open Source Stack**:\n` +
            `• Built with TypeScript 5.6 + discord.js v14.\n` +
            `• Database: Turso (LibSQL) & Local SQLite via Drizzle ORM.\n` +
            `• 100% Free Hosting on Render with built-in \`:8080/health\` keep-alive server.`
          );
      }

      await i.update({ embeds: [categoryEmbed] });
    });

    collector.on('end', async () => {
      // Disable select menu on timeout
      selectMenu.setDisabled(true);
      await interaction.editReply({ components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)] }).catch(() => {});
    });
  },
};
