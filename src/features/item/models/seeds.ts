import { logger } from '@/common/logger';
import type { NonEmptyArray } from '@/common/types';
import { db } from '@/db';
import type { Item } from '@/features/item/models/schemas';
import { ItemsTable } from './tables';

export async function seed(
  userIds: NonEmptyArray<string>,
  categoryIds: NonEmptyArray<string>,
  count = 10,
): Promise<Item[]> {
  logger.info(' - clearing items table');

  await db.delete(ItemsTable);

  logger.info(' - populating items table');

  const values = Array.from({ length: count }, (_, i) => ({
    name: `Item ${i + 1}`,
    description: `Description ${i + 1}`,
    categoryId: categoryIds[i % categoryIds.length] as string,
    userId: userIds[i % userIds.length] as string,
  }));

  return db.insert(ItemsTable).values(values).returning();
}
