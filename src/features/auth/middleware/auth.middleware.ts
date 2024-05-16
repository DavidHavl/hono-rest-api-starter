import { verifyAuth } from '@hono/auth-js';
import type { Context } from 'hono';

/**
 * Middleware (guard) to check if the user is authenticated
 */
export const authMiddleware = async (c: Context, next) => {
  const matchedPath = c.req.path;
  const publicPaths = ['/', '/docs', '/auth', '/auth/callback/github'];
  if (publicPaths.includes(matchedPath)) {
    return next();
  }
  console.log('Did not match public paths...');
  console.log(c.req);
  return verifyAuth()(c, next);
};
