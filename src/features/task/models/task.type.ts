import type { TaskSchema } from '@/features/task/models/task.schema';
import type { z } from '@hono/zod-openapi';

export type Task = z.infer<typeof TaskSchema>;
