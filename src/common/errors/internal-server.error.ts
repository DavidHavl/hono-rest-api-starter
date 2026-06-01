import { AppError } from './app.error';

export type InternalServerErrorMeta = {
  traceId?: string;
  spanId?: string;
};

export class InternalServerError extends AppError {
  constructor(detail = 'An unexpected error occurred.', meta?: InternalServerErrorMeta) {
    super({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      title: 'Internal Server Error',
      detail,
      meta,
    });
  }
}
