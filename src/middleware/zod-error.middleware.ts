import type { ErrorResponseSchema, ErrorSchema } from '@/features/shared/models/error-respone.schema';
import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { nanoid } from 'nanoid';
import { ZodError } from 'zod';

type ResultType = { success: false; error: ZodError<unknown> };

function formatInputZodErrors(result: ResultType, c: Context): z.infer<typeof ErrorSchema>[] {
  const origin = new URL(c.req.url).origin;
  return result.error.issues.map((i) => ({
    id: nanoid(),
    status: 400,
    code: 'INVALID_INPUT',
    title: i.message,
    details: i.message,
    meta: {
      ZodIssue: i,
    },
    source: {
      parameter: i.path.join('.'),
    },
    links: {
      about: `${origin}/docs/errors/INVALID_INPUT`,
      type: `${origin}/docs/errors`,
    },
  }));
}

/**
 * Middleware to handle (transform) Zod error results
 */
export const zodErrorMiddleware = (result: ResultType, c: Context) => {
  if (!result.success && 'error' in result && result.error instanceof ZodError) {
    return c.json<z.infer<typeof ErrorResponseSchema>, 400>(
      {
        errors: formatInputZodErrors(result, c),
      },
      400,
    );
  }
};
