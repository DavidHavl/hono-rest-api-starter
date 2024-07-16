import { emitter } from '@/events';
import { getCurentUser } from '@/features/auth/utils/current-user';
import { InvalidInputResponseSchema, invalidInputResponse } from '@/features/shared/responses/invalid-input.response';
import { notFoundResponse } from '@/features/shared/responses/not-found.response';
import { createSuccessResponseSchema } from '@/features/shared/responses/success.response';
import { UnauthorizedResponseSchema, unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { CreateTeamMemberSchema, TeamMemberSchema } from '@/features/team/models/team-member.schema';
import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { TeamsTable } from '@/features/team/models/teams.table';
import { UsersTable } from '@/features/user/models/users.table';
import type { Env } from '@/types';
import { pickObjectProperties } from '@/utils/object';
import { buildUrlQueryString } from '@/utils/url';
import { createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

const entityType = 'team-members';

// LOCAL SCHEMAS //

const fieldKeys = Object.keys(TeamMemberSchema.shape) as [string];
const QuerySchema = z.object({
  fields: z.enum<string, typeof fieldKeys>(fieldKeys).optional(),
});

interface RequestValidationTargets {
  out: {
    query: z.infer<typeof QuerySchema>;
    json: z.infer<typeof CreateTeamMemberSchema>;
  };
}

const ResponseSchema = createSuccessResponseSchema(entityType, TeamMemberSchema);

// ROUTE //
export const route = createRoute({
  method: 'post',
  path: `/${entityType}`,
  request: {
    query: QuerySchema,
    body: {
      content: {
        'application/vnd.api+json': {
          schema: CreateTeamMemberSchema,
        },
      },
      required: true,
    },
    description: 'Data to create new team-member from',
  },
  description: 'Create new team-member for a given team',
  responses: {
    200: {
      content: {
        'application/vnd.api+json': {
          schema: ResponseSchema,
        },
      },
      description: 'The new team-member',
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
          schema: InvalidInputResponseSchema,
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
  const input = c.req.valid('json');
  const user = await getCurentUser(c);

  if (!user) {
    return unauthorizedResponse(c, 'No user found');
  }

  // Input validation
  const validation = CreateTeamMemberSchema.safeParse(input);
  if (validation.success === false) {
    return invalidInputResponse(c, validation.error.errors);
  }
  // Validated data
  const validatedData = validation.data;

  // Check if user is an owner of the specified team
  const teamResult = await db
    .select()
    .from(TeamsTable)
    .where(and(eq(TeamsTable.id, validatedData.teamId), eq(TeamsTable.ownerId, user.id)));

  // Authorization
  if (teamResult.length === 0) {
    return unauthorizedResponse(c);
  }

  // Check if user with given email exists
  const userResult = await db.select().from(UsersTable).where(eq(UsersTable.email, validatedData.email));
  if (userResult.length === 0) {
    return notFoundResponse(c, 'No user found with given email');
  }
  const userId = userResult[0].id;

  // Check if team member already exists
  let result = await db
    .select()
    .from(TeamMembersTable)
    .where(and(eq(TeamMembersTable.teamId, validatedData.teamId), eq(TeamMembersTable.userId, userId)));

  // If member does not exist in team yet, create it
  if (result.length === 0) {
    // Insert into DB
    result = await db
      .insert(TeamMembersTable)
      .values({
        // Specifying one by one because of DrizzleORM bug preventing from using `...validatedData` directly
        teamId: validatedData.teamId,
        userId,
        hasTeamAccepted: true,
      })
      .returning();

    // Emit event
    await emitter.emitAsync('team-member:created', c, { teamMember: result[0] });
  }
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
