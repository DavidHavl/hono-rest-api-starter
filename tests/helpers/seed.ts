import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { ProjectsTable } from '../../src/features/project/models/projects.table';
import { TaskListsTable } from '../../src/features/task/models/task-lists.table';
import { TasksTable } from '../../src/features/task/models/tasks.table';
import { TeamMembersTable } from '../../src/features/team/models/team-members.table';
import { TeamsTable } from '../../src/features/team/models/teams.table';
import { UsersTable } from '../../src/features/user/models/users.table';

export const seed = async (db: DrizzleD1Database) => {
  // Users //
  const users = await db
    .insert(UsersTable)
    .values([
      {
        role: 'admin',
        githubId: '123456',
        email: 'test1@test.com',
        username: 'test1',
        fullName: 'Test 1',
        avatarUrl: 'https://avatars.githubusercontent.com/u/123456',
      },
      {
        role: 'user',
        githubId: '789012',
        email: 'test2@test.com',
        username: 'test2',
        fullName: 'Test 2',
        avatarUrl: 'https://avatars.githubusercontent.com/u/789012',
      },
    ])
    .returning();

  // Teams //
  const teams = await db
    .insert(TeamsTable)
    .values([
      {
        title: 'Team 1',
        ownerId: users[0].id,
      },
      {
        title: 'Team 2',
        ownerId: users[1].id,
      },
    ])
    .returning();

  // Team Members //
  const teamMembersData = [
    {
      userId: users[0].id,
      teamId: teams[0].id,
      hasTeamAccepted: true,
      hasUserAccepted: true,
    },
    {
      userId: users[1].id,
      teamId: teams[1].id,
      hasTeamAccepted: true,
      hasUserAccepted: true,
    },
  ];
  const teamMembers = await db.insert(TeamMembersTable).values(teamMembersData).returning();

  // Projects //
  const projects = await db
    .insert(ProjectsTable)
    .values([
      {
        title: 'Project 1',
        teamId: teams[0].id,
        ownerId: users[0].id,
      },
      {
        title: 'Project 2',
        teamId: teams[1].id,
        ownerId: users[1].id,
      },
    ])
    .returning();

  // Task Lists //
  const tasksListsData = [
    {
      title: 'Task List 1',
      teamId: teams[0].id,
      projectId: projects[0].id,
      ownerId: users[0].id,
      position: 1,
    },
    {
      title: 'Task List 2',
      teamId: teams[0].id,
      projectId: projects[0].id,
      ownerId: users[0].id,
      position: 2,
    },
    {
      title: 'Task List 3',
      projectId: projects[1].id,
      teamId: teams[1].id,
      ownerId: users[1].id,
      position: 1,
    },
  ];
  const taskLists = await db.insert(TaskListsTable).values(tasksListsData).returning();

  // Tasks //
  const tasksData = [
    {
      title: 'Task 1',
      description: 'Task 1 description',
      teamId: teams[0].id,
      projectId: projects[0].id,
      listId: taskLists[0].id,
      ownerId: users[0].id,
      assigneeId: users[1].id,
      position: 1,
    },
    {
      title: 'Task 2',
      description: 'Task 3 description',
      teamId: teams[0].id,
      projectId: projects[0].id,
      listId: taskLists[0].id,
      ownerId: users[0].id,
      assigneeId: users[1].id,
      position: 2,
    },
    {
      title: 'Task 3',
      description: 'Task 3 description',
      teamId: teams[0].id,
      projectId: projects[0].id,
      listId: taskLists[0].id,
      ownerId: users[0].id,
      assigneeId: users[1].id,
      position: 3,
    },
    {
      title: 'Task 4',
      description: 'Task 4 description',
      teamId: teams[1].id,
      projectId: projects[1].id,
      listId: taskLists[1].id,
      ownerId: users[1].id,
      assigneeId: users[0].id,
      position: 1,
    },
    {
      title: 'Task 5',
      description: 'Task 5 description',
      teamId: teams[1].id,
      projectId: projects[1].id,
      listId: taskLists[1].id,
      ownerId: users[1].id,
      assigneeId: users[0].id,
      position: 2,
    },
  ];
  const tasks = await db.insert(TasksTable).values(tasksData).returning();

  return {
    users,
    teams,
    teamMembers,
    projects,
    taskLists,
    tasks,
  };
};
