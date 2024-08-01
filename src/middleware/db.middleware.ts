import type { Env } from '@/types';
import { drizzle } from 'drizzle-orm/d1';
import type { Context } from 'hono';

export let db = null;
/**
 * Middleware for injecting db to context
 */
export const dbMiddleware = async (c: Context<Env>, next) => {
  if (c.env.DB === undefined) {
    throw new Error('DB is not defined');
  }

  if (db === null) {
    db = drizzle(c.env.DB, { logger: c.env.ENVIRONMENT !== 'production' });
  }

  c.set('db', db);

  return next();
};
