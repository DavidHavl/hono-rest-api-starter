import { z } from '@hono/zod-openapi';
import type { ZodRawShape } from 'zod';

type EmptyZodShape = { [key: string]: never };

export const createSuccessResponseSchema = <
  T extends ZodRawShape,
  R extends ZodRawShape = EmptyZodShape,
  M extends ZodRawShape = EmptyZodShape,
  I extends ZodRawShape = EmptyZodShape,
>(
  entityType: string,
  entitySchema: z.ZodObject<T>,
  relationshipsSchema?: z.ZodObject<R>,
  metaSchema?: z.ZodObject<M>,
  includedSchema?: z.ZodObject<I>,
) =>
  z.object({
    data: z.object({
      id: z.string().openapi({
        example: '123456789',
      }),
      type: z.string().openapi({
        example: entityType,
      }),
      attributes: entitySchema,
      relationships: relationshipsSchema ? relationshipsSchema : z.object({}).optional(),
      links: z
        .object({
          self: z
            .string()
            .url()
            .optional()
            .openapi({
              example: `https://api.website.com/${entityType}/123456789`,
            }),
        })
        .optional(),
    }),
    meta: metaSchema ? metaSchema : z.object({}).optional(), // https://jsonapi.org/format/#document-meta
    included: includedSchema ? includedSchema : z.object({}).optional(),
  });

export const createCollectionSuccessResponseSchema = <
  T extends ZodRawShape,
  R extends ZodRawShape = EmptyZodShape,
  M extends ZodRawShape = EmptyZodShape,
  I extends ZodRawShape = EmptyZodShape,
>(
  entityType: string,
  entitySchema: z.ZodObject<T>,
  relationshipsSchema?: z.ZodObject<R>,
  metaSchema?: z.ZodObject<M>,
  includedSchema?: z.ZodObject<I>,
) =>
  z.object({
    data: z.array(
      z
        .object({
          id: z.string().openapi({
            example: '123456789',
          }),
          type: z.string().openapi({
            example: entityType,
          }),
          attributes: entitySchema,
          relationships: relationshipsSchema ? relationshipsSchema : z.object({}).optional(),
          links: z
            .object({
              self: z
                .string()
                .url()
                .optional()
                .openapi({
                  example: `https://api.website.com/${entityType}/123456789`,
                }),
            })
            .optional(),
        })
        .openapi({}),
    ),
    links: z
      .object({
        self: z
          .string()
          .url()
          .openapi({
            example: `https://api.website.com/${entityType}?fields=id,title&sort=-createdAt&filter[isCompleted]=true&page[limit]=10&page[number]=2`,
          }),
        first: z
          .string()
          .url()
          .openapi({
            example: `https://api.website.com/${entityType}?fields=id,title&sort=-createdAt&filter[isCompleted]=true&page[limit]=10&page[number]=1`,
          }),
        last: z
          .string()
          .url()
          .openapi({
            example: `https://api.website.com/${entityType}?fields=id,title&sort=-createdAt&filter[isCompleted]=true&page[limit]=10&page[number]=12`,
          }),
        prev: z
          .string()
          .url()
          .openapi({
            example: `https://api.website.com/${entityType}?fields=id,title&sort=-createdAt&filter[isCompleted]=true&page[limit]=10&page[number]=1`,
          }),
        next: z
          .string()
          .url()
          .openapi({
            example: `https://api.website.com/${entityType}?fields=id,title&sort=-createdAt&filter[isCompleted]=true&page[limit]=10&page[number]=3`, // page[cursor]=sdfa
          }),
      })
      .optional()
      .openapi({}),
    meta: metaSchema ? metaSchema : z.object({}).optional(), // https://jsonapi.org/format/#document-meta
    included: includedSchema ? includedSchema : z.object({}).optional(),
  });

export const createDeletionSuccessResponseSchema = <M extends ZodRawShape = EmptyZodShape>(
  entityType: string,
  metaSchema?: z.ZodObject<M>,
) =>
  z.object({
    data: z.object({
      id: z.string().openapi({
        example: '123456789',
      }),
      type: z.string().openapi({
        example: entityType,
      }),
      attributes: z.object({
        id: z.string().openapi({ example: '123456789' }),
      }),
      links: z
        .object({
          self: z
            .string()
            .url()
            .optional()
            .openapi({
              example: `https://api.website.com/${entityType}/123456789`,
            }),
        })
        .optional(),
    }),
    meta: metaSchema ? metaSchema : z.object({}).optional(), // https://jsonapi.org/format/#document-meta
  });
