import type { ProjectsTable } from '@/features/project/models/projects.table';

export type Project = typeof ProjectsTable.$inferSelect;
