import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 409 Conflict ---------------------------------------------------------------
// ============================================================================
// Two distinct subtypes with different source semantics:
//
//   UNIQUE_CONSTRAINT_VIOLATION → source.pointer to the conflicting field
//   OPTIMISTIC_LOCK_CONFLICT → no source, meta carries version context
//
// Both are represented by a single schema since the pointer is optional.

export const jsonApiConflictErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
    status: z.literal('409').openapi({ example: '409' }),
    title: z.literal('Conflict').openapi({ example: 'Conflict' }),
    detail: z.string().openapi({
      description: 'Human-readable explanation of the conflict.',
      example: 'A user with this email address already exists.',
    }),
    code: z
      .enum(['RESOURCE_ALREADY_EXISTS', 'VERSION_CONFLICT', 'INVALID_STATE_TRANSITION'])
      .optional()
      .openapi({
        description:
          "RESOURCE_ALREADY_EXISTS: a duplicate value was submitted (e.g.: A user with email 'jane@example.com' already exists). " +
          'VERSION_CONFLICT: the resource was modified by another request since last fetch/sync (e.g.: The resource has been modified since you last retrieved it. Refetch and retry.). ' +
          "INVALID_STATE_TRANSITION: the resource was in an invalid state for the requested operation (e.g.: Cannot transition order from 'shipped' to 'cancelled'.).",
        example: 'RESOURCE_ALREADY_EXISTS',
      }),
    source: z
      .object({
        pointer: z.string().regex(/^\//).optional().openapi({
          description: 'RFC 6901 JSON Pointer to the conflicting field.',
          example: '/data/attributes/email',
        }),
      })
      .optional()
      .openapi({
        description: 'Present only for unique constraint violations. Omitted for optimistic lock conflicts.',
        example: { pointer: '/data/attributes/email' },
      }),
    links: jsonApiErrorLinksSchema.optional(),
    meta: z
      .object({
        currentVersion: z
          .number()
          .int()
          .optional()
          .openapi({
            description: 'Current server-side version of the resource. ' + 'Version conflicts only.',
            example: 4,
          }),
        submittedVersion: z
          .number()
          .int()
          .optional()
          .openapi({
            description: 'Version submitted in the request that is now stale. ' + 'Version conflicts only.',
            example: 2,
          }),
        currentState: z
          .string()
          .optional()
          .openapi({
            description: 'Current state of the resource. ' + 'Invalid state conflicts only.',
            example: 'shipped',
          }),
        submittedState: z
          .string()
          .optional()
          .openapi({
            description: 'State submitted in the request for the resource. ' + 'Invalid state conflicts only.',
            example: 'cancelled',
          }),
      })
      .catchall(z.unknown())
      .optional(),
  })
  .openapi('JsonApiConflictErrorObject');
