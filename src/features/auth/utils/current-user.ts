import type { User } from '@/features/user/models/user.type';
import { UsersTable } from '@/features/user/models/users.table';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';

export const getCurentUser = async (c: Context): Promise<User | undefined> => {
  const session = c.get('session');
  if (!session || !session.userId) {
    return undefined;
  }
  const found = await c.get('db').select().from(UsersTable).where(eq(UsersTable.id, session.userId)).limit(1);
  return found.length ? found[0] : undefined;
};
