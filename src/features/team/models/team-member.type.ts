import type { TeamMemberSchema } from '@/features/team/models/team-member.schema';
import type { z } from '@hono/zod-openapi';

export type TeamMember = z.infer<typeof TeamMemberSchema>;
