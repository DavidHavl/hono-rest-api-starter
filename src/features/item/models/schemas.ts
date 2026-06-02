import type { z } from '@hono/zod-openapi';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod';
import { temporalInstantSchema } from '@/common/schemas';
import { ItemsTable } from './tables';

export const itemSelectSchema = createSelectSchema(ItemsTable, {
  completedAt: temporalInstantSchema.nullable(),
  createdAt: temporalInstantSchema,
  updatedAt: temporalInstantSchema,
});

export const itemInsertSchema = createInsertSchema(ItemsTable);

export const itemUpdateSchema = createUpdateSchema(ItemsTable, {
  completedAt: temporalInstantSchema.optional(),
});

export type Item = z.infer<typeof itemSelectSchema>;
export type CreateItemInput = z.infer<typeof itemInsertSchema>;
export type UpdateItemInput = z.infer<typeof itemUpdateSchema>;
