import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  type TextChannel
} from 'discord.js';
import type { Command } from '../../types/index.js';
import { createBaseEmbed, createSuccessEmbed, COLORS } from '../../utils/embeds.js';
import { isOrganizerOrAdmin } from '../../utils/permissions.js';

export const toolsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('tool')
    .setDescription('Quick esports utilities (coinflip, dice, poll, serverinfo, clear)')
    // 1. /tool coinflip
    .addSubcommand((sub) =>
      sub
        .setName('coinflip')
        .setDescription('Flip a coin for side or map veto priority')
    )
    // 2. /tool dice
    .addSubcommand((sub) =>
      sub
        .setName('dice')
        .setDescription('Roll a die for random seed selection')
        .addIntegerOption((opt) =>
          opt.setName('sides').setDescription('Number of sides (default: 6)').setMinValue(2).setMaxValue(100)
        )
    )
    // 3. /tool poll
    .addSubcommand((sub) =>
      sub
        .setName('poll')
        .setDescription('Create a quick esports voting poll')
        .addStringOption((opt) =>
          opt.setName('question').setDescription('Poll question').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('option_1').setDescription('First Option').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('option_2').setDescription('Second Option').setRequired(true)
        )
    )
    // 4. /tool serverinfo
    .addSubcommand((sub) =>
      sub
        .setName('serverinfo')
        .setDescription('Display server esports status and telemetry')
    )
    // 5. /tool clear
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('Purge past chat messages in this channel')
        .addIntegerOption((opt) =>
          opt.setName('count').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'coinflip') {
      const outcome = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
      const icon = outcome === 'HEADS' ? '🪙' : '🪙';
      const embed = createBaseEmbed('🪙 Coinflip Result')
        .setColor(COLORS.CRYSTAL)
        .setDescription(`The coin flipped and landed on: **${outcome}**!`)
        .setFooter({ text: 'Decided by Crystal Random Engine' });
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'dice') {
      const sides = interaction.options.getInteger('sides') || 6;
      const roll = Math.floor(Math.random() * sides) + 1;
      const embed = createBaseEmbed('🎲 Dice Roll Result')
        .setColor(COLORS.SUCCESS)
        .setDescription(`Rolled a D${sides}: **${roll}**!`)
        .setFooter({ text: 'Decided by Crystal Random Engine' });
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'poll') {
      const question = interaction.options.getString('question', true);
      const opt1 = interaction.options.getString('option_1', true);
      const opt2 = interaction.options.getString('option_2', true);

      const embed = createBaseEmbed(`📊 Tournament Poll: ${question}`)
        .setColor(COLORS.CRYSTAL)
        .setDescription(
          `**${question}**\n\n` +
          `1️⃣ **${opt1}**\n` +
          `2️⃣ **${opt2}**\n\n` +
          `*Vote by clicking the reaction buttons below!*`
        )
        .setFooter({ text: `Created by ${interaction.user.tag}` });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_vote_1`)
          .setLabel(opt1)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`poll_vote_2`)
          .setLabel(opt2)
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    if (subcommand === 'serverinfo') {
      const guild = interaction.guild!;
      const embed = createBaseEmbed(`🛡️ Server Esports Telemetry: ${guild.name}`)
        .setColor(COLORS.CRYSTAL)
        .addFields(
          { name: '👥 Total Members', value: `\`${guild.memberCount}\``, inline: true },
          { name: '👑 Server Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: '🎮 Platform Engine', value: '`Crystal Scrims Manager v2.0`', inline: true },
          { name: '🌐 Web Console', value: '`http://localhost:8080/`', inline: true },
          { name: '💾 Database Backend', value: '`Turso LibSQL / Local SQLite`', inline: true }
        );
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'clear') {
      const isPermitted = await isOrganizerOrAdmin(interaction);
      if (!isPermitted) {
        await interaction.reply({ content: 'Only Admins or Organizers can clear chat messages.', ephemeral: true });
        return;
      }

      const count = interaction.options.getInteger('count', true);
      const channel = interaction.channel as TextChannel | null;
      if (!channel || !channel.bulkDelete) {
        await interaction.reply({ content: 'Cannot clear messages in this channel type.', ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const deleted = await channel.bulkDelete(count, true);
      await interaction.editReply({ content: `🧹 Successfully purged ${deleted.size} message(s).` });
      return;
    }
  },
};
