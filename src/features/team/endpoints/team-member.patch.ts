import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { InvalidInputResponseSchema } from '@/features/shared/responses/invalid-input.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TeamMemberSchema, UpdateTeamMemberSchema } from '@/features/team/models/team-member.schema';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env } from '@/types';
import { filterUndefinedObjectProperties, pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
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

const fieldKeys = Object.keys(TeamMemberSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
    query: z.infer<typeof QuerySchema>;
    json: z.infer<typeof UpdateTeamMemberSchema>;
  };
}

const ResponseSchema = createSuccessResponseSchema(entityType, TeamMemberSchema);

// ROUTE //
export const route = createRoute({
  method: 'patch',
  path: `/${entityType}/{id}`,
  request: {
    query: QuerySchema,
    params: ParamsSchema,
    body: {
      content: {
        'application/vnd.api+json': {
          schema: UpdateTeamMemberSchema,
        },
      },
      required: true,
    },
    description: 'Data to update team member with',
  },
  description: 'Update given team member',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'The updated team member',
    },
    400: {
      content: {
        'application/vnd.api+json': {
          schema: InvalidInputResponseSchema,
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
  const query = c.req.valid('query');
  const data = c.req.valid('json');
  const user = await getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c, 'No user found');
  }

  const found = await db.select().from(TeamMembersTable).where(eq(TeamMembersTable.id, id));
  if (found.length === 0) {
    return notFoundResponse(c);
  }
  let teamMember = found[0];

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

  // Refine data based on authorization
  if (team.ownerId !== user.id) {
    data.hasTeamAccepted = undefined;
  }
  if (teamMember.userId !== user.id) {
    data.hasUserAccepted = undefined;
  }

  if (Object.keys(data).length !== 0) {
    // Update in DB
    teamMember = await db
      .update(TeamMembersTable)
      .set(filterUndefinedObjectProperties(data))
      .where(eq(TeamMembersTable.id, id))
      .returning()[0];
  }

  // Emit event
  await emitter.emitAsync('team-member:updated', c, { teamMember });

  // Response
  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: {
      id: teamMember.id,
      type: entityType,
      attributes: query?.fields ? pickObjectProperties(teamMember, query?.fields.split(',')) : teamMember,
      links: {
        self: `${origin}/${entityType}/${teamMember.id}${buildUrlQueryString(query)}`,
      },
    },
  });
};
