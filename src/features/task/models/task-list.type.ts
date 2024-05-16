import type { TaskListSchema } from '@/features/task/models/task-list.schema';
import type { z } from '@hono/zod-openapi';

export type TaskList = z.infer<typeof TaskListSchema>;
