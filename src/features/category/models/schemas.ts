import type { z } from '@hono/zod-openapi';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod';
import { temporalInstantSchema } from '@/common/schemas';
import { CategoriesTable } from './tables';

export const categorySelectSchema = createSelectSchema(CategoriesTable, {
  createdAt: temporalInstantSchema,
  updatedAt: temporalInstantSchema,
});

export const categoryInsertSchema = createInsertSchema(CategoriesTable);

export const categoryUpdateSchema = createUpdateSchema(CategoriesTable);

export type Category = z.infer<typeof categorySelectSchema>;
export type CreateCategoryInput = z.infer<typeof categoryInsertSchema>;
export type UpdateCategoryInput = z.infer<typeof categoryUpdateSchema>;
