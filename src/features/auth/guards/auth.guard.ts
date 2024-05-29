import { isPathMatch } from '@/utils/path';
import { verifyAuth } from '@hono/auth-js';
import type { Context } from 'hono';

type AuthGuardConfig = {
  excludePaths?: string[];
};

/**
 * Middleware (route guard) to check if the user is authenticated
 */
export const authGuard = (config?: AuthGuardConfig) => {
  const excludePaths: string[] = config?.excludePaths || [];
  return async (c: Context, next) => {
    if (isPathMatch(c.req.path, excludePaths)) {
      return next();
    }
    return verifyAuth()(c, next);
  };
};
