import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { TooManyRequestsError, type TooManyRequestsErrorMeta } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiTooManyRequestsErrorObjectSchema } from '../errors/schemas';

// 429 Too Many Requests

/**
 * Response for: Rate limit exceeded.
 * Meta mirrors the standard rate-limit response headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
 */
export const tooManyRequestsResponse = (c: Context, detail: string, meta?: TooManyRequestsErrorMeta) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(
      new TooManyRequestsError(detail, meta),
      url.origin,
      405,
    ) as TooManyRequestsResponse,
    405,
    {
      'Content-Type': 'application/vnd.api+json',
      'Retry-After': meta?.retryAfterSeconds?.toString() ?? '',
    },
  );
};

export const jsonApiTooManyRequestsResponseSchema = createErrorResponseDocumentSchema(
  jsonApiTooManyRequestsErrorObjectSchema,
  'JsonApiTooManyRequestsResponse',
  'JSON:API error response for rate-limited requests. ' +
    'meta values should mirror RateLimit-Limit, RateLimit-Remaining, ' +
    'RateLimit-Reset, and Retry-After response headers.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
        status: '429',
        title: 'Too Many Requests',
        detail: 'Rate limit exceeded. Maximum 100 requests per minute per API key.',
        code: 'RATE_LIMIT_EXCEEDED',
        source: { header: 'X-Api-Key' },
        meta: {
          retryAfterSeconds: 30,
          limit: 100,
          remaining: 0,
          resetAt: '2025-04-01T10:01:00.000Z',
        },
      },
    ],
  },
);

export const tooManyRequestsResponseContentSchema = (description = 'Too Many Requests') =>
  createResponseContentSchema(jsonApiTooManyRequestsResponseSchema, description);

export type TooManyRequestsResponse = z.infer<typeof jsonApiTooManyRequestsResponseSchema>;
