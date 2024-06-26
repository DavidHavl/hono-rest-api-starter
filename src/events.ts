import type { Project } from '@/features/project/models/project.type';
import type { TaskList } from '@/features/task/models/task-list.type';
import type { TeamMember } from '@/features/team/models/team-member.type';
import type { Team } from '@/features/team/models/team.type';
import type { User } from '@/features/user/models/user.type';
import type { Context } from 'hono';
import { createEmitter } from 'hono-event-emitter';

export type EmitterEvents = {
  'user.created': { c: Context; user: User };
  'team.created': { c: Context; team: Team };
  'team-member.created': { c: Context; teamMember: TeamMember };
  'project.created': { c: Context; project: Project };
  'project.updated': { c: Context; project: Project };
  'project.deleted': { c: Context; projectId: string };
  'task-list.created': { c: Context; taskList: TaskList };
};

export const emitter = createEmitter<EmitterEvents>();
