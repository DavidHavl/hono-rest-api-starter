import { AppError } from './app.error';

export class UnsupportedMediaTypeError extends AppError {
  constructor(detail?: string, receivedMediaType?: string) {
    super({
      status: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE',
      title: 'Unsupported Media Type',
      detail:
        detail ??
        `Content-Type must be application/vnd.api+json. Received: ${receivedMediaType ?? 'application/json or other media type'}.`,
      source: { header: 'Content-Type' },
      meta: {
        receivedMediaType,
        requiredMediaType: 'application/vnd.api+json',
      },
    });
  }
}
