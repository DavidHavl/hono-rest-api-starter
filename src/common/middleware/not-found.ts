import type { Context } from 'hono';

export function notFound(c: Context) {
  const baseUrl = c.env.BASE_URL;
  return c.json(
    {
      jsonapi: { version: '1.1' },
      errors: [
        {
          status: '404',
          code: 'NOT_FOUND',
          title: 'Not Found',
          detail: `The route ${c.req.method} ${c.req.path} does not exist.`,
          links: {
            about: `${baseUrl}/docs/errors/NOT_FOUND`,
            type: `${baseUrl}/docs/errors`,
          },
        },
      ],
    },
    404,
    { 'Content-Type': 'application/vnd.api+json' },
  );
}
