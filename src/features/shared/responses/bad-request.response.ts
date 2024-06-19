import { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { s } from 'vitest/dist/reporters-yx5ZTtEV';
import { ZodIssue, string } from 'zod';

export const ErrorResponseSchema = z.object({
  errors: z.array(
    z.object({
      // https://jsonapi.org/format/#error-objects
      id: z.string().optional().openapi({
        example: '68fd63j5',
      }),
      status: z.number().int().openapi({
        example: 400,
      }),
      code: z.string().openapi({
        example: 'BAD_REQUEST',
      }),
      title: z.string().openapi({
        example: 'Bad Request',
      }),
      details: z.string().optional().openapi({
        example: 'There was an error while deleting the item',
      }),
      meta: z.object({}).optional(),
      source: z.object({
        pointer: z.string().optional().openapi({
          example: '/data/attributes/id',
        }),
        parameter: z.string().optional().openapi({
          example: 'id',
        }),
        header: z.string().optional().openapi({
          example: 'Authorization',
        }),
      }),
      links: z.object({
        about: z.string().url().openapi({
          example: 'https://api.website.com/docs/errors/BAD_REQUEST',
        }),
        type: z.string().url().openapi({
          example: 'https://api.website.com/docs/errors',
        }),
      }),
    }),
  ),
});

export const badRequestResponse = (
  c: Context,
  message: string,
  details: string,
  meta?: Record<string, unknown>,
  source?: { pointer?: string; parameter?: string; header?: string },
) => {
  const url = new URL(c.req.url);
  c.status(400);
  return c.json<z.infer<typeof ErrorResponseSchema>, 400>({
    errors: [
      {
        status: 400,
        code: 'BAD_REQUEST',
        title: message,
        details: details,
        meta,
        source,
        links: {
          about: `https://${url.origin}/docs/errors/BAD_REQUEST`,
          type: `https://${url.origin}/docs/errors`,
        },
      },
    ],
  });
};
