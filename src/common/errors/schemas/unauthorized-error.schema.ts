import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema, jsonApiErrorMetaSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 401 Unauthorized -----------------------------------------------------------
// ============================================================================
// Missing or invalid authentication credentials.
// source.header → Authorization is the canonical culprit.

export const jsonApiUnauthorizedErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
    status: z.literal('401').openapi({ example: '401' }),
    title: z.literal('Unauthorized').openapi({ example: 'Unauthorized' }),
    detail: z.string().openapi({
      description: 'Human-readable explanation of the authentication failure.',
      example: 'Bearer token is missing or has expired.',
    }),
    code: z
      .enum(['AUTHENTICATION_REQUIRED', 'INVALID_CREDENTIALS', 'TOKEN_EXPIRED', 'INVALID_TOKEN'])
      .optional()
      .openapi({
        description:
          'AUTHENTICATION_REQUIRED: a request is missing valid authentication credentials. ' +
          'INVALID_CREDENTIALS: the email or password is incorrect.' +
          'TOKEN_EXPIRED: the provided authentication token has expired. ' +
          'INVALID_TOKEN: the provided authentication token is invalid.',
        example: 'AUTHENTICATION_REQUIRED',
      }),
    source: z
      .object({
        // pointer and parameter omitted: auth lives in headers
        header: z.string().optional().openapi({
          description: 'The request header containing the invalid credentials.',
          example: 'Authorization',
        }),
      })
      .optional()
      .openapi({
        example: { header: 'Authorization' },
      }),
    links: jsonApiErrorLinksSchema.optional(),
    meta: jsonApiErrorMetaSchema.optional(),
  })
  .openapi('JsonApiUnauthorizedErrorObject');
