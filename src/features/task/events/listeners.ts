import { type EmitterEvents, emitter } from '@/events';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import type { Env } from '@/types';
import { defineHandler } from 'hono-event-emitter';

export const projectCreatedEventHandler = defineHandler<EmitterEvents, 'project.created', Env>(
  async (c, { project }) => {
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
    await emitter.emit('task-list.created', c, { taskList: inserted[0] });
  },
);
