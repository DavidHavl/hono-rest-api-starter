import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 406 Not Acceptable ---------------------------------------------------------
// ============================================================================
// JSON:API §3.4 mandates this when Accept is present but excludes
// application/vnd.api+json. source.header is the exact pointer.

export const jsonApiNotAcceptableErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
    status: z.literal('406').openapi({ example: '406' }),
    title: z.literal('Not Acceptable').openapi({ example: 'Not Acceptable' }),
    detail: z.string().openapi({
      description: 'Human-readable explanation of the Accept header requirement.',
      example: 'This API only serves application/vnd.api+json. ' + 'Include it in your Accept header.',
    }),
    code: z.string().optional().openapi({
      example: 'NOT_ACCEPTABLE',
    }),
    source: z
      .object({
        header: z.literal('Accept').openapi({
          description: 'Always the Accept header — the only possible source for a 406.',
          example: 'Accept',
        }),
      })
      .optional()
      .openapi({
        example: { header: 'Accept' },
      }),
    links: jsonApiErrorLinksSchema.optional(),
    meta: z
      .object({
        supportedMediaTypes: z
          .array(z.string())
          .min(1)
          .openapi({
            description: 'Media types this server is capable of serving.',
            example: ['application/vnd.api+json'],
          }),
      })
      .catchall(z.unknown())
      .optional()
      .openapi({
        example: { supportedMediaTypes: ['application/vnd.api+json'] },
      }),
  })
  .openapi('JsonApiNotAcceptableErrorObject');
