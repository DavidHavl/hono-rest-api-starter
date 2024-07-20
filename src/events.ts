import type { Project } from '@/features/project/models/project.type';
import type { TaskList } from '@/features/task/models/task-list.type';
import type { Task } from '@/features/task/models/task.type';
import type { TeamMember } from '@/features/team/models/team-member.type';
import type { Team } from '@/features/team/models/team.type';
import type { User } from '@/features/user/models/user.type';
import { createEmitter } from 'hono-event-emitter';

export type EmitterEvents = {
  'auth:signin': { user: User };
  'auth:signout': { user: User };
  'user:created': { user: User };
  'team:created': { team: Team };
  'team-member:created': { teamMember: TeamMember };
  'team-member:updated': { teamMember: TeamMember };
  'team-member:deleted': { teamMemberId: string };
  'project:created': { project: Project };
  'project:updated': { project: Project };
  'project:deleted': { projectId: string };
  'task-list:created': { taskList: TaskList };
  'task-list:updated': { taskList: TaskList };
  'task-list:deleted': { taskListId: string };
  'task:created': { task: Task };
  'task:updated': { task: Task };
  'task:deleted': { taskId: string };
};

export const emitter = createEmitter<EmitterEvents>();
