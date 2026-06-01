import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { UnauthorizedError, type UnauthorizedErrorCode } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiUnauthorizedErrorObjectSchema } from '../errors/schemas';

/**
 * Response for: failed authentication.
 */
export const unauthorizedResponse = (
  c: Context,
  detail: string,
  code: UnauthorizedErrorCode = 'AUTHENTICATION_REQUIRED',
) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(new UnauthorizedError(detail, code), url.origin, 401) as UnauthorizedResponse,
    401,
    {
      'Content-Type': 'application/vnd.api+json',
      'WWW-Authenticate': `Bearer realm="api"${code ? `, error="${code}"` : ''}`,
    },
  );
};

// 401 Unauthorized
// Missing or invalid authentication credentials.

export const jsonApiUnauthorizedResponseSchema = createErrorResponseDocumentSchema(
  jsonApiUnauthorizedErrorObjectSchema,
  'JsonApiUnauthorizedResponse',
  'JSON:API error response for missing or invalid authentication credentials.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
        status: '401',
        title: 'Unauthorized',
        detail: 'Bearer token is missing or has expired.',
        code: 'TOKEN_EXPIRED',
        source: { header: 'Authorization' },
      },
    ],
  },
);

export const unauthorizedResponseContentSchema = (description = 'Unauthorized') =>
  createResponseContentSchema(jsonApiUnauthorizedResponseSchema, description);

export type UnauthorizedResponse = z.infer<typeof jsonApiUnauthorizedResponseSchema>;
