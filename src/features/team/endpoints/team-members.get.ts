import { getCurentUser } from '@/features/auth/utils/current-user';
import { ErrorResponseSchema } from '@/features/shared/models/error-respone.schema';
import { createCollectionSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { TeamMemberSchema } from '@/features/team/models/team-member.schema';
import type { TeamMember } from '@/features/team/models/team-member.type';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import type { User } from '@/features/user/models/user.type';
import { UsersTable } from '@/features/user/models/users.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { eq, inArray } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'team-members';

// LOCAL SCHEMAS //

const fieldKeys = Object.keys(TeamMemberSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
  include: z.enum(['user']).optional().openapi({ example: 'user' }),
  teamId: z.string().optional().openapi({ example: '123456789' }),
});

interface RequestValidationTargets {
  out: {
    query: z.infer<typeof QuerySchema>;
  };
}

const ResponseSchema = createCollectionSuccessResponseSchema(entityType, TeamMemberSchema);

// ROUTE //
export const route = createRoute({
  method: 'get',
  path: `/${entityType}`,
  request: {
    query: QuerySchema,
  },
  description: 'Retrieve team members of given team',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'Retrieve teams',
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
  },
});

// HANDLER //
export const handler = async (c: Context<Env, typeof entityType, RequestValidationTargets>) => {
  const db = c.get('db');
  const origin = new URL(c.req.url).origin;
  const query = c.req.valid('query');
  const { fields, include, teamId } = query;
  const user = await getCurentUser(c);

  if (!user) {
    // Unauthorized
    return unauthorizedResponse(c);
  }

  let teamMemberResult: TeamMember[];
  if (teamId !== undefined) {
    teamMemberResult = await db.select().from(TeamMembersTable).where(eq(TeamMembersTable.teamId, teamId));
    // Check if user is a member of the team
    if (teamMemberResult.length === 0 || !teamMemberResult.some((teamMember) => teamMember.userId === user.id)) {
      return unauthorizedResponse(c, 'Not a member of given team');
    }
  } else {
    teamMemberResult = await db
      .select()
      .from(TeamMembersTable)
      .where(eq(TeamMembersTable.userId, user.id))
      .orderBy(TeamMembersTable.createdAt);
  }

  let users: User[] = [];
  if (include?.split(',').includes('user')) {
    const userIds = teamMemberResult.map((teamMember) => teamMember.userId);
    if (userIds.length > 0) {
      users = await db.select().from(UsersTable).where(inArray(UsersTable.id, userIds));
    }
  }

  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: teamMemberResult.map((teamMember) => ({
      id: teamMember.id,
      type: entityType,
      attributes: fields ? pickObjectProperties(teamMember, fields.split(',')) : teamMember,
      links: {
        self: `${origin}/${entityType}/${teamMember.id}`,
      },
      relationships: {
        user:
          users.length > 0
            ? {
                data: {
                  id: teamMember.userId,
                  type: 'users',
                  attributes: users.find((user) => user.id === teamMember.userId),
                },
              }
            : undefined,
      },
    })),
    links: {
      self: `${origin}/${entityType}${buildUrlQueryString(query)}`,
    },
  });
};
