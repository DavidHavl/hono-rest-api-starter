import { createMiddleware } from 'hono/factory';

export const faviconHandler = createMiddleware(async (c, _next) => {
  c.res.headers.set('content-type', 'image/svg+xml');
  return c.body(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70"><text y="0.925em" font-size="64">🔥</text></svg>`,
  );
});
