import { z } from '@hono/zod-openapi';

export const TaskSchema = z
  .object({
    id: z.string().cuid2().openapi({
      example: 'gy63blmknjbhvg43e2d',
    }),
    title: z.string().openapi({
      example: 'Buy Milk',
    }),
    description: z.string().optional().openapi({
      example: 'Go to the store nd buy some milk',
    }),
    dueAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
    teamId: z.string().cuid2().openapi({
      example: 'erdcvid6tlqy72ghjs4',
    }),
    projectId: z.string().cuid2().openapi({
      example: '6tghjserdcvidy74lq2',
    }),
    listId: z.string().cuid2().openapi({
      example: 'erdcvidy74lq26tghjs',
    }),
    ownerId: z.string().cuid2().optional().openapi({
      example: 'dfgerdew35647568utjh',
    }),
    assigneeId: z.string().cuid2().optional().openapi({
      example: 'dfgerdew35647568utjh',
    }),
    isCompleted: z.boolean().optional().default(false).openapi({
      example: false,
    }),
    completedAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
    createdAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
    updatedAt: z.coerce.date().openapi({
      example: '2024-04-19T14:37:58.000Z',
    }),
  })
  .openapi('Task');
