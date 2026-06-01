import type { z } from '@hono/zod-openapi';
import type { $ZodIssue } from 'zod/v4/core';
import type { ValidationErrorMeta } from '@/common/errors';
import type { BadRequestErrorOptions } from '@/common/errors/bad-request.error';
import type { NonBodyTarget } from '@/common/types';

// Default page-size bounds when an `invalid_type` (rather than too_small/big)
// issue robs us of `minimum`/`maximum`. Pull from env if you want a single
// source of truth.
const PAGINATION_SIZE_MIN = 1;
const PAGINATION_SIZE_MAX = 100;

// ============================================================================
// Synthetic trigger values ---------------------------------------------------
// ============================================================================
// Each value is designed to exercise a distinct Zod constraint class.
// We throw all of them at every field schema and deduplicate the resulting issues.
//
//  undefined           → invalid_type   (missing required)
//  null                → invalid_type   (non-nullable)
//  ""                  → too_small      (min length > 0)
//  "x"                 → too_small      (min length > 1)
//  "not-a-format"      → invalid_string (email / url / uuid / regex / etc.)
//  "a".repeat(1001)    → too_big        (any reasonable string max)
//  0                   → too_small      (number min > 0); invalid_type on string fields
//  -1                  → too_small      (number min >= 0)
//  Number.MAX_VALUE    → too_big        (any number max)
//  true                → invalid_type   (non-boolean fields)
//  "__invalid__"       → invalid_enum_value (any enum)

const VALIDATION_VALUES: unknown[] = [
  undefined,
  null,
  '',
  'x',
  'not-a-valid-format',
  'a'.repeat(1001),
  0,
  -1,
  Number.MAX_VALUE,
  true,
  '__invalid__',
];

/**
 * Take the schema and return all possible error issues that can occur when validating it.
 * @param fieldSchema The single field schema to validate against.
 */
export function getPossibleZodIssues(fieldSchema: z.ZodTypeAny): $ZodIssue[] {
  const seen = new Set<string>();
  const issues: $ZodIssue[] = [];

  // get a unique key for each issue to deduplicate
  function issueKey(issue: $ZodIssue): string {
    switch (issue.code) {
      case 'invalid_type':
        return `invalid_type::${issue.expected}`;

      case 'too_small':
        // In Zod v4 minimum is number | bigint — stringify safely
        return `too_small::${issue.origin}::${String(issue.minimum)}::${issue.inclusive}`;

      case 'too_big':
        return `too_big::${issue.origin}::${String(issue.maximum)}::${issue.inclusive}`;

      case 'invalid_format':
        return `invalid_format::${issue.format === 'string' ? issue.format : JSON.stringify(issue.format)}`;

      case 'unrecognized_keys':
        return `unrecognized_keys::${issue.keys.map(String).sort().join(',')}`;

      case 'invalid_value':
        return `invalid_value::${String(issue.values.map(String).sort().join(','))}`;

      default:
        return issue.code;
    }
  }

  for (const value of VALIDATION_VALUES) {
    const result = fieldSchema.safeParse(value);
    if (!result.success) {
      for (const issue of result.error.issues) {
        // Deduplicate issues by their key
        const key = issueKey(issue);
        if (!seen.has(key)) {
          seen.add(key);
          issues.push(issue);
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// Specific Error Conversion (400, 422) ---------------------------------------
// ============================================================================

/**
 * Map a single Zod issue to a `BadRequestErrorOptions` variant.
 *
 * Only covers variants derivable from schema-level validation alone.
 * The richer variants (INVALID_INCLUDE, INVALID_FIELDS, INVALID_SORT,
 * INVALID_FILTER, INVALID_PAGINATION_STRATEGY) require resource-graph context
 * and should be thrown explicitly from custom parsers/middleware via AppError.
 */
export function zodIssueToBadRequestErrorOptions(issue: $ZodIssue, target: NonBodyTarget): BadRequestErrorOptions {
  const path = issue.path.map(String);
  const head = path[0] ?? '';

  // -- Headers --------------------------------------------------------------
  if (target === 'header') {
    const headerName = head;

    // Idempotency-Key is its own variant, regardless of failure mode.
    if (headerName.toLowerCase() === 'idempotency-key') {
      return { code: 'INVALID_IDEMPOTENCY_KEY' };
    }

    if (isMissingFieldIssue(issue)) {
      return {
        code: 'MISSING_REQUIRED_HEADER',
        source: { header: headerName },
      };
    }

    return {
      code: 'MALFORMED_HEADER',
      source: { header: headerName },
    };
  }

  // -- Path params ----------------------------------------------------------
  if (target === 'param') {
    // Path params in this codebase are uniformly UUIDv7 resource IDs.
    // Extend if/when non-ID path params (slugs, etc.) are introduced.
    return {
      code: 'INVALID_RESOURCE_ID_FORMAT',
      source: { parameter: joinPathAsParameter(path) },
    };
  }

  // -- Query ----------------------------------------------------------------
  if (target === 'query') {
    // Strict-object schemas surface unknown keys as `unrecognized_keys`.
    if (issue.code === 'unrecognized_keys') {
      const keys = (issue as { keys?: readonly string[] }).keys ?? [];
      const unknown = keys[0] ?? head;
      return {
        code: 'UNKNOWN_QUERY_PARAMETER',
        source: { parameter: unknown },
      };
    }

    // Pagination — page[size]
    if (head === 'page' && path[1] === 'size') {
      const i = issue as {
        minimum?: number | bigint;
        maximum?: number | bigint;
        input?: unknown;
      };
      return {
        code: 'INVALID_PAGINATION_SIZE',
        meta: {
          min: typeof i.minimum === 'number' ? i.minimum : PAGINATION_SIZE_MIN,
          max: typeof i.maximum === 'number' ? i.maximum : PAGINATION_SIZE_MAX,
          received: i.input,
        },
      };
    }

    // Pagination — page[cursor]
    if (head === 'page' && path[1] === 'cursor') {
      return { code: 'INVALID_PAGINATION_CURSOR' };
    }

    // INVALID_INCLUDE / FIELDS / SORT / FILTER intentionally fall through:
    // they need resource-graph metadata (available relationships, sortable
    // fields, supported operators) that schema-level validation doesn't have.
    // Throw the corresponding AppError from your include/fields/sort/filter
    // parser middleware to surface the rich variant.
  }

  // -- Cookie & fallback ----------------------------------------------------
  return { code: 'BAD_REQUEST' };
}

// export function zodIssueToErrorMeta(issue: $ZodIssue) {
//   const { path, message, ...rest } = issue;
//   const { origin: _origin, ...withoutOrigin } = rest as typeof rest & { origin?: unknown };
//   return { ZodIssue: withoutOrigin };
// }

/**
 * Map a single Zod issue to its `ZodValidationMeta` shape.
 *
 * Handles only the "one issue → one meta" cases. `unrecognized_keys` is fanned
 * out into N errors by the serializer (one per unknown key), not here.
 */
export function zodIssueToValidationErrorMeta(issue: $ZodIssue): ValidationErrorMeta {
  // Normalise "missing required" — Zod emits this as `invalid_type` with
  // `received: "undefined"`. Clients act on it differently from wrong-type.
  if (issue.code === 'invalid_type' && isMissingFieldIssue(issue)) {
    return { validation: 'required' };
  }

  switch (issue.code) {
    case 'invalid_type': {
      const i = issue as { expected?: unknown; received?: unknown };
      return {
        validation: 'invalid_type',
        expected: typeof i.expected === 'string' ? i.expected : 'unknown',
        received: typeof i.received === 'string' ? i.received : 'unknown',
      };
    }

    case 'too_small': {
      const i = issue as {
        origin?: ValidationErrorMeta extends { validation: 'too_small'; origin: infer O } ? O : never;
        minimum?: number | bigint | string;
        inclusive?: boolean;
        input?: unknown;
      };
      return {
        validation: 'too_small',
        origin: i.origin ?? 'string',
        minimum: normaliseBound(i.minimum),
        inclusive: i.inclusive ?? false,
        ...(typeof i.input === 'number' || typeof i.input === 'string' ? { received: i.input } : {}),
      };
    }

    case 'too_big': {
      const i = issue as {
        origin?: ValidationErrorMeta extends { validation: 'too_big'; origin: infer O } ? O : never;
        maximum?: number | bigint | string;
        inclusive?: boolean;
        input?: unknown;
      };
      return {
        validation: 'too_big',
        origin: i.origin ?? 'string',
        maximum: normaliseBound(i.maximum),
        inclusive: i.inclusive ?? false,
        ...(typeof i.input === 'number' || typeof i.input === 'string' ? { received: i.input } : {}),
      };
    }

    case 'not_multiple_of': {
      const i = issue as { divisor?: number };
      return { validation: 'not_multiple_of', divisor: i.divisor ?? 0 };
    }

    case 'invalid_format': {
      const i = issue as { format?: string; pattern?: string };
      return {
        validation: 'invalid_format',
        // Cast — `zodFormatEnum` in the schema is the source of truth for the
        // narrow `format` literal union. Unrecognised formats should be added
        // there if Zod surfaces them.
        format: (i.format ?? 'regex') as ValidationErrorMeta extends {
          validation: 'invalid_format';
          format: infer F;
        }
          ? F
          : never,
        ...(i.pattern !== undefined && { pattern: i.pattern }),
      };
    }

    case 'invalid_value': {
      const i = issue as { values?: ReadonlyArray<unknown> };
      return {
        validation: 'invalid_value',
        values: (i.values ?? []).filter(
          (v): v is string | number | boolean =>
            typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
        ),
      };
    }

    case 'unrecognized_keys': {
      const i = issue as { keys?: readonly string[] };
      return { validation: 'unrecognized_keys', keys: i.keys ?? [] };
    }

    case 'invalid_union': {
      const i = issue as { errors?: ReadonlyArray<ReadonlyArray<$ZodIssue>> };
      return {
        validation: 'invalid_union',
        // Best-effort summary; per-branch issues are heterogeneous. For richer
        // branch detail (discriminator, missing fields), build at the schema
        // site and throw an AppError directly.
        branches: (i.errors ?? []).map((branch) => ({
          reason: branch[0]?.message,
        })),
      };
    }

    case 'invalid_element': {
      // Zod carries the offending position via path, so the serializer's
      // pointer is already specific. `index` is the position inside the
      // immediate parent array.
      const last = issue.path[issue.path.length - 1];
      return {
        validation: 'invalid_element',
        index: typeof last === 'number' ? last : 0,
      };
    }

    case 'invalid_key': {
      const last = issue.path[issue.path.length - 1];
      return {
        validation: 'invalid_key',
        key: last !== undefined ? String(last) : '',
      };
    }

    case 'custom': {
      // Custom refinements should pass `params: { rule: '...' }` to surface a
      // stable client-readable identifier here. Falls back to 'custom'.
      const i = issue as { params?: { rule?: unknown } };
      return {
        validation: 'custom',
        rule: typeof i.params?.rule === 'string' ? i.params.rule : 'custom',
      };
    }

    default:
      // Should not happen with stable Zod 4 issue codes. Degrade to `custom`
      // with the raw issue code as the rule for forward compatibility.
      return {
        validation: 'custom',
        rule: (issue as { code?: string }).code ?? 'unknown',
      };
  }
}

// ============================================================================
// Utils ----------------------------------------------------------------------
// ============================================================================

/**
 * Type guard for "the underlying field is missing" — Zod v4 reports this as
 * an `invalid_type` issue with `received === 'undefined'`.
 */
function isMissingFieldIssue(issue: $ZodIssue): boolean {
  if (issue.code !== 'invalid_type') return false;
  const received = (issue as { received?: unknown }).received;
  return received === 'undefined' || received === undefined;
}

/**
 * Normalizes the input value to either a number or a string.
 * If the value is `undefined`, it defaults to `0`.
 *
 * @param {number | bigint | string | undefined} value - The input value to be normalized.
 *        Can be a number, bigint, string, or undefined.
 * @return {number | string} - Returns the input as a number if it's a number,
 *         as a string if it's a bigint or string, and `0` if the input is undefined.
 */
function normaliseBound(value: number | bigint | string | undefined): number | string {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') return value;
  return 0;
}

/**
 * Convert a Zod issue path into a JSON:API-style query parameter name.
 *   ['page', 'size']        → 'page[size]'
 *   ['filter', 'status']    → 'filter[status]'
 *   ['fields', 'user']      → 'fields[user]'
 *   ['id']                  → 'id'
 */
function joinPathAsParameter(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) return '';
  const [head, ...rest] = path.map(String);
  return rest.length === 0 ? (head ?? '') : `${head}${rest.map((p) => `[${p}]`).join('')}`;
}

function escapePointerSegment(segment: PropertyKey): string {
  // RFC 6901: '~' → '~0', '/' → '~1'. Order matters — escape '~' first.
  const s = typeof segment === 'symbol' ? segment.toString() : String(segment);
  return s.replace(/~/g, '~0').replace(/\//g, '~1');
}
