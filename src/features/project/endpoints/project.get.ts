import { getCurentUser } from '@/features/auth/utils/current-user';
import { ProjectSchema } from '@/features/project/models/project.schema';
import { ProjectsTable } from '@/features/project/models/projects.table';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'projects';

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

const fieldKeys = Object.keys(ProjectSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
    query: z.infer<typeof QuerySchema>;
  };
}

const ResponseSchema = createSuccessResponseSchema(entityType, ProjectSchema);

// ROUTE //
export const route = createRoute({
  method: 'get',
  path: `/${entityType}/{id}`,
  request: {
    params: ParamsSchema,
    query: QuerySchema,
  },
  description: 'Retrieve a single project by id',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'Retrieve single project',
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
  const query = c.req.valid('query');
  const user = await getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c);
  }

  const result = await db.select().from(ProjectsTable).where(eq(ProjectsTable.id, id));

  if (result.length === 0) {
    return notFoundResponse(c);
  }

  const teamMemberResult = await db
    .select()
    .from(TeamMembersTable)
    .where(and(eq(TeamMembersTable.teamId, result[0].teamId), eq(TeamMembersTable.userId, user.id)));

  // Authorization.
  // Check if user is a member of the team
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c);
  }

  // Response
  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: {
      id: result[0].id,
      type: entityType,
      attributes: query?.fields ? pickObjectProperties(result[0], query?.fields.split(',')) : result[0],
      links: {
        self: `${origin}/${entityType}/${result[0].id}${buildUrlQueryString(query)}`,
      },
    },
  });
};
