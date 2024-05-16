import type { ProjectSchema } from '@/features/project/models/project.schema';
import type { z } from '@hono/zod-openapi';

export type Project = z.infer<typeof ProjectSchema>;
