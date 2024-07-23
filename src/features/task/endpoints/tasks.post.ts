import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { InvalidInputResponseSchema } from '@/features/shared/responses/invalid-input.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { CreateTaskSchema, TaskSchema } from '@/features/task/models/task.schema';
import { TasksTable } from '@/features/task/models/tasks.table';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import type { Context } from 'hono';

const entityType = 'tasks';

// LOCAL SCHEMAS //

const fieldKeys = Object.keys(TaskSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    query: z.infer<typeof QuerySchema>;
    json: z.infer<typeof CreateTaskSchema>;
  };
}

const ResponseSchema = createSuccessResponseSchema(entityType, TaskSchema);

// ROUTE //
export const route = createRoute({
  method: 'post',
  path: `/${entityType}`,
  request: {
    query: QuerySchema,
    body: {
      content: {
        'application/vnd.api+json': {
          schema: CreateTaskSchema,
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

  // Check if task list exists
  const listResult = await db.select().from(TaskListsTable).where(eq(TaskListsTable.id, data.listId));
  if (listResult.length === 0) {
    return notFoundResponse(c, 'Task list not found');
  }

  // Check if user is a member of the specified team
  const teamMemberResult = await db
    .select()
    .from(TeamMembersTable)
    .where(
      and(
        eq(TeamMembersTable.teamId, listResult[0].teamId),
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
  const tasks = await db
    .select()
    .from(TasksTable)
    .where(eq(TasksTable.listId, listResult[0].id))
    .orderBy(asc(TasksTable.position), desc(TasksTable.createdAt));
  if (tasks.length > 0) {
    let position = data.position ? Number(data.position) : 0;
    // @ts-ignore
    const batchQueries: [BatchItem<'sqlite'>] = [];
    for (const task of tasks) {
      if (Number(task.position) >= position) {
        position++;
        batchQueries.push(
          db
            .update(TasksTable)
            // biome-ignore lint/suspicious/noExplicitAny: Because of drizzle-orm types bug that does not see optional fields
            .set({ position } as any)
            .where(eq(TasksTable.id, task.id)),
        );
      }
    }
    if (batchQueries.length) {
      await db.batch(batchQueries);
    }
  }

  // Insert into DB
  const result = await db
    .insert(TasksTable)
    .values({
      ...data,
      // Specifying one by one because of DrizzleORM bug preventing from using `...data` directly
      projectId: listResult[0].projectId,
      teamId: listResult[0].teamId,
      dueAt: data.dueAt ? new Date(Number(data.dueAt)) : null,
      isCompleted: Boolean(data.isCompleted),
      completedAt: data.isCompleted ? new Date() : null,
      position: data.position ? Number(data.position) : 0,
      ownerId: user.id,
      // biome-ignore lint/suspicious/noExplicitAny:  Because of drizzle-orm types bug that does not see optional fields
    } as any)
    .returning();

  // Emit event
  await emitter.emitAsync('task:created', c, { task: result[0] });

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
