import { z } from '@hono/zod-openapi';

export const UserSchema = z.object({
  id: z.string().cuid2().openapi({
    example: '8aah7h4rdcvkk874l44',
  }),
  role: z.enum(['superadmin', 'admin', 'user']).openapi({
    example: 'user',
  }),
  username: z.string().openapi({
    example: 'john_doe',
  }),
  email: z.string().email().optional().openapi({
    example: 'john@doe.com',
  }),
  phone: z.string().optional().openapi({
    example: '+15555555555',
  }),
  fullName: z.string().optional().openapi({
    example: 'John Doe',
  }),
  avatarUrl: z.string().optional().openapi({
    example: 'https://website.com/avatar.jpg',
  }),
  githubId: z.string().optional().openapi({
    example: '123456789',
  }),
  googleId: z.string().optional().openapi({
    example: '123456789',
  }),
  isBlocked: z.boolean().default(false).openapi({
    example: false,
  }),
  createdAt: z.coerce.date().openapi({
    example: '2024-04-19T14:37:58.000Z',
  }),
  updatedAt: z.coerce.date().openapi({
    example: '2024-04-19T14:37:58.000Z',
  }),
});
