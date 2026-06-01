import { createMiddleware } from 'hono/factory'

/**
 * Ensures all responses use the JSON:API content type.
 */
export const jsonApiContentType = createMiddleware(async (c, next) => {
  await next()
  // Only set for JSON responses (skip static assets, etc.)
  const contentType = c.res.headers.get('Content-Type')
  if (contentType?.includes('application/json') || !contentType) {
    c.res.headers.set('Content-Type', 'application/vnd.api+json')
  }
})
