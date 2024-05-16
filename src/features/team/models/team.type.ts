import type { TeamSchema } from '@/features/team/models/team.schema';
import type { z } from '@hono/zod-openapi';

export type Team = z.infer<typeof TeamSchema>;
