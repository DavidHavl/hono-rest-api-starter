import { getCurentUser } from '@/features/auth/utils';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { SuccessResponseSchema } from '@/features/shared/models/success-respone.schema';
import { notFoundResponse } from '@/features/shared/responses/not-found';
import { unauthorizedResponse } from '@/features/shared/responses/unauthorized';
import { TaskSchema } from '@/features/task/models/task.schema';
import { TasksTable } from '@/features/task/models/tasks.table';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import type { Env, Vars } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'tasks';

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

const QuerySchema = z.object({
  fields: z.string().optional().openapi({ example: 'id,title' }), // TODO: only fields from task schema that are allowed to be queried
});

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
    query: z.infer<typeof QuerySchema>;
  };
}

const ResponseSchema = SuccessResponseSchema.merge(
  z.object({
    data: z.object({
      type: z.string().openapi({
        example: 'tasks',
      }),
      id: z.string().openapi({
        example: 'gy63blmknjbhvg43e2d',
      }),
      attributes: TaskSchema,
      links: z.object({
        self: z
          .string()
          .url()
          .optional()
          .openapi({
            example: `https://api.website.com/${entityType}/thgbw45brtb4rt5676uh`,
          }),
      }),
    }),
  }),
);

// ROUTE //
export const route = createRoute({
  method: 'get',
  path: `/${entityType}/{id}`,
  request: {
    params: ParamsSchema,
    query: QuerySchema,
  },
  description: 'Retrieve a single task by id',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'Retrieve single task',
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
  const { id } = c.req.valid('param');
  const query = c.req.valid('query');
  const user = getCurentUser(c);

  if (!user) {
    // Unauthorized
    return unauthorizedResponse(c);
  }

  const result = await db.select().from(TasksTable).where(eq(TasksTable.id, id));

  if (result.length === 0) {
    return notFoundResponse(c);
  }

  const teamMemberResult = await db
    .select()
    .from(TeamMembersTable)
    .where(and(eq(TeamMembersTable.teamId, result[0].teamId), eq(TeamMembersTable.userId, user.id)));

  // Check if user is a member of the team
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c);
  }

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
