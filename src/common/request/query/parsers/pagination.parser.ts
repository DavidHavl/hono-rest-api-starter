import type { JsonApiNumberPaginationParams } from '@/common/jsonapi/types';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 500;

/**
 * Parse JSON:API pagination from validated query object.
 * The parameter type is structural — it accepts any object that has the
 * required page keys, so this works equally well standalone or a merged composite query (pagination + sort + filter + fields + include).
 * Supports: ?page[number]=1&page[size]=20
 */
export function parsePagination(query: {
  'page[number]': number;
  'page[size]': number;
}): JsonApiNumberPaginationParams {
  const number = Math.max(1, query['page[number]'] ?? 1);
  const size = Math.min(Math.max(1, query['page[size]'] ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

  return { number, size };
}

/**
 * Calculate SQL offset from pagination params.
 */
export function paginationToOffset(params: JsonApiNumberPaginationParams): { limit: number; offset: number } {
  return {
    limit: params.size,
    offset: (params.number - 1) * params.size,
  };
}
