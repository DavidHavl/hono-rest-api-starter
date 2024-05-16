import { createId } from '@paralleldrive/cuid2';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const TeamMembersTable = sqliteTable('team-members', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('userId').notNull(),
  teamId: text('teamId').notNull(),
  hasUserAccepted: integer('userAccepted', { mode: 'boolean' }).default(false),
  hasTeamAccepted: integer('teamAccepted', { mode: 'boolean' }).default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$onUpdateFn(() => new Date()),
});
