import { logger } from '@/common/logger';
import { db } from '@/db';
import type { Category } from '@/features/category/models/schemas';
import { CategoriesTable } from './tables';

export async function seed(count = 4): Promise<Category[]> {
  logger.info(' - clearing categories table');

  await db.delete(CategoriesTable);

  logger.info(' - populating categories table');

  const values = Array.from({ length: count }, (_, i) => ({
    name: `Category ${i + 1}`,
  }));

  return db.insert(CategoriesTable).values(values).returning();
}
