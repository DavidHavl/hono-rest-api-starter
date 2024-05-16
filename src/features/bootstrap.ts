import type { Env, Vars } from '@/types';
import type { OpenAPIHono } from '@hono/zod-openapi';
import authBootstrap from './auth/bootstrap';
import projectBootstrap from './project/bootstrap';
import taskBootstrap from './task/bootstrap';
import teamBootstrap from './team/bootstrap';
import userBootstrap from './user/bootstrap';

export const bootstrapFeatures = (
  app: OpenAPIHono<{
    Bindings: Env;
    Variables: Vars;
  }>,
) => {
  authBootstrap(app);
  userBootstrap(app);
  teamBootstrap(app);
  projectBootstrap(app);
  taskBootstrap(app);
};
