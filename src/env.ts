import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('localhost'),
    BASE_URL: z.string().url().default('https://localhost:3000'),
    BASE_PATH: z.string().optional().default(''),
    CORS_ORIGINS: z.string().default('*'),
    PROJECT_TITLE: z.string().default('Hono REST API Starter'),
    API_MAJOR_VERSION: z.string().default('v1'),
    DATABASE_URL: z.string().url(),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    // BETTER_AUTH_SECRET: z.string().min(16),
    // BETTER_AUTH_URL: z.url().default('https://localhost:3000'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && !data.DATABASE_AUTH_TOKEN) {
      ctx.addIssue({
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        message: 'DATABASE_AUTH_TOKEN is required in production',
        path: ['DATABASE_AUTH_TOKEN'],
      });
    }
  });

export type Environment = z.infer<typeof envSchema>;

function loadEnv(): Environment {
  // biome-ignore lint/style/noProcessEnv: In this file, and this file only, we are intentionally using process.env
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(z.treeifyError(result.error).properties);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
