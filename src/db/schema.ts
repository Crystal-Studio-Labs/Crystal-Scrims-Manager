import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Guild / Server Configurations
export const guilds = sqliteTable('guilds', {
  guildId: text('guild_id').primaryKey(),
  name: text('name').notNull(),
  prefix: text('prefix').default('!').notNull(),
  scrimCategoryId: text('scrim_category_id'),
  idpChannelId: text('idp_channel_id'),
  logsChannelId: text('logs_channel_id'),
  organizerRoleId: text('organizer_role_id'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// 2. Teams and Rosters
export const teams = sqliteTable('teams', {
  teamId: text('team_id').primaryKey(),
  guildId: text('guild_id').references(() => guilds.guildId, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  tag: text('tag'),
  captainDiscordId: text('captain_discord_id').notNull(),
  logoUrl: text('logo_url'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// 3. Team Members
export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey(),
  teamId: text('team_id').references(() => teams.teamId, { onDelete: 'cascade' }).notNull(),
  discordId: text('discord_id').notNull(),
  gameUid: text('game_uid'),
  ign: text('ign'),
  role: text('role').default('STARTER').notNull(), // CAPTAIN, STARTER, SUB
});

// 4. Scrim Lobbies / Events
export const scrimLobbies = sqliteTable('scrim_lobbies', {
  lobbyId: text('lobby_id').primaryKey(),
  guildId: text('guild_id').references(() => guilds.guildId, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  tier: text('tier').default('T3').notNull(), // T1, T2, T3
  gameType: text('game_type').default('BGMI').notNull(), // BGMI, PUBG, VALORANT, FREEFIRE
  totalSlots: integer('total_slots').default(25).notNull(),
  status: text('status').default('SCHEDULED').notNull(), // SCHEDULED, OPEN, CLOSED, LIVE, COMPLETED, CANCELLED
  registrationChannelId: text('registration_channel_id'),
  slotlistMessageId: text('slotlist_message_id'),
  roomId: text('room_id'),
  roomPassword: text('room_password'),
  scheduledAt: text('scheduled_at'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// 5. Slot Allocations & Registrations
export const slotRegistrations = sqliteTable('slot_registrations', {
  registrationId: text('registration_id').primaryKey(),
  lobbyId: text('lobby_id').references(() => scrimLobbies.lobbyId, { onDelete: 'cascade' }).notNull(),
  teamId: text('team_id').references(() => teams.teamId, { onDelete: 'cascade' }).notNull(),
  slotNumber: integer('slot_number'), // NULL if on waitlist
  isWaitlist: integer('is_waitlist', { mode: 'boolean' }).default(false).notNull(),
  waitlistPosition: integer('waitlist_position'),
  checkedIn: integer('checked_in', { mode: 'boolean' }).default(false).notNull(),
  registeredAt: text('registered_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// 6. Blacklisted Users / Teams
export const blacklists = sqliteTable('blacklists', {
  id: text('id').primaryKey(),
  guildId: text('guild_id').references(() => guilds.guildId, { onDelete: 'cascade' }).notNull(),
  targetId: text('target_id').notNull(), // Discord User ID or Team Name
  type: text('type').default('USER').notNull(), // USER, TEAM
  reason: text('reason'),
  bannedBy: text('banned_by').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
