import { deleteSession } from '@/features/auth/utils/session';
import type { Env } from '@/types';
import type { Context } from 'hono';
import { deleteCookie } from 'hono/cookie';

export const handler = async (c: Context<Env>) => {
  const cookieName = c.env.ENVIRONMENT === 'production' ? '__Secure-session' : 'session';
  const session = c.get('session');
  if (session?.id) {
    await deleteSession(c, session.id);
  }
  deleteCookie(c, cookieName);
  return c.status(204);
};
