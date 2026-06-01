import { AppError } from './app.error';

export type MethodNotAllowedErrorMethods = ('GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT' | 'OPTIONS' | 'HEAD')[];

export class MethodNotAllowedError extends AppError {
  constructor(detail?: string, allowedMethods?: MethodNotAllowedErrorMethods) {
    super({
      status: 409,
      code: 'METHOD_NOT_ALLOWED',
      title: 'Method Not Allowed',
      detail: detail ?? 'Method is not supported on this endpoint.',
      meta: allowedMethods
        ? {
            allowedMethods,
          }
        : undefined,
    });
  }
}
