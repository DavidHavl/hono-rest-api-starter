import type { UsersTable } from '@/features/user/models/users.table';

export type User = typeof UsersTable.$inferSelect;
