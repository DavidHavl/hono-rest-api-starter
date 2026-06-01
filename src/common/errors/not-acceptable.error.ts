import { AppError } from './app.error';

export class NotAcceptableError extends AppError {
  constructor(detail?: string) {
    super({
      status: 406,
      code: 'NOT_ACCEPTABLE',
      title: 'Not Acceptable',
      detail: detail ?? 'This API only serves application/vnd.api+json. ' + 'Include it in your Accept header.',
      source: { header: 'Accept' },
      meta: { supportedMediaTypes: ['application/vnd.api+json'] },
    });
  }
}
