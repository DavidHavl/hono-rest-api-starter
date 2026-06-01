import { AppError } from './app.error';

export class GoneError extends AppError {
  constructor(detail: string = 'The resource was permanently deleted.') {
    super({
      status: 410,
      code: 'RESOURCE_GONE', // or API_VERSION_RETIRED
      title: 'Gone',
      detail,
    });
  }
}
