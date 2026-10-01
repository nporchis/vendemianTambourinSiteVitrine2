CREATE TABLE `admin` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_email_unique` ON `admin` (`email`);--> statement-breakpoint
CREATE TABLE `admin_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_admin_id` text,
	`action` text NOT NULL,
	`target_admin_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`actor_admin_id`) REFERENCES `admin`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_admin_id`) REFERENCES `admin`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `admin_session` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `admin_session_admin_id_idx` ON `admin_session` (`admin_id`);--> statement-breakpoint
CREATE TABLE `password_reset_token` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `password_reset_token_admin_id_idx` ON `password_reset_token` (`admin_id`);--> statement-breakpoint
ALTER TABLE `contact_request` ADD `processed_at` integer;