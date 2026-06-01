import { createRoute } from '@hono/zod-openapi';
import { idParamSchema } from '@/common/request/param/schemas';
import {
  forbiddenResponse,
  forbiddenResponseContentSchema,
  internalServerErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  unauthorizedResponseContentSchema,
} from '@/common/responses';
import { badRequestResponseContentSchema } from '@/common/responses/bad-request.response';
import { notFoundResponseContentSchema } from '@/common/responses/not-found.response';
import { deletionResponse, deletionResponseContentSchema } from '@/common/responses/success.response';
import type { AppRouteHandler } from '@/common/types';
import { getCurrentUser } from '@/features/auth/helpers/current-user';
import { hasPermission } from '@/features/auth/helpers/has-permission';
import { isAdmin } from '@/features/auth/helpers/is-admin';
import { isOwner } from '@/features/auth/helpers/is-owner';

const resourceType = 'item';
const tags = ['Items'];

// =====================================================================================================================
// Route ---------------------------------------------------------------------------------------------------------------
// =====================================================================================================================

export const route = createRoute({
  method: 'delete',
  path: '/v1/items/{id}',
  summary: 'Delete an item by its ID',
  tags,
  request: {
    params: idParamSchema,
  },
  responses: {
    200: deletionResponseContentSchema('The item has been deleted'),
    401: unauthorizedResponseContentSchema('You need to be authenticated to access this resource'),
    403: forbiddenResponseContentSchema('You are not authorized to access this resource'),
    400: badRequestResponseContentSchema({
      params: idParamSchema,
    }),
    404: notFoundResponseContentSchema(),
  },
});

// =====================================================================================================================
// Handler -------------------------------------------------------------------------------------------------------------
// =====================================================================================================================

export const handler: AppRouteHandler<typeof route> = async (c) => {
  const { id } = c.req.valid('param');
  const user = await getCurrentUser(c);
  const itemService = c.get('ItemService');

  // Authentication //
  if (!user) {
    return unauthorizedResponse(c, 'You need to be authenticated to access this resource');
  }

  // TODO:
  // Authorization (general) //
  if (!hasPermission(user, resourceType, 'delete')) {
    return forbiddenResponse(c, 'You are not authorized to access this resource type');
  }

  const item = await itemService.findById(id, ['id']);

  // Resource //
  if (!item) {
    return notFoundResponse(c, resourceType, id);
  }

  // Authorization (specific) //
  if (!isAdmin(user) && !isOwner(user, item)) {
    return forbiddenResponse(c, 'You are not authorized to perform this action');
  }

  // TODO: transaction!?
  const tx = new Transaction();
  try {
    await itemService.delete(item, tx);
  } catch (error) {
    tx.rollback();
    return internalServerErrorResponse(c, 'Failed to delete item');
  }

  return deletionResponse(c);
};
