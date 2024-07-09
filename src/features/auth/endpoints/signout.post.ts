import { deleteSession } from '@/features/auth/utils/session';
import type { Env } from '@/types';
import type { Context } from 'hono';
import { deleteCookie } from 'hono/cookie';

export const handler = async (c: Context<Env>) => {
  const session = c.get('session');
  if (!session || !session.id) {
    return c.status(204);
  }
  await deleteSession(c, session.id);

  // Delete the session cookie
  const cookieName = c.env.ENVIRONMENT === 'production' ? '__Secure-session' : 'session';
  deleteCookie(c, cookieName);
  // deleteCookie(c, cookieName, '', {
  //   path: '/',
  //   secure: c.env.ENVIRONMENT === 'production',
  //   httpOnly: true,
  //   maxAge: -1, // Set cookie to expire immediately
  //   sameSite: 'Lax',
  // });

  return c.status(204);
};
