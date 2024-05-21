import { getCurentUser } from '@/features/auth/utils';
import { ProjectsTable } from '@/features/project/models/projects.table';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { CollectionSuccessResponseSchema } from '@/features/shared/models/success-respone.schema';
import { notFoundResponse } from '@/features/shared/responses/not-found';
import { unauthorizedResponse } from '@/features/shared/responses/unauthorized';
import { TaskListSchema } from '@/features/task/models/task-list.schema';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import type { Env, Vars } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'task-lists';

// LOCAL SCHEMAS //

const QuerySchema = z.object({
  fields: z.string().optional().openapi({ example: 'id,title' }), // TODO: only fields from task schema that are allowed to be queried
  projectId: z.string().openapi({ example: '123456789' }),
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
        type: z.string().default(entityType).openapi({
          example: entityType,
        }),
        attributes: TaskListSchema,
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
  description: 'Retrieve task lists for a given project',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'Retrieve task lists',
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
  const { fields, projectId } = query;
  const user = getCurentUser(c);

  if (!user) {
    // Unauthorized
    return unauthorizedResponse(c);
  }

  const projectResult = await db.select().from(ProjectsTable).where(eq(ProjectsTable.id, projectId));

  if (projectResult.length === 0) {
    return notFoundResponse(c, 'Project not found');
  }

  const teamMemberResult = await db
    .select()
    .from(TeamMembersTable)
    .where(and(eq(TeamMembersTable.teamId, projectResult[0].teamId), eq(TeamMembersTable.userId, user.id)));

  // Check if user is a member of the team
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c);
  }

  const result = await db.select().from(TaskListsTable).where(eq(TaskListsTable.projectId, projectId));

  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: result.map((list) => ({
      id: list.id,
      type: entityType,
      attributes: fields ? pickObjectProperties(list, fields.split(',')) : list,
      links: {
        self: `${origin}/${entityType}/${list.id}`,
      },
    })),
    links: {
      self: `${origin}/${entityType}${buildUrlQueryString(query)}`,
    },
  });
};
