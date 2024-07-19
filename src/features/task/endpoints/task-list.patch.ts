import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { InvalidInputResponseSchema } from '@/features/shared/responses/invalid-input.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TaskListSchema, UpdateTaskListSchema } from '@/features/task/models/task-list.schema';
import { TaskListsTable } from '@/features/task/models/task-lists.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
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

const fieldKeys = Object.keys(TaskListSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
    query: z.infer<typeof QuerySchema>;
    json: z.infer<typeof UpdateTaskListSchema>;
  };
}

const ResponseSchema = createSuccessResponseSchema(entityType, TaskListSchema);

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
          schema: UpdateTaskListSchema,
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

  const found = await db.select().from(TaskListsTable).where(eq(TaskListsTable.id, id));
  if (found.length === 0) {
    return notFoundResponse(c);
  }

  // Authorizarion
  if (found[0].ownerId !== user.id) {
    return unauthorizedResponse(c, 'You are not the owner of the task list');
  }

  // Update position and positions of other tasks in the list
  if (data.position && data.position !== found[0].position) {
    const taskLists = await db
      .select()
      .from(TaskListsTable)
      .where(eq(TaskListsTable.projectId, found[0].projectId))
      .orderBy(asc(TaskListsTable.position), desc(TaskListsTable.createdAt));
    if (taskLists.length > 1) {
      let position = data.position;
      const batchQueries: [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]] = [
        db
          .update(TaskListsTable)
          // biome-ignore lint/suspicious/noExplicitAny: Because of drizzle-orm types bug that does not see optional fields
          .set({ position } as any)
          .where(eq(TaskListsTable.id, found[0].id)),
      ];
      for (const taskList of taskLists) {
        if (taskList.id === id) {
          continue;
        }
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
  }

  // Update in DB
  const result = await db
    .update(TaskListsTable)
    .set({
      ...data,
    })
    .where(eq(TaskListsTable.id, id))
    .returning();

  // Emit event
  await emitter.emitAsync('task-list:updated', c, { taskList: result[0] });

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
