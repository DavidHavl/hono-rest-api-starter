import { cors as honoCors } from 'hono/cors';
import { env } from '@/env';

export const cors = honoCors({
  origin: env.CORS_ORIGINS.split(','),
  allowHeaders: ['Content-Type', 'Accept', 'X-Auth-Return-Redirect', 'X-Custom-Header', 'Upgrade-Insecure-Requests'],
  allowMethods: ['POST', 'GET', 'DELETE', 'PATCH', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
});
