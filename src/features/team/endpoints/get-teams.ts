import { getCurentUser } from '@/features/auth/utils';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { CollectionSuccessResponseSchema } from '@/features/shared/models/success-respone.schema';
import { unauthorizedResponse } from '@/features/shared/responses/unauthorized';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamSchema } from '@/features/team/models/team.schema';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env, Vars } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { eq, inArray } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'teams';

// LOCAL SCHEMAS //

const QuerySchema = z.object({
  fields: z.string().optional().openapi({ example: 'id,title' }), // TODO: only fields from team schema that are allowed to be queried
});

interface RequestValidationTargets {
  out: {
    query: z.infer<typeof QuerySchema>;
  };
}

const ResponseSchema = CollectionSuccessResponseSchema.merge(
  z.object({
    data: z.array(
      z.object({
        id: z.string().openapi({
          example: 'gy63blmknjbhvg43e2d',
        }),
        type: z.string().default('teams').openapi({
          example: 'teams',
        }),
        attributes: TeamSchema,
        links: z.object({
          self: z
            .string()
            .url()
            .openapi({
              example: `https://api.website.com/${entityType}/thgbw45brtb4rt5676uh`,
            }),
        }),
      }),
    ),
  }),
);

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
          schema: ErrorResponseSchema,
        },
      },
      description: 'Bad Request',
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
    // Unauthorized
    return unauthorizedResponse(c);
  }

  const teamMemberResult = await db.select().from(TeamMembersTable).where(eq(TeamMembersTable.userId, user.id));

  // Check if user is a member of the team
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c);
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
