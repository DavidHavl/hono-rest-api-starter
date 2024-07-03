import type { User } from '@/features/user/models/user.type';
import type { Context } from 'hono';

export const getCurentUser = (c: Context): User | undefined => {
  const auth = c.get('authUser');
  return auth?.session?.user;
};
