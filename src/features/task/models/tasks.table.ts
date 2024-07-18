import { ProjectsTable } from '@/features/project/models/projects.table';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { UsersTable } from '@/features/user/models/users.table';
import { createId } from '@paralleldrive/cuid2';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const TasksTable = sqliteTable(
  'tasks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text('title').notNull(),
    description: text('description'),
    dueAt: integer('dueAt', { mode: 'timestamp' }),
    teamId: text('teamId').notNull(),
    projectId: text('projectId')
      .notNull()
      .references(() => ProjectsTable.id),
    listId: text('listId')
      .notNull()
      .references(() => TaskListsTable.id),
    ownerId: text('ownerId')
      .notNull()
      .references(() => UsersTable.id),
    assigneeId: text('assigneeId').references(() => UsersTable.id),
    position: integer('position').default(0),
    isCompleted: integer('isCompleted', { mode: 'boolean' }).notNull().default(false),
    completedAt: integer('completedAt', { mode: 'timestamp' }).default(null),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).$onUpdateFn(() => new Date()),
  },
  (table) => ({
    listIdx: index('list_idx').on(table.listId),
    projectIdx: index('project_idx').on(table.projectId),
    teamIdx: index('team_idx').on(table.teamId),
  }),
);
