import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown';
import { createMiddleware } from 'hono/factory';

/**
 * Middleware to serve the Markdown for LLMs
 * @see https://llmstxt.org/
 */
export const llms = (openApiDocument: object) =>
  createMiddleware(async (c, _next) => {
    const markdown = await createMarkdownFromOpenApi(JSON.stringify(openApiDocument));
    return c.text(markdown);
  });
