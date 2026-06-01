import type { SparseFieldsets } from '@/common/types';

/**
 * Extract sparse fieldset selections from a validated query object.
 *
 * Scans the query for any `fields[*]` keys and converts each comma-separated value
 * into an array of values for each resource type.
 *
 * Structural parameter type — composes with any merged query schema.
 * Pass the type→fields map as a type argument for type-safe Sets:
 *
 *   const fields = parseSparseFieldsets<{
 *     article: "title" | "slug" | "publishedAt";
 *     author: "name" | "avatar";
 *   }>(query);
 */
export function parseSparseFieldsets(query: Record<string, unknown>): SparseFieldsets {
  const result: SparseFieldsets = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value !== 'string') continue;
    const match = key.match(/^fields\[(.+)\]$/);
    if (!match) continue;
    const type = match[1]!;
    result[type] = value.split(',');
  }

  return result;
}
