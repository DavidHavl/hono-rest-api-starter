import { emitter } from '@/events';
import { teamCreatedEventHandler } from '@/features/project/events/listeners';
import type { Env } from '@/types';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { handler as deleteProjectHandler, route as deleteProjectRoute } from './endpoints/project.delete';
import { handler as getProjectHandler, route as getProjectRoute } from './endpoints/project.get';
import { handler as patchProjectHandler, route as patchProjectRoute } from './endpoints/project.patch';
import { handler as getProjectsHandler, route as getProjectsRoute } from './endpoints/projects.get';
import { handler as postProjectHandler, route as postProjectRoute } from './endpoints/projects.post';

export default function (app: OpenAPIHono<Env>) {
  // Setup endpoints
  app.openapi(getProjectRoute, getProjectHandler);
  app.openapi(getProjectsRoute, getProjectsHandler);
  app.openapi(postProjectRoute, postProjectHandler);
  app.openapi(deleteProjectRoute, deleteProjectHandler);
  app.openapi(patchProjectRoute, patchProjectHandler);

  // Register event listeners
  emitter.on('team.created', teamCreatedEventHandler);
}
