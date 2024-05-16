import { getCurentUser } from '@/features/auth/utils';
import { ProjectSchema } from '@/features/project/models/project.schema';
import { ProjectsTable } from '@/features/project/models/projects.table';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { CollectionSuccessResponseSchema } from '@/features/shared/models/success-respone.schema';
import { notFoundResponse } from '@/features/shared/responses/not-found';
import { unauthorizedResponse } from '@/features/shared/responses/unauthorized';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env, Vars } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'projects';

// LOCAL SCHEMAS //

const QuerySchema = z.object({
  fields: z.string().optional().openapi({ example: 'id,title' }), // TODO: only fields from project schema that are allowed to be queried
  teamId: z.string().openapi({ example: '123456789' }),
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
        type: z.string().default('projects').openapi({
          example: 'projects',
        }),
        attributes: ProjectSchema,
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
  description: 'Retrieve projects for a given team',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'Retrieve projects',
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
  const { fields, teamId } = query;
  const user = getCurentUser(c);

  if (!user) {
    // Unauthorized
    return unauthorizedResponse(c);
  }

  const teamResult = await db.select().from(TeamsTable).where(eq(TeamsTable.id, teamId));

  if (teamResult.length === 0) {
    return notFoundResponse(c, 'Team not found');
  }

  const teamMemberResult = await db
    .select()
    .from(TeamMembersTable)
    .where(and(eq(TeamMembersTable.teamId, teamId), eq(TeamMembersTable.userId, user.id)));

  // Check if user is a member of the team
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c);
  }

  const result = await db.select().from(ProjectsTable).where(eq(ProjectsTable.teamId, teamId));

  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: result.map((project) => ({
      id: project.id,
      type: entityType,
      attributes: fields ? pickObjectProperties(project, fields.split(',')) : project,
      links: {
        self: `${origin}/${entityType}/${project.id}`,
      },
    })),
    links: {
      self: `${origin}/${entityType}${buildUrlQueryString(query)}`,
    },
  });
};
