import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { ProjectsTable } from '@/features/project/models/projects.table';
import { InvalidInputResponseSchema, invalidInputResponse } from '@/features/shared/responses/invalid-input.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { CreateTaskListSchema, TaskListSchema } from '@/features/task/models/task-list.schema';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'task-lists';

// LOCAL SCHEMAS //

const fieldKeys = Object.keys(TaskListSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    query: z.infer<typeof QuerySchema>;
    form: z.infer<typeof CreateTaskListSchema>;
  };
}

const ResponseSchema = createSuccessResponseSchema(entityType, TaskListSchema);

// ROUTE //
export const route = createRoute({
  method: 'post',
  path: `/${entityType}`,
  request: {
    query: QuerySchema,
    body: {
      content: {
        'application/vnd.api+json': {
          schema: CreateTaskListSchema,
        },
      },
      required: true,
    },
    description: 'Data to create new task list from',
  },
  description: 'Create new task list for a given team',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'The new task list',
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
  const query = c.req.valid('query');
  const input = c.req.valid('form');
  const user = await getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c, 'No user found');
  }

  // Input validation
  const validation = CreateTaskListSchema.safeParse(input);
  if (validation.success === false) {
    return invalidInputResponse(c, validation.error.errors);
  }
  // Validated data
  const validatedData = validation.data;

  // Check if project exists
  const projectResult = await db
    .select()
    .from(ProjectsTable)
    .where(and(eq(ProjectsTable.id, validatedData.projectId), eq(TeamsTable.ownerId, user.id)));

  // Authorization
  if (projectResult.length === 0) {
    return notFoundResponse(c, 'Project not found');
  }

  // Check if user is a member of the specified team
  const teamMemberResult = await db
    .select()
    .from(TeamMembersTable)
    .where(
      and(
        eq(TeamMembersTable.teamId, projectResult[0].teamId),
        eq(TeamMembersTable.userId, user.id),
        eq(TeamMembersTable.hasResourceAccepted, true),
        eq(TeamMembersTable.hasUserAccepted, true),
      ),
    );

  // Authorization
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c);
  }

  // Insert into DB
  const result = await db
    .insert(TaskListsTable)
    .values({
      // Specifying one by one because of DrizzleORM bug preventing from using `...validatedData` directly
      projectId: validatedData.projectId,
      teamId: projectResult[0].teamId,
      title: validatedData.title,
      ownerId: user.id,
    })
    .returning();

  // Emit event
  emitter.emit('task-list.created', c, { taskList: result[0] });

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
