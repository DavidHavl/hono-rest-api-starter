import { emitter } from '@/events';
import { handler as getTeamHandler, route as getTeamRoute } from '@/features/team/endpoints/get-team';
import {
  handler as getTeamMembersHandler,
  route as getTeamMembersRoute,
} from '@/features/team/endpoints/get-team-members';
import { handler as getTeamsHandler, route as getTeamsRoute } from '@/features/team/endpoints/get-teams';
import { teamCreatedEventHandler, userCreatedEventHandler } from '@/features/team/events/listeners';
import type { Env, Vars } from '@/types';
import type { OpenAPIHono } from '@hono/zod-openapi';

export default function (
  app: OpenAPIHono<{
    Bindings: Env;
    Variables: Vars;
  }>,
) {
  // Setup endpoints
  app.openapi(getTeamRoute, getTeamHandler);
  app.openapi(getTeamsRoute, getTeamsHandler);
  app.openapi(getTeamMembersRoute, getTeamMembersHandler);
  // Subscribe to events
  emitter.on('team.created', teamCreatedEventHandler);
  emitter.on('user.created', userCreatedEventHandler);
}
