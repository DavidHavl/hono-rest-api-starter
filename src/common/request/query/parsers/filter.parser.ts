// ============================================================================
// Parsed shape + parse helper
// ============================================================================

import {
  type FilterAllowlistMap,
  type FilterFieldType,
  type FilterOperator,
  LIST_OPERATORS,
} from '@/common/request/query/schemas/filter.schema';

export type FilterValue = string | number | boolean | readonly string[] | readonly number[] | readonly boolean[];

export interface FilterDirective {
  field: string;
  operator: FilterOperator;
  value: FilterValue;
}

const FILTER_KEY_REGULAR_EXPRESSION = /^filter\[([^\]]+)\](?:\[([^\]]+)\])?$/;

/**
 * JSON:API v1.2 filter parser.
 *
 * Extract filter directives from a validated query object.
 *
 * Scans for `filter[*]` and `filter[*][*]` keys, normalises shorthand
 * to the explicit `eq` operator, and coerces values to typed JS values
 * according to the field's declared type (carried in `filterMap`).
 * This parser supports bracket-style with operator suffix convention.
 *
 *   filter[status]=published                 → { status, eq, "published" }
 *   filter[viewCount][gte]=100               → { viewCount, gte, "100" }
 *   filter[tags][in]=typescript,hono         → { tags, in, ["typescript","hono"] }
 *   filter[deletedAt][isnull]=true           → { deletedAt, isnull, true }
 *   filter[author.name]=Jane                 → { author.name, eq, "Jane" }
 *
 * Datetime values are kept as ISO 8601 strings — your service layer can
 * pass them to `Temporal.Instant.from(...)` at the point of use.
 *
 * @see https://jsonapi.org/format/#fetching-filtering
 */
export function parseFilter<TMap extends FilterAllowlistMap>(
  query: Record<string, unknown>,
  filterMap: TMap,
): FilterDirective[] {
  const directives: FilterDirective[] = [];

  for (const [key, raw] of Object.entries(query)) {
    if (typeof raw !== 'string') continue;
    const match = key.match(FILTER_KEY_REGULAR_EXPRESSION);
    if (!match) continue;

    const field = match[1]!;
    const operator = (match[2] ?? 'eq') as FilterOperator;
    const def = filterMap[field];
    if (!def) continue; // would have failed validation; defensive guard

    directives.push({
      field,
      operator,
      value: coerceValue(raw, operator, def.type),
    });
  }

  return directives;
}

function coerceValue(raw: string, op: FilterOperator, type: FilterFieldType): FilterValue {
  if (op === 'isnull') {
    return raw === 'true';
  }
  if (LIST_OPERATORS.has(op)) {
    const parts = raw.split(',');
    switch (type) {
      case 'number':
        return parts.map(Number);
      case 'boolean':
        return parts.map((p) => p === 'true');
      default:
        return parts; // string and datetime stay as strings
    }
  }
  if (op === 'like' || op === 'ilike') {
    return raw; // wildcards intact
  }
  switch (type) {
    case 'number':
      return Number(raw);
    case 'boolean':
      return raw === 'true';
    default:
      return raw; // string and datetime stay as strings
  }
}
