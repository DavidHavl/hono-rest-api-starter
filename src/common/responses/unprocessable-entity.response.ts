import type { z } from '@hono/zod-openapi';
import { jsonApiUnprocessableEntityErrorObjectSchema } from '@/common/errors/schemas/unprocessable-entity-error.schema';
import { createErrorResponseDocumentSchema } from '@/common/responses/factories';
import { getPossibleZodIssues, zodIssueToValidationErrorMeta } from '@/common/utils/zod';

// ============================================================================
// 422 Unprocessable Entity ---------------------------------------------------
// ============================================================================
// Request body failed Zod validation. One error object per field violation.

export const jsonApiUnprocessableEntityResponseSchema = createErrorResponseDocumentSchema(
  jsonApiUnprocessableEntityErrorObjectSchema,
  'JsonApiUnprocessableResponse',
  'JSON:API error response for request body validation failures. ' +
    'One error object per field violation, mapped from Zod ZodIssue array.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
        status: '422',
        title: 'Unprocessable Entity',
        detail: 'Invalid email address',
        code: 'invalid_format',
        source: { pointer: '/data/attributes/email' },
        meta: {
          ZodIssue: {
            code: 'invalid_format',
            format: 'email',
          },
        },
      },
      {
        id: '01933e8a-7c4e-7c8a-9b3f-2d1e4f5a6b8c',
        status: '422',
        title: 'Unprocessable Entity',
        detail: 'Invalid input: expected string, received undefined',
        code: 'invalid_type',
        source: { pointer: '/data/attributes/name' },
        meta: {
          ZodIssue: {
            code: 'invalid_type',
            expected: 'string',
          },
        },
      },
    ],
  },
);

export function unprocessableEntityResponseContentSchema(
  schema: z.ZodObject<z.ZodRawShape>,
  description = 'Unprocessable Entity',
) {
  const potentialErrors = Object.entries(schema.shape).flatMap(([fieldName, fieldSchema]) =>
    getPossibleZodIssues(fieldSchema as z.ZodTypeAny).map((issue) => ({
      status: '422' as const,
      title: 'Unprocessable Entity' as const, // Validation Error
      detail: issue.message,
      code: issue.code,
      source: { pointer: `/data/attributes/${fieldName}` },
      meta: zodIssueToValidationErrorMeta(issue),
    })),
  );

  return {
    content: {
      'application/vnd.api+json': {
        schema: jsonApiUnprocessableEntityResponseSchema,
        example: {
          jsonapi: { version: '1.1' },
          errors:
            potentialErrors.length > 0
              ? potentialErrors
              : [
                  {
                    status: '422',
                    title: 'Unprocessable Entity', // Validation Error
                    detail: 'Invalid input: expected string, received undefined',
                    code: 'invalid_type',
                    source: { pointer: `/data/attributes/name` },
                    meta: {
                      ZodIssue: {
                        expected: 'string',
                        code: 'invalid_type',
                      },
                    },
                  },
                ],
        },
      },
    },
    description,
  };
}

export type UnprocessableEntityResponseSchema = z.infer<typeof jsonApiUnprocessableEntityResponseSchema>;
