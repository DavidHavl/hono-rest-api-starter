import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 403 Forbidden --------------------------------------------------------------
// ============================================================================
// Authenticated but lacking the required role or permission.
// No source: identity is confirmed, the request itself is the problem.
// meta carries RBAC context (requiredRole, requiredPermission).

export const jsonApiForbiddenErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c' }),
    status: z.literal('403').openapi({ example: '403' }),
    title: z.literal('Forbidden').openapi({ example: 'Forbidden' }),
    detail: z.string().openapi({
      description: 'Human-readable explanation of the authorisation failure.',
      example: 'You do not have permission to delete this resource.',
    }),
    code: z.string().optional().openapi({
      example: 'INSUFFICIENT_PERMISSIONS',
    }),
    // source intentionally omitted: credentials are valid, permission is absent
    links: jsonApiErrorLinksSchema.optional(),
    meta: z
      .object({
        requiredRole: z.string().optional().openapi({
          description: 'The role required to perform this action.',
          example: 'admin',
        }),
        requiredPermission: z.string().optional().openapi({
          description: 'The specific permission required to perform this action.',
          example: 'item:delete',
        }),
      })
      .catchall(z.unknown())
      .optional()
      .openapi({
        description: 'RBAC context describing what access level is required.',
        example: {
          requiredRole: 'admin',
          requiredPermission: 'item:delete',
        },
      }),
  })
  .openapi('JsonApiForbiddenErrorObject');
