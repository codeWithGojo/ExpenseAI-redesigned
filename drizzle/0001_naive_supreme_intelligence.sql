CREATE TABLE `savings_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`target_kobo` integer NOT NULL,
	`saved_kobo` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_goals_owner` ON `savings_goals` (`owner_id`);