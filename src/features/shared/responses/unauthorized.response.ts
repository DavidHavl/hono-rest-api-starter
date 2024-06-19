import { z } from '@hono/zod-openapi';
import type { Context } from 'hono';

export const UnauthorizedResponseSchema = z.object({
  errors: z.array(
    z.object({
      status: z.literal(401),
      code: z.literal('UNAUTHORIZED'),
      title: z.literal('Unauthorized'),
      details: z.string().openapi({ example: 'You need to be authenticated to access this resource' }),
      links: z.object({
        about: z.string().openapi({ example: 'https://api.website.com/docs/errors/UNAUTHORIZED' }),
        type: z.string().openapi({ example: 'https://api.website.com/docs/errors' }),
      }),
    }),
  ),
});

export const unauthorizedResponse = (c: Context, message?: string) => {
  const url = new URL(c.req.url);
  c.status(401);
  return c.json<z.infer<typeof UnauthorizedResponseSchema>, 401>({
    errors: [
      {
        status: 401,
        code: 'UNAUTHORIZED',
        title: 'Unauthorized',
        details: message ?? 'You need to be authenticated to access this resource',
        links: {
          about: `https://${url.origin}/docs/errors/UNAUTHORIZED`,
          type: `https://${url.origin}/docs/errors`,
        },
      },
    ],
  });
};
