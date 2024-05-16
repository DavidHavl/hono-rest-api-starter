import { z } from '@hono/zod-openapi';

export const TaskListSchema = z
  .object({
    id: z.string().cuid2().openapi({
      example: 'gy63blmknjbhvg43e2d',
    }),
    title: z.string().openapi({
      example: 'Shopping List',
    }),
    teamId: z.string().cuid2().openapi({
      example: 'erdcvid6tlqy72ghjs4',
    }),
    projectId: z.string().cuid2().openapi({
      example: '6tghjserdcvidy74lq2',
    }),
    ownerId: z.string().cuid2().optional().openapi({
      example: 'dfgerdew35647568utjh',
    }),
    createdAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
    updatedAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
  })
  .openapi('Task List');
