import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { InvalidInputResponseSchema, invalidInputResponse } from '@/features/shared/responses/invalid-input.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TaskSchema, UpdateTaskSchema } from '@/features/task/models/task.schema';
import { TasksTable } from '@/features/task/models/tasks.table';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import type { Env } from '@/types';
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

const fieldKeys = Object.keys(TaskSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
    query: z.infer<typeof QuerySchema>;
    form: z.infer<typeof UpdateTaskSchema>;
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
  const input = c.req.valid('form');
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
    return unauthorizedResponse(c);
  }

  // Input Validation
  const validation = UpdateTaskSchema.safeParse(input);
  if (validation.success === false) {
    return invalidInputResponse(c, validation.error.errors);
  }
  // Validated data
  const validatedData = validation.data;

  // assign value to completedAt based on isCompleted and previous value
  let completedAt = null;
  if (validatedData.isCompleted !== undefined) {
    if (validatedData.isCompleted === false) {
      completedAt = null; // clear the date
    } else if (validatedData.isCompleted === true && !found[0].isCompleted) {
      completedAt = new Date(); // set the date to now
    } else {
      completedAt = found[0].completedAt; // keep the value as is
    }
  }
  // Update in DB
  const result = await db
    .update(TasksTable)
    .set({
      ...validatedData,
      dueAt: validatedData.dueAt ? new Date(Number(validatedData.dueAt)) : found[0].dueAt,
      isCompleted: validatedData.isCompleted !== undefined ? Boolean(validatedData.isCompleted) : found[0].isCompleted,
      completedAt,
    })
    .where(eq(TasksTable.id, id))
    .returning();

  // Emit event
  await emitter.emit('task.updated', c, { task: result[0] });

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
