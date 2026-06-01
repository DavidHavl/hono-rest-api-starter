import type { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { llms } from '@/common/middleware/llms';
import { env } from '@/env';
import type { AppBindings } from '@/types';
import packageJSON from '../../package.json';

export const configureOpenApi = (app: OpenAPIHono<AppBindings>) => {
  // OpenAPI specification
  app.doc(`/${env.API_MAJOR_VERSION}/openapi.json`, {
    openapi: '3.1.0',
    info: {
      title: env.PROJECT_TITLE ?? 'Hono REST API Starter',
      version: packageJSON.version,
      description: 'A production-ready REST API built with Hono, Drizzle ORM, and JSON:API specification.',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [{ url: `http://${env.HOST}:${env.PORT}` }],
  });

  // Scalar UI
  app.get(
    `/${env.API_MAJOR_VERSION}/docs`,
    Scalar({
      theme: 'kepler',
      url: `/${env.API_MAJOR_VERSION}/openapi.json`,
      pageTitle: 'API Reference',
      defaultHttpClient: {
        targetKey: 'node',
        clientKey: 'fetch',
      },
    }),
  );

  // LLMs enabled
  app.get(
    `/${env.API_MAJOR_VERSION}/llms.txt`,
    llms(
      app.getOpenAPI31Document({
        openapi: '3.1.0',
        info: { title: env.PROJECT_TITLE ?? 'Hono REST API Starter', version: env.API_MAJOR_VERSION },
      }),
    ),
  );
};
