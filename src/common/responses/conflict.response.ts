import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { ConflictError, type ConflictErrorCode } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiConflictErrorObjectSchema } from '../errors/schemas';

// ============================================================================
// 409 Conflict ---------------------------------------------------------------
// ============================================================================
// Two distinct subtypes with different source semantics:
//
//   UNIQUE_CONSTRAINT_VIOLATION → source.pointer to the conflicting field
//   OPTIMISTIC_LOCK_CONFLICT → no source, meta carries version context
//
// Both are represented by a single schema since the pointer is optional.

export const conflictResponse = (
  c: Context,
  message: string = 'A resource with these parameters already exist.',
  code: ConflictErrorCode = 'RESOURCE_ALREADY_EXISTS',
  attributePath?: string,
) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(
      new ConflictError(message, code, attributePath),
      url.origin,
      409,
    ) as ConflictResponse,
    409,
    {
      'Content-Type': 'application/vnd.api+json',
    },
  );
};

export const ConflictResponseSchema = createErrorResponseDocumentSchema(
  jsonApiConflictErrorObjectSchema,
  'JsonApiConflictResponse',
  'JSON:API error response for resource conflicts. ' +
    'Covers both unique constraint violations (source.pointer present) ' +
    'and optimistic lock conflicts (meta.currentVersion present).',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        status: '409',
        title: 'Conflict',
        detail: 'A user with this email address already exists.',
        code: 'RESOURCE_ALREADY_EXISTS',
        source: { pointer: '/data/attributes/email' },
      },
    ],
  },
);

export const conflictResponseContentSchema = (description = 'Conflict') =>
  createResponseContentSchema(ConflictResponseSchema, description);

export type ConflictResponse = z.infer<typeof ConflictResponseSchema>;
