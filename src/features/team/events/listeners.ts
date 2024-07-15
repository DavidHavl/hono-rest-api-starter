import { type EmitterEvents, emitter } from '@/events';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env } from '@/types';
import { defineHandler } from 'hono-event-emitter';

export const userCreatedEventHandler = defineHandler<EmitterEvents, 'user.created', Env>(async (c, { user }) => {
  const db = c.get('db');
  const inserted = await db
    .insert(TeamsTable)
    .values({
      title: `${user.fullName}'s Team`,
      ownerId: user.id,
    })
    .returning();
  await emitter.emit('team:created', c, { team: inserted[0] });
});

export const teamCreatedEventHandler = defineHandler<EmitterEvents, 'team.created', Env>(async (c, { team }) => {
  const db = c.get('db');
  const inserted = await db
    .insert(TeamMembersTable)
    .values({
      userId: team.ownerId,
      teamId: team.id,
      hasUserAccepted: true,
      hasTeamAccepted: true,
    })
    .returning();
  await emitter.emit('team-member:created', c, { teamMember: inserted[0] });
});
