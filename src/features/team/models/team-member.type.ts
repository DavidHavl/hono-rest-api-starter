import type { TeamMembersTable } from '@/features/team/models/team-members.table';

export type TeamMember = typeof TeamMembersTable.$inferSelect;
