import type { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { BadRequestError, type BadRequestErrorOptions } from '@/common/errors/bad-request.error';
import { createErrorResponseDocumentFromError, createErrorResponseDocumentSchema } from '@/common/responses/factories';
import { getPossibleZodIssues, zodIssueToValidationErrorMeta } from '@/common/utils/zod';
import { jsonApiBadRequestErrorObjectSchema } from '../errors/schemas';

// 400 Bad Request //

/**
 * Response for: invalid query, path or header parameters. Not body validation!
 * Reserved for malformed requests — broken JSON, invalid query parameter syntax, missing required headers.
 * Do not use it for "request was well-formed but a field failed validation" — that is 422 in JSON:API!
 */
export const badRequestResponse = (c: Context, detail: string, options: BadRequestErrorOptions) => {
  const url = new URL(c.req.url);
  return c.json(
    createErrorResponseDocumentFromError(new BadRequestError(detail, options), url.origin, 400) as BadRequestResponse,
    400,
    {
      'Content-Type': 'application/vnd.api+json',
    },
  );
};

export const BadRequestResponseSchema = createErrorResponseDocumentSchema(
  jsonApiBadRequestErrorObjectSchema,
  'JsonApiBadRequestResponse',
  'JSON:API error response for invalid query, path or header parameters.',
  {
    jsonapi: { version: '1.1' },
    errors: [
      {
        status: '400',
        title: 'Bad Request',
        detail: 'Invalid UUID',
        code: 'invalid_format',
        source: { parameter: 'id' },
        meta: {
          ZodIssue: {
            code: 'invalid_format',
            format: 'uuid',
          },
        },
      },
    ],
  },
);

export function badRequestResponseContentSchema(
  options: BadRequestResponseContentSchemaConfig,
  description = 'Bad Request',
) {
  const sources: Array<[z.ZodObject<z.ZodRawShape>, 'parameter' | 'header']> = [];
  if (options.params) sources.push([options.params, 'parameter']);
  if (options.query) sources.push([options.query, 'parameter']);
  if (options.headers) sources.push([options.headers, 'header']);

  const potentialErrors = sources.flatMap(([schema, sourceKind]) =>
    Object.entries(schema.shape).flatMap(([fieldName, fieldSchema]) =>
      getPossibleZodIssues(fieldSchema as z.ZodTypeAny).map((issue) => ({
        // TODO: check if this is ok!
        status: '400' as const,
        title: 'Bad Request' as const,
        detail: issue.message,
        code: issue.code,
        source: sourceKind === 'header' ? { header: fieldName } : { parameter: fieldName },
        meta: zodIssueToValidationErrorMeta(issue),
      })),
    ),
  );

  return {
    content: {
      'application/vnd.api+json': {
        schema: BadRequestResponseSchema,
        example: {
          jsonapi: { version: '1.1' },
          errors:
            potentialErrors.length > 0
              ? potentialErrors
              : [
                  {
                    status: '400',
                    title: 'Bad Request',
                    detail: 'Invalid input: expected string, received undefined',
                    code: 'invalid_type',
                    source: { parameter: 'id' },
                    meta: {
                      ZodIssue: {
                        code: 'invalid_type',
                        expected: 'string',
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

export type BadRequestResponse = z.infer<typeof BadRequestResponseSchema>;

export interface BadRequestResponseContentSchemaConfig {
  /** Path parameters schema, e.g. z.object({ id: z.uuidv7() }) */
  params?: z.ZodObject;
  /** Query parameters schema, e.g. z.object({ "filter[status]": z.enum([...]) }) */
  query?: z.ZodObject;
  /** Request headers schema, e.g. z.object({ "x-api-version": z.string() }) */
  headers?: z.ZodObject;
}
