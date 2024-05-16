import { createId } from '@paralleldrive/cuid2';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const TasksTable = sqliteTable('tasks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  dueAt: integer('dueAt', { mode: 'timestamp' }),
  teamId: text('teamId').notNull(),
  projectId: text('projectId').notNull(),
  listId: text('listId').notNull(),
  ownerId: text('ownerId').notNull(),
  assigneeId: text('assigneeId'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$onUpdateFn(() => new Date()),
});
