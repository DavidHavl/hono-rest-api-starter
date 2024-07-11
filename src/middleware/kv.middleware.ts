import type { Env } from '@/types';
import type { Context } from 'hono';

/**
 * Middleware for injecting clodflare KV to context
 */
export const kvMiddleware = async (c: Context<Env>, next) => {
  if (c.env.KV === undefined) {
    throw new Error('KV is not initialized');
  }

  c.set('kv', c.env.KV);

  return next();
};
