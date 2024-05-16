import { createId } from '@paralleldrive/cuid2';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const UsersTable = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  role: text('role', { enum: ['superadmin', 'admin', 'user'] }).default('user'),
  githubId: text('githubId'),
  googleId: text('googleId'),
  email: text('email'),
  username: text('username'),
  fullName: text('fullName'),
  avatarUrl: text('avatarUrl'),
  isBlocked: integer('isBlocked', { mode: 'boolean' }).default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$onUpdateFn(() => new Date()),
});
