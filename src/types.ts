import type { EmitterEvents } from '@/events';
import type { Session } from '@/features/auth/models/session';
import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import type { Emitter } from 'hono-event-emitter';

export type Env = {
  Bindings: {
    ENVIRONMENT: string;
    PROJECT_NAME: string;
    CORS_ORIGINS: string;
    COOKIE_DOMAIN: string;
    AUTH_REDIRECT_URL: string;
    AUTH_SECRET: string;
    AUTH_GITHUB_CLIENT_ID: string;
    AUTH_GITHUB_CLIENT_SECRET: string;
    AUTH_SESSION_EXPIRATION_MS: number;
    BASE_URL: string;
    D1: D1Database;
    KV: KVNamespace;
  };
  Variables: {
    db: DrizzleD1Database;
    kv: KVNamespace;
    emitter: Emitter<EmitterEvents>;
    session?: Session;
  };
};
