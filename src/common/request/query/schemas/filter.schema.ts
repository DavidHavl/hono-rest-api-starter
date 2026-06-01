import { z } from '@hono/zod-openapi';

// ============================================================================
// Operators, types, and the per-field configuration shape
// ============================================================================

export const FILTER_OPERATORS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'like', 'ilike', 'isnull'] as const;

// Sensible defaults per scalar kind
export const STRING_FILTER_OPS = ['eq', 'ne', 'in', 'nin', 'like', 'isnull'] as const;
export const NUMBER_FILTER_OPS = ['eq', 'ne', 'in', 'nin', 'gt', 'gte', 'lt', 'lte', 'isnull'] as const;
export const DATE_FILTER_OPS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'isnull'] as const;
export const ENUM_FILTER_OPS = ['eq', 'ne', 'in', 'nin', 'isnull'] as const;
export const BOOL_FILTER_OPS = ['eq', 'ne', 'isnull'] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export type FilterFieldType = 'string' | 'number' | 'boolean' | 'datetime';

export interface FilterFieldDef {
  type: FilterFieldType;
  operators: readonly [FilterOperator, ...FilterOperator[]];
  /** Optional override for the OpenAPI description of the shorthand param. */
  description?: string;
}

export type FilterAllowlistMap = Record<string, FilterFieldDef>;

// Operators with non-default value semantics.
export const LIST_OPERATORS = new Set<FilterOperator>(['in', 'nin']);
export const BOOLEAN_VALUE_OPERATORS = new Set<FilterOperator>(['isnull']);

// ============================================================================
// Per-type value patterns
// ============================================================================

const SCALAR_PATTERNS: Record<FilterFieldType, RegExp> = {
  string: /^[^,]+$/, // anything except comma (comma is the list separator)
  number: /^-?\d+(\.\d+)?$/,
  boolean: /^(true|false)$/,
  datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
};

function listPattern(type: FilterFieldType): RegExp {
  const scalar = SCALAR_PATTERNS[type].source.slice(1, -1); // strip ^ and $
  return new RegExp(`^${scalar}(,${scalar})*$`);
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory: create a per-route JSON:API 1.2 filter query schema.
 *
 * Convention: bracket-style with operator suffix.
 *   - filter[field]=value          (shorthand for filter[field][eq])
 *   - filter[field][op]=value      (explicit operator)
 *   - filter[field][in]=a,b,c      (list operators take CSV values)
 *   - filter[field][isnull]=true   (null check)
 *
 * Each field declares its scalar type and the operators it supports.
 * Schema enforces field allowlist, operator allowlist per field, and
 * per-type value format.
 *
 * @example
 * const filterSchema = makeFilterQuerySchema({
 *   age: { type: 'number', operators: ['eq', 'gt', 'lt'] },
 *   name: { type: 'string', operators: ['eq', 'like'] },
 * });
 */
export function createFilterQuerySchema<const TMap extends FilterAllowlistMap>(
  filterMap: TMap,
  options?: {
    examples?: Partial<Record<keyof TMap & string, string>>;
  },
) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of Object.keys(filterMap)) {
    const def = filterMap[field];
    if (!def) {
      throw new Error(`Invalid filter definition for field: ${field}`);
    }

    // Explicit operator variants: filter[field][op]
    for (const op of def.operators) {
      const paramName = `filter[${field}][${op}]`;
      shape[paramName] = buildValueSchema(def.type, op)
        .optional()
        .openapi({
          param: { name: paramName, in: 'query', required: false },
          description: describeOperator(field, def.type, op),
          example: exampleForOperator(def.type, op),
        });
    }

    // Shorthand: filter[field] (treated as filter[field][eq])
    if (def.operators.includes('eq')) {
      const paramName = `filter[${field}]`;
      shape[paramName] = buildValueSchema(def.type, 'eq')
        .optional()
        .openapi({
          param: { name: paramName, in: 'query', required: false },
          description:
            def.description ??
            `Shorthand for \`filter[${field}][eq]\`. Filter resources where ` +
              `\`${field}\` equals the given ${def.type} value.`,
          example: options?.examples?.[field] ?? exampleForOperator(def.type, 'eq'),
        });
    }
  }

  return z.object(shape);
}

function buildValueSchema(type: FilterFieldType, op: FilterOperator) {
  if (BOOLEAN_VALUE_OPERATORS.has(op)) {
    return z.string().regex(SCALAR_PATTERNS.boolean, {
      error: `value for \`${op}\` must be "true" or "false"`,
    });
  }
  if (LIST_OPERATORS.has(op)) {
    return z.string().regex(listPattern(type), {
      error: `value for \`${op}\` must be a comma-separated list of ${type} values`,
    });
  }
  if (op === 'like' || op === 'ilike') {
    return z.string().min(1, {
      error: `value for \`${op}\` cannot be empty`,
    });
  }
  return z.string().regex(SCALAR_PATTERNS[type], {
    error: `value for \`${op}\` must be a valid ${type}`,
  });
}

const OPERATOR_VERBS: Record<FilterOperator, string> = {
  eq: 'equals',
  ne: 'does not equal',
  gt: 'is greater than',
  gte: 'is greater than or equal to',
  lt: 'is less than',
  lte: 'is less than or equal to',
  in: 'matches any of',
  nin: 'matches none of',
  like: 'matches (case-sensitive, `%` wildcard)',
  ilike: 'matches (case-insensitive, `%` wildcard)',
  isnull: 'is null',
};

function describeOperator(field: string, type: FilterFieldType, op: FilterOperator): string {
  if (op === 'isnull') {
    return (
      `Filter resources where \`${field}\` IS NULL (when value is \`true\`) ` +
      `or IS NOT NULL (when value is \`false\`).`
    );
  }
  if (LIST_OPERATORS.has(op)) {
    return `Filter resources where \`${field}\` ${OPERATOR_VERBS[op]} the comma-separated list of ${type} values.`;
  }
  return `Filter resources where \`${field}\` ${OPERATOR_VERBS[op]} the given ${type} value.`;
}

function exampleForOperator(type: FilterFieldType, op: FilterOperator): string {
  if (op === 'isnull') return 'false';
  if (LIST_OPERATORS.has(op)) {
    switch (type) {
      case 'number':
        return '1,2,3';
      case 'boolean':
        return 'true,false';
      case 'datetime':
        return '2026-01-01T00:00:00Z,2026-06-01T00:00:00Z';
      default:
        return 'published,draft';
    }
  }
  if (op === 'like' || op === 'ilike') return 'hello%';
  switch (type) {
    case 'number':
      return '100';
    case 'boolean':
      return 'true';
    case 'datetime':
      return '2026-01-01T00:00:00Z';
    default:
      return 'published';
  }
}
