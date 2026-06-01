// JSON:API Specification Types //
// Fully compliant with https://jsonapi.org/format/

export type JsonApiDocument<T = JsonApiResource> = {
  jsonapi: { version: '1.1' };
  data: T | T[] | null;
  included?: JsonApiResource[];
  meta?: JsonApiMeta;
  links?: JsonApiLinks | JsonApiCollectionLinks;
  errors?: never;
};

export type JsonApiErrorDocument = {
  jsonapi: { version: '1.1' };
  errors: JsonApiError[];
  meta?: JsonApiMeta;
  data?: never;
};

export type JsonApiResource = {
  type: string;
  id: string;
  attributes?: JsonApiResouceAttributes;
  relationships?: JsonApiResouceRelationships;
  links?: JsonApiLinks;
  meta?: JsonApiMeta;
};

export type JsonApiResouceAttributes = Record<string, unknown>;

export type JsonApiResouceRelationships = Record<string, JsonApiRelationship>;

export type JsonApiRelationship = {
  data: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null;
  links?: JsonApiLinks;
  meta?: JsonApiMeta;
};

export type JsonApiResourceIdentifier = {
  type: string;
  id: string;
  meta?: JsonApiMeta;
};

export type JsonApiError = {
  id?: string;
  status: string;
  code?: string;
  title: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
    header?: string;
  };
  meta?: JsonApiMeta;
  links?: JsonApiErrorLinks;
};

export type JsonApiErrorLinks = {
  about?: string;
  type?: string;
};

export type JsonApiLinks = {
  self?: string | JsonApiLink;
  // related, describedby — optional, rarely used at top level for single resource
};

export type JsonApiCollectionLinks = {
  self?: string | JsonApiLink;
  first?: string | null;
  last?: string | null;
  prev?: string | null;
  next?: string | null;
};

export type JsonApiLink = {
  href: string;
  rel?: string;
  describedby?: string;
  title?: string;
  type?: string;
  hreflang?: string | string[];
  meta?: JsonApiMeta;
};

export type JsonApiMeta = Record<string, unknown>;

// export type SparseFieldsets<TMap extends Record<string, string> = Record<string, string>> = {
//   [K in keyof TMap]?: Set<TMap[K]>;
// };

// ============================================================================
// Pagination Types -----------------------------------------------------------
// ============================================================================

export type JsonApiNumberPaginationParams = {
  number: number;
  size: number;
};

export type JsonApiCursorPaginationMeta = {
  // TODO: change property names to reflect the new pagination schema
  strategy: 'cursor';
  size: number;
  hasMore: boolean;
  total?: number; // optional, opt-in
};

export type JsonApiOffsetPaginationMeta = {
  strategy: 'offset';
  offset: number;
  limit: number;
  total: number;
};

export type JsonApiNumberPaginationMeta = {
  strategy: 'number';
  number: number;
  size: number;
  totalPages: number;
  total: number;
};

export type JsonApiPaginationMeta =
  | JsonApiCursorPaginationMeta
  | JsonApiOffsetPaginationMeta
  | JsonApiNumberPaginationMeta;
