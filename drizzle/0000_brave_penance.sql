CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`month` text NOT NULL,
	`category` text NOT NULL,
	`amount_kobo` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_budgets_owner_month_category` ON `budgets` (`owner_id`,`month`,`category`);--> statement-breakpoint
CREATE TABLE `business_profiles` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`business_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`amount_kobo` integer NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`date` text NOT NULL,
	`vehicle` text DEFAULT '' NOT NULL,
	`trip` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_transactions_owner_date` ON `transactions` (`owner_id`,`date`);