import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ChannelType,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  type TextChannel,
  type CategoryChannel
} from 'discord.js';
import type { Command } from '../../types/index.js';
import { db, guilds } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { isOrganizerOrAdmin } from '../../utils/permissions.js';
import { createSuccessEmbed, createErrorEmbed, createBaseEmbed, COLORS } from '../../utils/embeds.js';

export const setupCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure server channels, roles, and automated structure')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    // 1. /setup autostructure
    .addSubcommand((sub) =>
      sub
        .setName('autostructure')
        .setDescription('1-Click magic: automatically create category & all scrim channels with permissions')
        .addStringOption((opt) =>
          opt.setName('category_name').setDescription('Custom name for the Scrims Category (default: 🏆 ┃ CRYSTAL SCRIMS)')
        )
    )
    // 2. /setup wizard
    .addSubcommand((sub) =>
      sub
        .setName('wizard')
        .setDescription('Interactive Channel & Role picker menus to bind existing server channels')
    )
    // 3. /setup set-role
    .addSubcommand((sub) =>
      sub
        .setName('set-role')
        .setDescription('Designate the Scrims Organizer / Event Manager role')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role permitted to run scrim commands').setRequired(true)
        )
    ),

  async execute(interaction) {
    const isPermitted = await isOrganizerOrAdmin(interaction);
    if (!isPermitted) {
      await interaction.reply({
        embeds: [createErrorEmbed('Permission Denied', 'Only Server Administrators or Scrim Organizers can configure bot settings.')],
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    // 1. Auto Structure Generator
    if (subcommand === 'autostructure') {
      await interaction.deferReply();
      try {
        const categoryName = interaction.options.getString('category_name') || '🏆 ┃ CRYSTAL SCRIMS';

        // Create Parent Category
        const category = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
        });

        // 1. Registration Channel
        const regChannel = await guild.channels.create({
          name: '📝・slot-registration',
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages], // Bot sends the interactive embed & buttons
            },
          ],
        });

        // 2. Slotlist Announcements Channel
        const slotlistChannel = await guild.channels.create({
          name: '📋・confirmed-slots',
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages],
            },
          ],
        });

        // 3. IDP Room Credentials Channel (Locked)
        const idpChannel = await guild.channels.create({
          name: '🔑・room-credentials',
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages],
            },
          ],
        });

        // 4. Announcements & Results Channel
        const announceChannel = await guild.channels.create({
          name: '📢・announcements-results',
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages],
            },
          ],
        });

        // Update database configuration
        const existing = await db.select().from(guilds).where(eq(guilds.guildId, guild.id)).get();
        if (existing) {
          await db.update(guilds).set({
            categoryName,
            scrimCategoryId: category.id,
            registrationChannelId: regChannel.id,
            slotlistChannelId: slotlistChannel.id,
            idpChannelId: idpChannel.id,
            announcementsChannelId: announceChannel.id,
          }).where(eq(guilds.guildId, guild.id));
        } else {
          await db.insert(guilds).values({
            guildId: guild.id,
            name: guild.name,
            categoryName,
            scrimCategoryId: category.id,
            registrationChannelId: regChannel.id,
            slotlistChannelId: slotlistChannel.id,
            idpChannelId: idpChannel.id,
            announcementsChannelId: announceChannel.id,
          });
        }

        const embed = createSuccessEmbed(
          '1-Click Server Structure Deployed!',
          `Successfully generated the scrims category and all channels with locked permissions:\n\n` +
          `📁 **Category**: ${category.name}\n` +
          `📝 **Registration**: <#${regChannel.id}>\n` +
          `📋 **Slotlist**: <#${slotlistChannel.id}>\n` +
          `🔑 **Room Credentials (IDP)**: <#${idpChannel.id}>\n` +
          `📢 **Announcements & Results**: <#${announceChannel.id}>\n\n` +
          `*Your server is now 100% configured and ready to host scrims!*`
        );

        await interaction.editReply({ embeds: [embed] });
      } catch (err: any) {
        await interaction.editReply({ embeds: [createErrorEmbed('Setup Failed', err.message)] });
      }
      return;
    }

    // 2. Interactive Wizard (ChannelSelectMenu & RoleSelectMenu)
    if (subcommand === 'wizard') {
      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup_select_reg_channel')
        .setPlaceholder('Select Scrims Registration Channel...')
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

      const idpSelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup_select_idp_channel')
        .setPlaceholder('Select Room IDP Credentials Channel...')
        .setChannelTypes(ChannelType.GuildText);

      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId('setup_select_organizer_role')
        .setPlaceholder('Select Scrim Organizer / Host Role...');

      const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect);
      const row2 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(idpSelect);
      const row3 = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect);

      const embed = createBaseEmbed('⚙️ Interactive Server Setup Wizard')
        .setColor(COLORS.CRYSTAL)
        .setDescription(
          `Use the native Discord selection menus below to bind your existing server channels and roles to **Crystal Scrims Manager**.\n\n` +
          `1. **Registration Channel**: Where open lobby registration embeds will be posted.\n` +
          `2. **IDP Channel**: Where private room credentials will be dispatched.\n` +
          `3. **Organizer Role**: Staff role permitted to manage scrims and tournaments.`
        );

      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
      return;
    }

    // 3. Set Organizer Role directly
    if (subcommand === 'set-role') {
      const role = interaction.options.getRole('role', true);

      const existing = await db.select().from(guilds).where(eq(guilds.guildId, guild.id)).get();
      if (existing) {
        await db.update(guilds).set({ organizerRoleId: role.id }).where(eq(guilds.guildId, guild.id));
      } else {
        await db.insert(guilds).values({
          guildId: guild.id,
          name: guild.name,
          organizerRoleId: role.id,
        });
      }

      const embed = createSuccessEmbed(
        'Organizer Role Configured',
        `Members with the role <@&${role.id}> now have full permission to manage scrims, brackets, and match outcomes!`
      );
      await interaction.reply({ embeds: [embed] });
      return;
    }
  },
};
