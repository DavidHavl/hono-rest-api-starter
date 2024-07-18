CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`ownerId` text NOT NULL,
	`title` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task-lists` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`teamId` text NOT NULL,
	`projectId` text NOT NULL,
	`ownerId` text NOT NULL,
	`position` integer DEFAULT 0,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`dueAt` integer,
	`teamId` text NOT NULL,
	`projectId` text NOT NULL,
	`listId` text NOT NULL,
	`ownerId` text NOT NULL,
	`assigneeId` text,
	`position` integer DEFAULT 0,
	`isCompleted` integer DEFAULT false NOT NULL,
	`completedAt` integer DEFAULT 'null',
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`listId`) REFERENCES `task-lists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team-members` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`teamId` text NOT NULL,
	`hasUserAccepted` integer DEFAULT false,
	`hasTeamAccepted` integer DEFAULT false,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`ownerId` text NOT NULL,
	`title` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'user',
	`githubId` text,
	`googleId` text,
	`email` text,
	`username` text,
	`fullName` text,
	`avatarUrl` text,
	`isBlocked` integer DEFAULT false,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `team_idx` ON `projects` (`teamId`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `task-lists` (`projectId`);--> statement-breakpoint
CREATE INDEX `team_idx` ON `task-lists` (`teamId`);--> statement-breakpoint
CREATE INDEX `list_idx` ON `tasks` (`listId`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `tasks` (`projectId`);--> statement-breakpoint
CREATE INDEX `team_idx` ON `tasks` (`teamId`);--> statement-breakpoint
CREATE INDEX `team_idx` ON `team-members` (`userId`);--> statement-breakpoint
CREATE INDEX `team_idx` ON `teams` (`ownerId`);