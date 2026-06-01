import { AppError } from './app.error';

export class NotFoundError extends AppError {
  constructor(resourceType: string, id?: string) {
    super({
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
      title: 'Resource not found',
      detail: id ? `${resourceType} with id '${id}' was not found.` : `${resourceType} was not found.`,
      source: { parameter: 'id' },
    });
  }
}
