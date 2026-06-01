import type { SparseFieldsets } from '@/common/types';

/**
 * Build Drizzle ORM column selection from sparse fieldsets.
 */
export function buildColumnSelection(
  fields: SparseFieldsets,
  resourceType: string,
  columnMap: Record<string, unknown>,
): Record<string, true> | undefined {
  const requested = fields[resourceType];
  if (!requested || requested.length === 0) return undefined;

  const columns: Record<string, true> = { id: true };
  for (const field of requested) {
    if (field in columnMap) {
      columns[field] = true;
    }
  }
  return columns;
}
