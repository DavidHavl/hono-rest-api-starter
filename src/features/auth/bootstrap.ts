import { callbackHandler, signinHandler } from '@/features/auth/endpoints/github';
import { handler as signoutHandler } from '@/features/auth/endpoints/signout.post';
import { authGuard } from '@/features/auth/guards/auth.guard';
import type { Env } from '@/types';
import type { OpenAPIHono } from '@hono/zod-openapi';

export default function (app: OpenAPIHono<Env>) {
  // Add OAuth routes
  app.get('/auth/github', signinHandler);
  app.get('/auth/github/callback', callbackHandler);

  // Add other auth routes
  app.post('/auth/signout', signoutHandler);

  // Add auth guards
  app.use('/*', authGuard({ excludePaths: ['/', '/docs'] })); // Add auth guards for all routes that need it
}
