import { emitter } from '@/events';
import { ProjectsTable } from '@/features/project/models/projects.table';
import type { Team } from '@/features/team/models/team.type';
import type { Env, Vars } from '@/types';
import type { Context } from 'hono';

export const teamCreatedEventHandler = async ({
  c,
  team,
}: {
  c: Context<{
    Bindings: Env;
    Variables: Vars;
  }>;
  team: Team;
}) => {
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
    emitter.emit('project.created', { c, project: inserted[0] });
  } catch (e) {
    console.error('Error creating project', e);
  }
};
