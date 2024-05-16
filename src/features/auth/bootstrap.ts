import { authMiddleware } from '@/features/auth/middleware/auth.middleware';
import type { Env, Vars } from '@/types';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { getAuthConfig } from './auth.config';

export default function (
  app: OpenAPIHono<{
    Bindings: Env;
    Variables: Vars;
  }>,
) {
  app.use('/*', initAuthConfig(getAuthConfig)); // Add auth config to context (under "authConfig" key) for all routes

  app.use('/auth/*', authHandler()); // Add handlers for auth/signin, auth/signout, and auth/callback routes

  app.use('/*', authMiddleware); // Add auth guards for all routes that need it
}
