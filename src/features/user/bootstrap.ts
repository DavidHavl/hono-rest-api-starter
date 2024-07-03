import type { Env } from '@/types';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { handler as getUserHandler, route as getUserRoute } from './endpoints/user.get';

export default function (app: OpenAPIHono<Env>) {
  app.openapi(getUserRoute, getUserHandler);
}
