import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { NotFoundError } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiNotFoundErrorObjectSchema } from '../errors/schemas';

/**
 * Response for: Resource was not found
 */
export const notFoundResponse = (c: Context, resourceType: string, id?: string) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(new NotFoundError(resourceType, id), url.origin, 404) as NotFoundResponse,
    404,
    {
      'Content-Type': 'application/vnd.api+json',
    },
  );
};

export const NotFoundResponseSchema = createErrorResponseDocumentSchema(
  jsonApiNotFoundErrorObjectSchema,
  'NotFoundResponse',
  'JSON:API error response for a resource that could not be located.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
        status: '404',
        title: 'Not Found',
        detail: 'The requested resource does not exist.',
        code: 'RESOURCE_NOT_FOUND',
        source: { parameter: 'id' },
      },
    ],
  },
);

export const notFoundResponseContentSchema = (description = 'Resource Not Found') =>
  createResponseContentSchema(NotFoundResponseSchema, description);

export type NotFoundResponse = z.infer<typeof NotFoundResponseSchema>;
