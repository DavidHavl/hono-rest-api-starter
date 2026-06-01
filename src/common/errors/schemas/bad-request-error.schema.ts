/**
 * JSON:API 1.1 — Bad Request (HTTP 400) error object schema.
 *
 * Mirrors the runtime `BadRequestErrorOptions` discriminated union 1:1.
 *
 * Structured as a discriminated union over `code`, with a shared base
 * (`id`, `status`, `detail`, `links`) extended per variant. Each variant carries:
 *   - a literal `title` matched to the failure mode
 *   - a constrained `source` (`pointer` | `parameter` | `header`) where applicable
 *   - a constrained `meta` shape relevant to the failure mode
 *
 * Variant `meta`/`source` objects are strict by design — the typed shape *is*
 * the contract. Extending a variant means adding to the variant schema, not
 * silently emitting unknown fields.
 *
 * Per-variant `example` payloads serve as Scalar UI defaults; per-route
 * overrides are layered in by `createBadRequestSchema`.
 */

import { z } from '@hono/zod-openapi';

import { jsonApiErrorLinksSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// Shared base ----------------------------------------------------------------
// ============================================================================

const baseFields = {
  id: z.uuidv7().openapi({
    description:
      'Correlation ID for this specific error occurrence. UUIDv7, generated server-side; safe to surface to end users for support escalation.',
    example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
  }),
  status: z.literal('400').openapi({ example: '400' }),
  detail: z.string().openapi({
    description: 'Human-readable explanation of the specific validation failure.',
    example: "The value 'abc' is not a valid UUIDv7 for path parameter 'id'.",
  }),
  links: jsonApiErrorLinksSchema.optional(),
} as const;

// Reused across per-variant `example` payloads.
const baseExample = {
  id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
  status: '400' as const,
};

// ============================================================================
// Variants -------------------------------------------------------------------
// ============================================================================

// ============================================================================
// Generic / body -------------------------------------------------------------
// ============================================================================

const badRequestVariant = z
  .object({
    ...baseFields,
    code: z.literal('BAD_REQUEST'),
    title: z.literal('Bad Request'),
  })
  .openapi({
    description: 'Generic bad request — fallback for failures not covered by a more specific code.',
    example: {
      ...baseExample,
      code: 'BAD_REQUEST',
      title: 'Bad Request',
      detail: 'The request could not be processed.',
    },
  });

const malformedJsonVariant = z
  .object({
    ...baseFields,
    code: z.literal('MALFORMED_JSON'),
    title: z.literal('Malformed JSON'),
  })
  .openapi({
    description: 'Request body is not valid JSON.',
    example: {
      ...baseExample,
      code: 'MALFORMED_JSON',
      title: 'Malformed JSON',
      detail: 'Request body could not be parsed as JSON.',
    },
  });

const emptyBodyVariant = z
  .object({
    ...baseFields,
    code: z.literal('EMPTY_BODY'),
    title: z.literal('Empty Request Body'),
  })
  .openapi({
    description: 'Request body is required but was empty.',
    example: {
      ...baseExample,
      code: 'EMPTY_BODY',
      title: 'Empty Request Body',
      detail: 'A JSON:API document is required for this operation but the request body was empty.',
    },
  });

// ============================================================================
// Document structure ---------------------------------------------------------
// ============================================================================

const invalidDocumentStructureVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_DOCUMENT_STRUCTURE'),
    title: z.literal('Invalid Document Structure'),
    source: z.object({ pointer: z.string() }),
  })
  .openapi({
    description: 'Top-level JSON:API document does not match the expected structure.',
    example: {
      ...baseExample,
      code: 'INVALID_DOCUMENT_STRUCTURE',
      title: 'Invalid Document Structure',
      detail: "Member 'data' is required at the top level.",
      source: { pointer: '/data' },
    },
  });

const typeMismatchVariant = z
  .object({
    ...baseFields,
    code: z.literal('TYPE_MISMATCH'),
    title: z.literal('Resource Type Mismatch'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({
      expected: z.string(),
      received: z.string(),
    }),
  })
  .openapi({
    description: 'Resource `type` member does not match the type expected at this endpoint.',
    example: {
      ...baseExample,
      code: 'TYPE_MISMATCH',
      title: 'Resource Type Mismatch',
      detail: "Expected resource type 'post', received 'comment'.",
      source: { pointer: '/data/type' },
      meta: { expected: 'post', received: 'comment' },
    },
  });

const idMismatchVariant = z
  .object({
    ...baseFields,
    code: z.literal('ID_MISMATCH'),
    title: z.literal('Resource ID Mismatch'),
    source: z.object({ pointer: z.string() }),
  })
  .openapi({
    description: 'Resource `id` in the body does not match the `id` in the URL.',
    example: {
      ...baseExample,
      code: 'ID_MISMATCH',
      title: 'Resource ID Mismatch',
      detail: 'Resource id in the document does not match the id in the URL.',
      source: { pointer: '/data/id' },
    },
  });

const unknownDocumentMemberVariant = z
  .object({
    ...baseFields,
    code: z.literal('UNKNOWN_DOCUMENT_MEMBER'),
    title: z.literal('Unknown Document Member'),
    source: z.object({ pointer: z.string() }),
    meta: z
      .object({
        suggestion: z.string().optional(),
      })
      .optional(),
  })
  .openapi({
    description: 'Document contains a member not defined by JSON:API or this resource type.',
    example: {
      ...baseExample,
      code: 'UNKNOWN_DOCUMENT_MEMBER',
      title: 'Unknown Document Member',
      detail: "Unknown member 'titel'. Did you mean 'title'?",
      source: { pointer: '/data/attributes/titel' },
      meta: { suggestion: 'title' },
    },
  });

// ============================================================================
// Query: include / fields / sort / filter ------------------------------------
// ============================================================================

const invalidIncludeVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_INCLUDE'),
    title: z.literal('Invalid Include Parameter'),
    meta: z.object({
      reason: z.enum(['unknown_relationship', 'depth_exceeded', 'circular_path', 'not_includable']),
      path: z.string(),
      available: z.array(z.string()).optional(),
    }),
  })
  .openapi({
    description: '`include` query parameter references an invalid or disallowed relationship path.',
    example: {
      ...baseExample,
      code: 'INVALID_INCLUDE',
      title: 'Invalid Include Parameter',
      detail: "Relationship 'autohr' is not defined on resource type 'post'.",
      meta: {
        reason: 'unknown_relationship',
        path: 'autohr',
        available: ['author', 'comments', 'tags'],
      },
    },
  });

const invalidFieldsVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_FIELDS'),
    title: z.literal('Invalid Sparse Fieldset'),
    source: z.object({
      parameter: z.string().regex(/^fields\[[^\]]+\]$/, "Must match the form 'fields[<type>]'"),
    }),
    meta: z.object({
      reason: z.enum(['unknown_type', 'unknown_field', 'not_selectable']),
      type: z.string(),
      field: z.string().optional(),
    }),
  })
  .openapi({
    description: '`fields[<type>]` query parameter references an invalid type or field.',
    example: {
      ...baseExample,
      code: 'INVALID_FIELDS',
      title: 'Invalid Sparse Fieldset',
      detail: "Field 'passwordHash' is not selectable on resource type 'user'.",
      source: { parameter: 'fields[user]' },
      meta: { reason: 'not_selectable', type: 'user', field: 'passwordHash' },
    },
  });

const invalidSortVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_SORT'),
    title: z.literal('Invalid Sort Parameter'),
    meta: z.object({
      reason: z.enum(['unknown_field', 'not_sortable', 'too_many_sort_fields']),
      field: z.string().optional(),
      sortable: z.array(z.string()).optional(),
    }),
  })
  .openapi({
    description: '`sort` query parameter references an unknown or non-sortable field.',
    example: {
      ...baseExample,
      code: 'INVALID_SORT',
      title: 'Invalid Sort Parameter',
      detail: "Field 'body' is not sortable on resource type 'post'.",
      meta: {
        reason: 'not_sortable',
        field: 'body',
        sortable: ['createdAt', 'title'],
      },
    },
  });

const invalidFilterVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_FILTER'),
    title: z.literal('Invalid Filter Parameter'),
    source: z.object({ parameter: z.string() }),
    meta: z.object({
      reason: z.enum([
        'unknown_field',
        'not_filterable',
        'unsupported_operator',
        'invalid_value_type',
        'value_out_of_range',
      ]),
      field: z.string(),
      operator: z.string().optional(),
      supported: z.array(z.string()).optional(),
    }),
  })
  .openapi({
    description: '`filter[...]` query parameter is malformed or references invalid fields/operators.',
    example: {
      ...baseExample,
      code: 'INVALID_FILTER',
      title: 'Invalid Filter Parameter',
      detail: "Operator 'gte' is not supported for field 'status'.",
      source: { parameter: 'filter[status][gte]' },
      meta: {
        reason: 'unsupported_operator',
        field: 'status',
        operator: 'gte',
        supported: ['eq', 'in'],
      },
    },
  });

// ============================================================================
// Pagination -----------------------------------------------------------------
// ============================================================================

const invalidPaginationStrategyVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_PAGINATION_STRATEGY'),
    title: z.literal('Invalid Pagination Strategy'),
    meta: z.object({
      received: z.array(z.string()),
    }),
  })
  .openapi({
    description:
      'Pagination parameters mix incompatible strategies (e.g. cursor + offset). `meta.received` lists the strategy keys observed.',
    example: {
      ...baseExample,
      code: 'INVALID_PAGINATION_STRATEGY',
      title: 'Invalid Pagination Strategy',
      detail: 'Cannot combine cursor and offset pagination in the same request.',
      meta: { received: ['page[cursor]', 'page[offset]'] },
    },
  });

const invalidPaginationCursorVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_PAGINATION_CURSOR'),
    title: z.literal('Invalid Pagination Cursor'),
  })
  .openapi({
    description: 'The supplied `page[cursor]` is malformed, expired, or has been tampered with.',
    example: {
      ...baseExample,
      code: 'INVALID_PAGINATION_CURSOR',
      title: 'Invalid Pagination Cursor',
      detail: 'The pagination cursor is invalid or has expired.',
    },
  });

const invalidPaginationSizeVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_PAGINATION_SIZE'),
    title: z.literal('Invalid Pagination Size'),
    meta: z.object({
      min: z.number().int(),
      max: z.number().int(),
      received: z.unknown(),
    }),
  })
  .openapi({
    description: '`page[size]` is outside the supported range.',
    example: {
      ...baseExample,
      code: 'INVALID_PAGINATION_SIZE',
      title: 'Invalid Pagination Size',
      detail: 'page[size] must be between 1 and 100.',
      meta: { min: 1, max: 100, received: 500 },
    },
  });

// ============================================================================
// Other query / params -------------------------------------------------------
// ============================================================================

const unknownQueryParameterVariant = z
  .object({
    ...baseFields,
    code: z.literal('UNKNOWN_QUERY_PARAMETER'),
    title: z.literal('Unknown Query Parameter'),
    source: z.object({ parameter: z.string() }),
    meta: z
      .object({
        suggestion: z.string().optional(),
      })
      .optional(),
  })
  .openapi({
    description: 'Query string contains a parameter that is not recognized by this endpoint.',
    example: {
      ...baseExample,
      code: 'UNKNOWN_QUERY_PARAMETER',
      title: 'Unknown Query Parameter',
      detail: "Unknown query parameter 'srot'. Did you mean 'sort'?",
      source: { parameter: 'srot' },
      meta: { suggestion: 'sort' },
    },
  });

const invalidResourceIdFormatVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_RESOURCE_ID_FORMAT'),
    title: z.literal('Invalid Resource ID Format'),
    source: z.object({ parameter: z.string() }),
  })
  .openapi({
    description:
      'A path or query parameter expected to contain a resource ID does not match the expected format (e.g. UUIDv7).',
    example: {
      ...baseExample,
      code: 'INVALID_RESOURCE_ID_FORMAT',
      title: 'Invalid Resource ID Format',
      detail: "The value 'abc' is not a valid UUIDv7 for path parameter 'id'.",
      source: { parameter: 'id' },
    },
  });

// ============================================================================
// Headers --------------------------------------------------------------------
// ============================================================================

const missingRequiredHeaderVariant = z
  .object({
    ...baseFields,
    code: z.literal('MISSING_REQUIRED_HEADER'),
    title: z.literal('Missing Required Header'),
    source: z.object({ header: z.string() }),
  })
  .openapi({
    description: 'A header required for this request is absent.',
    example: {
      ...baseExample,
      code: 'MISSING_REQUIRED_HEADER',
      title: 'Missing Required Header',
      detail: "Header 'Idempotency-Key' is required for this operation.",
      source: { header: 'Idempotency-Key' },
    },
  });

const malformedHeaderVariant = z
  .object({
    ...baseFields,
    code: z.literal('MALFORMED_HEADER'),
    title: z.literal('Malformed Header'),
    source: z.object({ header: z.string() }),
    meta: z
      .object({
        expectedFormat: z.string().optional(),
      })
      .optional(),
  })
  .openapi({
    description: 'A header is present but its value does not match the expected format.',
    example: {
      ...baseExample,
      code: 'MALFORMED_HEADER',
      title: 'Malformed Header',
      detail: "Header 'Content-Type' must be 'application/vnd.api+json'.",
      source: { header: 'Content-Type' },
      meta: { expectedFormat: 'application/vnd.api+json' },
    },
  });

const invalidIdempotencyKeyVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_IDEMPOTENCY_KEY'),
    title: z.literal('Invalid Idempotency Key'),
  })
  .openapi({
    description: '`Idempotency-Key` header value is malformed or does not satisfy server policy.',
    example: {
      ...baseExample,
      code: 'INVALID_IDEMPOTENCY_KEY',
      title: 'Invalid Idempotency Key',
      detail: 'Idempotency-Key must be a UUIDv7.',
    },
  });

// ============================================================================
// Relationships --------------------------------------------------------------
// ============================================================================

const invalidRelationshipCardinalityVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_RELATIONSHIP_CARDINALITY'),
    title: z.literal('Invalid Relationship Cardinality'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({
      expected: z.enum(['to-one', 'to-many']),
      received: z.enum(['to-one', 'to-many']),
    }),
  })
  .openapi({
    description: 'A relationship was supplied with the wrong cardinality (object vs array).',
    example: {
      ...baseExample,
      code: 'INVALID_RELATIONSHIP_CARDINALITY',
      title: 'Invalid Relationship Cardinality',
      detail: "Relationship 'tags' expects to-many (array) but received to-one (object).",
      source: { pointer: '/data/relationships/tags/data' },
      meta: { expected: 'to-many', received: 'to-one' },
    },
  });

const missingRelationshipDataVariant = z
  .object({
    ...baseFields,
    code: z.literal('MISSING_RELATIONSHIP_DATA'),
    title: z.literal('Missing Relationship Data'),
    source: z.object({ pointer: z.string() }),
  })
  .openapi({
    description: 'A required `data` member is missing inside a relationship object.',
    example: {
      ...baseExample,
      code: 'MISSING_RELATIONSHIP_DATA',
      title: 'Missing Relationship Data',
      detail: "Relationship 'author' is missing required member 'data'.",
      source: { pointer: '/data/relationships/author' },
    },
  });

const unresolvableLidVariant = z
  .object({
    ...baseFields,
    code: z.literal('UNRESOLVABLE_LID'),
    title: z.literal('Unresolvable Local ID'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({ lid: z.string() }),
  })
  .openapi({
    description:
      'A `lid` (JSON:API 1.1 local ID) referenced in this document was not declared by any resource in the same operation.',
    example: {
      ...baseExample,
      code: 'UNRESOLVABLE_LID',
      title: 'Unresolvable Local ID',
      detail: "Local id 'tmp-author-1' was referenced but never declared in this operation.",
      source: { pointer: '/data/relationships/author/data/lid' },
      meta: { lid: 'tmp-author-1' },
    },
  });

// ============================================================================
// Discriminated union --------------------------------------------------------
// ============================================================================

export const jsonApiBadRequestErrorObjectSchema = z
  .discriminatedUnion('code', [
    // Generic / body
    badRequestVariant,
    malformedJsonVariant,
    emptyBodyVariant,

    // Document structure
    invalidDocumentStructureVariant,
    typeMismatchVariant,
    idMismatchVariant,
    unknownDocumentMemberVariant,

    // Query: include / fields / sort / filter
    invalidIncludeVariant,
    invalidFieldsVariant,
    invalidSortVariant,
    invalidFilterVariant,

    // Pagination
    invalidPaginationStrategyVariant,
    invalidPaginationCursorVariant,
    invalidPaginationSizeVariant,

    // Other query / params
    unknownQueryParameterVariant,
    invalidResourceIdFormatVariant,

    // Headers
    missingRequiredHeaderVariant,
    malformedHeaderVariant,
    invalidIdempotencyKeyVariant,

    // Relationships
    invalidRelationshipCardinalityVariant,
    missingRelationshipDataVariant,
    unresolvableLidVariant,
  ])
  .openapi('JsonApiBadRequestErrorObject', {
    description:
      'JSON:API 1.1 error object for HTTP 400 responses. Discriminated by `code`; each variant constrains `source` and `meta` to the shape relevant for that failure mode.',
  });

export type JsonApiBadRequestErrorObject = z.infer<typeof jsonApiBadRequestErrorObjectSchema>;
