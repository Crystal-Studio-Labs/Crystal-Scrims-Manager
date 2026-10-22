import { EmbedBuilder } from 'discord.js';

export const COLORS = {
  PRIMARY: 0x5865f2,  // Discord Blurple
  SUCCESS: 0x57f287,  // Bright Green
  WARNING: 0xfee75c,  // Vibrant Yellow
  DANGER: 0xed4245,   // Red
  DARK: 0x2b2d31,     // Discord Dark Neutral
  CRYSTAL: 0x00f0ff,  // Cyber Cyan / Crystal Blue
};

export function createBaseEmbed(title?: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.CRYSTAL)
    .setTimestamp()
    .setFooter({ text: 'Crystal Scrims Manager • Open Source' });

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);

  return embed;
}

export function createSuccessEmbed(title: string, description: string): EmbedBuilder {
  return createBaseEmbed(`✅ ${title}`, description).setColor(COLORS.SUCCESS);
}

export function createErrorEmbed(title: string, description: string): EmbedBuilder {
  return createBaseEmbed(`❌ ${title}`, description).setColor(COLORS.DANGER);
}

export function createWarningEmbed(title: string, description: string): EmbedBuilder {
  return createBaseEmbed(`⚠️ ${title}`, description).setColor(COLORS.WARNING);
}
