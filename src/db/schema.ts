import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Guild / Server Configurations
export const guilds = sqliteTable('guilds', {
  guildId: text('guild_id').primaryKey(),
  name: text('name').notNull(),
  prefix: text('prefix').default('!').notNull(),
  
  // Custom Channels & Categories
  categoryName: text('category_name').default('🏆 ┃ CRYSTAL SCRIMS'),
  scrimCategoryId: text('scrim_category_id'),
  registrationChannelId: text('registration_channel_id'),
  slotlistChannelId: text('slotlist_channel_id'),
  idpChannelId: text('idp_channel_id'),
  announcementsChannelId: text('announcements_channel_id'),
  logsChannelId: text('logs_channel_id'),
  
  // Roles & Permissions
  organizerRoleId: text('organizer_role_id'),

  // Custom Pre-defined Outcome Announcement Templates
  winTemplate: text('win_template'),
  lossTemplate: text('loss_template'),
  drawTemplate: text('draw_template'),
  winImageUrl: text('win_image_url'),
  lossImageUrl: text('loss_image_url'),
  drawImageUrl: text('draw_image_url'),

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
  gameType: text('game_type').default('BGMI').notNull(), // BGMI, FREEFIRE, VALORANT, CODM, APEX, CUSTOM
  totalSlots: integer('total_slots').default(25).notNull(),
  reservedSlotsCount: integer('reserved_slots_count').default(0).notNull(),
  status: text('status').default('SCHEDULED').notNull(), // SCHEDULED, OPEN, CLOSED, LIVE, COMPLETED, CANCELLED
  
  registrationChannelId: text('registration_channel_id'),
  slotlistMessageId: text('slotlist_message_id'),
  
  // Credentials (IDP)
  roomId: text('room_id'),
  roomPassword: text('room_password'),
  
  // Timers & Recurring Automation
  autoOpenAt: text('auto_open_at'),
  autoCloseAt: text('auto_close_at'),
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
  isReserved: integer('is_reserved', { mode: 'boolean' }).default(false).notNull(),
  waitlistPosition: integer('waitlist_position'),
  checkedIn: integer('checked_in', { mode: 'boolean' }).default(false).notNull(),
  registeredAt: text('registered_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// 6. Match Results & Points Standings
export const scrimMatchResults = sqliteTable('scrim_match_results', {
  resultId: text('result_id').primaryKey(),
  lobbyId: text('lobby_id').references(() => scrimLobbies.lobbyId, { onDelete: 'cascade' }).notNull(),
  teamId: text('team_id').references(() => teams.teamId, { onDelete: 'cascade' }).notNull(),
  matchRound: integer('match_round').default(1).notNull(),
  placement: integer('placement').notNull(),
  placementPoints: integer('placement_points').default(0).notNull(),
  kills: integer('kills').default(0).notNull(),
  totalPoints: integer('total_points').default(0).notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// 7. Blacklisted Users / Teams
export const blacklists = sqliteTable('blacklists', {
  id: text('id').primaryKey(),
  guildId: text('guild_id').references(() => guilds.guildId, { onDelete: 'cascade' }).notNull(),
  targetId: text('target_id').notNull(), // Discord User ID or Team Name
  type: text('type').default('USER').notNull(), // USER, TEAM
  reason: text('reason'),
  bannedBy: text('banned_by').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
