import { logger } from '@/common/logger';
import { seed as categorySeed } from '@/features/category/models/seeds';
import { seed as itemSeed } from '@/features/item/models/seeds';
import { seed as userSeed } from '@/features/user/models/seeds';

async function seed() {
  logger.info('🌱 Seeding database...');

  const users = await userSeed();
  const categories = await categorySeed();

  const userIds = users.map((user) => user.id);
  const categoryIds = categories.map((category) => category.id);

  if (userIds.length === 0 || categoryIds.length === 0) {
    throw new Error('Seed data is empty: users and categories must have at least one entry.');
  }

  const items = await itemSeed(userIds as [string, ...string[]], categoryIds as [string, ...string[]]);

  logger.info('✅ Seeding database complete!');
}

seed().catch((err) => {
  logger.error('❌ Database seeding failed');
  throw err;
});
