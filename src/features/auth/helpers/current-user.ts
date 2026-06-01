// import { eq } from 'drizzle-orm';
// import type { Context } from 'hono';
// import type { User } from '@/features/user/models/user.type';
// import { UsersTable } from '@/features/user/models/users.table';
//
// export async function getCurrentUser(c: Context): Promise<User | undefined> {
//   const session = c.get('session');
//   if (!session || !session.userId) {
//     return undefined;
//   }
//   const found = await c.get('db').select().from(UsersTable).where(eq(UsersTable.id, session.userId)).limit(1);
//   return found.length ? found[0] : undefined;
// }
import type { Context } from 'hono';

export async function getCurrentUser(c: Context) {
  return null;
}
