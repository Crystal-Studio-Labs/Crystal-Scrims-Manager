import { PermissionFlagsBits, type ChatInputCommandInteraction, type GuildMember } from 'discord.js';
import { db, guilds } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';

export async function isOrganizerOrAdmin(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const member = interaction.member as GuildMember | null;
  if (!member) return false;

  // 1. Check if user is Server Owner or Administrator
  if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return true;
  }

  // 2. Check if user has the configured Organizer Role from the Database
  const guildConfig = await db.select().from(guilds).where(eq(guilds.guildId, interaction.guildId!)).get();
  
  if (guildConfig?.organizerRoleId && member.roles.cache.has(guildConfig.organizerRoleId)) {
    return true;
  }

  // 3. Fallback: Check if user has role matching DEFAULT_ORGANIZER_ROLE name
  if (member.roles.cache.some((role) => role.name.toLowerCase() === env.DEFAULT_ORGANIZER_ROLE.toLowerCase())) {
    return true;
  }

  return false;
}
