import type { EmitterEvents } from '@/events';
import type { Emitter } from '@/utils/emitter';
import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';

export type Env = {
  CORS_ORIGINS: string;
  COOKIE_DOMAIN: string;
  AUTH_REDIRECT_URL: string;
  AUTH_SECRET: string;
  AUTH_GITHUB_CLIENT_ID: string;
  AUTH_GITHUB_CLIENT_SECRET: string;
  BASE_URL: string;
  D1Database: D1Database;
};

export type Vars = {
  db: DrizzleD1Database;
  emitter: Emitter<EmitterEvents>;
};
