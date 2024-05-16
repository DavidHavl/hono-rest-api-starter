import { emitter } from '@/events';
import type { Project } from '@/features/project/models/project.type';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import type { Context } from 'hono';

export const projectCreatedEventHandler = async ({ c, project }: { c: Context; project: Project }) => {
  const db = c.get('db');
  const inserted = await db
    .insert(TaskListsTable)
    .values({
      title: 'Todo List',
      ownerId: project.ownerId,
      projectId: project.id,
      teamId: project.teamId,
    })
    .returning();
  emitter.emit('task-list.created', { c, taskList: inserted[0] });
};
