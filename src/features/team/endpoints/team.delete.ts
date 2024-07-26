import { getCurentUser } from '@/features/auth/utils/current-user';
import { ProjectsTable } from '@/features/project/models/projects.table';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { badRequestResponse } from '@/features/shared/responses/bad-request.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createDeletionSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env } from '@/types';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq, ne } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'teams';

// LOCAL SCHEMAS //
const ParamsSchema = z.object({
  id: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: 'id',
        in: 'path',
      },
      example: '123456789',
    }),
});

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
  };
}

const ResponseSchema = createDeletionSuccessResponseSchema(entityType);

// ROUTE //
export const route = createRoute({
  method: 'delete',
  path: `/${entityType}/{id}`,
  description: 'Delete given team',
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'The deleted team id',
    },
    400: {
      content: {
        'application/vnd.api+json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Bad Request',
    },
    401: {
      content: {
        'application/vnd.api+json': {
          schema: UnauthorizedResponseSchema,
        },
      },
      description: 'Unauthorized',
    },
    404: {
      content: {
        'application/vnd.api+json': {
          schema: NotFoundResponseSchema,
        },
      },
      description: 'Not Found',
    },
  },
});

// HANDLER //
export const handler = async (c: Context<Env, typeof entityType, RequestValidationTargets>) => {
  const db = c.get('db');
  const origin = new URL(c.req.url).origin;
  const { id } = c.req.valid('param');
  const user = await getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c, 'No user found');
  }

  const found = await db.select().from(TeamsTable).where(eq(TeamsTable.id, id));
  if (found.length === 0) {
    return notFoundResponse(c);
  }

  // Authorizarion
  if (found[0].ownerId !== user.id) {
    return unauthorizedResponse(c);
  }

  // Check if this is the last team
  const allUserTeams = await db.select().from(TeamsTable).where(eq(TeamsTable.ownerId, user.id));
  if (allUserTeams.length === 1) {
    return badRequestResponse(
      c,
      'Cannot delete last team',
      'You cannot delete your last team',
      { id, error_code: 'ERR_TEAM_LAST_TEAM' },
      { pointer: '/data/attributes/id' },
    );
  }

  // Check if there are any projects in the team
  const teamProjects = await db.select().from(ProjectsTable).where(eq(ProjectsTable.teamId, id));

  if (teamProjects.length > 0) {
    return badRequestResponse(
      c,
      'Cannot delete team with projects',
      'You cannot delete a team with projects',
      { id, error_code: 'ERR_TEAM_HAS_PROJECTS' },
      { pointer: '/data/attributes/id' },
    );
  }

  // Check if there are any team members other than the owner
  const teamMembers = await db
    .select()
    .from(TeamMembersTable)
    .where(and(eq(TeamMembersTable.teamId, id), ne(TeamMembersTable.userId, user.id)));

  if (teamMembers.length > 0) {
    return badRequestResponse(
      c,
      'Cannot delete team with members',
      'You cannot delete a team with members other than yourself',
      { id, error_code: 'ERR_TEAM_HAS_OTHER_MEMBERS' },
      { pointer: '/data/attributes/id' },
    );
  }

  // Delete all team members
  await db.delete(TeamMembersTable).where(eq(TeamMembersTable.teamId, id));

  // Delete all team projects
  await db.delete(ProjectsTable).where(eq(ProjectsTable.teamId, id));

  // delete from DB
  await db.delete(TeamsTable).where(eq(TeamsTable.id, id));

  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: {
      id,
      type: entityType,
      attributes: { id },
      links: {
        self: `${origin}/${entityType}/${id}}`,
      },
    },
  });
};
