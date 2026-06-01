import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 410 Gone -------------------------------------------------------------------
// ============================================================================
// Stronger than 404 — the resource existed but has been permanently removed.
// Tells clients and crawlers to stop retrying and remove cached references.
// meta.deletedAt gives clients a tombstone timestamp.

export const jsonApiGoneErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
    status: z.literal('410').openapi({ example: '410' }),
    title: z.literal('Gone').openapi({ example: 'Gone' }),
    detail: z.string().openapi({
      description: 'Human-readable explanation that the resource was permanently removed.',
      example: 'The resource has been permanently deleted and is no longer available.',
    }),
    code: z.string().optional().openapi({
      example: 'RESOURCE_GONE',
    }),
    // source intentionally omitted: the resource is gone, not malformed
    links: jsonApiErrorLinksSchema.optional(),
    meta: z
      .object({
        deletedAt: z.string().optional().openapi({
          description: 'ISO 8601 timestamp of when the resource was deleted.',
          example: '2025-03-15T08:30:00.000Z',
        }),
      })
      .catchall(z.unknown())
      .optional()
      .openapi({
        description: 'Tombstone metadata for the deleted resource.',
        example: { deletedAt: '2025-03-15T08:30:00.000Z' },
      }),
  })
  .openapi('JsonApiGoneErrorObject');
