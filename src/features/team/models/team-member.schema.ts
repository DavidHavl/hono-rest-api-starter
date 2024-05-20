import { z } from '@hono/zod-openapi';

export const TeamMemberSchema = z
  .object({
    id: z.string().cuid2().openapi({
      example: '8aah7h4rdcvkk874l44',
    }),
    teamId: z.string().cuid2().openapi({
      example: 'h4rdcg2vkk874l8aah7',
    }),
    userId: z.string().cuid2().openapi({
      example: 'vkk874l8aah7h4rdcg2',
    }),
    hasUserAccepted: z.boolean().default(false).optional().openapi({
      example: false,
    }),
    hasResourceAccepted: z.boolean().default(false).optional().openapi({
      example: false,
    }),
    createdAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
    updatedAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
  })
  .openapi('Team');
