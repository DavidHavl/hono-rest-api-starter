import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 429 Too Many Requests ------------------------------------------------------
// ============================================================================
// Rate limit exceeded. meta mirrors the standard rate-limit response headers:
//   RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
// meta.retryAfter mirrors the Retry-After header (seconds).
// source.header can point to the API key or IP that was throttled.

export const jsonApiTooManyRequestsErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
    status: z.literal('429').openapi({ example: '429' }),
    title: z.literal('Too Many Requests').openapi({
      example: 'Too Many Requests',
    }),
    detail: z.string().openapi({
      description: 'Human-readable explanation of the rate limit that was hit.',
      example: 'Rate limit exceeded. Maximum 100 requests per minute per API key.',
    }),
    code: z.string().optional().openapi({
      example: 'RATE_LIMIT_EXCEEDED',
    }),
    source: z
      .object({
        header: z
          .string()
          .optional()
          .openapi({
            description:
              'The request header that identified the throttled client, ' + 'if applicable (e.g. X-Api-Key).',
            example: 'X-Api-Key',
          }),
      })
      .optional()
      .openapi({
        example: { header: 'X-Api-Key' },
      }),
    links: jsonApiErrorLinksSchema.optional(),
    meta: z
      .object({
        retryAfterSeconds: z.number().int().nonnegative().optional().openapi({
          description: 'Seconds until the client may retry. Mirrors the Retry-After response header.',
          example: 30,
        }),
        limit: z.number().int().positive().optional().openapi({
          description: 'Maximum number of requests allowed in the current window.',
          example: 100,
        }),
        remaining: z.number().int().nonnegative().optional().openapi({
          description: 'Requests remaining in the current window.',
          example: 0,
        }),
        resetAt: z.string().optional().openapi({
          description: 'ISO 8601 timestamp when the rate limit window resets.',
          example: '2025-04-01T10:01:00.000Z',
        }),
      })
      .catchall(z.unknown())
      .optional()
      .openapi({
        description: 'Rate limit context. Values should mirror the RateLimit-* response headers.',
        example: {
          retryAfterSeconds: 30,
          limit: 100,
          remaining: 0,
          resetAt: '2025-04-01T10:01:00.000Z',
        },
      }),
  })
  .openapi('JsonApiTooManyRequestsErrorObject');
