import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { badRequestResponse } from '@/features/shared/responses/bad-request.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createDeletionSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import { TasksTable } from '@/features/task/models/tasks.table';
import type { Env } from '@/types';
import { createRoute, z } from '@hono/zod-openapi';
import { asc, desc, eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import type { Context } from 'hono';

const entityType = 'task-lists';

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

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
  };
}

const ResponseSchema = createDeletionSuccessResponseSchema(entityType);

// ROUTE //
export const route = createRoute({
  method: 'delete',
  path: `/${entityType}/{id}`,
  description: 'Delete given task list',
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'The deleted task list id',
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
  const user = await getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c, 'No user found');
  }

  const found = await db.select().from(TaskListsTable).where(eq(TaskListsTable.id, id));
  if (found.length === 0) {
    return notFoundResponse(c);
  }

  // Authorizarion
  if (found[0].ownerId !== user.id) {
    return unauthorizedResponse(c, 'You are not the owner of the task list');
  }

  const removedPosition = Number(found[0].position);
  const projectId = found[0].projectId;

  // Get all tasks for the task list
  const tasks = await db.select().from(TasksTable).where(eq(TasksTable.listId, id));
  if (tasks.length > 0) {
    return badRequestResponse(c, 'Task list is not empty');
  }

  // delete from DB
  await db.delete(TaskListsTable).where(eq(TaskListsTable.id, id));

  // Update positions of other task lists
  const taskLists = await db
    .select()
    .from(TaskListsTable)
    .where(eq(TaskListsTable.projectId, projectId))
    .orderBy(asc(TaskListsTable.position), desc(TaskListsTable.createdAt));
  if (taskLists.length > 1) {
    // @ts-ignore
    const batchQueries: [BatchItem<'sqlite'>] = [];
    for (const taskList of taskLists) {
      let pos = Number(taskList.position);
      if (pos > removedPosition) {
        pos--;
        batchQueries.push(
          db
            .update(TaskListsTable)
            // biome-ignore lint/suspicious/noExplicitAny: Because of drizzle-orm types bug that does not see optional fields
            .set({ position: pos } as any)
            .where(eq(TaskListsTable.id, taskList.id)),
        );
      }
    }
    if (batchQueries.length > 0) {
      await db.batch(batchQueries);
    }
  }

  // Emit event
  await emitter.emitAsync('task-list:deleted', c, { taskListId: id });

  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: {
      id,
      type: entityType,
      attributes: { id },
      links: {
        self: `${origin}/${entityType}/${id}}`,
      },
    },
  });
};
