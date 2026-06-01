import { AppError } from './app.error';

export type ConflictErrorMeta = {
  currentVersion?: number;
  submittedVersion?: number;
  currentState?: string;
  submittedState?: string;
};

export type ConflictErrorCode = 'RESOURCE_ALREADY_EXISTS' | 'VERSION_CONFLICT' | 'INVALID_STATE_TRANSITION';

export class ConflictError extends AppError {
  constructor(
    detail?: string,
    code: ConflictErrorCode = 'RESOURCE_ALREADY_EXISTS',
    attributePath?: string,
    meta?: ConflictErrorMeta,
  ) {
    super({
      status: 409,
      code: code ?? 'RESOURCE_ALREADY_EXISTS',
      title: 'Conflict',
      detail: detail ?? 'A resource with these parameters already exist.',
      source: attributePath ? { pointer: attributePath } : {},
      meta,
    });
  }
}
