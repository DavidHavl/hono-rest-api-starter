import type { TeamsTable } from '@/features/team/models/teams.table';

export type Team = typeof TeamsTable.$inferSelect;
