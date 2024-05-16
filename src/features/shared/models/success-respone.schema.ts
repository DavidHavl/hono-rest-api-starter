import { z } from '@hono/zod-openapi';

export const SuccessResponseSchema = z.object({
  data: z
    .object({
      id: z.string().openapi({
        example: '123456789',
      }),
      type: z.string().openapi({
        example: 'tasks',
      }),
      attributes: z.object({}).openapi({
        // https://jsonapi.org/format/#document-resource-object-attributes
        example: {
          id: '123456789',
          title: 'Buy Milk',
          description: 'Go to the store and buy some milk',
          dueAt: 1711978082,
          projectId: '123456789',
          assigneeId: '123456789',
          createdAt: 1711978082,
          updatedAt: 1711978082,
          completed: false,
        },
      }),
      relationships: z
        .object({})
        .optional()
        .openapi({
          // https://jsonapi.org/format/#document-resource-object-relationships
          example: {
            user: { data: { id: '123456789', type: 'user', attributes: { title: 'John Smith' } } },
            comments: [{ data: { id: '123456789', type: 'comment', attributes: { title: 'Great job!' } } }],
          },
        }),
      links: z
        .object({
          self: z.string().url().optional().openapi({
            example: 'https://api.website.com/tasks/123456789',
          }),
        })
        .optional(),
    })
    .openapi({}),
  meta: z.object({}).optional().openapi({}), // https://jsonapi.org/format/#document-meta
  included: z.object({}).optional().openapi({}),
});

export const CollectionSuccessResponseSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.string().openapi({
          example: '123456789',
        }),
        type: z.string().openapi({
          example: 'tasks',
        }),
        attributes: z.object({}).openapi({}),
        relationships: z
          .object({})
          .optional()
          .openapi({
            example: {
              user: { data: { id: '123456789', type: 'user', attributes: { title: 'John Smith' } } },
              comments: [{ data: { id: '123456789', type: 'comment', attributes: { title: 'Great job!' } } }],
            },
          }),
        links: z
          .object({
            self: z.string().url().optional().openapi({
              example: 'https://api.website.com/tasks/123456789',
            }),
          })
          .optional(),
      })
      .openapi({}),
  ),
  links: z
    .object({
      self: z.string().url().openapi({
        example:
          'https://api.website.com/tasks?fields=id,title&sort=-createdAt&filter[completed]=true&page[limit]=10&page[number]=2',
      }),
      first: z.string().url().openapi({
        example:
          'https://api.website.com/tasks?fields=id,title&sort=-createdAt&filter[completed]=true&page[limit]=10&page[number]=1',
      }),
      last: z.string().url().openapi({
        example:
          'https://api.website.com/tasks?fields=id,title&sort=-createdAt&filter[completed]=true&page[limit]=10&page[number]=12',
      }),
      prev: z.string().url().openapi({
        example:
          'https://api.website.com/tasks?fields=id,title&sort=-createdAt&filter[completed]=true&page[limit]=10&page[number]=1',
      }),
      next: z.string().url().openapi({
        example:
          'https://api.website.com/tasks?fields=id,title&sort=-createdAt&filter[completed]=true&page[limit]=10&page[number]=3', // page[cursor]=sdfa
      }),
    })
    .optional()
    .openapi({}),
  meta: z.object({}).optional().openapi({}),
  included: z.object({}).optional().openapi({}),
});
