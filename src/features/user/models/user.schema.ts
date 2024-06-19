import { UsersTable } from '@/features/user/models/users.table';
import { z } from '@hono/zod-openapi';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const UserSchema = createSelectSchema(UsersTable)
  .openapi({
    example: {
      id: 'gy63blmknjbhvg43e2d',
      role: 'user',
      username: 'john_doe',
      email: 'john@doe.com',
      fullName: 'John Doe',
      avatarUrl: 'https://website.com/avatar.jpg',
      githubId: '43erwdg43et34wrgewsb',
      googleId: '3wthrng4twr42wgrthnh',
      isBlocked: false,
      createdAt: '2021-01-01T00:00:00.000Z',
      updatedAt: '2021-01-01T00:00:00.000Z',
    },
  })
  .openapi('User');

export const CreateUserSchema = createInsertSchema(UsersTable).openapi({
  example: {
    id: 'gy63blmknjbhvg43e2d',
    role: 'user',
    username: 'john_doe',
    email: 'john@doe.com',
    fullName: 'John Doe',
    avatarUrl: 'https://website.com/avatar.jpg',
    githubId: '43erwdg43et34wrgewsb',
    googleId: '3wthrng4twr42wgrthnh',
    isBlocked: false,
    createdAt: '2021-01-01T00:00:00.000Z',
    updatedAt: '2021-01-01T00:00:00.000Z',
  },
});
