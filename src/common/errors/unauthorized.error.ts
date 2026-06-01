import { AppError } from './app.error';

export type UnauthorizedErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN';

export class UnauthorizedError extends AppError {
  constructor(
    detail = 'Authentication is required to access this resource.',
    code: UnauthorizedErrorCode = 'AUTHENTICATION_REQUIRED',
  ) {
    super({
      status: 401,
      code: code ?? 'AUTHENTICATION_REQUIRED',
      title: 'Unauthorized',
      detail,
      source: code !== 'INVALID_CREDENTIALS' ? { header: 'Authorization' } : undefined,
    });
  }
}
