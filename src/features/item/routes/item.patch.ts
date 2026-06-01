import { createRoute, z } from '@hono/zod-openapi';
import type { JsonApiResource } from '@/common/jsonapi/types';
import { requestBodyContentSchema } from '@/common/request/body/schemas';
import { idParamSchema } from '@/common/request/param/schemas';
import { parseSparseFieldsets } from '@/common/request/query/parsers/sparse-fieldsets.parser';
import { createSparseFieldsetsQuerySchema } from '@/common/request/query/schemas/sparse-fieldsets.schema';
import {
  forbiddenResponse,
  forbiddenResponseContentSchema,
  notFoundResponse,
  unauthorizedResponse,
  unauthorizedResponseContentSchema,
  validationErrorResponseContentSchema,
} from '@/common/responses';
import { badRequestResponseContentSchema } from '@/common/responses/bad-request.response';
import { notFoundResponseContentSchema } from '@/common/responses/not-found.response';
import { successResponse, successResponseContentSchema } from '@/common/responses/success.response';
import {
  extractPropertyNames,
  type SerializerRelationshipsOptions,
  serializeResource,
} from '@/common/serializers/resource.serializer';
import type { AppRouteHandler } from '@/common/types';
import { getCurrentUser } from '@/features/auth/helpers/current-user';
import { isOwner } from '@/features/auth/helpers/is-owner';

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

// Sparse fields query schema
const querySchema = z.object({
  fields: createSparseFieldsetsQuerySchema({ [resourceType]: Object.keys(attributesSchema.shape) }),
});

// =====================================================================================================================
// Route ---------------------------------------------------------------------------------------------------------------
// =====================================================================================================================

export const route = createRoute({
  method: 'patch',
  path: '/v1/items/{id}',
  summary: 'Update details of an item by its ID',
  tags,
  request: {
    params: idParamSchema,
    query: querySchema,
    body: requestBodyContentSchema(
      z.object({
        namse: z.string().openapi({ description: 'Item name', example: 'New Item' }),
        bla: z.string().optional().openapi({ description: 'Additional item property', example: 'bla' }),
      }),
    ),
  },
  responses: {
    200: successResponseContentSchema(
      resourceType,
      { attributes: attributesSchema },
      { description: 'Updated item details' },
    ),
    401: unauthorizedResponseContentSchema('You need to be authenticated to access this resource'),
    403: forbiddenResponseContentSchema('You are not authorized to access this resource'),
    400: badRequestResponseContentSchema({
      params: idParamSchema,
      query: querySchema,
    }),
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
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const user = await getCurrentUser(c);
  const itemService = c.get('ItemService');

  // Authentication //
  if (!user) {
    return unauthorizedResponse(c, 'You need to be authenticated to access this resource');
  }

  // TODO:
  // Authorization (general) //
  if (!user.hasPermission('read', resourceType)) {
    return forbiddenResponse(c, 'You are not authorized to access this resource type');
  }

  // TODO: Get item from service
  const data = {}; // await itemService.findById(id, fieldsets?.item) // Or item?

  // TODO: give the fields to db as well so we don't have to load all fields!

  // Resource //
  if (!data) {
    return notFoundResponse(c, resourceType, id);
  }

  // Authorization (specific) //
  if (!isOwner(data, user)) {
    return forbiddenResponse(c, 'You are not authorized to modify this resource');
  }

  // Update //
  // const returnDataObject = await ItemService.update(id, body, user);

  // Specify which properties/attributes of the resource should be included by default
  const attributes = extractPropertyNames(data, ['created_at', 'updated_at']); // TODO: ?!

  const relationshipsOptions: SerializerRelationshipsOptions = {
    owner: { type: 'user', foreignKey: 'owner_id' },
    category: { type: 'category' },
  };

  // TODO: do this. Will it come from service (db using "with") or it may also come from secondary service/db call. Accomodate both!
  const included: JsonApiResource[] = [];

  // Serialize the resource
  const serialized = serializeResource({
    type: resourceType,
    data,
    relationships: relationshipsOptions,
    attributes,
    fieldsets,
  });

  // TODO: can the relationships be calculated from included (if given)?
  return successResponse(c, serialized, { included });
};
