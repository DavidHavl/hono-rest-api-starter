import type { z } from '@hono/zod-openapi';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod';
import { temporalInstantSchema } from '@/common/schemas';
import { UsersTable } from './tables';

export const userSelectSchema = createSelectSchema(UsersTable, {
  createdAt: temporalInstantSchema,
  updatedAt: temporalInstantSchema,
});

export const userInsertSchema = createInsertSchema(UsersTable);

export const userUpdateSchema = createUpdateSchema(UsersTable);

export type User = z.infer<typeof userSelectSchema>;
export type CreateUserInput = z.infer<typeof userInsertSchema>;
export type UpdateUserInput = z.infer<typeof userUpdateSchema>;
