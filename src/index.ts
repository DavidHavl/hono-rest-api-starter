import { bootstrapFeatures } from '@/features/bootstrap';
import { dbMiddleware } from '@/middleware/db.middleware';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { zodErrorMiddleware } from './middleware/zod-error.middleware';
import type { Env, Vars } from './types';

export const app = new OpenAPIHono<{
  Bindings: Env;
  Variables: Vars;
}>({
  defaultHook: zodErrorMiddleware,
});

// MIDDLEWARE //
app.use(logger());

// Helmet like middleware
app.use(secureHeaders());

// CORS //
app.use((c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGINS.split(','), // (origin) => origin,
    allowHeaders: ['Content-Type', 'X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['POST', 'GET', 'DELETE', 'PATCH', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

app.use((c, next) => {
  const csrfMiddleware = csrf({
    origin: c.env.CORS_ORIGINS.split(','),
  });
  return csrfMiddleware(c, next);
});

// DB //
app.use(dbMiddleware);

// CACHE //
// app.get(
//   '*',
//   cache({
//     cacheName: 'my-app',
//     cacheControl: 'max-age=3600',
//   })
// )

// Set up features (endpoints, events,...)
bootstrapFeatures(app);

// The OpenAPI documentation will be available at /docs
app.doc('/', (c) => ({
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Task Manager API',
  },
  servers: [
    {
      url: 'http://localhost:8787',
      description: 'Development environment',
    },
    {
      url: new URL(c.req.url).origin,
      description: 'Production environment',
    },
  ],
}));

app.get(
  '/docs',
  swaggerUI({
    url: '/',
  }),
);

// 404
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Route not found',
    },
    { status: 404 },
  );
});

// Error handling
app.onError((err, c) => {
  console.error('app.onError', err);
  if (err instanceof HTTPException) {
    // Get the custom response
    return err.getResponse();
  }
  return c.json(err, { status: 500 });
});

export default app;
