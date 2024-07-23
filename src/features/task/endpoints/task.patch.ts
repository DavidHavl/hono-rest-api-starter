import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { badRequestResponse } from '@/features/shared/responses/bad-request.response';
import { InvalidInputResponseSchema } from '@/features/shared/responses/invalid-input.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { TaskSchema, UpdateTaskSchema } from '@/features/task/models/task.schema';
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

const fieldKeys = Object.keys(TaskSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
    query: z.infer<typeof QuerySchema>;
    json: z.infer<typeof UpdateTaskSchema>;
  };
}

const ResponseSchema = createSuccessResponseSchema(entityType, TaskSchema);

// ROUTE //
export const route = createRoute({
  method: 'patch',
  path: `/${entityType}/{id}`,
  request: {
    query: QuerySchema,
    params: ParamsSchema,
    body: {
      content: {
        'application/vnd.api+json': {
          schema: UpdateTaskSchema,
        },
      },
      required: true,
    },
    description: 'Data to update task list with',
  },
  description: 'Update given task list',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'The updated task list',
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
  const { id } = c.req.valid('param');
  const query = c.req.valid('query');
  const data = c.req.valid('json');
  const user = await getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c, 'No user found');
  }

  const found = await db.select().from(TasksTable).where(eq(TasksTable.id, id));
  if (found.length === 0) {
    return notFoundResponse(c);
  }

  // Check if user is a member of the specified team
  const teamMemberResult = await db
    .select()
    .from(TeamMembersTable)
    .where(
      and(
        eq(TeamMembersTable.teamId, found[0].teamId),
        eq(TeamMembersTable.userId, user.id),
        eq(TeamMembersTable.hasTeamAccepted, true),
        eq(TeamMembersTable.hasUserAccepted, true),
      ),
    );

  // Authorization
  if (teamMemberResult.length === 0) {
    return unauthorizedResponse(c, 'The given task does not belong to a team you are a member of');
  }

  // Check the list is same project as the task
  if (data.listId) {
    const listResult = await db.select().from(TaskListsTable).where(eq(TaskListsTable.id, data.listId));
    if (listResult.length === 0) {
      return notFoundResponse(c, 'Task list not found');
    }
    if (listResult[0].projectId !== found[0].projectId) {
      return badRequestResponse(c, 'The new task list is not in the same project as the task');
    }
  }
  // assign value to completedAt based on isCompleted and previous value
  let completedAt = null;
  if (data.isCompleted !== undefined) {
    if (data.isCompleted === false) {
      completedAt = null; // clear the date
    } else if (data.isCompleted === true && !found[0].isCompleted) {
      completedAt = new Date(); // set the date to now
    } else {
      completedAt = found[0].completedAt; // keep the value as is
    }
  }

  // Update position and positions of other tasks in the list
  if (data.position !== undefined && Number(data.position) !== Number(found[0].position)) {
    const tasks = await db
      .select()
      .from(TasksTable)
      .where(eq(TasksTable.projectId, found[0].projectId))
      .orderBy(asc(TasksTable.position), desc(TasksTable.createdAt));
    if (tasks.length > 1) {
      const newPosition = Number(data.position);
      const oldPosition = Number(found[0].position);
      const direction = newPosition > oldPosition ? 'up' : 'down';
      const batchQueries: [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]] = [
        db
          .update(TasksTable)
          // biome-ignore lint/suspicious/noExplicitAny: Because of drizzle-orm types bug that does not see optional fields
          .set({ position: newPosition } as any)
          .where(eq(TasksTable.id, found[0].id)),
      ];
      for (const task of tasks) {
        if (task.id === id) {
          continue;
        }
        let pos = Number(task.position);
        if (direction === 'up') {
          // If the task is moved up, we need to move all tasks that are between the old and new position down
          if (Number(task.position) > oldPosition && Number(task.position) <= newPosition) {
            pos--;
          }
        } else {
          // If the task is moved down, we need to move all tasks that are between the old and new position up
          if (Number(task.position) < oldPosition && Number(task.position) >= newPosition) {
            pos++;
          }
        }
        if (pos !== Number(task.position)) {
          batchQueries.push(
            db
              .update(TasksTable)
              // biome-ignore lint/suspicious/noExplicitAny: Because of drizzle-orm types bug that does not see optional fields
              .set({ position: pos } as any)
              .where(eq(TasksTable.id, task.id)),
          );
        }
      }
      if (batchQueries.length > 0) {
        await db.batch(batchQueries);
      }
    }
  }

  // Update in DB
  const result = await db
    .update(TasksTable)
    .set({
      ...data,
      dueAt: data.dueAt ? new Date(Number(data.dueAt)) : found[0].dueAt,
      isCompleted: data.isCompleted !== undefined ? Boolean(data.isCompleted) : found[0].isCompleted,
      completedAt,
      position: data.position || found[0].position,
      // biome-ignore lint/suspicious/noExplicitAny: Because of drizzle-orm types bug that does not see optional fields
    } as any)
    .where(eq(TasksTable.id, id))
    .returning();

  // Emit event
  await emitter.emitAsync('task:updated', c, { task: result[0] });

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
