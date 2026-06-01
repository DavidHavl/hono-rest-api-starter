import { createRoute, z } from '@hono/zod-openapi';
import {
  createIncludedSchema,
  createResourceSchema,
  createToOneRelationshipSchema,
} from '@/common/jsonapi/schemas/factories';
import { jsonApiPaginationMetaSchema } from '@/common/jsonapi/schemas/schemas';
import type { JsonApiResource } from '@/common/jsonapi/types';
import { idParamSchema } from '@/common/request/param/schemas';
import { parseFilter } from '@/common/request/query/parsers/filter.parser';
import { parsePagination } from '@/common/request/query/parsers/pagination.parser';
import { parseSort } from '@/common/request/query/parsers/sort.parser';
import { parseSparseFieldsets } from '@/common/request/query/parsers/sparse-fieldsets.parser';
import { createFilterQuerySchema, type FilterAllowlistMap } from '@/common/request/query/schemas/filter.schema';
import { paginationQuerySchema } from '@/common/request/query/schemas/pagination.schema';
import { createSortQuerySchema } from '@/common/request/query/schemas/sort.schema';
import { createSparseFieldsetsQuerySchema } from '@/common/request/query/schemas/sparse-fieldsets.schema';
import { forbiddenResponse, unauthorizedResponse } from '@/common/responses';
import { badRequestResponseContentSchema } from '@/common/responses/bad-request.response';
import { notFoundResponseContentSchema } from '@/common/responses/not-found.response';
import { successCollectionResponse, successCollectionResponseContentSchema } from '@/common/responses/success.response';
import {
  buildCollectionLinks,
  extractPropertyNames,
  type SerializerRelationshipsOptions,
  serializeMany,
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
  name: z.string().min(1).max(100),
  email: z.email(),
  displayName: z.string().min(1).max(100),
  createdAt: z.iso.datetime(),
});

const relationshipsSchema = z.object({
  category: createToOneRelationshipSchema('category'),
  owner: createToOneRelationshipSchema('user'),
  // subitems: createToManyRelationshipSchema('item'),
});

const metaSchema = z.object({
  version: z.number().positive(),
  lastSeenAt: z.iso.datetime(),
});

export const userResourceSchema = createResourceSchema({
  type: 'user',
  attributes: z.object({
    name: z.string().min(1).max(100),
    email: z.email(),
    displayName: z.string().min(1).max(100),
  }),
  schemaName: 'UserResource',
});

export const categoryResourceSchema = createResourceSchema({
  type: 'category',
  attributes: z.object({
    name: z.string().min(1).max(100),
  }),
  schemaName: 'CategoryResource',
});

const includedSchema = createIncludedSchema([userResourceSchema, categoryResourceSchema]);
// const singleIncludedSchema = createIncludedSchema(categoryResourceSchema);

const itemFilterMap = {
  status: { type: 'string', operators: ['eq', 'in'] },
  viewCount: { type: 'number', operators: ['eq', 'gt', 'gte', 'lt', 'lte'] },
  publishedAt: { type: 'datetime', operators: ['gte', 'lte', 'isnull'] },
  title: { type: 'string', operators: ['eq', 'like', 'ilike'] },
} as const satisfies FilterAllowlistMap;

// Query schema
const querySchema = z
  .object({})
  .merge(paginationQuerySchema) // Pagination
  // Sorting
  .merge(createSortQuerySchema(['categoryId', 'createdAt']))
  // Filtering
  .merge(createFilterQuerySchema(itemFilterMap))
  // Sparse Fields
  .merge(
    createSparseFieldsetsQuerySchema({
      [resourceType]: Object.keys(attributesSchema.shape),
      owner: ['name', 'id'],
    }),
  );

// =====================================================================================================================
// Route ---------------------------------------------------------------------------------------------------------------
// =====================================================================================================================

export const route = createRoute({
  method: 'get',
  path: '/v1/items',
  summary: 'Retrieve collection of items',
  tags,
  request: {
    query: querySchema,
  },
  responses: {
    200: successCollectionResponseContentSchema(
      resourceType,
      {
        attributes: attributesSchema,
        relationships: relationshipsSchema,
        included: includedSchema,
        paginationMeta: jsonApiPaginationMetaSchema,
      },
      { usesSparseFields: true, description: 'Item details including all relationships' },
    ),
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
  const query = c.req.valid('query');
  // console.log(c.req.valid('query'));
  const pagination = parsePagination(query);
  const sort = parseSort(query);
  const fieldsets = parseSparseFieldsets(query);
  const filter = parseFilter(query, itemFilterMap);
  const itemService = c.get('ItemService');
  const user = await getCurrentUser(c);

  // Authentication //
  if (!user) {
    return unauthorizedResponse(c, 'You need to be authenticated to access this resource collection');
  }

  // TODO:
  // Authorization (general) //
  if (!hasPermission(user, resourceType, 'read')) {
    return forbiddenResponse(c, 'You are not authorized to access this resource type');
  }

  const relationshipsOptions: SerializerRelationshipsOptions = {
    category: { type: 'category' },
  };

  // JsonApiPaginationMeta
  const [data, paginationMeta] = await itemService.findManyPaginated(filter, { pagination });
  // const { limit, offset } = paginationToOffset(pagination);

  // Specify which properties/attributes of the resource should be included by default
  const attributes = extractPropertyNames(data[0] ?? {}, ['created_at', 'updated_at']);

  const serialized = serializeMany({
    type: resourceType,
    data,
    attributes,
    relationships: relationshipsOptions,
    fieldsets,
  });

  // TODO: do this. Will it come from service (db using "with") or it may also come from secondary service/db call. Accomodate both!
  const included: JsonApiResource[] = [];

  return successCollectionResponse(c, serialized, {
    included,
    documentMeta: {
      pagination: paginationMeta,
    },
    links: buildCollectionLinks(paginationMeta, c.req.url),
  });
};
