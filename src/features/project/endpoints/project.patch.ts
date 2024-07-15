import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { ProjectSchema, UpdateProjectSchema } from '@/features/project/models/project.schema';
import { ProjectsTable } from '@/features/project/models/projects.table';
import { InvalidInputResponseSchema, invalidInputResponse } from '@/features/shared/responses/invalid-input.response';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'projects';

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

const fieldKeys = Object.keys(ProjectSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
    query: z.infer<typeof QuerySchema>;
    form: z.infer<typeof UpdateProjectSchema>;
  };
}

const ResponseSchema = createSuccessResponseSchema(entityType, ProjectSchema);

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
          schema: UpdateProjectSchema,
        },
      },
      required: true,
    },
    description: 'Data to update project with',
  },
  description: 'Update given project',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'The updated project',
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
  const input = await c.req.json();
  const user = await getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c, 'No user found');
  }

  const found = await db.select().from(ProjectsTable).where(eq(ProjectsTable.id, id));
  if (found.length === 0) {
    return notFoundResponse(c);
  }

  // Authorizarion
  if (found[0].ownerId !== user.id) {
    return unauthorizedResponse(c);
  }

  // Input Validation
  const validation = UpdateProjectSchema.safeParse(input);
  if (validation.success === false) {
    return invalidInputResponse(c, validation.error.errors);
  }
  // Validated data
  const validatedData = validation.data;

  // Update in DB
  const result = await db
    .update(ProjectsTable)
    .set({
      ...validatedData,
    })
    .where(eq(ProjectsTable.id, id))
    .returning();

  // Emit event
  await emitter.emit('project:updated', c, { project: result[0] });

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
