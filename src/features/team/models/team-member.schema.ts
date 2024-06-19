import { TeamMembersTable } from '@/features/team/models/team-members.table';
import { createInsertSchema } from 'drizzle-zod';

export const TeamMemberSchema = createInsertSchema(TeamMembersTable);
// .openapi({
//   example: {
//     id: 'gy63blmknjbhvg43e2d',
//     userId: 'lm2dknjg4bg3bhv3ey6',
//     teamId: 'lm2dknjg4bg3bhv3ey6',
//     hasUserAccepted: true,
//     hasResourceAccepted: true,
//     createdAt: '2021-01-01T00:00:00.000Z',
//     updatedAt: '2021-01-01T00:00:00.000Z',
//   },
// })
// .openapi('TeamMember');

export const CreateTeamMemberSchema = createInsertSchema(TeamMembersTable);
// .openapi({
//   example: {
//     id: 'gy63blmknjbhvg43e2d',
//     userId: 'lm2dknjg4bg3bhv3ey6',
//     teamId: 'lm2dknjg4bg3bhv3ey6',
//     hasUserAccepted: true,
//     hasResourceAccepted: true,
//     createdAt: '2021-01-01T00:00:00.000Z',
//     updatedAt: '2021-01-01T00:00:00.000Z',
//   },
// })
// .openapi('TeamMember');
