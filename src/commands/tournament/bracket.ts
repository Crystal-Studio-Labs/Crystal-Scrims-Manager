import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/index.js';
import { isOrganizerOrAdmin } from '../../utils/permissions.js';
import { createSuccessEmbed, createErrorEmbed, createBaseEmbed, COLORS } from '../../utils/embeds.js';

// In-memory bracket state for tournaments
interface BracketMatch {
  matchId: string;
  round: number;
  teamA: string;
  teamB: string;
  winner?: string;
}

interface TournamentBracket {
  bracketId: string;
  title: string;
  teamCount: number;
  matches: BracketMatch[];
}

const activeBrackets: Map<string, TournamentBracket> = new Map();

export const bracketCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('bracket')
    .setDescription('Tournament elimination brackets and visual tree generation')
    // 1. generate
    .addSubcommand((sub) =>
      sub
        .setName('generate')
        .setDescription('Create a single-elimination tournament bracket')
        .addStringOption((opt) =>
          opt.setName('title').setDescription('Tournament Title').setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('teams')
            .setDescription('Total teams in bracket')
            .setRequired(true)
            .addChoices(
              { name: '4 Teams (Semifinals + Finals)', value: 4 },
              { name: '8 Teams (Quarterfinals + Semis + Finals)', value: 8 },
              { name: '16 Teams (Round of 16 to Finals)', value: 16 }
            )
        )
    )
    // 2. visual
    .addSubcommand((sub) =>
      sub
        .setName('visual')
        .setDescription('Render ASCII tournament bracket tree in chat')
        .addStringOption((opt) =>
          opt.setName('bracket_id').setDescription('Bracket ID').setRequired(true)
        )
    )
    // 3. advance
    .addSubcommand((sub) =>
      sub
        .setName('advance')
        .setDescription('Advance winning team in a bracket match')
        .addStringOption((opt) =>
          opt.setName('bracket_id').setDescription('Bracket ID').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('match_id').setDescription('Match identifier (e.g. M1, M2)').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('winner').setDescription('Winning team name').setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'generate') {
      const isPermitted = await isOrganizerOrAdmin(interaction);
      if (!isPermitted) {
        await interaction.reply({ content: 'Only Admins or Organizers can generate brackets.', ephemeral: true });
        return;
      }

      const title = interaction.options.getString('title', true);
      const teamCount = interaction.options.getInteger('teams', true);
      const bracketId = Math.random().toString(36).slice(2, 8).toUpperCase();

      const matches: BracketMatch[] = [];
      const numMatchesR1 = teamCount / 2;

      for (let i = 0; i < numMatchesR1; i++) {
        matches.push({
          matchId: `M${i + 1}`,
          round: 1,
          teamA: `Seed #${(i * 2) + 1}`,
          teamB: `Seed #${(i * 2) + 2}`,
        });
      }

      activeBrackets.set(bracketId, {
        bracketId,
        title,
        teamCount,
        matches,
      });

      const embed = createSuccessEmbed(
        'Tournament Bracket Generated',
        `**Title**: ${title}\n` +
        `**Bracket ID**: \`${bracketId}\`\n` +
        `**Bracket Size**: \`${teamCount} Teams\`\n\n` +
        `👉 View visual tree: \`/bracket visual bracket_id:${bracketId}\`\n` +
        `👉 Advance winners: \`/bracket advance bracket_id:${bracketId} match_id:M1 winner:"Team Name"\``
      );

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'visual') {
      const bracketId = interaction.options.getString('bracket_id', true).toUpperCase();
      const bracket = activeBrackets.get(bracketId);

      if (!bracket) {
        await interaction.reply({ content: `Bracket \`${bracketId}\` not found.`, ephemeral: true });
        return;
      }

      let tree = '```prolog\n';
      tree += `=== ${bracket.title.toUpperCase()} BRACKET [${bracket.bracketId}] ===\n\n`;

      if (bracket.teamCount === 4) {
        tree += `[SEMIFINALS]                    [GRAND FINALS]            [CHAMPION]\n\n`;
        tree += `M1: ${bracket.matches[0].winner || bracket.matches[0].teamA} vs ${bracket.matches[0].teamB}\n`;
        tree += `      \\___________________\n`;
        tree += `                          \\_ M3: [Finals Match]\n`;
        tree += `      ____________________/\n`;
        tree += `M2: ${bracket.matches[1].winner || bracket.matches[1].teamA} vs ${bracket.matches[1].teamB}\n`;
      } else {
        tree += `ROUND 1 MATCHES:\n`;
        bracket.matches.forEach((m) => {
          tree += `  ${m.matchId}: ${m.teamA} vs ${m.teamB} ${m.winner ? `=> [WINNER: ${m.winner}]` : ''}\n`;
        });
        tree += `\nFINALS:\n  M_FINAL: Pending Round 1 completions\n`;
      }
      tree += '```';

      const embed = createBaseEmbed(`🏆 Bracket: ${bracket.title}`)
        .setColor(COLORS.CRYSTAL)
        .setDescription(tree)
        .setFooter({ text: `Single Elimination • ID: ${bracket.bracketId}` });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'advance') {
      const isPermitted = await isOrganizerOrAdmin(interaction);
      if (!isPermitted) {
        await interaction.reply({ content: 'Only Admins or Organizers can advance match winners.', ephemeral: true });
        return;
      }

      const bracketId = interaction.options.getString('bracket_id', true).toUpperCase();
      const matchId = interaction.options.getString('match_id', true).toUpperCase();
      const winner = interaction.options.getString('winner', true);

      const bracket = activeBrackets.get(bracketId);
      if (!bracket) {
        await interaction.reply({ content: `Bracket \`${bracketId}\` not found.`, ephemeral: true });
        return;
      }

      const match = bracket.matches.find((m) => m.matchId === matchId);
      if (!match) {
        await interaction.reply({ content: `Match \`${matchId}\` not found in bracket \`${bracketId}\`.`, ephemeral: true });
        return;
      }

      match.winner = winner;

      const embed = createSuccessEmbed(
        'Match Winner Advanced',
        `**${winner}** has won match **${matchId}** and advances in bracket \`${bracketId}\`!\n\n` +
        `Run \`/bracket visual bracket_id:${bracketId}\` to see the updated tree.`
      );

      await interaction.reply({ embeds: [embed] });
      return;
    }
  },
};
