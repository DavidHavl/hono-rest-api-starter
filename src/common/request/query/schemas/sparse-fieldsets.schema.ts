import { z } from '@hono/zod-openapi';

/**
 * Factory: create a per-route JSON:API 1.2 sparse fieldsets schema.
 *
 * For each resource type that may appear in the response (primary data
 * AND any types reachable via `include`), provide the tuple of fields
 * consumers are allowed to request.
 *
 * Important: the key inside `fields[...]` is the resource TYPE — the
 * value of the `type` member in the JSON:API document — not the URL
 * segment. If your response has `"type": "article"`, the param is
 * `fields[article]`, not `fields[articles]`.
 *
 * Pure validation only. Use `parseSparseFieldsets` in the handler to
 * convert the validated query into a `{ type: Set<field> }` lookup
 * structure for your serializer.
 *
 * @example
 * createSparseFieldsetsQuerySchema({
 *   item: ['title', 'slug', 'publishedAt', 'viewCount'],
 *   owner: ['name', 'id'],
 * });
 */
export function createSparseFieldsetsQuerySchema<const TMap extends Record<string, readonly string[]>>(
  fieldsMap: TMap,
  options?: {
    isRequired?: boolean;
    descriptions?: Partial<Record<keyof TMap & string, string>>;
    examples?: Partial<Record<keyof TMap & string, string>>;
  },
) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const type of Object.keys(fieldsMap)) {
    const allowedFields = fieldsMap[type];
    const allowed = new Set<string>(allowedFields);
    const fieldList = allowedFields?.join(', ');
    const defaultExample = allowedFields?.slice(0, 3).join(',');
    const paramName = `fields[${type}]`;

    const fieldSchema = z
      .string()
      .min(1, { error: `${paramName} cannot be an empty string` })
      .regex(/^[a-zA-Z][\w]*(,[a-zA-Z][\w]*)*$/, {
        error: `${paramName} must be a comma-separated list of field names`,
      })
      .refine((val) => val.split(',').every((f) => allowed.has(f)), {
        error: (val) => {
          const invalid = val
            .toString()
            .split(',')
            .filter((f) => !allowed.has(f));
          return `Unknown field(s) for type \`${type}\`: ${invalid.join(', ')}. Allowed fields: ${fieldList}`;
        },
      })
      .openapi({
        param: { name: paramName, in: 'query', required: false },
        description:
          options?.descriptions?.[type] ??
          `Comma-separated list of fields to include in the response for ` +
            `resources of type \`${type}\`. When omitted, all fields for this ` +
            `type are returned. Allowed fields: ${fieldList}.`,
        example: options?.examples?.[type] ?? defaultExample,
      });

    shape[paramName] = options?.isRequired ? fieldSchema : fieldSchema.optional();
  }

  return z.object(shape);
}
