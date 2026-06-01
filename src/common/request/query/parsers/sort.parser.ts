export type SortDirection = 'asc' | 'desc';

export interface SortDirective<TField extends string = string> {
  field: TField;
  direction: SortDirection;
}
/**
 * Split a validated sort string into structured directives.
 *
 * Structural parameter type so this composes with any merged query
 * schema (pagination + sort + filter + fields + include).
 *
 * Pass the field union as a type argument for type-safe directives:
 *   const sort = parseSort<"createdAt" | "title" | "viewCount">(query);
 */
export function parseSort<TField extends string = string>(
  query: { sort?: string | null | undefined },
  defaultSort: readonly SortDirective<TField>[] = [],
): SortDirective<TField>[] {
  const raw = query.sort;
  if (!raw) return [...defaultSort];

  return raw.split(',').map((token) => {
    if (token.startsWith('-')) {
      return { field: token.slice(1) as TField, direction: 'desc' };
    }
    return { field: token as TField, direction: 'asc' };
  });
}
