import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const TaskListSchema = createSelectSchema(TaskListsTable)
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

export const CreateTaskListSchema = createInsertSchema(TaskListsTable).openapi({
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
});
