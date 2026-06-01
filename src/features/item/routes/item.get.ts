import { createRoute, z } from '@hono/zod-openapi';
import { Temporal } from '@js-temporal/polyfill';
import {
  createIncludedSchema,
  createResourceSchema,
  createToOneRelationshipSchema,
} from '@/common/jsonapi/schemas/factories';
import type { JsonApiResource } from '@/common/jsonapi/types';
import { idParamSchema } from '@/common/request/param/schemas';
import { parseSparseFieldsets } from '@/common/request/query/parsers/sparse-fieldsets.parser';
import { createSparseFieldsetsQuerySchema } from '@/common/request/query/schemas/sparse-fieldsets.schema';
import {
  forbiddenResponse,
  forbiddenResponseContentSchema,
  notFoundResponse,
  unauthorizedResponse,
  unauthorizedResponseContentSchema,
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
import { hasPermission } from '@/features/auth/helpers/has-permission';

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

const relationshipsSchema = z.object({
  category: createToOneRelationshipSchema('category'),
  // subitems: createToManyRelationshipSchema('item'),
});

const metaSchema = z.object({
  // version: z.number().positive(),
  // lastSeenAt: z.iso.datetime(),
});

export const categoryResourceSchema = createResourceSchema({
  type: 'category',
  attributes: z.object({
    name: z.string().min(1).max(100),
  }),
  schemaName: 'CategoryResource',
});

const includedSchema = createIncludedSchema([categoryResourceSchema]);
// const singleIncludedSchema = createIncludedSchema(categoryResourceSchema);

// Sparse fields query schema
const querySchema = z.object({
  fields: createSparseFieldsetsQuerySchema({ [resourceType]: Object.keys(attributesSchema.shape) }),
});

// =====================================================================================================================
// Route ---------------------------------------------------------------------------------------------------------------
// =====================================================================================================================

export const route = createRoute({
  method: 'get',
  path: '/v1/items/{id}',
  summary: 'Retrieve an item by its ID',
  tags,
  request: {
    params: idParamSchema,
    query: querySchema,
  },
  responses: {
    200: successResponseContentSchema(
      resourceType,
      {
        attributes: attributesSchema,
        relationships: relationshipsSchema,
        included: includedSchema,
        documentMeta: metaSchema,
      },
      { usesSparseFields: true, description: 'Item details including all relationships' },
    ),
    401: unauthorizedResponseContentSchema('You need to be authenticated to access this resource'),
    403: forbiddenResponseContentSchema('You are not authorized to access this resource'),
    400: badRequestResponseContentSchema({
      params: idParamSchema,
      query: querySchema,
    }),
    404: notFoundResponseContentSchema(),
  },
});

// =====================================================================================================================
// Handler -------------------------------------------------------------------------------------------------------------
// =====================================================================================================================

export const handler: AppRouteHandler<typeof route> = async (c) => {
  const { id } = c.req.valid('param');
  const query = c.req.valid('query');
  const fieldsets = parseSparseFieldsets(query);
  const user = await getCurrentUser(c);
  // const itemService = c.get('ItemService');

  // Authentication //
  if (!user) {
    return unauthorizedResponse(c, 'You need to be authenticated to access this resource');
  }

  // TODO:
  // Authorization (general) //
  if (!hasPermission(user, resourceType, 'read')) {
    return forbiddenResponse(c, 'You are not authorized to access this resource type');
  }

  // TODO: Get item from service
  // TODO: give the fields to db as well so we don't have to load all fields!
  const data = {
    id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
    email: 'bla@bla.com',
    displayName: 'Hello',
    createdAt: Temporal.Instant, // '2023-01-01T00:00:00Z',
  }; // await itemService.findById(id, fieldsets.item)

  // Resource //
  if (!data) {
    return notFoundResponse(c, resourceType, id);
  }

  // Specify which properties/attributes of the resource should be included by default
  const attributes = extractPropertyNames(data, ['created_at', 'updated_at']);

  const relationshipsOptions: SerializerRelationshipsOptions = {
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
