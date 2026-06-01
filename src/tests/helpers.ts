import { createApp } from '@/app';

const BASE = 'http://localhost:3001';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const app = createApp();

/**
 * Helper to create JSON:API requests for testing.
 */
export function apiRequest(method: Method, path: string, body?: unknown) {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return app.request(`${BASE}${path}`, init);
}

/**
 * Assert a response matched JSON:API format.
 */
export async function assertJsonApi(res: Response) {
  const json = await res.json();
  if (res.ok) {
    if (json.jsonapi) {
      expect(json.jsonapi.version).toBe('1.1');
    }
    // data should exist for success responses (unless 204)
    if (res.status !== 204) {
      expect(json).toHaveProperty('data');
    }
  } else {
    expect(json).toHaveProperty('errors');
    expect(json.jsonapi.version).toBe('1.1');
  }
  return json;
}

/**
 * Assert a JSON:API resource has the correct structure.
 */
export function assertResource(resource: Record<string, unknown>, type: string) {
  expect(resource).toHaveProperty('type', type);
  expect(resource).toHaveProperty('id');
  expect(resource).toHaveProperty('attributes');
}

/**
 * Assert pagination meta is present and valid.
 */
export function assertPagination(meta: Record<string, unknown>) {
  expect(meta).toHaveProperty('page');
  const page = meta.page as Record<string, number>;
  expect(page).toHaveProperty('currentPage');
  expect(page).toHaveProperty('pageSize');
  expect(page).toHaveProperty('totalItems');
  expect(page).toHaveProperty('totalPages');
}
