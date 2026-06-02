import { logger } from '@/common/logger';
import { db } from '@/db';
import type { AuthRole } from '@/features/auth/types';
import type { User } from '@/features/user/models/schemas';
import { UsersTable } from './tables';

export async function seed(): Promise<User[]> {
  logger.info(' - clearing users table');

  await db.delete(UsersTable);

  logger.info(' - populating users table');

  const userRoles: AuthRole[] = ['superadmin', 'admin', 'user', 'user', 'user'];

  const values = userRoles.map((role, i) => ({
    name: `${role} user ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role,
  }));

  return db.insert(UsersTable).values(values).returning();
}
