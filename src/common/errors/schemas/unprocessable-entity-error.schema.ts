/**
 * JSON:API 1.1 — Unprocessable Entity (HTTP 422) error object schema.
 *
 * Mirrors the runtime `UnprocessableEntityErrorVariant` taxonomy 1:1.
 *
 * Two-level discriminated union:
 *   - Outer discriminator: `code` (VALIDATION_ERROR, BUSINESS_RULE_VIOLATION, …)
 *   - Inner discriminator (VALIDATION_ERROR only): `meta.validation`,
 *     mirroring Zod 4's issue.code 1:1. `required` is normalised from
 *     `invalid_type` with `received: "undefined"` because clients act on
 *     "missing field" differently from "wrong type".
 *
 * Same shape conventions as `jsonApiBadRequestErrorObjectSchema`:
 *   - Variant `pointer` (top-level in the runtime type) is lifted into
 *     `source.pointer` per JSON:API §7.1.3.
 *   - Per-variant `z.literal(...)` titles.
 *   - Strict variant `meta` shapes — adding a field means updating the schema.
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
    example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6d01',
  }),
  status: z.literal('422').openapi({ example: '422' }),
  detail: z.string().openapi({
    description: 'Human-readable explanation of the specific failure.',
    example: 'Required field is missing.',
  }),
  links: jsonApiErrorLinksSchema.optional(),
} as const;

const baseExample = {
  id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6d01',
  status: '422' as const,
};

// ============================================================================
// Inner: ZodValidationMeta — VALIDATION_ERROR.meta only ---------------------
// ============================================================================

/** Zod 4 origin discriminator for `too_small` / `too_big`. */
export const zodOriginEnum = z.enum(['string', 'array', 'number', 'date', 'set', 'bigint', 'file']);

/** Zod 4 string-format identifiers surfaced in `invalid_format` issues. */
export const zodFormatEnum = z.enum([
  'email',
  'url',
  'uuid',
  'uuidv4',
  'uuidv7',
  'regex',
  'iso_datetime',
  'iso_date',
  'iso_time',
  'iso_duration',
  'ipv4',
  'ipv6',
  'cidrv4',
  'cidrv6',
  'base64',
  'base64url',
  'jwt',
  'cuid',
  'cuid2',
  'ulid',
  'nanoid',
  'emoji',
]);

export const zodValidationMetaSchema = z
  .discriminatedUnion('validation', [
    z.object({ validation: z.literal('required') }),

    z.object({
      validation: z.literal('invalid_type'),
      expected: z.string(),
      received: z.string(),
    }),

    // `too_small` and `too_big` are split (TS type collapses them; schema
    // is stricter — minimum/maximum is required for its respective bound).
    z.object({
      validation: z.literal('too_small'),
      origin: zodOriginEnum,
      // number for length/value/size; ISO-8601 string for dates and bigint.
      minimum: z.union([z.number(), z.string()]),
      inclusive: z.boolean(),
      received: z.union([z.number(), z.string()]).optional(),
    }),

    z.object({
      validation: z.literal('too_big'),
      origin: zodOriginEnum,
      maximum: z.union([z.number(), z.string()]),
      inclusive: z.boolean(),
      received: z.union([z.number(), z.string()]).optional(),
    }),

    z.object({
      validation: z.literal('not_multiple_of'),
      divisor: z.number(),
    }),

    z.object({
      validation: z.literal('invalid_format'),
      format: zodFormatEnum,
      pattern: z.string().optional(),
    }),

    z.object({
      validation: z.literal('invalid_value'),
      values: z.array(z.union([z.string(), z.number(), z.boolean()])),
    }),

    z.object({
      validation: z.literal('unrecognized_keys'),
      keys: z.array(z.string()),
    }),

    z.object({
      validation: z.literal('invalid_union'),
      branches: z.array(
        z.object({
          discriminator: z.string().optional(),
          missing: z.array(z.string()).optional(),
          reason: z.string().optional(),
        }),
      ),
    }),

    z.object({
      validation: z.literal('invalid_element'),
      index: z.number().int(),
    }),

    z.object({
      validation: z.literal('invalid_key'),
      key: z.string(),
    }),

    z.object({
      validation: z.literal('custom'),
      rule: z.string(),
    }),
  ])
  .openapi('ZodValidationMeta', {
    description:
      'Discriminated by `validation`. Mirrors Zod 4 issue codes 1:1; `required` is normalised from `invalid_type` + `received: "undefined"` because clients handle "missing field" differently from "wrong type".',
  });

export type ZodValidationMeta = z.infer<typeof zodValidationMetaSchema>;

// ============================================================================
// Variants -------------------------------------------------------------------
// ============================================================================

// --- VALIDATION_ERROR -------------------------------------------------------

const validationErrorVariant = z
  .object({
    ...baseFields,
    code: z.literal('VALIDATION_ERROR'),
    title: z.literal('Validation Error'),
    source: z.object({ pointer: z.string() }),
    meta: zodValidationMetaSchema,
  })
  .openapi({
    description:
      'Field-level schema validation failure. `meta` is itself discriminated (Zod-aligned) so the right shape is enforced per failure mode.',
    example: {
      ...baseExample,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Required field is missing.',
      source: { pointer: '/data/attributes/email' },
      meta: { validation: 'required' },
    },
  });

// --- BUSINESS_RULE_VIOLATION -----------------------------------------------

const businessRuleViolationVariant = z
  .object({
    ...baseFields,
    code: z.literal('BUSINESS_RULE_VIOLATION'),
    title: z.literal('Business Rule Violation'),
    // `pointer` is optional on this variant (some rules aren't field-scoped).
    source: z.object({ pointer: z.string() }).optional(),
    meta: z.object({
      rule: z.string(),
      // Rule-specific data — names and shapes are application-defined.
      context: z.record(z.string(), z.unknown()).optional(),
    }),
  })
  .openapi({
    description:
      'Domain rule violation — values are individually well-formed but the action conflicts with a business invariant. `meta.rule` is the stable identifier; rule-specific data lives in `meta.context`.',
    example: {
      ...baseExample,
      code: 'BUSINESS_RULE_VIOLATION',
      title: 'Business Rule Violation',
      detail: 'Cannot schedule a meeting in the past.',
      source: { pointer: '/data/attributes/startsAt' },
      meta: {
        rule: 'future_datetime_required',
        context: { now: '2026-05-08T14:23:00Z' },
      },
    },
  });

// --- Cross-field -----------------------------------------------------------

const mutuallyExclusiveFieldsVariant = z
  .object({
    ...baseFields,
    code: z.literal('MUTUALLY_EXCLUSIVE_FIELDS'),
    title: z.literal('Mutually Exclusive Fields'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({
      group: z.string(),
      conflictingWith: z.string(),
    }),
  })
  .openapi({
    description:
      'Two or more fields in `meta.group` cannot be set simultaneously. Emit one error per offending pointer; clients deduplicate by `meta.group`.',
    example: {
      ...baseExample,
      code: 'MUTUALLY_EXCLUSIVE_FIELDS',
      title: 'Mutually Exclusive Fields',
      detail: "Only one of 'cardToken' and 'bankAccountId' may be set.",
      source: { pointer: '/data/attributes/cardToken' },
      meta: {
        group: 'payment_source',
        conflictingWith: '/data/attributes/bankAccountId',
      },
    },
  });

const conditionallyRequiredFieldVariant = z
  .object({
    ...baseFields,
    code: z.literal('CONDITIONALLY_REQUIRED_FIELD'),
    title: z.literal('Conditionally Required Field'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({
      condition: z.object({
        pointer: z.string(),
        expectedValue: z.unknown(),
      }),
    }),
  })
  .openapi({
    description:
      'Field is required because another field has a particular value. `meta.condition` is the contract clients re-run locally to mirror server logic.',
    example: {
      ...baseExample,
      code: 'CONDITIONALLY_REQUIRED_FIELD',
      title: 'Conditionally Required Field',
      detail: "Field 'shippingAddress' is required when 'requiresShipping' is true.",
      source: { pointer: '/data/attributes/shippingAddress' },
      meta: {
        condition: {
          pointer: '/data/attributes/requiresShipping',
          expectedValue: true,
        },
      },
    },
  });

const inconsistentFieldValuesVariant = z
  .object({
    ...baseFields,
    code: z.literal('INCONSISTENT_FIELD_VALUES'),
    title: z.literal('Inconsistent Field Values'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({
      rule: z.string(),
      fields: z.array(z.string()),
    }),
  })
  .openapi({
    description:
      'Fields are individually valid but their combination is not. Pointer targets the field the user can fix (later/derived); `meta.fields` lists everything in the relationship.',
    example: {
      ...baseExample,
      code: 'INCONSISTENT_FIELD_VALUES',
      title: 'Inconsistent Field Values',
      detail: "'endsAt' must be after 'startsAt'.",
      source: { pointer: '/data/attributes/endsAt' },
      meta: {
        rule: 'end_after_start',
        fields: ['/data/attributes/startsAt', '/data/attributes/endsAt'],
      },
    },
  });

// --- Composite resource validation -----------------------------------------

const invalidDiscriminatorVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_DISCRIMINATOR'),
    title: z.literal('Invalid Discriminator'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({
      allowed: z.array(z.string()),
    }),
  })
  .openapi({
    description:
      'Polymorphic resource discriminator picks an unsupported variant. Distinct from VALIDATION_ERROR/`invalid_value` only when the domain has true polymorphism (different attribute shapes per variant).',
    example: {
      ...baseExample,
      code: 'INVALID_DISCRIMINATOR',
      title: 'Invalid Discriminator',
      detail: "Discriminator 'kind' must be one of: 'card', 'bank_account', 'wallet'.",
      source: { pointer: '/data/attributes/kind' },
      meta: { allowed: ['card', 'bank_account', 'wallet'] },
    },
  });

const invalidAttributeForTypeVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_ATTRIBUTE_FOR_TYPE'),
    title: z.literal('Invalid Attribute For Type'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({
      discriminator: z.object({
        pointer: z.string(),
        value: z.string(),
      }),
      validForTypes: z.array(z.string()),
    }),
  })
  .openapi({
    description:
      'Attribute is valid for some variants of this resource but not the one specified by the discriminator.',
    example: {
      ...baseExample,
      code: 'INVALID_ATTRIBUTE_FOR_TYPE',
      title: 'Invalid Attribute For Type',
      detail: "Attribute 'expiryDate' is not valid for paymentMethod type 'bank_account'.",
      source: { pointer: '/data/attributes/expiryDate' },
      meta: {
        discriminator: {
          pointer: '/data/attributes/kind',
          value: 'bank_account',
        },
        validForTypes: ['card'],
      },
    },
  });

const invalidRelationshipTargetTypeVariant = z
  .object({
    ...baseFields,
    code: z.literal('INVALID_RELATIONSHIP_TARGET_TYPE'),
    title: z.literal('Invalid Relationship Target Type'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({
      expected: z.string(),
      received: z.string(),
    }),
  })
  .openapi({
    description:
      'Relationship `data.type` is structurally valid but semantically wrong for this relationship. Distinct from INVALID_RELATIONSHIP_CARDINALITY (400, structural object-vs-array mismatch).',
    example: {
      ...baseExample,
      code: 'INVALID_RELATIONSHIP_TARGET_TYPE',
      title: 'Invalid Relationship Target Type',
      detail: "Relationship 'author' must reference a resource of type 'user'.",
      source: { pointer: '/data/relationships/author/data/type' },
      meta: { expected: 'user', received: 'team' },
    },
  });

const relationshipTargetNotFoundVariant = z
  .object({
    ...baseFields,
    code: z.literal('RELATIONSHIP_TARGET_NOT_FOUND'),
    title: z.literal('Relationship Target Not Found'),
    source: z.object({ pointer: z.string() }),
    meta: z.object({
      type: z.string(),
      id: z.string(),
    }),
  })
  .openapi({
    description:
      'Body references a resource that does not exist. Distinct from a top-level 404 — the missing thing is referenced from the request body, not the request URL.',
    example: {
      ...baseExample,
      code: 'RELATIONSHIP_TARGET_NOT_FOUND',
      title: 'Relationship Target Not Found',
      detail: "Referenced 'organization' does not exist.",
      source: { pointer: '/data/relationships/organization/data/id' },
      meta: { type: 'organization', id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6c7d' },
    },
  });

// ============================================================================
// Discriminated union --------------------------------------------------------
// ============================================================================

export const jsonApiUnprocessableEntityErrorObjectSchema = z
  .discriminatedUnion('code', [
    // Field validation (Zod-mapped)
    validationErrorVariant,

    // Business rules
    businessRuleViolationVariant,

    // Cross-field
    mutuallyExclusiveFieldsVariant,
    conditionallyRequiredFieldVariant,
    inconsistentFieldValuesVariant,

    // Composite resource validation
    invalidDiscriminatorVariant,
    invalidAttributeForTypeVariant,
    invalidRelationshipTargetTypeVariant,
    relationshipTargetNotFoundVariant,
  ])
  .openapi('JsonApiUnprocessableEntityErrorObject', {
    description:
      'JSON:API 1.1 error object for HTTP 422 responses. Discriminated by `code`; VALIDATION_ERROR additionally discriminates `meta` by `validation` (Zod-aligned).',
  });

export type JsonApiUnprocessableEntityErrorObject = z.infer<typeof jsonApiUnprocessableEntityErrorObjectSchema>;
