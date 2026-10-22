import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/index.js';
import { createBaseEmbed, COLORS } from '../../utils/embeds.js';

export const guideCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('guide')
    .setDescription('Step-by-step simple guides for players and event organizers')
    .addSubcommand((sub) =>
      sub
        .setName('player')
        .setDescription('How to register your team, check in, and view Room ID/Password')
    )
    .addSubcommand((sub) =>
      sub
        .setName('host')
        .setDescription('Complete guide for hosts: creating scrims, dropping IDP, and scoring')
    )
    .addSubcommand((sub) =>
      sub
        .setName('template')
        .setDescription('Get a copy-paste registration template for team captains')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'player') {
      const embed = createBaseEmbed('📖 Player Quick-Start Guide')
        .setColor(COLORS.CRYSTAL)
        .setDescription(
          `### 🎯 How to Register for Scrims:\n\n` +
          `1. **Find the Registration Channel**:\n` +
          `   Go to the channel designated for scrim signups (e.g. \`#📝・slot-registration\`).\n\n` +
          `2. **Click the [📝 Register Team] Button**:\n` +
          `   A pop-up modal will appear on your screen. Enter your **Team Name**, optional **Tag** (e.g. \`CRYS\`), and your player lineup.\n\n` +
          `3. **Check Your Slot Status**:\n` +
          `   • If slots are available: You receive a **Confirmed Slot** (e.g. \`Slot #4\`).\n` +
          `   • If slots are full: You are placed on the **Waitlist**. If any team drops out, you are automatically promoted!\n\n` +
          `4. **View Room ID & Password (IDP)**:\n` +
          `   15 minutes before the match starts, click the **[🔑 View Room IDP]** button. The bot will reveal the room credentials securely to you alone.\n\n` +
          `5. **Need to cancel?**:\n` +
          `   Click the red **[🚪 Leave Slot]** button to forfeit cleanly and allow waitlist squads to play.`
        );
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'host') {
      const embed = createBaseEmbed('👑 Event Organizer & Host Guide')
        .setColor(COLORS.SUCCESS)
        .setDescription(
          `### 🏆 How to Host Daily Scrims:\n\n` +
          `1. **1-Click Auto Server Setup**:\n` +
          `   Run \`/setup autostructure\` to automatically create the Scrims Category and channels.\n\n` +
          `2. **Create a Scrim Lobby**:\n` +
          `   Run \`/scrim create title:"Daily 8PM T3 Scrims" game:BGMI slots:25 tier:T3\`\n\n` +
          `3. **Open Registrations**:\n` +
          `   Run \`/scrim open lobby_id:<id>\`. The bot will post the registration card with interactive buttons in the channel.\n\n` +
          `4. **Manage via Web Console or Discord Panel**:\n` +
          `   • On Discord: Run \`/scrim panel lobby_id:<id>\`\n` +
          `   • On Web: Open \`http://localhost:8080/\` to use the live Drag & Drop slot matrix!\n\n` +
          `5. **Set Room ID & Password**:\n` +
          `   Run \`/scrim set-idp lobby_id:<id> room_id:12345 password:abcd\`.\n\n` +
          `6. **Score the Match**:\n` +
          `   Run \`/points add lobby_id:<id> team_name:"Team Name" placement:1 kills:6\` or use the Web Scorekeeper Studio.`
        );
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'template') {
      const embed = createBaseEmbed('📋 Team Registration Template')
        .setColor(COLORS.CRYSTAL)
        .setDescription(
          `Captains can copy and fill out this standard lineup template:\n\n` +
          `\`\`\`txt\n` +
          `TEAM NAME: \n` +
          `TAG: \n` +
          `PLAYER 1 (Captain): @Mention / IGN\n` +
          `PLAYER 2: @Mention / IGN\n` +
          `PLAYER 3: @Mention / IGN\n` +
          `PLAYER 4: @Mention / IGN\n` +
          `SUB: @Mention / IGN\n` +
          `\`\`\`\n` +
          `*Simply click **[📝 Register Team]** and paste your lineup into the modal!*`
        );
      await interaction.reply({ embeds: [embed] });
      return;
    }
  },
};
