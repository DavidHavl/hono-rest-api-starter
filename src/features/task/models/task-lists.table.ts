import { createId } from '@paralleldrive/cuid2';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const TaskListsTable = sqliteTable(
  'task-lists',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text('title').notNull(),
    teamId: text('teamId').notNull(),
    projectId: text('projectId').notNull(),
    ownerId: text('ownerId').notNull(),
    position: integer('position').default(0),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).$onUpdateFn(() => new Date()),
  },
  (table) => ({
    projectIdx: index('task-lists_projectId_idx').on(table.projectId),
    teamIdx: index('task-lists_teamId_idx').on(table.teamId),
  }),
);
