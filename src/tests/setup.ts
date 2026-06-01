import { vi } from 'vitest';

// Mock environment variables for testing
// biome-ignore lint/style/noProcessEnv: We need to set these for the tests to work
process.env.NODE_ENV = 'test';
// biome-ignore lint/style/noProcessEnv: We need to set these for the tests to work
process.env.PORT = '3001';
// biome-ignore lint/style/noProcessEnv: We need to set these for the tests to work
process.env.HOST = 'localhost';
// biome-ignore lint/style/noProcessEnv: We need to set these for the tests to work
process.env.BASE_PATH = '';
// biome-ignore lint/style/noProcessEnv: We need to set these for the tests to work
process.env.API_MAJOR_VERSION = 'v1';
// biome-ignore lint/style/noProcessEnv: We need to set these for the tests to work
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/hono_test';
// biome-ignore lint/style/noProcessEnv: We need to set these for the tests to work
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only';
// biome-ignore lint/style/noProcessEnv: We need to set these for the tests to work
process.env.BETTER_AUTH_URL = 'http://localhost:3001';
// biome-ignore lint/style/noProcessEnv: We need to set these for the tests to work
process.env.LOG_LEVEL = 'error';

// Silence logger during tests
vi.mock('../common/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));
