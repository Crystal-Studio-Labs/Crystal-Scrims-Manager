import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/index.js';
import { createBaseEmbed, COLORS } from '../../utils/embeds.js';

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check Crystal Scrims Manager latency and system telemetry'),

  async execute(interaction, client) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = client.ws.ping;
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());

    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = uptimeSec % 60;
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    const embed = createBaseEmbed('🏓 Pong! • System Telemetry')
      .setColor(roundtripLatency < 200 ? COLORS.SUCCESS : COLORS.WARNING)
      .addFields(
        { name: '⚡ Bot Latency', value: `\`${roundtripLatency}ms\``, inline: true },
        { name: '💓 WebSocket Heartbeat', value: `\`${wsPing}ms\``, inline: true },
        { name: '⏱️ Uptime', value: `\`${uptimeStr}\``, inline: true },
        { name: '💾 Memory (RSS)', value: `\`${(mem.rss / 1024 / 1024).toFixed(1)} MB\``, inline: true },
        { name: '🧠 Heap Used', value: `\`${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB\``, inline: true },
        { name: '🌐 Active Guilds', value: `\`${client.guilds.cache.size}\``, inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
