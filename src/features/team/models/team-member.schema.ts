import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { z } from '@hono/zod-openapi';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const SelectTeamMemberSchema = createSelectSchema(TeamMembersTable);

export const CreateTeamMemberSchema = createInsertSchema(TeamMembersTable)
  .omit({
    id: true,
    userId: true,
    hasUserAccepted: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    email: z.string().email().openapi({ example: 'team-member@email.com' }),
  });

export const UpdateTeamMemberSchema = createInsertSchema(TeamMembersTable).omit({
  id: true,
  userId: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
});

export const TeamMemberSchema = z
  .object(SelectTeamMemberSchema.shape)
  .openapi({
    example: {
      id: 'k23wjser46yidy7qngs',
      userId: 'kser4623wjyidygs7qn',
      teamId: 'k23wjser46yidy7qngs',
      hasUserAccepted: true,
      hasResourceAccepted: true,
      createdAt: '2024-04-19T14:37:58.000Z',
      updatedAt: '2024-04-19T14:37:58.000Z',
    },
  })
  .openapi('TeamMember');
