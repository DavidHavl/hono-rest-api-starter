import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { InternalServerError, type InternalServerErrorMeta } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiInternalServerErrorObjectSchema } from '../errors/schemas';

// 500 Internal Server Error
// Response for: Unhandled exception or infrastructure failure.
export const internalServerErrorResponse = (c: Context, detail: string, meta?: InternalServerErrorMeta) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(
      new InternalServerError(detail, meta),
      url.origin,
      500,
    ) as InternalServerErrorResponse,
    500,
    {
      'Content-Type': 'application/vnd.api+json',
    },
  );
};
export const jsonApiInternalServerErrorResponseSchema = createErrorResponseDocumentSchema(
  jsonApiInternalServerErrorObjectSchema,
  'JsonApiInternalServerErrorResponse',
  'JSON:API error response for unhandled server-side failures. ' +
    'Detail is always sanitised — stack traces are logged server-side only.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b98',
        status: '500',
        title: 'Internal Server Error',
        detail: 'An unexpected error occurred. Reference: 01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b98',
        code: 'INTERNAL_SERVER_ERROR',
        meta: {
          traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
          spanId: '00f067aa0ba902b7',
          timestamp: '2025-04-01T10:00:00.000Z',
        },
      },
    ],
  },
);

export const internalServerErrorResponseContentSchema = (description = 'Internal Server Error') =>
  createResponseContentSchema(jsonApiInternalServerErrorResponseSchema, description);

export type InternalServerErrorResponse = z.infer<typeof jsonApiInternalServerErrorResponseSchema>;
