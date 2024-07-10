import { type EmitterEvents, emitter } from '@/events';
import { ProjectsTable } from '@/features/project/models/projects.table';
import type { Env } from '@/types';
import { defineHandler } from 'hono-event-emitter';

export const teamCreatedEventHandler = defineHandler<EmitterEvents, 'team.created', Env>(async (c, { team }) => {
  const db = c.get('db');
  try {
    const inserted = await db
      .insert(ProjectsTable)
      .values({
        title: 'New Project',
        ownerId: team.ownerId,
        teamId: team.id,
      })
      .returning();
    await emitter.emit('project.created', c, { project: inserted[0] });
  } catch (e) {
    console.error('Error creating project', e);
  }
});
