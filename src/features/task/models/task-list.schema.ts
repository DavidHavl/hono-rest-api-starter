import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { z } from '@hono/zod-openapi';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const SelectTaskListSchema = createSelectSchema(TaskListsTable);
export const CreateTaskListSchema = createInsertSchema(TaskListsTable, {
  title: z.string().min(1).trim(),
  position: z.number().int().min(0).default(0).optional(),
}).omit({
  id: true,
  ownerId: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateTaskListSchema = CreateTaskListSchema.omit({
  projectId: true,
}).partial();

export const TaskListSchema = z
  .object(SelectTaskListSchema.shape)
  .openapi({
    description: 'Task List',
    example: {
      id: 'gy63blmknjbhvg43e2d',
      title: 'Shopping List',
      teamId: 'erdcvid6tltfdeagf3',
      projectId: '6tghjserdcvidy74lq2',
      ownerId: 'dfgerdew35647568utjh',
      createdAt: '2024-04-19T14:37:58.000Z',
      updatedAt: '2024-04-19T14:37:58.000Z',
    },
  })
  .openapi('Task List');
