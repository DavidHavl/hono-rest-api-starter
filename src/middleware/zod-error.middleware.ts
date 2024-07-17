import { invalidInputResponse } from '@/features/shared/responses/invalid-input.response';
import type { Context } from 'hono';
import { ZodError } from 'zod';

type ResultType = { success: false; error: ZodError<unknown> };

/**
 * Middleware to handle Zod errors
 */
export const zodErrorMiddleware = (result: ResultType, c: Context) => {
  if (!result.success && 'error' in result && result.error instanceof ZodError) {
    return invalidInputResponse(c, result.error.errors);
  }
};
