CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`ownerId` text NOT NULL,
	`title` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `task-lists` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`teamId` text NOT NULL,
	`projectId` text NOT NULL,
	`ownerId` text NOT NULL,
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
	`isCompleted` integer DEFAULT false NOT NULL,
	`completedAt` integer,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `team-members` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`teamId` text NOT NULL,
	`hasUserAccepted` integer DEFAULT false,
	`hasTeamAccepted` integer DEFAULT false,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`ownerId` text NOT NULL,
	`title` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
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
