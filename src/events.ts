import type { Project } from '@/features/project/models/project.type';
import type { TaskList } from '@/features/task/models/task-list.type';
import type { TeamMember } from '@/features/team/models/team-member.type';
import type { Team } from '@/features/team/models/team.type';
import type { User } from '@/features/user/models/user.type';
import { createEmitter } from '@/utils/emitter';
import type { Context } from 'hono';

export type EmitterEvents = {
  'user.created': { c: Context; user: User };
  'team.created': { c: Context; team: Team };
  'team-member.created': { c: Context; teamMember: TeamMember };
  'project.created': { c: Context; project: Project };
  'task-list.created': { c: Context; taskList: TaskList };
};

export const emitter = createEmitter<EmitterEvents>();
