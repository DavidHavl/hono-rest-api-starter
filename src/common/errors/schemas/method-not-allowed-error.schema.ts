import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 405 Method Not Allowed -----------------------------------------------------
// ============================================================================
// The resource exists but doesn't support this HTTP method.
// meta.allowedMethods mirrors the required Allow response header.
// No source: the method is the problem, not a field or param.

export const jsonApiMethodNotAllowedErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
    status: z.literal('405').openapi({ example: '405' }),
    title: z.literal('Method Not Allowed').openapi({
      example: 'Method Not Allowed',
    }),
    detail: z.string().openapi({
      description: 'Human-readable explanation of which methods are supported.',
      example: 'POST is not supported on this endpoint. Allowed methods: GET, PATCH.',
    }),
    code: z.string().optional().openapi({
      example: 'METHOD_NOT_ALLOWED',
    }),
    // source intentionally omitted: the HTTP method is the problem, not a field
    links: jsonApiErrorLinksSchema.optional(),
    meta: z
      .object({
        allowedMethods: z
          .array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']))
          .min(1)
          .openapi({
            description:
              'HTTP methods supported by this endpoint. ' + 'Must match the Allow header returned in the response.',
            example: ['GET', 'PATCH'],
          }),
      })
      .catchall(z.unknown())
      .optional()
      .openapi({
        example: { allowedMethods: ['GET', 'PATCH'] },
      }),
  })
  .openapi('JsonApiMethodNotAllowedErrorObject');
