import { z } from '@hono/zod-openapi';

/**
 * Factory: create a per-route JSON:API 1.2 sort query schema constrained
 * to a specific set of sortable fields for the resource.
 *
 * Validates the syntax (comma-separated field names, optional `-` prefix
 * for descending) AND rejects any field not in `allowedFields`
 *
 * @example
 * const articleSortSchema = createSortQuerySchema(
 *   ["createdAt", "title"] as const,
 *   { example: 'title' },
 * );
 * @example
 * const articleSortSchema = createSortQuerySchema(
 *   ["createdAt", "updatedAt", "title", "viewCount", "category.name"] as const,
 *   { example: 'category.name,title,-createdAt' },
 * );*/
export function createSortQuerySchema<const TField extends string>(
  allowedFields: readonly [TField, ...TField[]],
  options?: {
    description?: string;
    example?: string;
  },
) {
  const allowed = new Set<string>(allowedFields);
  const fieldList = allowedFields.join(', ');

  const [first, second] = allowedFields;
  const defaultExample = second ? `-${first},${second}` : `-${first}`;

  return z.object({
    sort: z
      .string()
      .min(1, { message: 'sort cannot be an empty string' })
      .regex(/^-?[a-zA-Z][\w.]*(,-?[a-zA-Z][\w.]*)*$/, {
        error:
          'sort must be a comma-separated list of field names, each ' +
          'optionally prefixed with `-` for descending order',
      })
      .refine((val) => val.split(',').every((token) => allowed.has(token.replace(/^-/, ''))), {
        error: (val) => {
          const invalid = val
            .toString()
            .split(',')
            .map((t) => t.replace(/^-/, ''))
            .filter((f) => !allowed.has(f));
          return `Unknown sort field(s): ${invalid.join(', ')}. Allowed fields: ${fieldList}`;
        },
      })
      .optional()
      .openapi({
        param: { name: 'sort', in: 'query', required: false },
        description:
          options?.description ??
          'Comma-separated list of fields to sort the result set by, ' +
            'applied left-to-right (primary sort first, then tiebreakers). ' +
            'Prefix a field with `-` for descending order; default is ' +
            `ascending. Allowed fields: ${fieldList}.`,
        example: options?.example ?? defaultExample,
      }),
  });
}
