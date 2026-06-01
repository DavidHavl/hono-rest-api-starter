import { AppError } from './app.error';

/**
 * Meta information for validation errors, derived from zod, detailing the specific validation failure.
 */
export type ValidationErrorMeta =
  | { validation: 'required' }
  | { validation: 'invalid_type'; expected: string; received: string }
  | {
      validation: 'too_small' | 'too_big';
      origin: 'string' | 'array' | 'number' | 'date' | 'set' | 'bigint' | 'file';
      // number for length/value/size; ISO string for dates.
      minimum?: number | string;
      maximum?: number | string;
      inclusive: boolean;
      received?: number;
    }
  | { validation: 'not_multiple_of'; divisor: number }
  | {
      validation: 'invalid_format';
      format:
        | 'email'
        | 'url'
        | 'uuid'
        | 'uuidv4'
        | 'uuidv7'
        | 'regex'
        | 'iso_datetime'
        | 'iso_date'
        | 'iso_time'
        | 'iso_duration'
        | 'ipv4'
        | 'ipv6'
        | 'cidrv4'
        | 'cidrv6'
        | 'base64'
        | 'base64url'
        | 'jwt'
        | 'cuid'
        | 'cuid2'
        | 'ulid'
        | 'nanoid'
        | 'emoji';
      pattern?: string;
    }
  | { validation: 'invalid_value'; values: ReadonlyArray<string | number | boolean> }
  | { validation: 'unrecognized_keys'; keys: readonly string[] }
  | {
      validation: 'invalid_union';
      branches: ReadonlyArray<{
        discriminator?: string;
        missing?: readonly string[];
        reason?: string;
      }>;
    }
  | { validation: 'invalid_element'; index: number }
  | { validation: 'invalid_key'; key: string }
  | { validation: 'custom'; rule: string };

export class ValidationError extends AppError {
  constructor(detail: string, pointer?: string, meta?: ValidationErrorMeta) {
    super({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Unprocessable Entity',
      detail,
      source: pointer ? { pointer } : {},
      meta,
    });
  }
}
