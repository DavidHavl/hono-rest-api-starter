import type { Hook } from '@hono/zod-openapi';
import { ZodError } from 'zod';
import { createErrorResponseDocumentFromError } from '@/common/responses/factories';
import type { NonBodyTarget } from '@/common/types';
import type { AppBindings } from '@/types';

function isBodyTarget(target: string): boolean {
  return target === 'json' || target === 'form';
}

const defaultHook: Hook<unknown, AppBindings, string, unknown> = (result, c) => {
  if (!('success' in result) || result.success || !('error' in result)) return;
  if (!(result.error instanceof ZodError)) return;

  const target = result.target as NonBodyTarget | 'json' | 'form';
  const status: 400 | 422 = isBodyTarget(target) ? 422 : 400;

  c.get('logger').withContext({ error: result.error, target }).warn('Validation failed in default hook');

  const baseUrl = new URL(c.req.url).origin;

  return c.json(createErrorResponseDocumentFromError(result.error, baseUrl, status, target), status, {
    'Content-Type': 'application/vnd.api+json',
  });
};

export default defaultHook;
