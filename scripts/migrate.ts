import 'dotenv/config';
import { D1DatabaseAPI, D1Database as MiniflareD1Database } from '@miniflare/d1';
import { createSQLiteDB } from '@miniflare/shared';
import { drizzle } from 'drizzle-orm/d1';
import { migrate } from 'drizzle-orm/d1/migrator';

const sqliteDb = await createSQLiteDB(':memory:');
const d1 = new MiniflareD1Database(new D1DatabaseAPI(sqliteDb));
const db = drizzle(d1 as unknown as D1Database, { logger: true });
// This will run migrations on the database, skipping the ones already applied
await migrate(db, { migrationsFolder: './migrations' });
// Don't forget to close the connection, otherwise the script will hang
await sqliteDb.close();
