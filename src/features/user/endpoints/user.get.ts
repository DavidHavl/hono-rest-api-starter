import { getCurentUser } from '@/features/auth/utils';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { SuccessResponseSchema } from '@/features/shared/models/success-respone.schema';
import { NotFoundResponseSchema, notFoundResponse } from '@/features/shared/responses/not-found.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { UserSchema } from '@/features/user/models/user.schema';
import { UsersTable } from '@/features/user/models/users.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'users';

// LOCAL SCHEMAS //
const ParamsSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({
      param: {
        name: 'id',
        in: 'path',
      },
      example: '123456789',
    }),
});

const fieldKeys = Object.keys(UserSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    param: z.infer<typeof ParamsSchema>;
    query: z.infer<typeof QuerySchema>;
  };
}

const ResponseSchema = SuccessResponseSchema.merge(
  z.object({
    data: z.object({
      type: z.string().openapi({
        example: 'users',
      }),
      id: z.string().openapi({
        example: 'gy63blmknjbhvg43e2d',
      }),
      attributes: UserSchema,
      links: z.object({
        self: z
          .string()
          .url()
          .optional()
          .openapi({
            example: `https://api.website.com/${entityType}/thgbw45brtb4rt5676uh`,
          }),
      }),
    }),
  }),
);

// ROUTE //
export const route = createRoute({
  method: 'get',
  path: `/${entityType}/{id}`,
  request: {
    params: ParamsSchema,
    query: QuerySchema,
  },
  description: 'Retrieve single user by ID. Use "me" to retrieve the current user.',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'Retrieve single task',
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
  const params = c.req.valid('param');
  const query = c.req.valid('query');
  const user = getCurentUser(c);

  if (!user) {
    // Unauthorized
    return unauthorizedResponse(c);
  }

  if (params.id === 'me') {
    params.id = user.id;
  }

  // Show details of other users to admins only
  if (user.id !== params.id && user.role !== 'admin' && user.role !== 'superadmin') {
    return unauthorizedResponse(c);
  }

  const result = await db.select().from(UsersTable).where(eq(UsersTable.id, params.id));

  if (result.length === 0) {
    return notFoundResponse(c);
  }

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
