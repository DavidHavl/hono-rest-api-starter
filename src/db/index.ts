import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '@/env';
import { relations, schema } from './schema';

export const db = drizzle(env.DATABASE_URL, {
  schema,
  relations,
});

export type Database = typeof db;
export { relations, schema };
