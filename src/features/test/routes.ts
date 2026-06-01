import { createRoute, z } from '@hono/zod-openapi';
import { createRouter } from '@/app';
import { idParamSchema } from '@/common/request/param/schemas';
import type { AppRouteHandler } from '@/common/types';

const patchBodySchema = z.object({
  data: z.object({
    type: z.literal('tests'),
    attributes: z.object({
      name: z.string().min(3).openapi({ example: 'Test name' }),
      value: z.number().int().min(1).max(100).openapi({ example: 42 }),
    }),
  }),
});

const route = createRoute({
  method: 'patch',
  path: '/v1/tests/{id}',
  tags: ['Tests'],
  summary: 'Update a test resource (for validation testing)',
  request: {
    params: idParamSchema,
    body: {
      content: {
        'application/vnd.api+json': {
          schema: patchBodySchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/vnd.api+json': {
          schema: z.object({ ok: z.boolean() }),
        },
      },
    },
    // 400: badRequestResponseContentSchema('Bad Request'),
    // 422: validationErrorResponseContentSchema('Validation failed'),
  },
});

const router = createRouter();
const handler: AppRouteHandler<typeof route> = async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  return c.json({ ok: true }, 200);
};

router.openapi(route, handler);

export default router;
