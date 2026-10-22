CREATE TABLE `blacklists` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`target_id` text NOT NULL,
	`type` text DEFAULT 'USER' NOT NULL,
	`reason` text,
	`banned_by` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`guild_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `guilds` (
	`guild_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`prefix` text DEFAULT '!' NOT NULL,
	`category_name` text DEFAULT '🏆 ┃ CRYSTAL SCRIMS',
	`scrim_category_id` text,
	`registration_channel_id` text,
	`slotlist_channel_id` text,
	`idp_channel_id` text,
	`announcements_channel_id` text,
	`logs_channel_id` text,
	`organizer_role_id` text,
	`captain_role_id` text,
	`player_role_id` text,
	`allowed_games` text DEFAULT 'ALL' NOT NULL,
	`win_template` text,
	`loss_template` text,
	`draw_template` text,
	`win_image_url` text,
	`loss_image_url` text,
	`draw_image_url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scrim_lobbies` (
	`lobby_id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`title` text NOT NULL,
	`tier` text DEFAULT 'T3' NOT NULL,
	`game_type` text DEFAULT 'BGMI' NOT NULL,
	`total_slots` integer DEFAULT 25 NOT NULL,
	`reserved_slots_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'SCHEDULED' NOT NULL,
	`registration_channel_id` text,
	`slotlist_message_id` text,
	`live_leaderboard_channel_id` text,
	`live_leaderboard_message_id` text,
	`room_id` text,
	`room_password` text,
	`auto_open_at` text,
	`auto_close_at` text,
	`scheduled_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`guild_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scrim_match_results` (
	`result_id` text PRIMARY KEY NOT NULL,
	`lobby_id` text NOT NULL,
	`team_id` text NOT NULL,
	`match_round` integer DEFAULT 1 NOT NULL,
	`placement` integer NOT NULL,
	`placement_points` integer DEFAULT 0 NOT NULL,
	`kills` integer DEFAULT 0 NOT NULL,
	`total_points` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`lobby_id`) REFERENCES `scrim_lobbies`(`lobby_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `slot_registrations` (
	`registration_id` text PRIMARY KEY NOT NULL,
	`lobby_id` text NOT NULL,
	`team_id` text NOT NULL,
	`slot_number` integer,
	`is_waitlist` integer DEFAULT false NOT NULL,
	`is_reserved` integer DEFAULT false NOT NULL,
	`waitlist_position` integer,
	`checked_in` integer DEFAULT false NOT NULL,
	`registered_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`lobby_id`) REFERENCES `scrim_lobbies`(`lobby_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`discord_id` text NOT NULL,
	`game_uid` text,
	`ign` text,
	`role` text DEFAULT 'STARTER' NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`team_id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`name` text NOT NULL,
	`tag` text,
	`captain_discord_id` text NOT NULL,
	`logo_url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`guild_id`) ON UPDATE no action ON DELETE cascade
);
