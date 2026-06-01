import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { NotAcceptableError } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiNotAcceptableErrorObjectSchema } from '../errors/schemas';

// 406 Not Acceptable

/**
 * Response for: when Accept is present in headers but excludes application/vnd.api+json.
 */
export const notAcceptableResponse = (c: Context, detail: string) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(new NotAcceptableError(detail), url.origin, 406) as NotAcceptableResponse,
    406,
    {
      'Content-Type': 'application/vnd.api+json',
    },
  );
};

export const jsonApiNotAcceptableResponseSchema = createErrorResponseDocumentSchema(
  jsonApiNotAcceptableErrorObjectSchema,
  'JsonApiNotAcceptableResponse',
  'JSON:API §3.4 — error response when the client Accept header excludes ' + 'application/vnd.api+json.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
        status: '406',
        title: 'Not Acceptable',
        detail: 'This API only serves application/vnd.api+json. ' + 'Include it in your Accept header.',
        code: 'NOT_ACCEPTABLE',
        source: { header: 'Accept' },
        meta: { supportedMediaTypes: ['application/vnd.api+json'] },
      },
    ],
  },
);

export const notAcceptableResponseContentSchema = (description = 'Not Acceptable') =>
  createResponseContentSchema(jsonApiNotAcceptableResponseSchema, description);

export type NotAcceptableResponse = z.infer<typeof jsonApiNotAcceptableResponseSchema>;
