import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ChannelType,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
  type TextChannel,
  type CategoryChannel,
  type Role
} from 'discord.js';
import type { Command } from '../../types/index.js';
import { db, guilds } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { isOrganizerOrAdmin } from '../../utils/permissions.js';
import { createSuccessEmbed, createErrorEmbed, createBaseEmbed, COLORS } from '../../utils/embeds.js';

export const setupCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure server channels, roles, games, and automated structure')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    // 1. /setup autostructure
    .addSubcommand((sub) =>
      sub
        .setName('autostructure')
        .setDescription('1-Click magic: automatically create roles, category & all scrim channels with permissions')
        .addStringOption((opt) =>
          opt.setName('category_name').setDescription('Custom name for the Scrims Category (default: 🏆 ┃ CRYSTAL SCRIMS)')
        )
    )
    // 2. /setup roles
    .addSubcommand((sub) =>
      sub
        .setName('roles')
        .setDescription('Automatically provision or repair core esports roles (Organizer, Captain, Player)')
    )
    // 3. /setup games
    .addSubcommand((sub) =>
      sub
        .setName('games')
        .setDescription('Configure which esports games are allowed on this server')
        .addStringOption((opt) =>
          opt
            .setName('allowed')
            .setDescription('Select allowed games or choose ALL')
            .setRequired(true)
            .addChoices(
              { name: '🌐 All Esports Disciplines (Default)', value: 'ALL' },
              { name: '🔫 BGMI / PUBG Mobile Only', value: 'BGMI' },
              { name: '🔥 Free Fire Only', value: 'FREEFIRE' },
              { name: '🎯 Valorant Only', value: 'VALORANT' },
              { name: '🎖️ Call of Duty Mobile Only', value: 'CODM' },
              { name: '⚡ Apex Legends Only', value: 'APEX' }
            )
        )
    )
    // 4. /setup wizard
    .addSubcommand((sub) =>
      sub
        .setName('wizard')
        .setDescription('Interactive Channel & Role picker menus to bind existing server channels')
    )
    // 5. /setup set-role
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

    // Helper: Find or create esports role
    async function getOrCreateRole(name: string, color: number, hoist = false): Promise<Role> {
      let role = guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase());
      if (!role) {
        role = await guild.roles.create({
          name,
          color,
          hoist,
          reason: 'Crystal Scrims Manager automated esports role provisioning',
        });
      }
      return role;
    }

    // 1. Auto Structure Generator (Creates Roles + Category + Channels)
    if (subcommand === 'autostructure') {
      await interaction.deferReply();
      try {
        const categoryName = interaction.options.getString('category_name') || '🏆 ┃ CRYSTAL SCRIMS';

        // 1. Provision Core Esports Roles
        const organizerRole = await getOrCreateRole('Scrim Organizer', 0xFF0055, true);
        const captainRole = await getOrCreateRole('Scrim Captain', 0x00F0FF, true);
        const playerRole = await getOrCreateRole('Verified Player', 0x39FF14, false);

        // 2. Create Parent Category
        const category = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
        });

        // 3. Registration Channel
        const regChannel = await guild.channels.create({
          name: '📝・slot-registration',
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages],
            },
            {
              id: organizerRole.id,
              allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
            },
          ],
        });

        // 4. Confirmed Slots Channel
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

        // 5. IDP Room Credentials Channel (Locked)
        const idpChannel = await guild.channels.create({
          name: '🔑・room-credentials',
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: organizerRole.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
              id: captainRole.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages],
            },
          ],
        });

        // 6. Announcements & Results Channel
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
            {
              id: organizerRole.id,
              allow: [PermissionFlagsBits.SendMessages],
            },
          ],
        });

        // Save into Database
        await db.insert(guilds).values({
          guildId: guild.id,
          name: guild.name,
          categoryName,
          scrimCategoryId: category.id,
          registrationChannelId: regChannel.id,
          slotlistChannelId: slotlistChannel.id,
          idpChannelId: idpChannel.id,
          announcementsChannelId: announceChannel.id,
          organizerRoleId: organizerRole.id,
          captainRoleId: captainRole.id,
          playerRoleId: playerRole.id,
        }).onConflictDoUpdate({
          target: guilds.guildId,
          set: {
            categoryName,
            scrimCategoryId: category.id,
            registrationChannelId: regChannel.id,
            slotlistChannelId: slotlistChannel.id,
            idpChannelId: idpChannel.id,
            announcementsChannelId: announceChannel.id,
            organizerRoleId: organizerRole.id,
            captainRoleId: captainRole.id,
            playerRoleId: playerRole.id,
          },
        });

        const embed = createSuccessEmbed(
          '1-Click Esports Ecosystem Deployed!',
          `Successfully provisioned server roles, category, and locked channels:\n\n` +
          `🎭 **Roles Created**:\n` +
          `• Organizer: <@&${organizerRole.id}>\n` +
          `• Captain: <@&${captainRole.id}>\n` +
          `• Player: <@&${playerRole.id}>\n\n` +
          `📁 **Category**: ${category.name}\n` +
          `📝 **Registration**: <#${regChannel.id}>\n` +
          `📋 **Slotlist**: <#${slotlistChannel.id}>\n` +
          `🔑 **Room Credentials (IDP)**: <#${idpChannel.id}>\n` +
          `📢 **Announcements & Results**: <#${announceChannel.id}>\n\n` +
          `*Your server is now 100% configured with role hierarchies and locked permissions!*`
        );

        await interaction.editReply({ embeds: [embed] });
      } catch (err: any) {
        await interaction.editReply({ embeds: [createErrorEmbed('Setup Failed', err.message)] });
      }
      return;
    }

    // 2. Provision / Repair Esports Roles Subcommand
    if (subcommand === 'roles') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const organizerRole = await getOrCreateRole('Scrim Organizer', 0xFF0055, true);
        const captainRole = await getOrCreateRole('Scrim Captain', 0x00F0FF, true);
        const playerRole = await getOrCreateRole('Verified Player', 0x39FF14, false);

        await db.insert(guilds).values({
          guildId: guild.id,
          name: guild.name,
          organizerRoleId: organizerRole.id,
          captainRoleId: captainRole.id,
          playerRoleId: playerRole.id,
        }).onConflictDoUpdate({
          target: guilds.guildId,
          set: {
            organizerRoleId: organizerRole.id,
            captainRoleId: captainRole.id,
            playerRoleId: playerRole.id,
          },
        });

        const embed = createSuccessEmbed(
          'Esports Roles Provisioned',
          `Verified and configured core competitive roles for this server:\n\n` +
          `🛡️ **Organizer**: <@&${organizerRole.id}> (Staff permissions)\n` +
          `👑 **Captain**: <@&${captainRole.id}> (Team manager role)\n` +
          `🎮 **Player**: <@&${playerRole.id}> (Verified roster member)`
        );

        await interaction.editReply({ embeds: [embed] });
      } catch (err: any) {
        await interaction.editReply({ embeds: [createErrorEmbed('Role Setup Failed', err.message)] });
      }
      return;
    }

    // 3. Configure Allowed Games Whitelist Subcommand
    if (subcommand === 'games') {
      const allowed = interaction.options.getString('allowed', true);

      await db.insert(guilds).values({
        guildId: guild.id,
        name: guild.name,
        allowedGames: allowed,
      }).onConflictDoUpdate({
        target: guilds.guildId,
        set: { allowedGames: allowed },
      });

      const embed = createSuccessEmbed(
        'Allowed Games Whitelist Updated',
        `Server game discipline policy set to: **${allowed === 'ALL' ? '🌐 All Esports Disciplines' : allowed}**.\n\n` +
        `When staff create scrim lobbies with \`/scrim create\`, only enabled games will be allowed!`
      );

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // 4. Interactive Wizard with 2-Minute Expiration & Misclick Prevention
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
          `Use the selection menus below to bind existing server channels and staff roles.\n\n` +
          `1. **Registration Channel**: Where registration embeds will be posted.\n` +
          `2. **IDP Channel**: Where private room credentials will route.\n` +
          `3. **Organizer Role**: Staff role permitted to manage scrims.\n\n` +
          `⏱️ *This setup menu will automatically expire in 2 minutes to prevent misclicks.*`
        );

      const response = await interaction.reply({
        embeds: [embed],
        components: [row1, row2, row3],
        ephemeral: true,
      });

      // Collector with auto-disable expiration
      const collector = response.createMessageComponentCollector({
        time: 120000, // 2 minutes
      });

      collector.on('end', async () => {
        channelSelect.setDisabled(true);
        idpSelect.setDisabled(true);
        roleSelect.setDisabled(true);

        const expiredEmbed = createBaseEmbed('⚙️ Interactive Server Setup Wizard (Expired)')
          .setColor(COLORS.DARK)
          .setDescription(`*This wizard session has expired to prevent accidental misclicks. Run \`/setup wizard\` again whenever you wish to adjust settings.*`);

        await interaction.editReply({
          embeds: [expiredEmbed],
          components: [
            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect),
            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(idpSelect),
            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect),
          ],
        }).catch(() => {});
      });

      return;
    }

    // 5. Set Organizer Role directly
    if (subcommand === 'set-role') {
      const role = interaction.options.getRole('role', true);

      await db.insert(guilds).values({
        guildId: guild.id,
        name: guild.name,
        organizerRoleId: role.id,
      }).onConflictDoUpdate({
        target: guilds.guildId,
        set: { organizerRoleId: role.id },
      });

      const embed = createSuccessEmbed(
        'Organizer Role Configured',
        `Members with the role <@&${role.id}> now have full permission to manage scrims, brackets, and match outcomes!`
      );
      await interaction.reply({ embeds: [embed] });
      return;
    }
  },
};
