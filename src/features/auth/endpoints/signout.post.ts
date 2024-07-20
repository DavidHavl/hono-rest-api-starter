import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { deleteSession } from '@/features/auth/utils/session';
import type { Env } from '@/types';
import type { Context } from 'hono';
import { deleteCookie } from 'hono/cookie';

export const handler = async (c: Context<Env>) => {
  const cookieName = c.env.ENVIRONMENT === 'production' ? '__Secure-session' : 'session';
  const session = c.get('session');
  const user = await getCurentUser(c);
  // Delete session
  if (session?.id) {
    await deleteSession(c, session.id);
  }
  // Delete cookie
  deleteCookie(c, cookieName);
  // Emit event
  if (user) {
    await emitter.emitAsync('auth:signout', c, { user });
  }
  return c.body(null, 204);
};
