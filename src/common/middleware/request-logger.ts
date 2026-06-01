import { honoLogLayer } from '@loglayer/hono';
import type { ILogLayer } from 'loglayer';
import { logger } from '@/common/logger';

declare module 'hono' {
  interface ContextVariableMap {
    logger: ILogLayer;
  }
}

export const requestLogger = honoLogLayer({
  instance: logger,
  autoLogging: {
    // request: { logLevel: "debug" },
    // response: { logLevel: "info" },
    // ignore: ['/health'],
  },
});
