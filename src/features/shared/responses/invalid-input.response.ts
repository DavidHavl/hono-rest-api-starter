import { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { nanoid } from 'nanoid';
import type { ZodIssue } from 'zod';

export const InvalidInputResponseSchema = z.object({
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
        example: 'INVALID_INPUT',
      }),
      title: z.string().openapi({
        example: 'Invalid Input',
      }),
      details: z.string().optional().openapi({
        example: 'The input is invalid',
      }),
      meta: z
        .object({
          ZodIssue: z
            .object({})
            .optional()
            .openapi({
              example: {
                code: 'too_small',
                minimum: 3,
                type: 'string',
                inclusive: true,
                exact: false,
                message: 'String must contain at least 3 character(s)',
                path: ['username'],
              },
            }),
        })
        .optional()
        .openapi({}),
      source: z.object({
        pointer: z.string().optional().openapi({
          example: '/data/attributes/username',
        }),
        parameter: z.string().optional().openapi({
          example: 'username',
        }),
        header: z.string().optional().openapi({
          example: 'Authorization',
        }),
      }),
      links: z.object({
        about: z.string().url().openapi({
          example: 'https://api.website.com/docs/errors/INVALID_INPUT',
        }),
        type: z.string().url().openapi({
          example: 'https://api.website.com/docs/errors',
        }),
      }),
    }),
  ),
});

export const invalidInputResponse = (c: Context, errors: ZodIssue[]) => {
  const url = new URL(c.req.url);
  c.status(400);
  return c.json<z.infer<typeof InvalidInputResponseSchema>, 400>({
    errors: errors.map((issue) => ({
      id: nanoid(),
      status: 400,
      code: 'INVALID_INPUT',
      title: 'Invalid Input',
      details: issue.message,
      meta: {
        ZodIssue: issue,
      },
      source: {
        pointer: `/data/${issue.path.join('/')}`,
      },
      links: {
        about: `https://${url.origin}/docs/errors/INVALID_INPUT`,
        type: `https://${url.origin}/docs/errors`,
      },
    })),
  });
};
