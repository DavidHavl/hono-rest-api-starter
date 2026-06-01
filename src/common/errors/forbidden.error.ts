import { AppError } from './app.error';

export type ForbiddenErrorMeta = {
  requiredRole?: string;
  requiredPermission?: string;
};

export type ForbiddenErrorCode =
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RESOURCE_FORBIDDEN'
  | 'ACCOUNT_DISABLED'
  | 'NOT_VERIFIED';

export class ForbiddenError extends AppError {
  constructor(
    detail = 'You do not have permission to perform this action.',
    code: ForbiddenErrorCode = 'INSUFFICIENT_PERMISSIONS',
    meta?: ForbiddenErrorMeta,
  ) {
    super({
      status: 403,
      code,
      title: 'Forbidden',
      detail,
      meta,
    });
  }
}
