import { z } from '@hono/zod-openapi';

export const TeamSchema = z
  .object({
    id: z.string().cuid2().openapi({
      example: '8aah7h4rdcvkk874l44',
    }),
    title: z.string().openapi({
      example: 'My Team',
    }),
    ownerId: z.string().cuid2().openapi({
      example: 'vkk874l8aah7h4rdcg2',
    }),
    createdAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
    updatedAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
  })
  .openapi('Team');
