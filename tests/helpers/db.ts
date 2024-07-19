import * as path from 'node:path';
import { D1DatabaseAPI, D1Database as MiniflareD1Database } from '@miniflare/d1';
import { createSQLiteDB } from '@miniflare/shared';
import type { Database } from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { migrate } from 'drizzle-orm/d1/migrator';
import { seed } from './seed';

export class TestDatabase {
  sqliteDb: Database = null;
  d1Instance = null;
  drizzleInstance = null;

  async setup(): Promise<void> {
    this.sqliteDb = await createSQLiteDB(':memory:');
    this.d1Instance = new MiniflareD1Database(new D1DatabaseAPI(this.sqliteDb));
    this.drizzleInstance = drizzle(this.d1Instance, { logger: true });
  }

  async teardown(): Promise<void> {
    this.d1Instance = null;
    this.drizzleInstance = null;
    return this.sqliteDb.close();
  }

  async seed() {
    if (!this.drizzleInstance) {
      throw new Error('Database not initialized');
    }
    // run migrations
    await migrate(this.drizzleInstance, { migrationsFolder: path.join(__dirname, '../../migrations') });
    return seed(this.drizzleInstance);
  }

  async clear() {
    if (!this.drizzleInstance) {
      throw new Error('Database not initialized');
    }
    // Get all table names
    const tables = await this.drizzleInstance
      .select({ name: sql<string>`name` })
      .from(sql<string>`sqlite_master`)
      .where(sql<string>`type = 'table' AND name != 'sqlite_sequence'`);

    // Enable foreign key constraint dropping
    await this.drizzleInstance.run(sql`PRAGMA foreign_keys = OFF`);

    // Drop each table
    if (tables.length === 0) {
      for (const { name } of tables) {
        await this.drizzleInstance.run(sql`DROP TABLE IF EXISTS ${sql.identifier(name)}`);
      }
    }
    // Re-enable foreign key constraints
    await this.drizzleInstance.run(sql`PRAGMA foreign_keys = ON`);

    // await this.drizzleInstance.delete(UsersTable);
    // await this.drizzleInstance.delete(TeamsTable);
    // await this.drizzleInstance.delete(TeamMembersTable);
    // await this.drizzleInstance.delete(ProjectsTable);
    // await this.drizzleInstance.delete(TaskListsTable);
    // await this.drizzleInstance.delete(TasksTable);
  }
}
