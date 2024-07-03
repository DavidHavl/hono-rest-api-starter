import type { Project } from '@/features/project/models/project.type';
import type { TaskList } from '@/features/task/models/task-list.type';
import type { TeamMember } from '@/features/team/models/team-member.type';
import type { Team } from '@/features/team/models/team.type';
import type { User } from '@/features/user/models/user.type';
import { createEmitter } from 'hono-event-emitter';

export type EmitterEvents = {
  'user.created': { user: User };
  'team.created': { team: Team };
  'team-member.created': { teamMember: TeamMember };
  'project.created': { project: Project };
  'project.updated': { project: Project };
  'project.deleted': { projectId: string };
  'task-list.created': { taskList: TaskList };
};

export const emitter = createEmitter<EmitterEvents>();
