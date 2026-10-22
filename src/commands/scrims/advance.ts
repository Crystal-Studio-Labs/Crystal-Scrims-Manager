import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/index.js';
import { ScrimService } from '../../services/scrimService.js';
import { isOrganizerOrAdmin } from '../../utils/permissions.js';
import { createSuccessEmbed, createErrorEmbed, createBaseEmbed, COLORS } from '../../utils/embeds.js';

export const advanceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('scrim-admin')
    .setDescription('Advanced scrim moderation and direct delivery tools')
    // 1. verify-tags
    .addSubcommand((sub) =>
      sub
        .setName('verify-tags')
        .setDescription('Scan registered lineups to detect fake mentions or non-server members')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('Lobby ID').setRequired(true)
        )
    )
    // 2. ping-unconfirmed
    .addSubcommand((sub) =>
      sub
        .setName('ping-unconfirmed')
        .setDescription('Alert and mention only teams that have NOT checked in yet')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('Lobby ID').setRequired(true)
        )
    )
    // 3. dm-idp
    .addSubcommand((sub) =>
      sub
        .setName('dm-idp')
        .setDescription('Send Room ID & Password directly to captains via private Discord DMs')
        .addStringOption((opt) =>
          opt.setName('lobby_id').setDescription('Lobby ID').setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const isPermitted = await isOrganizerOrAdmin(interaction);
    if (!isPermitted) {
      await interaction.reply({
        embeds: [createErrorEmbed('Permission Denied', 'Only Scrim Organizers or Administrators can run advanced commands.')],
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const lobbyId = interaction.options.getString('lobby_id', true);

    await interaction.deferReply();

    try {
      const { lobby, confirmed } = await ScrimService.getSlotlist(lobbyId);

      if (subcommand === 'verify-tags') {
        const guild = interaction.guild!;
        const verifiedList: string[] = [];
        let suspiciousCount = 0;

        for (const slot of confirmed) {
          const isMember = guild.members.cache.has(slot.captainId) || (await guild.members.fetch(slot.captainId).catch(() => null));
          if (!isMember) {
            verifiedList.push(`❌ \`Slot #${slot.slotNumber}\` **${slot.teamName}** — Captain <@${slot.captainId}> is NOT in the server!`);
            suspiciousCount++;
          } else {
            verifiedList.push(`✅ \`Slot #${slot.slotNumber}\` **${slot.teamName}** — Verified Captain (<@${slot.captainId}>)`);
          }
        }

        const rawList = verifiedList.join('\n');
        const safeList = rawList.length > 3900 ? rawList.slice(0, 3900) + '\n...[truncated]' : rawList;

        const embed = createBaseEmbed(`🛡️ Tag Verification Audit: ${lobby.title}`)
          .setColor(suspiciousCount === 0 ? COLORS.SUCCESS : COLORS.WARNING)
          .setDescription(
            `Audited **${confirmed.length}** confirmed squads in lobby \`${lobbyId}\`:\n\n` +
            (verifiedList.length === 0 ? '*No confirmed teams registered yet.*' : safeList)
          )
          .setFooter({ text: suspiciousCount === 0 ? 'All Captains Verified' : `${suspiciousCount} Suspicious Lineup(s) Detected` });

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'ping-unconfirmed') {
        const unconfirmed = confirmed.filter((s) => !s.checkedIn);

        if (unconfirmed.length === 0) {
          await interaction.editReply({
            embeds: [createSuccessEmbed('All Checked In', `Every confirmed team in lobby \`${lobbyId}\` has already checked in!`)],
          });
          return;
        }

        const rawMentions = unconfirmed.map((s) => `<@${s.captainId}> (Slot #${s.slotNumber} - ${s.teamName})`).join('\n');
        const safeMentions = rawMentions.length > 3900 ? rawMentions.slice(0, 3900) + '\n...[truncated]' : rawMentions;

        const embed = createBaseEmbed(`⏰ Mandatory Check-In Warning: ${lobby.title}`)
          .setColor(COLORS.WARNING)
          .setDescription(
            `The following team captains must check in immediately or risk losing their confirmed slot:\n\n` +
            `${safeMentions}\n\n` +
            `👉 Click the **[✅ Check-in]** button in the registration channel to secure your slot!`
          );

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'dm-idp') {
        if (!lobby.roomId || !lobby.roomPassword) {
          await interaction.editReply({
            embeds: [createErrorEmbed('No Credentials Set', `Please run \`/scrim set-idp\` first to store the Room ID & Password.`)],
          });
          return;
        }

        let sentCount = 0;
        let failCount = 0;

        for (const slot of confirmed) {
          try {
            const user = await client.users.fetch(slot.captainId);
            const dmEmbed = createBaseEmbed('🔑 Your Custom Room Credentials')
              .setColor(COLORS.CRYSTAL)
              .setDescription(
                `Here are your private room credentials for **${lobby.title}**:\n\n` +
                `🎮 **Team**: **${slot.teamName}** (\`Slot #${slot.slotNumber}\`)\n` +
                `🔒 **Room ID**: \`${lobby.roomId}\`\n` +
                `🔑 **Password**: \`${lobby.roomPassword}\`\n\n` +
                `⚠️ *Do not leak or share credentials with unregistered teams.*`
              );
            await user.send({ embeds: [dmEmbed] });
            sentCount++;
          } catch {
            failCount++;
          }
        }

        const embed = createSuccessEmbed(
          'Direct Message Delivery Complete',
          `Dispatched Room ID & Password to confirmed captains:\n\n` +
          `✅ **Successfully Delivered**: ${sentCount} captain(s)\n` +
          `❌ **Failed (DMs Closed)**: ${failCount} captain(s)\n\n` +
          `*Captains can also retrieve credentials via the [🔑 View Room IDP] button in the server!*`
        );

        await interaction.editReply({ embeds: [embed] });
        return;
      }
    } catch (err: any) {
      await interaction.editReply({ embeds: [createErrorEmbed('Command Failed', err.message)] });
    }
  },
};
