import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { ForbiddenError, type ForbiddenErrorCode, type ForbiddenErrorMeta } from '@/common/errors';
import {
  createErrorResponseDocumentFromError,
  createErrorResponseDocumentSchema,
  createResponseContentSchema,
} from '@/common/responses/factories';
import { jsonApiForbiddenErrorObjectSchema } from '../errors/schemas';

// ============================================================================
// 403 Forbidden --------------------------------------------------------------
// ============================================================================
/**
 * Response for: Authenticated but lacking the required role or permission.
 */
export const forbiddenResponse = (
  c: Context,
  detail: string = 'You do not have permission to perform this action.',
  code: ForbiddenErrorCode = 'INSUFFICIENT_PERMISSIONS',
  meta?: ForbiddenErrorMeta,
) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(new ForbiddenError(detail, code, meta), url.origin, 403) as ForbiddenResponse,
    403,
    {
      'Content-Type': 'application/vnd.api+json',
    },
  );
};

export const jsonApiForbiddenResponseSchema = createErrorResponseDocumentSchema(
  jsonApiForbiddenErrorObjectSchema,
  'JsonApiForbiddenResponse',
  'JSON:API error response for authenticated requests that lack the required permissions.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
        status: '403',
        title: 'Forbidden',
        detail: 'You do not have permission to delete this resource.',
        code: 'INSUFFICIENT_PERMISSIONS',
        meta: {
          requiredRole: 'admin',
        },
      },
    ],
  },
);

export const forbiddenResponseContentSchema = (description = 'You do not have permission to perform this action.') =>
  createResponseContentSchema(jsonApiForbiddenResponseSchema, description);

export type ForbiddenResponse = z.infer<typeof jsonApiForbiddenResponseSchema>;
