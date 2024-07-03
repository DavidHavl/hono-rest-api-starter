import { emitter } from '@/events';
import { projectCreatedEventHandler } from '@/features/task/events/listeners';
import type { Env } from '@/types';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { handler as getTaskListHandler, route as getTaskListsRoute } from './endpoints/task-lists.get';
import { handler as getTaskHandler, route as getTaskRoute } from './endpoints/task.get';
import { handler as getTasksHandler, route as getTasksRoute } from './endpoints/tasks.get';

export default function (app: OpenAPIHono<Env>) {
  // Setup endpoints
  app.openapi(getTaskRoute, getTaskHandler);
  app.openapi(getTasksRoute, getTasksHandler);
  app.openapi(getTaskListsRoute, getTaskListHandler);

  // Subscribe to events
  emitter.on('project.created', projectCreatedEventHandler);
}
