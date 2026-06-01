import { AppError } from './app.error';

/**
 * Code → human-readable title. The same map underpins the per-variant
 * `z.literal(...)` titles in `jsonApiBadRequestErrorObjectSchema`.
 */
export const BAD_REQUEST_TITLES = {
  BAD_REQUEST: 'Bad Request',
  MALFORMED_JSON: 'Malformed JSON',
  EMPTY_BODY: 'Empty Request Body',
  INVALID_DOCUMENT_STRUCTURE: 'Invalid Document Structure',
  TYPE_MISMATCH: 'Resource Type Mismatch',
  ID_MISMATCH: 'Resource ID Mismatch',
  UNKNOWN_DOCUMENT_MEMBER: 'Unknown Document Member',
  INVALID_INCLUDE: 'Invalid Include Parameter',
  INVALID_FIELDS: 'Invalid Sparse Fieldset',
  INVALID_SORT: 'Invalid Sort Parameter',
  INVALID_FILTER: 'Invalid Filter Parameter',
  INVALID_PAGINATION_STRATEGY: 'Invalid Pagination Strategy',
  INVALID_PAGINATION_CURSOR: 'Invalid Pagination Cursor',
  INVALID_PAGINATION_SIZE: 'Invalid Pagination Size',
  UNKNOWN_QUERY_PARAMETER: 'Unknown Query Parameter',
  MISSING_REQUIRED_HEADER: 'Missing Required Header',
  MALFORMED_HEADER: 'Malformed Header',
  INVALID_IDEMPOTENCY_KEY: 'Invalid Idempotency Key',
  INVALID_RESOURCE_ID_FORMAT: 'Invalid Resource ID Format',
  INVALID_RELATIONSHIP_CARDINALITY: 'Invalid Relationship Cardinality',
  MISSING_RELATIONSHIP_DATA: 'Missing Relationship Data',
  UNRESOLVABLE_LID: 'Unresolvable Local ID',
} as const satisfies Record<BadRequestErrorOptions['code'], string>;

export type BadRequestErrorOptions =
  | { code: 'BAD_REQUEST' }
  | { code: 'MALFORMED_JSON' }
  | { code: 'EMPTY_BODY' }
  | {
      code: 'INVALID_DOCUMENT_STRUCTURE';
      source: { pointer: string };
    }
  | {
      code: 'TYPE_MISMATCH';
      source: { pointer: string };
      meta: { expected: string; received: string };
    }
  | {
      code: 'ID_MISMATCH';
      source: { pointer: string };
    }
  | {
      code: 'UNKNOWN_DOCUMENT_MEMBER';
      source: { pointer: string };
      meta?: { suggestion?: string };
    }
  | {
      code: 'INVALID_INCLUDE';
      meta: {
        reason: 'unknown_relationship' | 'depth_exceeded' | 'circular_path' | 'not_includable';
        path: string;
        available?: readonly string[];
      };
    }
  | {
      code: 'INVALID_FIELDS';
      source: { parameter: `fields[${string}]` };
      meta: {
        reason: 'unknown_type' | 'unknown_field' | 'not_selectable';
        type: string;
        field?: string;
      };
    }
  | {
      code: 'INVALID_SORT';
      meta: {
        reason: 'unknown_field' | 'not_sortable' | 'too_many_sort_fields';
        field?: string;
        sortable?: readonly string[];
      };
    }
  | {
      code: 'INVALID_FILTER';
      source: { parameter: string };
      meta: {
        reason:
          | 'unknown_field'
          | 'not_filterable'
          | 'unsupported_operator'
          | 'invalid_value_type'
          | 'value_out_of_range';
        field: string;
        operator?: string;
        supported?: readonly string[];
      };
    }
  | {
      code: 'INVALID_PAGINATION_STRATEGY';
      meta: { received: readonly string[] };
    }
  | { code: 'INVALID_PAGINATION_CURSOR' }
  | {
      code: 'INVALID_PAGINATION_SIZE';
      meta: { min: number; max: number; received: unknown };
    }
  | {
      code: 'UNKNOWN_QUERY_PARAMETER';
      source: { parameter: string };
      meta?: { suggestion?: string };
    }
  | {
      code: 'MISSING_REQUIRED_HEADER';
      source: { header: string };
    }
  | {
      code: 'MALFORMED_HEADER';
      source: { header: string };
      meta?: { expectedFormat?: string };
    }
  | {
      code: 'INVALID_IDEMPOTENCY_KEY';
    }
  | {
      code: 'INVALID_RESOURCE_ID_FORMAT';
      source: { parameter: string };
    }
  | {
      code: 'INVALID_RELATIONSHIP_CARDINALITY';
      source: { pointer: string };
      meta: { expected: 'to-one' | 'to-many'; received: 'to-one' | 'to-many' };
    }
  | {
      code: 'MISSING_RELATIONSHIP_DATA';
      source: { pointer: string };
    }
  | {
      code: 'UNRESOLVABLE_LID';
      source: { pointer: string };
      meta: { lid: string };
    };

export type BadRequestErrorType = {
  id: string;
  title: string;
  detail: string;
  links?: {
    about?: string;
    type?: string;
  };
} & BadRequestErrorOptions;

/**
 * Represents an error that occurs when a request is invalid or cannot be processed.
 * Extends the AppError class with a status code of 400.
 */
export class BadRequestError extends AppError {
  constructor(detail: string = 'There was an error while processing the request', options: BadRequestErrorOptions) {
    super({
      status: 400,
      code: options.code ?? 'BAD_REQUEST',
      title: 'Bad request',
      detail,
    });
    if ('source' in options && options.source) {
      this.source = options.source;
    }
    if ('meta' in options && options.meta) {
      this.meta = options.meta;
    }
  }
}
