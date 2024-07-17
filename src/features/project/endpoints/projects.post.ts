import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { CreateProjectSchema, ProjectSchema } from '@/features/project/models/project.schema';
import { ProjectsTable } from '@/features/project/models/projects.table';
import { InvalidInputResponseSchema } from '@/features/shared/responses/invalid-input.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TeamsTable } from '@/features/team/models/teams.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'projects';

// LOCAL SCHEMAS //

const fieldKeys = Object.keys(ProjectSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    query: z.infer<typeof QuerySchema>;
    json: z.infer<typeof CreateProjectSchema>;
  };
}

const ResponseSchema = createSuccessResponseSchema(entityType, ProjectSchema);

// ROUTE //
export const route = createRoute({
  method: 'post',
  path: `/${entityType}`,
  request: {
    query: QuerySchema,
    body: {
      content: {
        'application/vnd.api+json': {
          schema: CreateProjectSchema,
        },
      },
      required: true,
    },
    description: 'Data to create new project from',
  },
  description: 'Create new project for a given team',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'The new project',
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

  // Check if user is an owner of the specified team
  const teamResult = await db
    .select()
    .from(TeamsTable)
    .where(and(eq(TeamsTable.id, data.teamId), eq(TeamsTable.ownerId, user.id)));

  // Authorization
  if (teamResult.length === 0) {
    return unauthorizedResponse(c);
  }

  // Insert into DB
  const result = await db
    .insert(ProjectsTable)
    .values({
      // Specifying one by one because of DrizzleORM bug preventing from using `...validatedData` directly
      teamId: data.teamId,
      title: data.title,
      ownerId: user.id,
    })
    .returning();

  // Emit event
  await emitter.emitAsync('project:created', c, { project: result[0] });

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
