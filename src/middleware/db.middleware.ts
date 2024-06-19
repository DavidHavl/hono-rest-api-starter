import { drizzle } from 'drizzle-orm/d1';
import type { Context } from 'hono';

export let db = null;
/**
 * Middleware for injecting db to context
 */
export const dbMiddleware = async (c: Context, next) => {
  if (db === null) {
    db = drizzle(c.env.D1Database, { logger: true });
  }
  c.set('db', db);
  return next();
};
