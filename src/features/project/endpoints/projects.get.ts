import { getCurentUser } from '@/features/auth/utils';
import { ProjectSchema } from '@/features/project/models/project.schema';
import { ProjectsTable } from '@/features/project/models/projects.table';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createCollectionSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'projects';

// LOCAL SCHEMAS //

const fieldKeys = Object.keys(ProjectSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
  teamId: z.string().openapi({ example: '123456789' }),
});

interface RequestValidationTargets {
  out: {
    query: z.infer<typeof QuerySchema>;
  };
}

const ResponseSchema = createCollectionSuccessResponseSchema(entityType, ProjectSchema);

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
  const query = c.req.valid('query');
  const { fields, teamId } = query;
  const user = getCurentUser(c);

  if (!user) {
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

  // Authorization.
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
