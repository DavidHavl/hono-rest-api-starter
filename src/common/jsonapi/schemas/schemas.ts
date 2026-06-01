import { z } from '@hono/zod-openapi';

export const jsonApiVersionSchema = z
  .object({
    version: z.literal('1.1').openapi({
      description: 'JSON:API specification version implemented by this server.',
      example: '1.1',
    }),
  })
  .openapi('JsonApiVersion', {
    description: 'JSON:API version descriptor.',
    example: { version: '1.1' },
  });

export const jsonApiResourceAttributesSchema = z.object({}).catchall(z.any()).openapi('JsonApiResourceAttributes', {
  description: 'JSON:API resource attributes descriptor.',
});

/** Free-form meta — JSON:API allows any object here. */
export const jsonApiMetaSchema = z.object({}).catchall(z.any()).openapi('JsonApiMeta');

/** Links on a relationship object (§7.7). Both members optional. */
export const jsonApiRelationshipLinksSchema = z
  .object({
    self: z.string().optional(),
    related: z.string().optional(),
  })
  .openapi('JsonApiRelationshipLinks');

/** Links on a resource object (§7.4). Just `self` per spec. */
export const jsonApiResourceLinksSchema = z
  .object({
    self: z.string().optional(),
  })
  .openapi('JsonApiResourceLinks', {
    description: 'JSON:API resource links descriptor.',
    example: { self: 'https://api.website.com/users/0196b1a2-3c4d-7e8f-9a0b-1c2d3e4f5a6b' },
    required: ['self'],
  });

/**
 * Top-level links for a collection document (§7.1.2 + §8.4). Each pagination
 * link is `string | null | undefined`:
 *   - URL    → link exists
 *   - null   → link explicitly doesn't exist (e.g. `prev` on first page)
 *   - absent → server doesn't expose this navigation (cursor strategies
 *              typically omit `last` since cursors can't address "the last
 *              page" without knowing the total).
 */
export const jsonApiCollectionDocumentLinksSchema = z
  .object({
    self: z.url().optional(),
    first: z.url().nullable().optional(),
    last: z.url().nullable().optional(),
    prev: z.url().nullable().optional(),
    next: z.url().nullable().optional(),
  })
  .openapi('JsonApiCollectionLinks', {
    description: 'JSON:API collection links descriptor.',
    example: { self: 'https://api.website.com/users' },
    required: ['self'],
  });

export const jsonApiResourceRelationshipSchema = z
  .object({
    data: z
      .union([z.object({ type: z.string(), id: z.string() }), z.array(z.object({ type: z.string(), id: z.string() }))])
      .optional(),
    links: jsonApiRelationshipLinksSchema.optional(),
    meta: jsonApiMetaSchema.optional(),
  })
  .openapi('JsonApiResourceRelationship');

export const jsonApiResourceRelationshipsSchema = z
  .object({})
  .catchall(jsonApiResourceRelationshipSchema)
  .openapi('JsonApiResourceRelationships');

export const jsonApiResourceSchema = z
  .object({
    type: z.string(),
    id: z.string(),
    attributes: jsonApiResourceAttributesSchema,
    relationships: jsonApiResourceRelationshipsSchema.optional(),
    links: jsonApiResourceLinksSchema.optional(),
    meta: jsonApiMetaSchema.optional(),
  })
  .openapi('JsonApiResource', {
    description: 'JSON:API resource descriptor.',
    example: {
      type: 'user',
      id: '1',
      attributes: { name: 'John Doe', email: 'john.doe@example.com' },
      relationships: { posts: { data: [{ type: 'post', id: '1' }] } },
      links: { self: 'https://api.website.com/users/0196b1a2-3c4d-7e8f-9a0b-1c2d3e4f5a6b' },
    },
  });

/**
 * Base schema for a single entry in a JSON:API `included` array.
 *
 * By default this accepts any resource object (generic `type: string`).
 * When you know the exact resource types up-front, replace this with a
 * `z.discriminatedUnion('type', [...])` so the discriminator key `type`
 * narrows each variant to a concrete literal:
 *
 * @example
 * // single type
 * included: itemResourceSchema
 *
 * @example
 * // multiple types — discriminated by the `type` literal
 * included: z.array(z.discriminatedUnion('type', [itemResourceSchema, userResourceSchema]))
 */
export const jsonApiResourceIncludedSchema = z.array(jsonApiResourceSchema);

// ============================================================================
// Pagination -----------------------------------------------------------------
// ============================================================================

/**
 * Page-based pagination — `?page[number]=N&page[size]=N`.
 * `totalRecords` / `totalPages` are optional — omit when the count query is
 * too expensive to run on every request (large tables, no aggregate cache).
 */
export const jsonApiPageBasedPaginationMetaSchema = z
  .object({
    strategy: z.literal('page'),
    currentPage: z.int().positive(),
    pageSize: z.int().positive(),
    totalRecords: z.int().nonnegative().optional(),
    totalPages: z.int().nonnegative().optional(),
  })
  .openapi('PageBasedPaginationMeta', {
    description:
      'Page-based pagination meta. `totalRecords` and `totalPages` are optional — server may omit when count is expensive.',
  });

/**
 * Offset-based pagination — `?page[offset]=N&page[size]=N`.
 * Useful for resumable scans where you want to skip a known number of records.
 */
export const jsonApiOffsetBasedPaginationMetaSchema = z
  .object({
    strategy: z.literal('offset'),
    offset: z.int().nonnegative(),
    pageSize: z.int().positive(),
    totalRecords: z.int().nonnegative().optional(),
  })
  .openapi('OffsetBasedPaginationMeta', {
    description: 'Offset-based pagination meta.',
  });

/**
 * Cursor-based pagination — `?page[after]=opaque-cursor&page[size]=N`.
 * `nextCursor` / `prevCursor` are opaque strings (typically base64-encoded
 * tuples of sort-key + tiebreaker id). `null` = no further page in that
 * direction. No `totalRecords` — counting is incompatible with cursor
 * pagination at scale (the whole point is to avoid `COUNT(*)`).
 */
export const jsonApiCursorBasedPaginationMetaSchema = z
  .object({
    strategy: z.literal('cursor'),
    pageSize: z.int().positive(),
    hasMore: z.boolean(),
    nextCursor: z.string().nullable().optional(),
    prevCursor: z.string().nullable().optional(),
  })
  .openapi('CursorBasedPaginationMeta', {
    description: 'Cursor-based pagination meta. Cursors are opaque to clients — do not parse or construct them.',
  });

/** Discriminated union of all built-in pagination strategies. */
export const jsonApiPaginationMetaSchema = z
  .discriminatedUnion('strategy', [
    jsonApiPageBasedPaginationMetaSchema,
    jsonApiOffsetBasedPaginationMetaSchema,
    jsonApiCursorBasedPaginationMetaSchema,
  ])
  .openapi('JsonApiPaginationMeta', {
    description: 'JSON:API pagination meta. Discriminated by `strategy` so clients know which fields to expect.',
  });

// ============================================================================
// Errors ---------------------------------------------------------------------
// ============================================================================

// Error source (JSON:API §7.2)

export const jsonApiErrorSourceSchema = z
  .object({
    pointer: z.string().regex(/^\//, 'Must be a valid RFC 6901 JSON Pointer starting with /').optional().openapi({
      description: 'RFC 6901 JSON Pointer to the field in the request document that caused the error.',
      example: '/data/attributes/email',
    }),
    parameter: z.string().optional().openapi({
      description: 'URI query parameter that caused the error.',
      example: 'filter[status]',
    }),
    header: z.string().optional().openapi({
      description: 'Request header that caused the error.',
      example: 'Authorization',
    }),
  })
  .openapi('JsonApiErrorSource');

// Error links (JSON:API §7.2, 1.1 adds `type`)

const jsonApiErrorLinkSchema = z.union([
  z.url(),
  z.object({
    href: z.url(),
    title: z.string().optional(),
    type: z.string().optional(), // media type of the link target
    meta: z.record(z.string(), z.unknown()).optional(),
  }),
]);

export const jsonApiErrorLinksSchema = z
  .object({
    about: jsonApiErrorLinkSchema.optional().openapi({
      description: 'Link to further details about this specific occurrence of the error.',
      example: 'https://docs.example.com/errors/NOT_FOUND/occurrences/abc123',
    }),
    type: jsonApiErrorLinkSchema.optional().openapi({
      description: 'Stable link identifying the error type. Consistent across all occurrences.',
      example: 'https://docs.example.com/errors/NOT_FOUND',
    }),
  })
  .openapi('JsonApiErrorLinks');

// Error meta //

export const jsonApiErrorMetaSchema = z.record(z.string(), z.unknown()).openapi('JsonApiErrorMeta', {
  description: 'Non-standard meta-information about this error occurrence.',
  example: {
    requestId: '01HXYZ...',
    timestamp: '2025-04-01T10:00:00Z',
  },
});
