import { z } from '@hono/zod-openapi';
import type { Temporal } from '@js-temporal/polyfill';
import type { Context } from 'hono';
import type { IncludedSchema, RelationshipsObjectSchema } from '@/common/jsonapi/schemas/factories';
import type {
  JsonApiCollectionLinks,
  JsonApiMeta,
  JsonApiPaginationMeta,
  JsonApiResource,
} from '@/common/jsonapi/types';
import {
  createResponseContentSchema,
  createSuccessCollectionResponseDocument,
  createSuccessCollectionResponseDocumentSchema,
  createSuccessResponseDocument,
  createSuccessResponseDocumentSchema,
} from '@/common/responses/factories';
import type { jsonApiPaginationMetaSchema } from '../jsonapi/schemas/schemas';

// ============================================================================
// 200 Success ----------------------------------------------------------------
// ============================================================================

/**
 * Constructs and sends a success response adhering to the JSON:API specification.
 *
 * @param {Context} c - The context object representing the current request and response lifecycle.
 * @param {Object} options - Configuration options for the success response.
 * @param {T extends JsonApiResource} resourceData - The primary resource data object to include in the response.
 * @param {JsonApiResource[]} [options.included] - An optional array of related resource objects to include in the response.
 * @param {JsonApiMeta} [options.documentMeta] - An optional metadata object to include in the response document.
 * @param {200 | 201} [options.status=200] - The HTTP status code for the response; defaults to 200 if not provided.
 * @return {void} Sends the constructed success response to the client.
 */
export function successResponse<T extends JsonApiResource>(
  c: Context,
  resourceData: T,
  options?: {
    included?: JsonApiResource[];
    documentMeta?: JsonApiMeta;
    status?: 200 | 201;
  },
) {
  const url = new URL(c.req.url);
  return c.json(createSuccessResponseDocument({ ...options, resourceData }, url.origin), options?.status ?? 200, {
    'Content-Type': 'application/vnd.api+json',
  });
}

/**
 * Generates a successful JSON:API collection response document and sends it with the specified HTTP status code.
 *
 * @param {Context} c - The context object, used to send the response.
 * @param {[T]} resourceData - The array of resource objects to include in the `data` section of the JSON:API document.
 * @param {Object} options - Additional options for customizing the response document.
 * @param {JsonApiResource[]} [options.included] - An array of related resources to include in the `included` section of the response.
 * @param {Object} [options.documentMeta] - An object containing top-level metadata for the response document.
 * @param {JsonApiPaginationMeta} [options.documentMeta.pagination] - Pagination metadata to include in the `meta` section of the document.
 * @param {Object} [options.documentMeta] - Additional top-level `meta` properties, with custom key-value pairs.
 * @param {JsonApiCollectionLinks} [options.links] - Links to include in the `links` section of the response document.
 * @return {void} This method does not return a value and sends the response directly.
 */
export function successCollectionResponse<T extends JsonApiResource>(
  c: Context,
  resourceData: T[],
  options: {
    included?: JsonApiResource[];
    documentMeta?: {
      pagination?: JsonApiPaginationMeta;
      // Additional doc-level meta as needed.
      [k: string]: unknown;
    };
    links?: JsonApiCollectionLinks;
  },
) {
  return c.json(createSuccessCollectionResponseDocument({ ...options, resourceData }), 200, {
    'Content-Type': 'application/vnd.api+json',
  });
}

export function deletionResponse(c: Context) {
  return c.body(null, 204);
}

export function softDeletionResponse(
  c: Context,
  meta: {
    deletedAt?: Temporal.Instant;
    deletedBy?: string;
  },
) {
  return c.json(
    {
      jsonapi: { version: '1.1' },
      meta,
    },
    200,
    {
      'Content-Type': 'application/vnd.api+json',
    },
  );
}

// relationshipDeletion
// DELETE /v1/articles/01933e8a-.../relationships/comments
// Content-Type: application/vnd.api+json
//
// {
//   "data": [
//     { "type": "comment", "id": "01933e2c-1f4a-7e10-a3b2-0d9f8e6b4c11" },
//     { "type": "comment", "id": "01933e2c-1f4a-7e10-a3b2-0d9f8e6b4c12" }
//   ]
// }

// ============================================================================
// Schemas --------------------------------------------------------------------
// ============================================================================

/**
 * Generates a schema for a successful response content, including the main resource, relationships,
 * document metadata, and included resources if provided.
 *
 * @param {string} resourceType - The type of the resource being represented in the schema.
 * @param {Object} schemas - An object containing the schemas for the resource, relationships, document metadata, and included resources.
 * @param {z.ZodObject} schemas.attributes - The schema defining the attributes of the resource. Example:
 * ```
 * z.object({
 *   name: z.string(),
 *   description: z.string().optional(),
 *   price: z.number().positive(),
 * })
 * ```
 * @param {z.ZodObject} [schemas.relationships] - The schema defining the relationships of the resource (optional). Example:
 *  ```
 *  z.object({
 *   category: createToOneRelationshipSchema('category'),
 *   subitems: createToManyRelationshipSchema('item'),
 * });
 * ```
 * @param {z.ZodObject} [schemas.documentMeta] - The schema defining metadata for the jsonapi document (not resource) (optional). Example:
 * ```
 * z.object({
 *   totalItems: z.number(),
 *   lastUpdated: z.date(),
 *   lastSeenAt: z.iso.datetime(),
 * })
 * ```
 * @param {z.ZodObject} [schemas.included] - The schema defining any included resources (optional).
 *                                           Pass a single resource schema for one type, or a `z.discriminatedUnion('type', [...])` for several.
 *                                           Omit if the endpoint doesn't support `?include=`.
 * @param {Object}  [options]
 * @param {string} [options.description] - An optional OpenAPI description for the response content schema.
 * @param {string} [options.documentSchemaName] - An optional name for the document for OpenAPI schema.
 * @param {boolean} [options.usesSparseFields] - Whether the response uses sparse fields, which can affect schema generation.
 * @return {any} The constructed schema for the successful response content.
 */
export function successResponseContentSchema(
  resourceType: string,
  schemas: {
    attributes: z.ZodObject<z.ZodRawShape>;
    relationships?: RelationshipsObjectSchema;
    included?: IncludedSchema;
    documentMeta?: z.ZodObject<z.ZodRawShape>;
  },
  options?: {
    description?: string;
    documentSchemaName?: string;
    usesSparseFields?: boolean;
  },
) {
  return createResponseContentSchema(
    createSuccessResponseDocumentSchema(resourceType, schemas, options),
    options?.description ?? `${resourceType} response content`,
  );
}

/**
 * Generates a schema for a successful collection response content in a JSON:API-compliant API.
 *
 * @param {string} resourceType - The type of resource for which this response is being generated.
 * @param {Object} schemas - The schema definitions required to construct the response.
 * @param {z.ZodObject} schemas.attributes - The schema defining the attributes of the resource. Example:
 * ```
 * z.object({
 *   name: z.string(),
 *   description: z.string().optional(),
 *   price: z.number().positive(),
 * })
 * ```
 * @param {z.ZodObject} [schemas.relationships] - The schema defining the relationships of the resource (optional). Example:
 *  ```
 *  z.object({
 *   category: createToOneRelationshipSchema('category'),
 *   subitems: createToManyRelationshipSchema('item'),
 * });
 * ```
 * @param {z.ZodObject} [schemas.documentMeta] - The schema defining metadata for the jsonapi document (not resource) (optional). Example:
 * ```
 * z.object({
 *   totalItems: z.number(),
 *   lastUpdated: z.date(),
 *   lastSeenAt: z.iso.datetime(),
 * })
 * ```
 * @param {z.ZodObject} [schemas.included] - The schema defining any included resources (optional).
 *                                           Pass a single resource schema for one type, or a `z.discriminatedUnion('type', [...])` for several.
 *                                           Omit if the endpoint doesn't support `?include=`.
 * @param {typeof jsonApiPaginationMetaSchema} schemas.paginationMeta - The schema for pagination metadata.
 * @param {Object} [options] - Optional configuration for the response schema.
 * @param {string} [options.description] - A custom description for the response content schema.
 * @param {string} [options.documentSchemaName] - The name of the document schema for OpenAPI schema.
 * @param {boolean} [options.usesSparseFields] - Indicates if sparse fieldsets are supported in the response schema.
 * @return {object} The response content schema for a successful collection response.
 */
export function successCollectionResponseContentSchema(
  resourceType: string,
  schemas: {
    attributes: z.ZodObject<z.ZodRawShape>;
    relationships?: RelationshipsObjectSchema;
    included?: IncludedSchema;
    paginationMeta: typeof jsonApiPaginationMetaSchema;
  },
  options?: {
    description?: string;
    documentSchemaName?: string;
    usesSparseFields?: boolean;
  },
) {
  return createResponseContentSchema(
    createSuccessCollectionResponseDocumentSchema(resourceType, schemas, options),
    options?.description ?? `${resourceType} response content`,
  );
}

/**
 * Generates a schema for a successful deletion response (HTTP 204 No Content).
 *
 * Per the JSON:API specification, a server MUST return a 204 No Content status
 * code with no response document when a deletion request is successful.
 *
 * @param {string} [description] - An optional OpenAPI description for the response.
 * @return {object} The response content schema for a successful deletion (no body).
 */
export function deletionResponseContentSchema(description = 'The resource was successfully deleted.') {
  return { description };
}

/**
 * Generates a schema for a successful soft deletion response (HTTP 200 OK).
 *
 * Per the JSON:API specification, a server MUST return a 200 OK status code
 * with a response document when a soft deletion request is successful.
 *
 * @param {string} [description] - An optional OpenAPI description for the response.
 * @return {object} The response content schema for a successful soft deletion.
 */
export function softDeletionResponseContentSchema(description = 'The resource was successfully soft deleted.') {
  const softDeletionDocumentSchema = z.object({
    jsonapi: z.object({
      version: z.literal('1.1'),
    }),
    meta: z.object({
      deletedAt: z.string().datetime().optional().openapi({
        description: 'The timestamp when the resource was soft deleted',
        example: '2026-05-21T10:30:00Z',
      }),
      deletedBy: z.string().optional().openapi({
        description: 'The identifier of the user who performed the soft deletion',
      }),
    }),
  });

  return createResponseContentSchema(softDeletionDocumentSchema, description);
}
