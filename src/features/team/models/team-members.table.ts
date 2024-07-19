import { TeamsTable } from '@/features/team/models/teams.table';
import { UsersTable } from '@/features/user/models/users.table';
import { createId } from '@paralleldrive/cuid2';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const TeamMembersTable = sqliteTable(
  'team-members',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('userId')
      .notNull()
      .references(() => UsersTable.id),
    teamId: text('teamId')
      .notNull()
      .references(() => TeamsTable.id),
    hasUserAccepted: integer('hasUserAccepted', { mode: 'boolean' }).default(false),
    hasTeamAccepted: integer('hasTeamAccepted', { mode: 'boolean' }).default(false),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).$onUpdateFn(() => new Date()),
  },
  (table) => ({
    userIdx: index('team-members_userId_idx').on(table.userId),
    teamIdx: index('team-members_teamId_idx').on(table.teamId),
  }),
);
