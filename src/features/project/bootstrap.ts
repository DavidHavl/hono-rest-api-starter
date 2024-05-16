import { emitter } from '@/events';
import { teamCreatedEventHandler } from '@/features/project/events/listeners';
import type { Env, Vars } from '@/types';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { handler as getProjectHandler, route as getProjectRoute } from './endpoints/get-project';
import { handler as getProjectsHandler, route as getProjectsRoute } from './endpoints/get-projects';

export default function (
  app: OpenAPIHono<{
    Bindings: Env;
    Variables: Vars;
  }>,
) {
  // Setup endpoints
  app.openapi(getProjectRoute, getProjectHandler);
  app.openapi(getProjectsRoute, getProjectsHandler);

  // Register event listeners
  emitter.on('team.created', teamCreatedEventHandler);
}
