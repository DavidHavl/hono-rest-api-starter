import { TeamsTable } from '@/features/team/models/teams.table';
import { z } from '@hono/zod-openapi';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const SelectTeamSchema = createSelectSchema(TeamsTable);

export const CreateTeamSchema = createInsertSchema(TeamsTable, {
  title: z.string().min(1),
}).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateTeamSchema = CreateTeamSchema;

export const TeamSchema = z
  .object(SelectTeamSchema.shape)
  .openapi({
    example: {
      id: 'k23wjser46yidy7qngs',
      title: 'My Team',
      ownerId: 'kser4623wjyidygs7qn',
      createdAt: '2024-04-19T14:37:58.000Z',
      updatedAt: '2024-04-19T14:37:58.000Z',
    },
  })
  .openapi('Team');
