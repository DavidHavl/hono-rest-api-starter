import { TeamsTable } from '@/features/team/models/teams.table';
import { UsersTable } from '@/features/user/models/users.table';
import { createId } from '@paralleldrive/cuid2';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const ProjectsTable = sqliteTable(
  'projects',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    teamId: text('teamId')
      .notNull()
      .references(() => TeamsTable.id),
    ownerId: text('ownerId')
      .notNull()
      .references(() => UsersTable.id),
    title: text('title').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).$onUpdateFn(() => new Date()),
  },
  (table) => ({
    teamIdx: index('team_idx').on(table.teamId),
  }),
);
