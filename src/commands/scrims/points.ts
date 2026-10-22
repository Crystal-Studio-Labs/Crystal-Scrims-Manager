import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/index.js';
import { PointsService } from '../../services/pointsService.js';
import { LiveLeaderboardService } from '../../services/liveLeaderboardService.js';
import { isOrganizerOrAdmin } from '../../utils/permissions.js';
import { createSuccessEmbed, createErrorEmbed, createBaseEmbed, COLORS } from '../../utils/embeds.js';

export const pointsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('points')
    .setDescription('Calculate placement points, kills, and live tournament leaderboards')
    // 1. /points add
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Record match placement and kill points for a team')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('Lobby ID').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('team_name').setDescription('Exact registered Team Name').setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName('placement').setDescription('Match placement rank (1 to 25)').setRequired(true).setMinValue(1).setMaxValue(100)
        )
        .addIntegerOption((opt) =>
          opt.setName('kills').setDescription('Finish kills achieved').setRequired(true).setMinValue(0)
        )
        .addIntegerOption((opt) =>
          opt.setName('round').setDescription('Match Round Number (default: 1)').setMinValue(1).setMaxValue(20)
        )
    )
    // 2. /points table
    .addSubcommand((sub) =>
      sub
        .setName('table')
        .setDescription('Display the sorted live Points Table standings')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('Lobby ID').setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName('round').setDescription('Filter by specific round number (optional)')
        )
    )
    // 3. /points reset
    .addSubcommand((sub) =>
      sub
        .setName('reset')
        .setDescription('Clear all points for a lobby')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('Lobby ID').setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add' || subcommand === 'reset') {
      const isPermitted = await isOrganizerOrAdmin(interaction);
      if (!isPermitted) {
        await interaction.reply({
          embeds: [createErrorEmbed('Permission Denied', 'Only Scrim Organizers or Administrators can record or reset points.')],
          ephemeral: true,
        });
        return;
      }
    }

    try {
      if (subcommand === 'add') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        const teamName = interaction.options.getString('team_name', true).trim();
        const placement = interaction.options.getInteger('placement', true);
        const kills = interaction.options.getInteger('kills', true);
        const round = interaction.options.getInteger('round') || 1;

        const res = await PointsService.addResult({
          lobbyId,
          teamIdentifier: teamName,
          placement,
          kills,
          matchRound: round,
        });

        // Trigger real-time live channel leaderboard update
        LiveLeaderboardService.updateLiveLeaderboard(client, lobbyId).catch(() => {});

        const embed = createSuccessEmbed(
          'Points Recorded',
          `**Team**: ${res.teamName}\n` +
          `**Round**: \`#${res.round}\`\n` +
          `**Placement**: \`#${res.placement}\` (${res.placementPoints} pts)\n` +
          `**Kills**: \`${res.kills}\` pts\n` +
          `**Total Round Points**: \`${res.totalPoints}\` pts\n\n` +
          `📊 *Live Event Leaderboard channel updated in real-time!*\n` +
          `Use \`/points table lobby_id:${lobbyId}\` to see the standings here.`
        );

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'table') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        const round = interaction.options.getInteger('round') ?? undefined;

        const { lobby, results } = await PointsService.getLeaderboard(lobbyId, round);

        if (results.length === 0) {
          await interaction.reply({
            embeds: [createErrorEmbed('No Points Data', `No match results have been recorded yet for lobby \`${lobbyId}\`.`)],
            ephemeral: true,
          });
          return;
        }

        let tableText = '```prolog\n';
        tableText += `${'Rank'.padEnd(5)} ${'Team'.padEnd(16)} ${'Plac'.padEnd(6)} ${'Kills'.padEnd(6)} ${'Total'.padEnd(6)}\n`;
        tableText += '-'.repeat(42) + '\n';

        const displayResults = results.slice(0, 25);
        displayResults.forEach((row: { teamName: string; placementPoints: number; kills: number; totalPoints: number }, index: number) => {
          const rank = `#${index + 1}`.padEnd(5);
          const name = (row.teamName.length > 14 ? row.teamName.slice(0, 13) + '…' : row.teamName).padEnd(16);
          const plac = String(row.placementPoints).padEnd(6);
          const kills = String(row.kills).padEnd(6);
          const total = String(row.totalPoints).padEnd(6);
          tableText += `${rank} ${name} ${plac} ${kills} ${total}\n`;
        });

        if (results.length > 25) {
          tableText += `... +${results.length - 25} more teams (view on web dashboard)\n`;
        }
        tableText += '```';

        const embed = createBaseEmbed(`📊 Live Standings: ${lobby.title}`)
          .setColor(COLORS.CRYSTAL)
          .setDescription(
            `🎮 **Game**: \`${lobby.gameType}\` (${lobby.tier})\n` +
            (round ? `🏆 **Round Filter**: Round #${round}\n` : '🏆 **Overall Leaderboard**\n') +
            tableText
          )
          .setFooter({ text: 'Official Standings • Crystal Scrims Manager' });

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'reset') {
        const lobbyId = interaction.options.getString('lobby_id', true).trim();
        await PointsService.resetResults(lobbyId);

        // Update live leaderboard
        LiveLeaderboardService.updateLiveLeaderboard(client, lobbyId).catch(() => {});

        await interaction.reply({
          embeds: [createSuccessEmbed('Points Reset', `All match scores for lobby \`${lobbyId}\` have been cleared.`)],
        });
        return;
      }
    } catch (err: any) {
      await interaction.reply({
        embeds: [createErrorEmbed('Points Action Failed', err.message || 'An error occurred while calculating points.')],
        ephemeral: true,
      });
    }
  },
};
