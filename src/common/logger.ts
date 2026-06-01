import { getSimplePrettyTerminal, moonlight } from '@loglayer/transport-simple-pretty-terminal';
import { LogLayer } from 'loglayer';
import { serializeError } from 'serialize-error';

// https://loglayer.dev/integrations/hono.html

export const logger = new LogLayer({
  errorSerializer: serializeError,
  transport: [
    getSimplePrettyTerminal({ runtime: 'node', theme: moonlight }),
    // Debug0Transport({ id: 'debug0', logger: debug0 }),
    // NattioTransport({ id: 'nattio', logger: nattio }),
    // DebugZeroTransport({ id: 'debug-zero', logger: debugZero }),
    // BugRayTransport({ id: 'bugray', logger: bugray }),
    // BugViewTransport({ id: 'bugview', logger: bugview }),
  ],
});

export type Logger = typeof logger;
