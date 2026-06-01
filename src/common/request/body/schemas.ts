import type { z } from '@hono/zod-openapi';

/**
 * Generates a content schema object for request bodies in compliance with JSON:API specifications.
 *
 * @param {z.ZodObject<z.ZodRawShape>} schema - The validation schema for the request body.
 * @param {string} [description] - An optional description for the request body.
 * @param {boolean} [required=true] - Indicates whether the request body is required.
 * @return {object} An object defining the request body schema, content type, optional description, and required status.
 */
export function requestBodyContentSchema(
  schema: z.ZodObject<z.ZodRawShape>,
  description?: string,
  required: boolean = true,
) {
  return {
    content: {
      'application/vnd.api+json': {
        schema: schema,
      },
    },
    ...(description ? { description } : {}),
    required,
  };
}
