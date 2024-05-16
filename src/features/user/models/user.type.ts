import type { UserSchema } from '@/features/user/models/user.schema';
import type { z } from '@hono/zod-openapi';

export type User = z.infer<typeof UserSchema>;
