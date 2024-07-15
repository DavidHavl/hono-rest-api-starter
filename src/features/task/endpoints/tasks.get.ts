import { getCurentUser } from '@/features/auth/utils/current-user';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { CollectionSuccessResponseSchema } from '@/features/shared/models/success-respone.schema';
import { badRequestResponse } from '@/features/shared/responses/bad-request.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { TaskSchema } from '@/features/task/models/task.schema';
import { TasksTable } from '@/features/task/models/tasks.table';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { UsersTable } from '@/features/user/models/users.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq, inArray } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'tasks';

// LOCAL SCHEMAS //
const fieldKeys = Object.keys(TaskSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
  include: z.enum(['assignee']).optional(),
  listId: z.string().optional().openapi({ example: '123456789' }),
  teamId: z.string().optional().openapi({ example: '123456789' }),
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
        attributes: TaskSchema,
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
  description: 'Retrieve tasks for a given task list',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'Retrieve tasks',
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
  const { fields, include, listId, teamId } = query;
  const user = await getCurentUser(c);

  if (!user) {
    // Unauthorized
    return unauthorizedResponse(c);
  }

  let teamIdToCheck = '';
  if (listId) {
    // Check if the task list exists
    const taskListResult = await db.select().from(TaskListsTable).where(eq(TaskListsTable.id, listId));
    if (taskListResult.length === 0) {
      return notFoundResponse(c, 'Task list not found');
    }
    teamIdToCheck = taskListResult[0].teamId;
  } else if (teamId) {
    teamIdToCheck = teamId;
  } else {
    return badRequestResponse(c, 'Either listId or teamId must be provided');
  }

  // Authorization
  const teamMemberResult = await db
    .select()
    .from(TeamMembersTable)
    .where(and(eq(TeamMembersTable.teamId, teamIdToCheck), eq(TeamMembersTable.userId, user.id)));

  // Check if user is a member of the team
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c, 'You are not a member of the requested team');
  }

  // Fetch tasks
  let result = [];
  if (listId) {
    result = await db.select().from(TasksTable).where(eq(TasksTable.listId, listId));
  } else {
    result = await db.select().from(TasksTable).where(eq(TasksTable.teamId, teamIdToCheck));
  }

  // Include assignee details if requested
  const includeAsignees = include === 'assignee';
  let assignees = [];
  if (includeAsignees) {
    const userIds = result.map((task) => task.assigneeId).filter(Boolean);
    if (userIds.length > 0) {
      assignees = await db.select().from(UsersTable).where(inArray(UsersTable.id, userIds));
    }
  }

  // Return response
  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: result.map((task) => ({
      id: task.id,
      type: entityType,
      attributes: fields ? pickObjectProperties(task, fields.split(',')) : task,
      relationships: {
        assignee:
          includeAsignees && assignees.length > 0
            ? {
                data: {
                  id: task.assigneeId,
                  type: 'users',
                },
              }
            : undefined,
      },
      links: {
        self: `${origin}/${entityType}/${task.id}`,
      },
    })),
    included:
      includeAsignees && assignees.length > 0
        ? assignees.map((assignee) => ({
            id: assignee.id,
            type: 'users',
            attributes: {
              id: assignee.id,
              fullName: assignee.fullName,
            },
            links: {
              self: `${origin}/users/${assignee.id}`,
            },
          }))
        : undefined,
    links: {
      self: `${origin}/${entityType}${buildUrlQueryString(query)}`,
    },
  });
};
