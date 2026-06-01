import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 415 Unsupported Media Type -------------------------------------------------
// ============================================================================
// JSON:API §3.4 mandates this when Content-Type is not application/vnd.api+json
// on requests that include a body (POST, PATCH, PUT).
// source.header is always Content-Type — no ambiguity.

export const jsonApiUnsupportedMediaTypeErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
    status: z.literal('415').openapi({ example: '415' }),
    title: z.literal('Unsupported Media Type').openapi({
      example: 'Unsupported Media Type',
    }),
    detail: z.string().openapi({
      description: 'Human-readable explanation of the required Content-Type.',
      example: 'Content-Type must be application/vnd.api+json. Received: application/json or other media type.',
    }),
    code: z.string().optional().openapi({
      example: 'UNSUPPORTED_CONTENT_TYPE',
    }),
    source: z
      .object({
        header: z.literal('Content-Type').openapi({
          description: 'Always Content-Type — the only possible source for a 415.',
          example: 'Content-Type',
        }),
      })
      .optional()
      .openapi({
        example: { header: 'Content-Type' },
      }),
    links: jsonApiErrorLinksSchema.optional(),
    meta: z
      .object({
        receivedMediaType: z.string().optional().openapi({
          description: 'The Content-Type value the server actually received.',
          example: 'application/json',
        }),
        requiredMediaType: z.string().optional().openapi({
          description: 'The Content-Type value this endpoint requires.',
          example: 'application/vnd.api+json',
        }),
      })
      .catchall(z.unknown())
      .optional()
      .openapi({
        example: {
          receivedMediaType: 'application/json',
          requiredMediaType: 'application/vnd.api+json',
        },
      }),
  })
  .openapi('JsonApiUnsupportedMediaTypeErrorObject');
