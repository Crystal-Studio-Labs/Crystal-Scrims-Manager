import { PermissionFlagsBits, type GuildMember, type PermissionsBitField } from 'discord.js';
import { db, guilds } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';

export interface InteractionWithPermissions {
  member: GuildMember | any;
  guildId: string | null;
  memberPermissions?: Readonly<PermissionsBitField> | null;
}

export async function isOrganizerOrAdmin(interaction: InteractionWithPermissions): Promise<boolean> {
  // If in direct messages or invalid guild context, deny administrative actions
  if (!interaction.guildId || !interaction.member) {
    return false;
  }

  // 1. Check memberPermissions directly if available (works for API & cached members)
  if (interaction.memberPermissions) {
    if (
      interaction.memberPermissions.has(PermissionFlagsBits.Administrator) ||
      interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      return true;
    }
  }

  // 2. Check cached guild member permissions
  const member = interaction.member as GuildMember;
  if (member?.permissions?.has) {
    if (
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      return true;
    }
  }

  // 3. Check if user has the configured Organizer Role from the Database
  try {
    const guildConfig = await db.select().from(guilds).where(eq(guilds.guildId, interaction.guildId)).get();
    
    if (guildConfig?.organizerRoleId && member?.roles?.cache?.has(guildConfig.organizerRoleId)) {
      return true;
    }
  } catch {
    // Database query error fallback
  }

  // 4. Fallback: Check if user has role matching DEFAULT_ORGANIZER_ROLE name
  if (member?.roles?.cache?.some((role: any) => role.name.toLowerCase() === env.DEFAULT_ORGANIZER_ROLE.toLowerCase())) {
    return true;
  }

  return false;
}
