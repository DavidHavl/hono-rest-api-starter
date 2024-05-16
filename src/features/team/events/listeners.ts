import { emitter } from '@/events';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import type { Team } from '@/features/team/models/team.type';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { User } from '@/features/user/models/user.type';
import type { Context } from 'hono';

export const userCreatedEventHandler = async ({ c, user }: { c: Context; user: User }) => {
  const db = c.get('db');
  const inserted = await db
    .insert(TeamsTable)
    .values({
      title: `${user.fullName}'s Team`,
      ownerId: user.id,
    })
    .returning();
  emitter.emit('team.created', { c, team: inserted[0] });
};

export const teamCreatedEventHandler = async ({ c, team }: { c: Context; team: Team }) => {
  const db = c.get('db');
  const inserted = await db
    .insert(TeamMembersTable)
    .values({
      userId: team.ownerId,
      teamId: team.id,
    })
    .returning();
  emitter.emit('team-member.created', { c, teamMember: inserted[0] });
};
