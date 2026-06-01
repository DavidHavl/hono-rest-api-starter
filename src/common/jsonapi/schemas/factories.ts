import { z } from '@hono/zod-openapi';
import {
  jsonApiMetaSchema,
  jsonApiRelationshipLinksSchema,
  jsonApiResourceLinksSchema,
} from '@/common/jsonapi/schemas/schemas';

// ============================================================================
// Single ---------------------------------------------------------------------
// ============================================================================

/**
 * Create a resource object schema for a specific type. The output shape:
 *
 *   {
 *     type: <literal>,
 *     id: <uuidv7>,
 *     attributes: z.ZodObject<z.ZodRawShape>,
 *     relationships?: <RelationshipsObjectSchema>,
 *     links: z.ZodObject<{
 *       self: z.ZodOptional<z.ZodString>
 *     }>,
 *     meta: Record<string, unknown>,
 *   }
 *
 * `attributes` and `relationships` are optional on the *response* — server
 * may omit either when sparse fieldsets or include rules apply — but if
 * passed at construction time their shape is enforced.
 *
 * @param options - Configuration object for creating the resource schema.
 * @param options.type - The JSON:API resource type (e.g., 'user', 'post').
 * @param options.attributes - Zod schema defining the resource attributes.
 * @param options.relationships - Optional Zod schema defining relationships to other resources.
 * @param options.metaSchema - Optional Zod schema for the meta object.
 * @param options.schemaName - Optional OpenAPI schema name for documentation.
 * @param options.description - Optional OpenAPI description for the schema.
 * @param options.usesSparseFields - If true, makes all attribute and relationship keys individually optional to support sparse fieldsets.
 *
 * @returns A Zod schema representing a JSON:API resource object with the specified type, attributes, and relationships.
 *
 * @throws {Error} If `attributes` contains JSON:API §7.1.4 reserved keys (`type`, `id`, `lid`, `relationships`, `links`).
 * @throws {Error} If `relationships` contains JSON:API §7.1.4 reserved keys (`type`, `id`, `lid`, `relationships`, `links`).
 *
 * @example
 * const userResourceSchema = createResourceSchema({
 *   type: 'user',
 *   attributes: z.object({
 *     name: z.string(),
 *     email: z.string().email(),
 *   }),
 *   relationships: z.object({
 *     posts: createToManyRelationshipSchema('post'),
 *   }),
 *   schemaName: 'UserResource',
 *   description: 'A user resource with basic profile information',
 * });
 */
export function createResourceSchema(options: {
  type: string;
  attributes: z.ZodObject<z.ZodRawShape>;
  relationships?: RelationshipsObjectSchema;
  metaSchema?: z.ZodObject<z.ZodRawShape>;
  schemaName?: string;
  description?: string;
  usesSparseFields?: boolean;
}) {
  // Guards
  if (options.attributes) assertNoReservedKeys(options.attributes, 'attributes');
  if (options.relationships) assertNoReservedKeys(options.relationships, 'relationships');

  // Shape — when sparse fields are enabled, make every key inside
  // `attributes` and `relationships` individually optional so that
  // `?fields[type]=name,email` may omit any of them.
  const attributesSchema = options.usesSparseFields
    ? options.attributes.partial().optional()
    : options.attributes?.optional();

  const relationshipsSchema = options.usesSparseFields
    ? options.relationships?.partial().optional()
    : options.relationships?.optional();

  const shape = {
    type: z.literal(options.type),
    id: z.uuidv7(),
    ...(options.attributes && { attributes: attributesSchema }),
    ...(options.relationships && { relationships: relationshipsSchema }),
    ...(options.metaSchema && { meta: options.metaSchema.optional() }),
    links: jsonApiResourceLinksSchema.optional(),
  };

  const schema = z.object(shape);
  if (options.schemaName) {
    return options.description
      ? schema.openapi(options.schemaName, { description: options.description })
      : schema.openapi(options.schemaName);
  }
  return options.description ? schema.openapi({ description: options.description }) : schema;
}

// ============================================================================
// Collection -----------------------------------------------------------------
// ============================================================================

// ============================================================================
// Relationships ---------------------------------------------------------------
// ============================================================================
/**
 * To-one relationship. The `data` member distinguishes three states:
 *   - identifier object → relationship populated
 *   - `null`             → relationship explicitly unset (cleared)
 *   - absent             → relationship not loaded into this response
 */
export function createToOneRelationshipSchema<const TType extends string>(
  type: TType,
  options?: { schemaName?: string; description?: string },
) {
  const schema = z.object({
    links: jsonApiRelationshipLinksSchema.optional(),
    meta: jsonApiMetaSchema.optional(),
    data: z.union([createResourceIdentifierSchema(type), z.null()]).optional(),
  });

  if (options?.schemaName) {
    return options.description
      ? schema.openapi(options.schemaName, { description: options.description })
      : schema.openapi(options.schemaName);
  }
  return options?.description ? schema.openapi({ description: options.description }) : schema;
}

/**
 * To-many relationship. `data` is an array (possibly empty) or absent (not
 * loaded). `null` is not valid for to-many — use `[]` for "no related
 * resources".
 */
export function createToManyRelationshipSchema<const TType extends string>(
  type: TType,
  options?: { schemaName?: string; description?: string },
) {
  const schema = z.object({
    links: jsonApiRelationshipLinksSchema.optional(),
    meta: jsonApiMetaSchema.optional(),
    data: z.array(createResourceIdentifierSchema(type)).optional(),
  });

  if (options?.schemaName) {
    return options.description
      ? schema.openapi(options.schemaName, { description: options.description })
      : schema.openapi(options.schemaName);
  }
  return options?.description ? schema.openapi({ description: options.description }) : schema;
}

export type ToOneRelationshipSchema = ReturnType<typeof createToOneRelationshipSchema>;
export type ToManyRelationshipSchema = ReturnType<typeof createToManyRelationshipSchema>;

export type RelationshipSchema = ToOneRelationshipSchema | ToManyRelationshipSchema;

export type RelationshipsObjectSchema = z.ZodObject<Record<string, RelationshipSchema>>;

// ============================================================================
// Included -------------------------------------------------------------------
// ============================================================================

/**
 * Creates a `z.array(z.discriminatedUnion('type', [...schemas]))` schema for multiple resources, or `z.array(schemas)` schema for single resource
 * produced by {@link createResourceSchema}.
 *
 * Each schema in the array must have a `type` literal so that the
 * discriminated union can narrow correctly at both runtime and type-level.
 *
 * @example
 * const includedSchema = createIncludedSchema([
 *   categoryResourceSchema,
 *   userResourceSchema,
 * ]);
 * // → z.discriminatedUnion('type', [categoryResourceSchema, userResourceSchema])
 * @example
 * const includedSchema = createIncludedSchema(userResourceSchema);
 * // → userResourceSchema
 */
export function createIncludedSchema(
  schemas: z.core.$ZodTypeDiscriminable | Readonly<[z.core.$ZodTypeDiscriminable, ...z.core.$ZodTypeDiscriminable[]]>,
) {
  return Array.isArray(schemas)
    ? z.array(
        z.discriminatedUnion(
          'type',
          schemas as Readonly<[z.core.$ZodTypeDiscriminable, ...z.core.$ZodTypeDiscriminable[]]>,
        ),
      )
    : z.array(schemas as z.core.$ZodTypeDiscriminable);
}

/** Schema produced exclusively by {@link createIncludedSchema}. */
export type IncludedSchema = ReturnType<typeof createIncludedSchema>;

// ============================================================================
// Resource identifier --------------------------------------------------------
// ============================================================================

/**
 * Resource identifier schema bound to a specific `type` literal. Used for
 * the `data` member of relationships and as the shape of `included` entries.
 *
 *   { type: 'user', id: '01933e8a-...', meta?: {...} }
 */
export function createResourceIdentifierSchema<const TType extends string>(
  type: TType,
  options?: { schemaName?: string; description?: string },
) {
  const schema = z.object({
    type: z.literal(type),
    id: z.uuidv7(),
    meta: jsonApiMetaSchema.optional(),
  });

  if (options?.schemaName) {
    return options.description
      ? schema.openapi(options.schemaName, { description: options.description })
      : schema.openapi(options.schemaName);
  }
  return options?.description ? schema.openapi({ description: options.description }) : schema;
}

// ============================================================================
// Utils ---------------------------------------------------------
// ============================================================================

/** JSON:API §7.1.4: these keys may not appear inside attributes/relationships. */
function assertNoReservedKeys(schema: z.ZodObject<z.ZodRawShape>, where: 'attributes' | 'relationships'): void {
  const shapeKeys = Object.keys(schema.shape);
  const reserved = shapeKeys.filter((k) => ['type', 'id', 'lid', 'relationships', 'links'].includes(k));
  if (reserved.length > 0) {
    throw new Error(
      `[json-api] Resource object \`${where}\` cannot contain JSON:API §7.1.4 reserved keys: "${reserved.join(', ')}". ` +
        `Rename them to something resource-specific (e.g. \`type\` → \`category\`, \`links\` → \`externalLinks\`).`,
    );
  }
}
