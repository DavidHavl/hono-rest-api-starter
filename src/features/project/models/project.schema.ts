import { z } from '@hono/zod-openapi';

export const ProjectSchema = z
  .object({
    id: z.string().cuid2().openapi({
      example: '6tghjserdcvidy74lq2',
    }),
    title: z.string().openapi({
      example: 'Shopping List',
    }),
    teamId: z.string().cuid2().openapi({
      example: 'k23wjser46yidy7qngs',
    }),
    ownerId: z.string().cuid2().openapi({
      example: 'kser4623wjyidygs7qn',
    }),
    createdAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
    updatedAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
  })
  .openapi('Project');
