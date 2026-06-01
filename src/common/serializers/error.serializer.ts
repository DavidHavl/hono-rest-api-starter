import { ZodError } from 'zod';
import type { $ZodIssue } from 'zod/v4/core';
import type { AppError } from '@/common/errors';
import { BAD_REQUEST_TITLES } from '@/common/errors/bad-request.error';
import type { JsonApiError, JsonApiErrorLinks, JsonApiMeta } from '@/common/jsonapi/types';
import type { NonBodyTarget } from '@/common/types';
import { generateUuid } from '@/common/utils/id';
import { zodIssueToBadRequestErrorOptions, zodIssueToValidationErrorMeta } from '@/common/utils/zod';
import { env } from '@/env';

export function serializeError(
  error: AppError | ZodError,
  baseUrl?: string,
  status?: number,
  target?: NonBodyTarget | 'json' | 'form',
): JsonApiError[] {
  const resolvedBaseUrl = baseUrl ?? env.BASE_URL;

  if (error instanceof ZodError) {
    // 400 - bad request (query / path / header) validation errors
    if (status === 400 && target && !isBodyTarget(target)) {
      return error.issues.map((issue) => buildBadRequestErrorObjectFromZodIssue(issue, target, resolvedBaseUrl));
    }
    // 422 - Default for Zod errors with body or unknown target.
    return serializeZodError(error, resolvedBaseUrl);
  }

  return [
    {
      id: generateUuid(),
      status: status?.toString() ?? error.status?.toString() ?? '400',
      code: error.code,
      title: error.title,
      ...(error.detail !== undefined && { detail: error.detail }), // Return undefined if undefined
      ...(error.source !== undefined && { source: error.source }), // Return undefined if undefined
      ...(error.meta !== undefined && { meta: error.meta }), // Return undefined if undefined
      links: buildErrorLinks(resolvedBaseUrl, error.code),
    },
  ];
}

/**
 * Serialise a body-level ZodError into one or more `VALIDATION_ERROR` objects.
 *
 * `unrecognized_keys` issues are fanned out — one error per unknown key, each
 * with its own pointer — so client form UI can highlight each field.
 */
export function serializeZodError(zodError: ZodError, baseUrl: string): JsonApiError[] {
  const errors: JsonApiError[] = [];

  for (const issue of zodError.issues) {
    if (issue.code === 'unrecognized_keys') {
      const keys = (issue as { keys?: readonly string[] }).keys ?? [];
      for (const key of keys) {
        errors.push({
          id: generateUuid(),
          status: '422',
          code: 'VALIDATION_ERROR',
          title: 'Validation Error',
          detail: issue.message,
          source: { pointer: zodPathToBodyPointer([...issue.path, key]) },
          meta: { validation: 'unrecognized_keys', keys: [key] },
          links: buildErrorLinks(baseUrl, 'VALIDATION_ERROR'),
        });
      }
      continue;
    }

    errors.push({
      id: generateUuid(),
      status: '422',
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: issue.message,
      source: { pointer: zodPathToBodyPointer(issue.path) },
      meta: zodIssueToValidationErrorMeta(issue),
      links: buildErrorLinks(baseUrl, 'VALIDATION_ERROR'),
    });
  }

  return errors;
}
// ============================================================================
// Utilities ------------------------------------------------------------------
// ============================================================================

function isBodyTarget(target: string | undefined): target is 'json' | 'form' {
  return target === 'json' || target === 'form';
}

function buildBadRequestErrorObjectFromZodIssue(
  issue: $ZodIssue,
  target: NonBodyTarget,
  baseUrl: string,
): JsonApiError {
  const variant = zodIssueToBadRequestErrorOptions(issue, target);

  // The variant's correlation id is the JSON:API `id` field — repeated in
  // `detail` lower down for copy-paste ergonomics, per project conventions.
  const id = generateUuid();
  const detail = issue.message;

  const obj: JsonApiError = {
    id,
    status: '400',
    code: variant.code,
    title: BAD_REQUEST_TITLES[variant.code],
    detail,
    links: buildErrorLinks(baseUrl, variant.code),
  };

  if ('source' in variant && variant.source !== undefined) {
    obj.source = variant.source;
  }
  if ('meta' in variant && variant.meta !== undefined) {
    // Variant meta shapes are structurally compatible with JsonApiMeta.
    obj.meta = variant.meta as unknown as JsonApiMeta;
  }
  // INVALID_FIELDS carries `parameter` at the top level in the runtime type;
  // it's lifted into `source.parameter` by the schema. Mirror that here.
  // if (variant.code === 'INVALID_FIELDS') {
  //   obj.source = { parameter: variant.parameter };
  // }

  return obj;
}

/**
 * Build a JSON Pointer (RFC 6901) for a body-validation Zod path.
 *
 * If the schema validates the full envelope, `path[0] === 'data'` and the
 * pointer is rooted there. Otherwise the path is treated as relative to
 * `/data/attributes` (the common Hono convention of validating the attributes
 * object directly). Override `prefix` for relationship-validating schemas.
 */
export function zodPathToBodyPointer(
  path: ReadonlyArray<PropertyKey>,
  prefix: '/data/attributes' | '/data/relationships' | '/data' = '/data/attributes',
): string {
  if (path.length === 0) return prefix;
  const segments = path.map(escapePointerSegment);
  if (segments[0] === 'data') {
    return `/${segments.join('/')}`;
  }
  return `${prefix}/${segments.join('/')}`;
}

function buildErrorLinks(baseUrl: string, code: string): JsonApiErrorLinks {
  const root = `${baseUrl}${env.BASE_PATH}/${env.API_MAJOR_VERSION}/docs/errors`;
  return { about: `${root}/${code}`, type: root };
}

function escapePointerSegment(segment: PropertyKey): string {
  // RFC 6901: '~' → '~0', '/' → '~1'. Order matters — escape '~' first.
  const s = typeof segment === 'symbol' ? segment.toString() : String(segment);
  return s.replace(/~/g, '~0').replace(/\//g, '~1');
}
