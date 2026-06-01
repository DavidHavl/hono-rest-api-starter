import { z } from '@hono/zod-openapi';

export const idParamSchema = z.object({
  id: z.uuidv7().openapi({ description: 'Resource UUID (v7)', example: '0196b1a2-3c4d-7e8f-9a0b-1c2d3e4f5a6b' }),
});
