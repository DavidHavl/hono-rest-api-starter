import { z } from '@hono/zod-openapi';

/**
 * JSON:API 1.2 offset-based pagination query parameters.
 *
 * Pure validation schema — no derivation. Use `parsePagination` in the
 * handler to compute `offset` / `limit` and other derived values.
 *
 * Because this is a plain `z.object` (no `.transform()`), it can be
 * `.merge()`-ed with sort, filter, fields, and include schemas to form
 * a single composite query schema for list endpoints.
 */
export const paginationQuerySchema = z.object({
  'page[number]': z.coerce
    .number()
    .int()
    .min(1, { message: 'page[number] must be 1 or greater' })
    .default(1)
    .openapi({
      param: { name: 'page[number]', in: 'query', required: false },
      description: 'The 1-indexed page number to retrieve. Defaults to `1` when omitted.',
      example: 1,
    }),

  'page[size]': z.coerce
    .number()
    .int()
    .min(1, { message: 'page[size] must be at least 1' })
    .max(100, { message: 'page[size] cannot exceed 100' })
    .default(20)
    .openapi({
      param: { name: 'page[size]', in: 'query', required: false },
      description:
        'Number of resources to return per page. Minimum `1`, maximum `100`. ' + 'Defaults to `20` when omitted.',
      example: 20,
    }),
});

/** Validated query shape after coercion + defaults are applied. */
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
