import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { MethodNotAllowedError, type MethodNotAllowedErrorMethods } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiMethodNotAllowedErrorObjectSchema } from '../errors/schemas';

/**
 * Response for: The resource exists but doesn't support this HTTP method.
 */
export const methodNotAllowedResponse = (c: Context, detail: string, allowedMethods?: MethodNotAllowedErrorMethods) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(
      new MethodNotAllowedError(detail, allowedMethods),
      url.origin,
      405,
    ) as MethodNotAllowedResponse,
    405,
    {
      'Content-Type': 'application/vnd.api+json',
      Allow: allowedMethods?.join(', ') ?? '',
    },
  );
};

export const jsonApiMethodNotAllowedResponseSchema = createErrorResponseDocumentSchema(
  jsonApiMethodNotAllowedErrorObjectSchema,
  'JsonApiMethodNotAllowedResponse',
  'JSON:API error response when the HTTP method is not supported by this endpoint. ' +
    'The Allow response header must be set alongside this body.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
        status: '405',
        title: 'Method Not Allowed',
        detail: 'POST is not supported on this endpoint. Allowed methods: GET, PATCH.',
        code: 'METHOD_NOT_ALLOWED',
        meta: { allowedMethods: ['GET', 'PATCH'] },
      },
    ],
  },
);

export const methodNotAllowedResponseContentSchema = (description = 'Method Not Allowed') =>
  createResponseContentSchema(jsonApiMethodNotAllowedResponseSchema, description);

export type MethodNotAllowedResponse = z.infer<typeof jsonApiMethodNotAllowedResponseSchema>;
