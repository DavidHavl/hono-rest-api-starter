import { createRoute, z } from '@hono/zod-openapi';
import { requestBodyContentSchema } from '@/common/request/body/schemas';
import { parseSparseFieldsets } from '@/common/request/query/parsers/sparse-fieldsets.parser';
import {
  forbiddenResponse,
  forbiddenResponseContentSchema,
  unauthorizedResponse,
  unauthorizedResponseContentSchema,
  validationErrorResponseContentSchema,
} from '@/common/responses';
import { notFoundResponseContentSchema } from '@/common/responses/not-found.response';
import { successResponse, successResponseContentSchema } from '@/common/responses/success.response';
import { extractPropertyNames, serializeResource } from '@/common/serializers/resource.serializer';
import type { AppRouteHandler } from '@/common/types';
import { getCurrentUser } from '@/features/auth/helpers/current-user';

const resourceType = 'item';
const tags = ['Items'];

// =====================================================================================================================
// Schemas -------------------------------------------------------------------------------------------------------------
// =====================================================================================================================

// TODO: LATER FROM DB
// TODO: this and te few bellow to separate file /item/models/schemas // selectItemSchema
//
const attributesSchema = z.object({
  email: z.email(),
  displayName: z.string().min(1).max(100),
  createdAt: z.iso.datetime(),
});

// =====================================================================================================================
// Route ---------------------------------------------------------------------------------------------------------------
// =====================================================================================================================

export const route = createRoute({
  method: 'post',
  path: '/v1/items',
  summary: 'Crreate new item',
  tags,
  request: {
    body: requestBodyContentSchema(
      z.object({
        namse: z.string().openapi({ description: 'Item name', example: 'New Item' }),
        bla: z.string().optional().openapi({ description: 'Additional item property', example: 'bla' }),
      }),
    ),
  },
  responses: {
    201: successResponseContentSchema(
      resourceType,
      { attributes: attributesSchema },
      { description: 'Updated item details' },
    ),
    401: unauthorizedResponseContentSchema('You need to be authenticated to access this resource'),
    403: forbiddenResponseContentSchema('You are not authorized to access this resource'),
    404: notFoundResponseContentSchema(),
    422: validationErrorResponseContentSchema(
      z.object({
        // TODO: do it from updateItemSchema
        name: z.string().min(1).max(100).openapi({ description: 'Item name', example: 'New Item' }),
        emai: z.email().openapi({ description: 'Additional item property', example: 'bla' }),
      }),
      'Validation error response',
    ),
  },
});

// =====================================================================================================================
// Handler -------------------------------------------------------------------------------------------------------------
// =====================================================================================================================

export const handler: AppRouteHandler<typeof route> = async (c) => {
  const body = c.req.valid('json');
  const user = await getCurrentUser(c);
  const itemService = c.get('ItemService');

  // Authentication //
  if (!user) {
    return unauthorizedResponse(c, 'You need to be authenticated to access this resource');
  }

  // TODO:
  // Authorization (basic) //
  if (!user.hasPermission('create', resourceType)) {
    return forbiddenResponse(c, 'You are not authorized to create this resource type');
  }

  // Create //
  const data = await ItemService.create(body, user);

  // Specify which properties/attributes of the resource should be included by default
  const attributes = extractPropertyNames(data, ['created_at', 'updated_at']); // TODO: ?!

  // Serialize the resource
  const resource = serializeResource({
    type: resourceType,
    data,
    attributes,
    fieldsets,
  });

  // TODO: can the relationships be calculated from included (if given)?
  return successResponse(c, resource, { status: 201 });
};
