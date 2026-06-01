import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { MethodNotAllowedError, type MethodNotAllowedErrorMethods, UnsupportedMediaTypeError } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiUnsupportedMediaTypeErrorObjectSchema } from '../errors/schemas';

// 415 Unsupported Media Type
// JSON:API §3.4 mandates this when Content-Type is not application/vnd.api+json on requests that include a body (POST, PATCH, PUT).

/**
 * Response for: The resource exists but doesn't support this HTTP method.
 */
export const unsupportedMediaTypeResponse = (c: Context, detail: string, receivedMediaType?: string) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(
      new UnsupportedMediaTypeError(detail, receivedMediaType),
      url.origin,
      415,
    ) as UnsupportedMediaTypeResponse,
    415,
    {
      'Content-Type': 'application/vnd.api+json',
    },
  );
};

export const jsonApiUnsupportedMediaTypeResponseSchema = createErrorResponseDocumentSchema(
  jsonApiUnsupportedMediaTypeErrorObjectSchema,
  'JsonApiUnsupportedMediaTypeResponse',
  'JSON:API §3.4 — error response when the request Content-Type is not application/vnd.api+json.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
        status: '415',
        title: 'Unsupported Media Type',
        detail: 'Content-Type must be application/vnd.api+json. Received: application/json.',
        code: 'UNSUPPORTED_CONTENT_TYPE',
        source: { header: 'Content-Type' },
        meta: {
          receivedMediaType: 'application/json',
          requiredMediaType: 'application/vnd.api+json',
        },
      },
    ],
  },
);

export const unsupportedMediaTypeResponseContentSchema = (description = 'Unsupported Media Type') =>
  createResponseContentSchema(jsonApiUnsupportedMediaTypeResponseSchema, description);

export type UnsupportedMediaTypeResponse = z.infer<typeof jsonApiUnsupportedMediaTypeResponseSchema>;
