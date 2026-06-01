import { serve } from '@hono/node-server';
import { createApp } from './app';
import { logger } from './common/logger';
import { env } from './env';

const apiVersion = env.API_MAJOR_VERSION;

const app = createApp();

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    logger.info(`🚀 Server running at http://localhost:${info.port}`);
    logger.info(`📖 API docs at http://localhost:${info.port}/${apiVersion}/docs`);
  },
);

// Graceful shutdown
function shutdown() {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
