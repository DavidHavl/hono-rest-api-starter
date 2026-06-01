import { z } from '@hono/zod-openapi';
import type { ZodError } from 'zod';
import type { AppError } from '@/common/errors';
import {
  createResourceSchema,
  type IncludedSchema,
  type RelationshipsObjectSchema,
} from '@/common/jsonapi/schemas/factories';
import type {
  JsonApiCollectionLinks,
  JsonApiDocument,
  JsonApiMeta,
  JsonApiPaginationMeta,
  JsonApiResource,
} from '@/common/jsonapi/types';
import { serializeError } from '@/common/serializers/error.serializer';
import { buildResourceLinkUrl } from '@/common/serializers/resource.serializer';
import {
  jsonApiCollectionDocumentLinksSchema,
  jsonApiMetaSchema,
  type jsonApiPaginationMetaSchema,
  jsonApiVersionSchema,
} from '../jsonapi/schemas/schemas';

type NonBodyTarget = 'param' | 'query' | 'header' | 'cookie';

export function createSuccessResponseDocument<T extends JsonApiResource>(
  options: {
    resourceData: T;
    included?: JsonApiResource[];
    documentMeta?: JsonApiMeta;
  },
  baseUrl: string,
): JsonApiDocument<T> {
  return {
    jsonapi: { version: '1.1' } as const,
    data: options.resourceData,
    links: {
      self: buildResourceLinkUrl(baseUrl, options.resourceData.type, options.resourceData.id),
    },
    ...(options.documentMeta && { meta: options.documentMeta }),
    ...(options.included && { included: options.included }),
  };
}

export function createSuccessCollectionResponseDocument<T extends JsonApiResource>(options: {
  resourceData: T[];
  included?: JsonApiResource[];
  documentMeta?: {
    pagination?: JsonApiPaginationMeta;
    // Additional doc-level meta as needed.
    [k: string]: unknown;
  };
  links?: JsonApiCollectionLinks;
  status?: 200 | 201;
}): JsonApiDocument<T> {
  return {
    jsonapi: { version: '1.1' } as const,
    data: options.resourceData,
    ...(options.links && { links: options.links }),
    ...(options.documentMeta && { meta: options.documentMeta }),
    ...(options.included && { included: options.included }),
  };
}

/**
 * Creates a JSON:API format error response object with the given error, base URL, and optional status code.
 * @param error - The error object to serialize.
 * @param baseUrl - The base URL for the error response.
 * @param status - The HTTP status code for the error response (default: 500).
 * @param target - The target format for the error response (default: undefined).
 *
 * @returns A JSON:API error response object.
 */
export function createErrorResponseDocumentFromError(
  error: AppError | ZodError,
  baseUrl: string,
  status?: number,
  target?: NonBodyTarget | 'json' | 'form',
) {
  return {
    jsonapi: { version: '1.1' } as const,
    errors: serializeError(error, baseUrl, status ?? 500, target),
  };
}

// ============================================================================
// Schemas --------------------------------------------------------------------
// ============================================================================

/**
 *
 * @param resourceType type of the resource (i.e., item, user, post)
 *
 * @param schemas
 *
 * @param options
 *
 * @param {z.ZodObject} schemas.attributes - The schema defining the attributes of the resource. Example:
 * ```
 * z.object({
 *   name: z.string(),
 *   description: z.string().optional(),
 *   price: z.number().positive(),
 * })
 * ```
 *
 * @param {z.ZodObject} [schemas.relationships] - The schema defining the relationships of the resource (optional). Example:
 *  ```
 *  z.object({
 *   category: createToOneRelationshipSchema('category'),
 *   subitems: createToManyRelationshipSchema('item'),
 * });
 * ```
 *
 * @param {z.ZodObject} [schemas.documentMeta] - The schema defining metadata for the jsonapi document (not resource) (optional). Example:
 * ```
 * z.object({
 *   totalRecords: z.number(),
 *   lastUpdated: z.date(),
 *   lastSeenAt: z.iso.datetime(),
 * })
 * ```
 *
 * @param {z.ZodObject} schemas.included Optional schema for `included` entries.
 *                         Pass a single resource schema for one type, or a
 *                         `z.discriminatedUnion('type', [...])` for several.
 *
 * @param {object} [options] - Optional configuration options for the response document.
 *
 * @param {boolean} [options.usesSparseFields] - Indicates if sparse fieldsets are used in the response (it changes the attributes to optional).
 */
export function createSuccessResponseDocumentSchema(
  resourceType: string,
  schemas: {
    attributes: z.ZodObject<z.ZodRawShape>;
    relationships?: RelationshipsObjectSchema;
    included?: IncludedSchema;
    documentMeta?: z.ZodObject<z.ZodRawShape>;
  },
  options?: {
    usesSparseFields?: boolean;
    documentSchemaName?: string;
  },
) {
  const shape = {
    jsonapi: jsonApiVersionSchema,
    data: createResourceSchema({
      type: resourceType,
      attributes: schemas.attributes,
      ...(schemas.relationships ? { relationships: schemas.relationships } : {}),
      ...(options?.usesSparseFields ? { usesSparseFields: options?.usesSparseFields } : {}),
    }),
    meta: schemas.documentMeta ?? z.record(z.string(), z.unknown()).optional(), // https://jsonapi.org/format/#document-meta
    ...(schemas.included && { included: schemas.included.optional() }),
  };
  const schema = z.object(shape);
  return options?.documentSchemaName ? schema.openapi(options.documentSchemaName) : schema;
}

/**
 * Build a 200 collection response schema.
 *
 * @param resourceType type of the resource (i.e., item, user, post)
 *
 * @param schemas
 *
 * @param options
 *
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
 *
 * @param schemas.paginationMeta Optional pagination meta schema. Pass one of
 *                              the built-in strategy schemas, the union
 *                              `paginationMetaSchema`, or a custom schema.
 *                              When provided, `response.meta.pagination` is
 *                              constrained to this shape; other meta keys
 *                              remain free-form via catchall.
 *
 * @param options.sparseFields   Apply `.partial()` to `data.attributes` and
 *                              `data.relationships` so the response permits
 *                              field omission via `?fields[type]=...`
 *
 * @param options.documentSchemaName     Optional OpenAPI component name.
 */
export function createSuccessCollectionResponseDocumentSchema(
  resourceType: string,
  schemas: {
    attributes: z.ZodObject<z.ZodRawShape>;
    relationships?: RelationshipsObjectSchema;
    included?: IncludedSchema;
    paginationMeta: typeof jsonApiPaginationMetaSchema;
  },
  options?: {
    documentSchemaName?: string;
    usesSparseFields?: boolean;
  },
) {
  // When paginationMeta is configured, meta.pagination is allowed within meta.
  // Both meta itself and meta.pagination are optional — server can emit meta
  // for non-pagination purposes (debug info, filter echo) without pagination,
  // or skip meta entirely. Additional keys via catchall (JSON:API meta is
  // free-form).
  const meta = schemas.paginationMeta
    ? z.object({ pagination: schemas.paginationMeta.optional() }).catchall(z.unknown()).optional()
    : jsonApiMetaSchema.optional();

  const resourceSchema = createResourceSchema({
    type: resourceType,
    attributes: schemas.attributes,
    ...(schemas.relationships ? { relationships: schemas.relationships } : {}),
    ...(options?.usesSparseFields ? { usesSparseFields: options?.usesSparseFields } : {}),
  });

  const shape = {
    jsonapi: jsonApiVersionSchema,
    data: z.array(resourceSchema),
    ...(schemas.included && { included: schemas.included.optional() }),
    links: jsonApiCollectionDocumentLinksSchema.optional(),
    meta,
  };

  const schema = z.object(shape);
  return options?.documentSchemaName ? schema.openapi(options.documentSchemaName) : schema;
}

/**
 * Creates a JSON:API format error response schema with the given error object schema, name, description, and example.
 * Usable for OpenAPI documentation of potential error responses
 * {
 *   404: {
 *     content: {
 *       'application/vnd.api+json': {
 *         schema: notFoundResponseSchema()
 *       }
 *     }
 *   }
 * }.
 *
 * @param errorObjectSchema - The error object schema to use for documentation.
 * @param name - The reusable name of the error response schema.
 * @param description - The description of the error response schema.
 * @param example - The example of the error response schema.
 * @returns A JSON:API error response schema.
 */
export function createErrorResponseDocumentSchema<T extends z.ZodTypeAny>(
  errorObjectSchema: T,
  name: string,
  description: string,
  example: unknown,
) {
  return z
    .object({
      jsonapi: jsonApiVersionSchema.openapi({
        example: { version: '1.1' },
      }),
      errors: z.array(errorObjectSchema).min(1).openapi({
        description: 'Non-empty array of JSON:API error objects.',
      }),
    })
    .openapi(name, { description, example });
}

/**
 * Creates an object representing the content of a response with the given jsonapi document schema and description.
 * Usable for OpenAPI documentation of responses { 200: successResponseContentSchema(), 404: notFoundResponseContentSchema() }.
 * @param documentSchema - The schema to use for validation.
 * @param description - The OpenAPI description of the response content schema.
 * @returns A response content schema.
 */
export function createResponseContentSchema<T extends z.ZodTypeAny>(documentSchema: T, description: string) {
  return {
    content: {
      'application/vnd.api+json': {
        schema: documentSchema,
      },
    },
    description,
  };
}

// ============================================================================
// Helpers -------------------------------------------------------
// ============================================================================
