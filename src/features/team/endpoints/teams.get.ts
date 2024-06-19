import { getCurentUser } from '@/features/auth/utils';
import { ProjectSchema } from '@/features/project/models/project.schema';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { CollectionSuccessResponseSchema } from '@/features/shared/models/success-respone.schema';
import { InvalidInputResponseSchema } from '@/features/shared/responses/invalid-input.response';
import { createCollectionSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamSchema } from '@/features/team/models/team.schema';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env, Vars } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { eq, inArray } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import type { Context } from 'hono';

const entityType = 'teams';

// LOCAL SCHEMAS //

const fieldKeys = Object.keys(TeamSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    query: z.infer<typeof QuerySchema>;
  };
}

const ResponseSchema = createCollectionSuccessResponseSchema(entityType, TeamSchema);

// ROUTE //
export const route = createRoute({
  method: 'get',
  path: `/${entityType}`,
  request: {
    query: QuerySchema,
  },
  description: 'Retrieve teams the current user is member of',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'Retrieve teams',
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
  },
});

// HANDLER //
export const handler = async (
  c: Context<{ Bindings: Env; Variables: Vars }, typeof entityType, RequestValidationTargets>,
) => {
  const db = c.get('db');
  const origin = new URL(c.req.url).origin;
  const query = c.req.valid('query');
  const { fields } = query;
  const user = getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c, 'No user found');
  }

  const teamMemberResult = await db.select().from(TeamMembersTable).where(
    // and(
    eq(TeamMembersTable.userId, user.id),
    // eq(TeamMembersTable.hasUserAccepted, true),
    // eq(TeamMembersTable.hasResourceAccepted, true),
    // ),
  );

  // Unauthorized
  // Check if user is a member of the team
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c, 'User is not a member of any team');
  }

  const ids = teamMemberResult.map((teamMember) => teamMember.teamId);

  const result = await db.select().from(TeamsTable).where(inArray(TeamsTable.id, ids));

  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: result.map((team) => ({
      id: team.id,
      type: entityType,
      attributes: fields ? pickObjectProperties(team, fields.split(',')) : team,
      links: {
        self: `${origin}/${entityType}/${team.id}`,
      },
    })),
    links: {
      self: `${origin}/${entityType}${buildUrlQueryString(query)}`,
    },
  });
};
