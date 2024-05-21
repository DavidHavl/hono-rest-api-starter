import type { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';

export const notFoundResponse = (c: Context, message?: string) => {
  const url = new URL(c.req.url);
  c.status(404);
  return c.json<z.infer<typeof ErrorResponseSchema>, 401>({
    errors: [
      {
        status: 404,
        code: 'NOT_FOUND',
        title: '404 Not Found',
        details: message ?? 'The item does not exist',
        links: {
          about: `https://${url.origin}/docs/errors/NOT_FOUND`,
          type: `https://${url.origin}/docs/errors`,
        },
      },
    ],
  });
};
