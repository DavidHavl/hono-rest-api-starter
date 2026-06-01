import { OpenAPIHono } from '@hono/zod-openapi';
import { csrf } from 'hono/csrf';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { cors } from '@/common/middleware/cors';
import defaultHook from '@/common/middleware/default-hook';
import { healthHandler } from '@/common/middleware/health';
import { jsonApiContentType } from '@/common/middleware/jsonapi-content-type';
import { requestId } from '@/common/middleware/request-id';
import { configureOpenApi } from '@/common/openapi';
import { env } from '@/env';
import itemFeature from '@/features/item';
import { errorHandler } from './common/middleware/error';
import { faviconHandler } from './common/middleware/favicon';
import { notFound } from './common/middleware/not-found';
import { requestLogger } from './common/middleware/request-logger';
import testRoutes from './features/test/routes';
import type { AppBindings } from './types';

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export function createApp() {
  const app = createRouter();

  // CORS //
  app.use(cors);

  // CSRF
  app.use(
    csrf({
      origin: env.CORS_ORIGINS.split(','),
    }),
  );

  app.use(secureHeaders());
  app.use(timing());
  app.use(requestId);
  app.use(requestLogger);

  // JSON:API content type for api routes
  app.use(`/${env.API_MAJOR_VERSION}/*`, jsonApiContentType);

  // Error handler
  app.onError(errorHandler);

  // Favicon handler
  app.get('/favicon.ico', faviconHandler);

  // Health check endpoint
  app.get('/health', healthHandler);

  // Test routes (for validation testing)
  app.route('/', testRoutes);

  // 404 handler
  app.notFound(notFound);

  // OpenAPI
  configureOpenApi(app);

  // TODO: I do not like this much
  // Features
  const features = [
    // userFeature,
    // authFeature,
    itemFeature,
  ];
  for (const feature of features) {
    app.route('/', feature);
  }

  return app;
}
