import { z } from '@hono/zod-openapi';

// ============================================================================
// Generic JSON:API error object schema ---------------------------------------
// ============================================================================

export const jsonApiErrorObjectSchema = z.object({
  id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
  status: z.string().openapi({
    description: 'HTTP status code as a string, per JSON:API §7.2.',
    example: '404',
  }),
  code: z.string().optional().openapi({
    // TODO: use default()?
    description: 'Application-specific error code.',
    example: 'NOT_FOUND',
  }),
  title: z.string().openapi({
    description: 'Short, human-readable summary of the error. MUST NOT change between occurrences.',
    example: 'Not Found',
  }),
  detail: z.string().openapi({
    description: 'Human-readable explanation specific to this occurrence of the error.',
    example: 'The requested resource does not exist.',
  }),
  source: z
    .object({
      pointer: z.string().optional(),
      parameter: z.string().optional(),
    })
    .optional(),
  meta: z.object({}).optional(),
  links: z
    .object({
      about: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
});
