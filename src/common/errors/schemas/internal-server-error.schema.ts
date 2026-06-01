import { z } from '@hono/zod-openapi';
import { jsonApiErrorLinksSchema } from '../../jsonapi/schemas/schemas';

// ============================================================================
// 500 Internal Server Error --------------------------------------------------
// ============================================================================
// Unhandled exception or infrastructure failure.
// No source: the fault is server-side, not in the request.
// detail must never leak stack traces or internal state to the client.
// meta carries requestId for log correlation — safe to expose.

export const jsonApiInternalServerErrorObjectSchema = z
  .object({
    id: z.uuidv7().openapi({ example: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b98' }),
    status: z.literal('500').openapi({ example: '500' }),
    title: z.literal('Internal Server Error').openapi({
      example: 'Internal Server Error',
    }),
    detail: z.string().openapi({
      description:
        'Generic, sanitised explanation. Must never contain stack traces, ' +
        'database errors, or any internal implementation detail.',
      example: 'An unexpected error occurred. Reference: 01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b98',
    }),
    code: z.string().optional().openapi({
      example: 'INTERNAL_SERVER_ERROR',
    }),
    // source intentionally omitted: server fault, not a request fault
    links: jsonApiErrorLinksSchema.optional(),
    meta: z
      .object({
        traceId: z.string().optional().openapi({
          description: 'Trace identifier for log correlation. Safe to expose to clients.',
          example: '4bf92f3577b34da6a3ce929d0e0e4736',
        }),
        spanId: z.string().optional().openapi({
          description: 'Span identifier for log correlation. Safe to expose to clients.',
          example: '00f067aa0ba902b7',
        }),
        timestamp: z.string().optional().openapi({
          description: 'ISO 8601 timestamp of when the error occurred.',
          example: '2025-04-01T10:00:00.000Z',
        }),
      })
      .catchall(z.unknown())
      .optional()
      .openapi({
        description:
          'Safe server-side metadata for client-side log correlation. ' +
          'Never includes stack traces or internal state.',
        example: {
          traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
          spanId: '00f067aa0ba902b7',
          timestamp: '2025-04-01T10:00:00.000Z',
        },
      }),
  })
  .openapi('JsonApiInternalServerErrorObject');
