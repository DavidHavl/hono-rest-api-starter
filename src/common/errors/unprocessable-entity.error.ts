import { AppError, type BadRequestErrorOptions, type ValidationErrorMeta } from './index';

/**
 * Code → human-readable title. Mirrors the per-variant `z.literal(...)` titles
 * in the response schemas.
 */
export const UNPROCESSABLE_ENTITY_ERROR_TITLES = {
  // 422 ---------------------------------------------------------------------
  VALIDATION_ERROR: 'Validation Error',
  BUSINESS_RULE_VIOLATION: 'Business Rule Violation',
  MUTUALLY_EXCLUSIVE_FIELDS: 'Mutually Exclusive Fields',
  CONDITIONALLY_REQUIRED_FIELD: 'Conditionally Required Field',
  INCONSISTENT_FIELD_VALUES: 'Inconsistent Field Values',
  INVALID_DISCRIMINATOR: 'Invalid Discriminator',
  INVALID_ATTRIBUTE_FOR_TYPE: 'Invalid Attribute For Type',
  INVALID_RELATIONSHIP_TARGET_TYPE: 'Invalid Relationship Target Type',
  RELATIONSHIP_TARGET_NOT_FOUND: 'Relationship Target Not Found',
} as const satisfies Record<UnprocessableEntityErrorOptions['code'], string>;

export type UnprocessableEntityErrorOptions =
  | {
      code: 'VALIDATION_ERROR';
      pointer: string;
      meta: ValidationErrorMeta;
    }
  | {
      code: 'BUSINESS_RULE_VIOLATION';
      pointer?: string;
      meta: {
        rule: string;
        // Free-form per rule; type at usage site.
        context?: Record<string, unknown>;
      };
    }
  | {
      code: 'MUTUALLY_EXCLUSIVE_FIELDS';
      pointer: string;
      meta: {
        group: string;
        conflictingWith: string;
      };
    }
  | {
      code: 'CONDITIONALLY_REQUIRED_FIELD';
      pointer: string;
      meta: {
        condition: {
          pointer: string;
          expectedValue: unknown;
        };
      };
    }
  | {
      code: 'INCONSISTENT_FIELD_VALUES';
      pointer: string;
      meta: {
        rule: string;
        fields: readonly string[];
      };
    }
  | {
      code: 'INVALID_DISCRIMINATOR';
      pointer: string;
      meta: {
        allowed: readonly string[];
      };
    }
  | {
      code: 'INVALID_ATTRIBUTE_FOR_TYPE';
      pointer: string;
      meta: {
        discriminator: { pointer: string; value: string };
        validForTypes: readonly string[];
      };
    }
  | {
      code: 'INVALID_RELATIONSHIP_TARGET_TYPE';
      pointer: string;
      meta: {
        expected: string;
        received: string;
      };
    }
  | {
      code: 'RELATIONSHIP_TARGET_NOT_FOUND';
      pointer: string;
      meta: {
        type: string;
        id: string;
      };
    };

export type UnprocessableEntityErrorType = {
  id: string;
  title: string;
  detail: string;
  links?: {
    about?: string;
    type?: string;
  };
} & UnprocessableEntityErrorOptions;

export class UnprocessableEntityError extends AppError {
  constructor(detail: string = 'Validation failed', options: UnprocessableEntityErrorOptions) {
    super({
      status: 422,
      code: options.code ?? 'VALIDATION_ERROR',
      title: 'Unprocessable Entity',
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
