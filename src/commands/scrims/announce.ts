import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/index.js';
import { AnnouncementService } from '../../services/announcementService.js';
import { isOrganizerOrAdmin } from '../../utils/permissions.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds.js';

export const announceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Broadcast pre-defined match outcome announcements')
    .addSubcommand((sub) =>
      sub
        .setName('result')
        .setDescription('Declare match outcome (Win / Loss / Draw) with celebratory GIF embeds')
        .addStringOption((opt) =>
          opt
            .setName('outcome')
            .setDescription('Match outcome')
            .setRequired(true)
            .addChoices(
              { name: '🏆 Victory / Win (WWCD / Match Winner)', value: 'WIN' },
              { name: '⚔️ Defeat / Runner-Up', value: 'LOSS' },
              { name: '🤝 Draw / Stalemate Tie', value: 'DRAW' }
            )
        )
        .addStringOption((opt) =>
          opt.setName('team_a').setDescription('Winning Team (or Team A in a draw)').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('Lobby ID (optional)').setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName('team_b').setDescription('Defeated Team (or Team B in a draw)').setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName('score').setDescription('Scoreline (e.g. 13-9 or 85 pts)').setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt.setName('kills').setDescription('Finish kills (e.g. 14 kills)').setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName('mvp').setDescription('Match MVP (e.g. Jonathan / TenZ)').setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName('image_url').setDescription('Custom celebration GIF / image URL').setRequired(false)
        )
    ),

  async execute(interaction, client) {
    const isPermitted = await isOrganizerOrAdmin(interaction);
    if (!isPermitted) {
      await interaction.reply({
        embeds: [createErrorEmbed('Permission Denied', 'Only Server Administrators or Scrim Organizers can broadcast match announcements.')],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const outcome = interaction.options.getString('outcome', true) as 'WIN' | 'LOSS' | 'DRAW';
      const teamA = interaction.options.getString('team_a', true);
      const teamB = interaction.options.getString('team_b') || undefined;
      const lobbyId = interaction.options.getString('lobby_id') || undefined;
      const score = interaction.options.getString('score') || undefined;
      const kills = interaction.options.getInteger('kills') ?? undefined;
      const mvp = interaction.options.getString('mvp') || undefined;
      const customImageUrl = interaction.options.getString('image_url') || undefined;

      const broadcastResult = await AnnouncementService.broadcastOutcome(client, {
        guildId: interaction.guildId!,
        lobbyId,
        outcome,
        teamA,
        teamB,
        score,
        kills,
        mvp,
        customImageUrl,
      });

      const successEmbed = createSuccessEmbed(
        'Match Announcement Broadcasted!',
        `Your **${outcome}** announcement has been posted directly to <#${broadcastResult.channelId}>!`
      );

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Announcement Failed', err.message)] });
    }
  },
};
