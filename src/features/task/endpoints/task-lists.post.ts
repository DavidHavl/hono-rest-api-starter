import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { ProjectsTable } from '@/features/project/models/projects.table';
import { InvalidInputResponseSchema } from '@/features/shared/responses/invalid-input.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { CreateTaskListSchema, TaskListSchema } from '@/features/task/models/task-list.schema';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
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
    json: z.infer<typeof CreateTaskListSchema>;
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
  const data = c.req.valid('json');
  const user = await getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c, 'No user found');
  }

  // Check if project exists
  const projectResult = await db
    .select()
    .from(ProjectsTable)
    .where(and(eq(ProjectsTable.id, data.projectId), eq(ProjectsTable.ownerId, user.id)));

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
        eq(TeamMembersTable.hasTeamAccepted, true),
        eq(TeamMembersTable.hasUserAccepted, true),
      ),
    );

  // Authorization
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c);
  }

  // Update position and positions of other tasks in the list
  const taskLists = await db
    .select()
    .from(TaskListsTable)
    .where(eq(TaskListsTable.projectId, projectResult[0].id))
    .orderBy(asc(TaskListsTable.position), desc(TaskListsTable.createdAt));
  if (taskLists.length > 1) {
    let position = data.position;
    // @ts-ignore
    const batchQueries: [BatchItem<'sqlite'>] = [];
    for (const taskList of taskLists) {
      if (taskList.position >= data.position) {
        position++;
        batchQueries.push(
          db
            .update(TaskListsTable)
            // biome-ignore lint/suspicious/noExplicitAny: Because of drizzle-orm types bug that does not see optional fields
            .set({ position } as any)
            .where(eq(TaskListsTable.id, taskList.id)),
        );
      }
    }
    if (batchQueries.length) {
      await db.batch(batchQueries);
    }
  }

  // Insert into DB
  const result = await db
    .insert(TaskListsTable)
    .values({
      // Specifying one by one because of DrizzleORM bug preventing from using `...data` directly
      projectId: data.projectId,
      teamId: projectResult[0].teamId,
      title: data.title,
      ownerId: user.id,
      position: data.position ?? 0,
      // biome-ignore lint/suspicious/noExplicitAny: Because of drizzle-orm types bug that does not see optional fields
    } as any)
    .returning();

  // Emit event
  await emitter.emitAsync('task-list:created', c, { taskList: result[0] });

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
