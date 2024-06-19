import { ProjectsTable } from '@/features/project/models/projects.table';
import { z } from '@hono/zod-openapi';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const SelectProjectSchema = createSelectSchema(ProjectsTable);
export const CreateProjectSchema = createInsertSchema(ProjectsTable, {
  title: z.string().min(1),
}).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateProjectSchema = CreateProjectSchema.omit({
  teamId: true,
});

export const ProjectSchema = z
  .object(SelectProjectSchema.shape)
  .openapi({
    example: {
      id: 'gy63blmknjbhvg43e2d',
      title: 'First Project',
      teamId: 'k23wjser46yidy7qngs',
      ownerId: 'kser4623wjyidygs7qn',
      createdAt: '2024-04-19T14:37:58.000Z',
      updatedAt: '2024-04-19T14:37:58.000Z',
    },
  })
  .openapi('Project');
