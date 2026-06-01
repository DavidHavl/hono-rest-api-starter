import type { Context } from 'hono';
import { ZodError } from 'zod';
import { AppError } from '@/common/errors';
import { InternalServerError } from '@/common/errors/internal-server.error';
import { createErrorResponseDocumentFromError } from '@/common/responses/factories';
import { generateUuid } from '@/common/utils/id';
import { env } from '@/env';

/**
 * Global error handler that converts all errors to JSON:API error documents.
 */
export function errorHandler(err: Error, c: Context) {
  const logger = c.get('logger');
  logger.info('Handling error in global error handler');

  // App-level errors (known)
  if (err instanceof AppError) {
    logger.withError(err).warn(err.message);
    return c.json(createErrorResponseDocumentFromError(err, new URL(c.req.url).origin, err.status), err.status as 400, {
      'Content-Type': 'application/vnd.api+json',
    });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    logger.withContext({ error: err }).warn('Validation failed');
    return c.json(createErrorResponseDocumentFromError(err, new URL(c.req.url).origin, 422), 422, {
      'Content-Type': 'application/vnd.api+json',
    });
  }

  const errorId = generateUuid();
  // Unknown / unhandled errors
  logger.withError(err).withMetadata({ errorId }).error('Unhandled error');

  const detail = env.NODE_ENV !== 'production' ? err.message : 'An unexpected error occurred.';
  // const meta = {
  //     traceId: undefined,
  //     spanId: undefined,
  //   };
  const error = new InternalServerError(detail);
  return c.json(createErrorResponseDocumentFromError(error, new URL(c.req.url).origin, 500), 500, {
    'Content-Type': 'application/vnd.api+json',
  });
}
