import { createId } from '@paralleldrive/cuid2';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const TeamsTable = sqliteTable('teams', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  ownerId: text('ownerId').notNull(),
  title: text('title').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$onUpdateFn(() => new Date()),
});
