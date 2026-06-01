import type {
  JsonApiCollectionLinks,
  JsonApiNumberPaginationMeta,
  JsonApiRelationship,
  JsonApiResource,
} from '@/common/jsonapi/types';
import type { SparseFieldsets } from '@/common/types';
import { env } from '@/env';

export type SerializerRelationshipsOptions = Record<
  string,
  {
    type: string;
    /** Name of the foreign key field on the source record (i.e.: ownerId for user relationship) */
    foreignKey?: string;
  }
>;

/**
 * Serializes a resource object into a JSON:API-compliant resource.
 *
 * @param {Object} options - An object containing options for resource serialization.
 * @param {string} options.type - The type of the resource.
 * @param {{ id: string | number; [key: string]: unknown }} options.data - The raw data representing the resource and any related data.
 *                                                 Property "id" is required.
 * @param {string[]} options.attributes - The list of attributes to include in the resource by default.
 *                                        This is to filter out sensitive or unnecessary data.
 * @param {SerializerRelationshipsOptions} [options.relationships] - Optional configuration for relationships.
 * @param {SparseFieldsets} [options.fieldsets] - Optional sparse fieldsets specifying requested fields for the resource.
 * @return {JsonApiResource} A JSON:API-compliant resource object.
 */
export function serializeResource(options: {
  type: string;
  data: { id: string | number; [key: string]: unknown };
  attributes: string[];
  relationships?: SerializerRelationshipsOptions;
  fieldsets?: SparseFieldsets;
}): JsonApiResource {
  const id = String(options.data.id);
  const allowedFields = options.fieldsets?.[options.type];

  // Build attributes (exclude id and relationship foreign keys)
  const relationshipForeignKeys = new Set(
    Object.values(options.relationships ?? {})
      .map((r) => r.foreignKey)
      .filter(Boolean),
  );

  const attributes: Record<string, unknown> = {};
  for (const attr of options.attributes) {
    if (attr === 'id') continue; // Not allowed as resource attribute
    if (attr === 'typed') continue; // Not allowed as resource attribute
    if (relationshipForeignKeys.has(attr)) continue;
    if (allowedFields && !allowedFields.includes(attr)) continue;
    if (options.data[attr] !== undefined) {
      attributes[attr] = [attr];
    }
  }

  // Build relationships
  const relationships: Record<string, JsonApiRelationship> = {};

  if (options.relationships) {
    for (const [name, rel] of Object.entries(options.relationships)) {
      const relData = options.data[name];

      if (Array.isArray(relData)) {
        // Has-many relationship
        relationships[name] = {
          data: relData.map((item: Record<string, unknown>) => ({
            type: rel.type,
            id: String(item.id),
          })),
        };
      } else if (relData && typeof relData === 'object') {
        // Belongs-to / has-one (eagerly loaded)
        const relRecord = relData as Record<string, unknown>;
        relationships[name] = {
          data: { type: rel.type, id: String(relRecord.id) },
        };
      } else if (rel.foreignKey && options.data[rel.foreignKey]) {
        // Belongs-to via foreign key
        relationships[name] = {
          data: { type: rel.type, id: String(options.data[rel.foreignKey]) },
        };
      }
    }
  }

  const resource: JsonApiResource = { type: options.type, id, attributes };
  if (Object.keys(relationships).length > 0) {
    resource.relationships = relationships;
  }

  // Link
  const baseUrl = `${env.BASE_URL}${env.BASE_PATH}/${env.API_MAJOR_VERSION}`;
  resource.links = { self: `${baseUrl}/${options.type}/${id}` };

  return resource;
}

/**
 * Serializes a data collection into a JSON:API-compliant resource collection.
 *
 * @param {Object} options - An object containing options for resource serialization.
 * @param {string} options.type - The type of the resource.
 * @param {ReadonlyArray<{ id: string | number; [key: string]: unknown }>} options.data - Array where each element is raw data representing a resource and any related data.
 * @param {string[]} options.attributes - The list of attributes to include in the resource by default.
 *                                        This is to filter out sensitive or unnecessary data.
 * @param {SerializerRelationshipsOptions} [options.relationships] - Optional configuration for relationships.
 * @param {SparseFieldsets} [options.fieldsets] - Optional sparse fieldsets specifying requested fields for the resource.
 * @return {JsonApiResource[]} An array of JSON:API-compliant resource objects.
 */
export function serializeMany(options: {
  type: string;
  data: ReadonlyArray<{ id: string | number; [key: string]: unknown }>;
  attributes: string[];
  relationships?: SerializerRelationshipsOptions;
  fieldsets?: SparseFieldsets;
}): JsonApiResource[] {
  return options.data.map((data) => serializeResource({ ...options, data }));
}

// ============================================================================
// Utils-----------------------------------------------------------------------
// ============================================================================

export function buildResourceLinkUrl(baseUrl: string, type: string, id: string) {
  const root = `${baseUrl}${env.BASE_PATH}/${env.API_MAJOR_VERSION}/` + pluralizeType(type);
  return `${root}/${id}`;
}

/**
 * Creates a set of pagination links for a collection based on the pagination metadata and base URL.
 *
 * @param {JsonApiNumberPaginationMeta} paginationMeta - An object containing pagination meta information such as the current page number, page size, and the total number of pages.
 * @param {string} url - The base URL to which pagination query parameters will be appended.
 * @return {JsonApiCollectionLinks} An object containing the self, first, last, prev, and next links for the paginated collection. Each link is a URL string or null if not applicable.
 */
export function buildCollectionLinks(paginationMeta: JsonApiNumberPaginationMeta, url: string): JsonApiCollectionLinks {
  const { number, size, totalPages } = paginationMeta;

  const buildUrl = (page: number) => {
    const u = new URL(url);
    u.searchParams.set('page[number]', String(page));
    u.searchParams.set('page[size]', String(size));
    return u.toString();
  };

  return {
    self: buildUrl(number),
    first: buildUrl(1),
    last: buildUrl(totalPages),
    prev: number > 1 ? buildUrl(number - 1) : null,
    next: number < totalPages ? buildUrl(number + 1) : null,
  };
}

/**
 * Extracts the property names from the given data object, excluding the specified keys.
 *
 * @param {Record<string, unknown>} data - The source object containing key-value pairs.
 * @param {string[]} excluded - An array of keys to be excluded from the extraction.
 * @return {string[]} An array of keys from the data object that are not present in the excluded array.
 */
export function extractPropertyNames(data: Record<string, unknown>, excluded: string[]) {
  return excluded ? Object.keys(data).filter((key) => !excluded.includes(key)) : Object.keys(data);
}

function pluralizeType(type: string): string {
  return `${type}s`;
}
