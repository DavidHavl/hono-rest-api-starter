import { TasksTable } from '@/features/task/models/tasks.table';
import { z } from '@hono/zod-openapi';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const SelectTaskSchema = createSelectSchema(TasksTable);

export const CreateTaskSchema = createInsertSchema(TasksTable, {
  title: z.string().min(1).trim(),
  position: z.number().int().min(0).default(0),
  dueAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
}).omit({
  id: true,
  ownerId: true,
  teamId: true,
  projectId: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskSchema = z
  .object(SelectTaskSchema.shape)
  .openapi({
    example: {
      id: 'gy63blmknjbhvg43e2d',
      title: 'Buy Milk',
      description: 'Go to the store nd buy some milk',
      dueAt: '2024-04-19T14:37:58.000Z',
      teamId: 'erdcvid6tlqy72ghjs4',
      projectId: '6tghjserdcvidy74lq2',
      listId: 'erdcvidy74lq26tghjs',
      ownerId: 'dfgerdew35647568utjh',
      assigneeId: 'dfgerdew35647568utjh',
      isCompleted: false,
      position: 3,
      completedAt: '2024-04-19T14:37:58.000Z',
      createdAt: '2024-04-19T14:37:58.000Z',
      updatedAt: '2024-04-19T14:37:58.000Z',
    },
  })
  .openapi('Task');
