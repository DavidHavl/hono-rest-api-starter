import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema, jsonApiErrorMetaSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 404 Not Found --------------------------------------------------------------
// ============================================================================
// Resource does not exist. No source: there is no field to point to.

export const jsonApiNotFoundErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
    status: z.literal('404').openapi({ example: '404' }),
    title: z.literal('Not Found').openapi({ example: 'Not Found' }),
    detail: z.string().openapi({
      description: 'Human-readable explanation specific to this occurrence.',
      example: 'The requested resource does not exist.',
    }),
    code: z.string().optional().openapi({
      example: 'RESOURCE_NOT_FOUND',
    }),
    source: z.object({ parameter: z.literal('id').openapi({ example: 'id' }) }),
    links: jsonApiErrorLinksSchema.optional(),
    meta: jsonApiErrorMetaSchema.optional(),
  })
  .openapi('JsonApiNotFoundErrorObject');
