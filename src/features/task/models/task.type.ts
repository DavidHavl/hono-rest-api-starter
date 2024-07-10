import type { TasksTable } from '@/features/task/models/tasks.table';

export type Task = typeof TasksTable.$inferSelect;
