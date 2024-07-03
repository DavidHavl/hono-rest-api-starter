import { emitter } from '@/events';
import { projectCreatedEventHandler } from '@/features/task/events/listeners';
import type { Env } from '@/types';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { handler as deleteTaskListHandler, route as deleteTaskListsRoute } from './endpoints/task-list.delete';
import { handler as patchTaskListHandler, route as patchTaskListsRoute } from './endpoints/task-list.patch';
import { handler as getTaskListHandler, route as getTaskListsRoute } from './endpoints/task-lists.get';
import { handler as postTaskListHandler, route as postTaskListsRoute } from './endpoints/task-lists.post';
import { handler as getTaskHandler, route as getTaskRoute } from './endpoints/task.get';
import { handler as getTasksHandler, route as getTasksRoute } from './endpoints/tasks.get';

export default function (app: OpenAPIHono<Env>) {
  // Setup endpoints
  app.openapi(getTaskRoute, getTaskHandler);
  app.openapi(getTasksRoute, getTasksHandler);
  app.openapi(getTaskListsRoute, getTaskListHandler);
  app.openapi(postTaskListsRoute, postTaskListHandler);
  app.openapi(patchTaskListsRoute, patchTaskListHandler);
  app.openapi(deleteTaskListsRoute, deleteTaskListHandler);

  // Subscribe to events
  emitter.on('project.created', projectCreatedEventHandler);
}
