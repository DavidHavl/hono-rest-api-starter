import { createMiddleware } from 'hono/factory';
import { uuidv7 } from 'uuidv7';

/**
 * Assigns a unique request ID to every incoming request.
 * Available via c.get('requestId') and returned in X-Request-Id header.
 */
export const requestId = createMiddleware(async (c, next) => {
  const id = c.req.header('x-request-id') ?? uuidv7();
  c.set('requestId', id);
  c.header('X-Request-Id', id);
  await next();
});
