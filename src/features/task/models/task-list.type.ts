import type { TaskListsTable } from '@/features/task/models/task-lists.table';

export type TaskList = typeof TaskListsTable.$inferSelect;
