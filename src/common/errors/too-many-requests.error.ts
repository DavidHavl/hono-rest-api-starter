import { AppError } from './app.error';

export type TooManyRequestsErrorMeta = {
  limit?: number;
  remaining?: number;
  resetAt?: string;
  retryAfterSeconds?: number;
};

export class TooManyRequestsError extends AppError {
  constructor(detail = 'Rate limit exceeded', meta?: TooManyRequestsErrorMeta) {
    super({
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      title: 'Too Many Requests',
      detail,
      meta,
    });
  }
}
