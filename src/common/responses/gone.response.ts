import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { GoneError } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiGoneErrorObjectSchema, jsonApiNotFoundErrorObjectSchema } from '../errors/schemas';

/**
 * Response for: Gone
 */
export const goneResponse = (c: Context, detail: string = 'The resource was permanently deleted.') => {
  const url = new URL(c.req.url);
  return c.json(createErrorResponseDocumentFromError(new GoneError(detail), url.origin, 410) as GoneResponse, 410, {
    'Content-Type': 'application/vnd.api+json',
  });
};

// ============================================================================
// 410 Gone -------------------------------------------------------------------
// ============================================================================
// Stronger than 404 — the resource existed but has been permanently removed.
// Tells clients and crawlers to stop retrying and remove cached references.

export const jsonApiGoneResponseSchema = createErrorResponseDocumentSchema(
  jsonApiGoneErrorObjectSchema,
  'JsonApiGoneResponse',
  'JSON:API error response for permanently deleted resources. ' +
    'Stronger signal than 404 — clients should remove cached references.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        status: '410',
        title: 'Gone',
        detail: 'This post has been permanently deleted and is no longer available.',
        code: 'RESOURCE_GONE',
        meta: { deletedAt: '2025-03-15T08:30:00.000Z' },
      },
    ],
  },
);

export const goneResponseContentSchema = (description = 'The resource was permanently deleted.') =>
  createResponseContentSchema(jsonApiGoneResponseSchema, description);

export type GoneResponse = z.infer<typeof jsonApiGoneResponseSchema>;
