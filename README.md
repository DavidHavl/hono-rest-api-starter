# Advanced Hono REST API starter kit

This is Real World starter project utilizing Hono, Zod, DrizzleORM, OpenAPI, JSON:API format, hono-event-emitter, specifically tailored to run on cloudflare workers.
It  for my own needs, but I hope it will be useful for others as well.

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev).
2. Clone this project and install dependencies with `pnpm install`
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `wrangler deploy` to publish the API to Cloudflare Workers

## Development

1. Run `wrangler dev` to start a local instance of the API.
2. Open `http://localhost:8787/docs` in your browser to see the Swagger interface where you can try the endpoints.
3. Changes made in the `src/` folder will automatically trigger the server to reload, you only need to refresh the Swagger interface.

## Database

### Migrations:
https://orm.drizzle.team/kit-docs/commands#generate-migrations

- To generate new migration: `pnpm migration:generate`
- To apply migrations to the DB: `pnpm migration:migrate`

Dangerous: 
- To push current schema to database without using migrations: `drizzle-kit push`

## REST API

- Swager UI: is available at root URL "/docs"