import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { badRequestResponse } from '@/features/shared/responses/bad-request.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createDeletionSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env } from '@/types';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'team-members';

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
  description: 'Delete given team member by id',
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
      description: 'The deleted team member id',
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

  const found = await db.select().from(TeamMembersTable).where(eq(TeamMembersTable.id, id));
  if (found.length === 0) {
    return notFoundResponse(c);
  }
  const teamMember = found[0];

  // get team
  const teamResult = await db.select().from(TeamsTable).where(eq(TeamsTable.id, teamMember.teamId));
  if (teamResult.length === 0) {
    return notFoundResponse(c);
  }
  const team = teamResult[0];

  // Authorizarion (check if user is a team member or team owner)
  if (teamMember.userId !== user.id && team.ownerId !== user.id) {
    return unauthorizedResponse(c);
  }

  // Check if user is trying to delete himself from the team he owns
  if (team.ownerId === user.id && teamMember.userId === user.id) {
    return badRequestResponse(c, 'Cannot delete yourself from the team. You are the owner!');
  }

  // delete from DB
  await db.delete(TeamMembersTable).where(eq(TeamMembersTable.id, id));

  // Emit event
  await emitter.emitAsync('team-member:deleted', c, { teamMemberId: id });

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
