import { emitter } from '@/events';
import {
  handler as deleteTeamMemberHandler,
  route as deleteTeamMemberRoute,
} from '@/features/team/endpoints/team-member.delete';
import {
  handler as patchTeamMemberHandler,
  route as patchTeamMemberRoute,
} from '@/features/team/endpoints/team-member.patch';
import {
  handler as getTeamMembersHandler,
  route as getTeamMembersRoute,
} from '@/features/team/endpoints/team-members.get';
import {
  handler as postTeamMembersHandler,
  route as postTeamMembersRoute,
} from '@/features/team/endpoints/team-members.post';
import { handler as deleteTeamHandler, route as deleteTeamRoute } from '@/features/team/endpoints/team.delete';
import { handler as getTeamHandler, route as getTeamRoute } from '@/features/team/endpoints/team.get';
import { handler as patchTeamHandler, route as patchTeamRoute } from '@/features/team/endpoints/team.patch';
import { handler as getTeamsHandler, route as getTeamsRoute } from '@/features/team/endpoints/teams.get';
import { handler as postTeamsHandler, route as postTeamsRoute } from '@/features/team/endpoints/teams.post';
import { teamCreatedEventHandler, userCreatedEventHandler } from '@/features/team/events/listeners';
import type { Env } from '@/types';
import type { OpenAPIHono } from '@hono/zod-openapi';

export default function (app: OpenAPIHono<Env>) {
  // Setup endpoints
  app.openapi(getTeamRoute, getTeamHandler);
  app.openapi(getTeamsRoute, getTeamsHandler);
  app.openapi(postTeamsRoute, postTeamsHandler);
  app.openapi(patchTeamRoute, patchTeamHandler);
  app.openapi(deleteTeamRoute, deleteTeamHandler);

  app.openapi(getTeamMembersRoute, getTeamMembersHandler);
  app.openapi(postTeamMembersRoute, postTeamMembersHandler);
  app.openapi(patchTeamMemberRoute, patchTeamMemberHandler);
  app.openapi(deleteTeamMemberRoute, deleteTeamMemberHandler);
  // Subscribe to events
  emitter.on('team.created', teamCreatedEventHandler);
  emitter.on('user.created', userCreatedEventHandler);
}
