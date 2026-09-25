CREATE TABLE `board_member` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name_initial` text NOT NULL,
	`role` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `club_info` (
	`id` text PRIMARY KEY DEFAULT 'club' NOT NULL,
	`history_text` text NOT NULL,
	`values` text NOT NULL,
	`team_info` text,
	`contact_email` text NOT NULL,
	`contact_phone` text,
	`social_links` text DEFAULT '[]' NOT NULL,
	`key_figures` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `competition` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date` integer NOT NULL,
	`location` text NOT NULL,
	`description` text,
	`result` text
);
--> statement-breakpoint
CREATE INDEX `competition_date_idx` ON `competition` (`date`);--> statement-breakpoint
CREATE TABLE `contact_request` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`submitted_at` integer NOT NULL,
	`captcha_verified` integer NOT NULL,
	`rgpd_notice_acknowledged` integer NOT NULL,
	`purge_at` integer NOT NULL,
	`notification_sent_at` integer
);
--> statement-breakpoint
CREATE INDEX `contact_request_purge_at_idx` ON `contact_request` (`purge_at`);--> statement-breakpoint
CREATE TABLE `partner` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`level` text NOT NULL,
	`website_url` text,
	`description` text,
	`logo_url` text,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photo` (
	`id` text PRIMARY KEY NOT NULL,
	`image_url` text NOT NULL,
	`caption` text,
	`category_id` text NOT NULL,
	`taken_or_event_date` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `photo_category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `photo_created_at_idx` ON `photo` (`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `photo_category_created_at_idx` ON `photo` (`category_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `photo_category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photo_category_name_unique` ON `photo_category` (`name`);