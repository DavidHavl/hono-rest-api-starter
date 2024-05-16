import type { Context } from 'hono';

export const getCurentUser = (c: Context) => {
  const auth = c.get('authUser');
  return auth?.session?.user;
};
