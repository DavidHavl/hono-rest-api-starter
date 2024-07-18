# Advanced Hono REST API starter kit

This is production grade starter project utilizing Typescript, Hono, Zod, DrizzleORM, OpenAPI, JSON:API format, specifically tailored to run on cloudflare workers.

It serves my own needs, to copy/paste from, when starting new project with the mentioned technology stack, but I hope it will be useful for others as well.

It is an API for project management Sass, with the following features:
- User authentication / authorization
- Team management
- Project management
- Task (tasks and lists) management

# This is still very much a WIP (work in progress)!

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev).
2. Clone this project and install dependencies with `pnpm install`
3. Rename `wrangler.toml.example` to `wrangler.toml` and fill in the necessary values
4. Run `wrangler login` to login to your Cloudflare account in wrangler
5. Create D1 database in Cloudflare Workers KV and add the `KV_DATABASE_ID` to the wrangler.toml file
6. Create a new KV namespace in Cloudflare Workers KV and add the `KV_NAMESPACE_ID` to the wrangler.toml file
7. Run `wrangler deploy` to publish the API to Cloudflare Workers

## Development

1. Run `wrangler dev` to start a local instance of the API.
2. Open `http://localhost:8787/docs` in your browser to see the Swagger interface where you can try the endpoints.
3. Changes made in the `src/` folder will automatically trigger the server to reload, you only need to refresh the Swagger interface.

## Database

### Migrations:
https://orm.drizzle.team/kit-docs/commands#generate-migrations

#### Local development:
- To generate new migration: `pnpm migration:generate:local`
- To apply migrations to the DB: `pnpm migration:migrate:local`

#### Production:

- To generate new migration: `pnpm migration:generate`
- To apply migrations to the DB: `pnpm migration:migrate`


<!--
Dangerous: 
- To push current schema to database without using migrations: `drizzle-kit push`
-->

## UI

- Swager UI: is available at root URL "/docs"


## Author
David Havl - [davidhavl.com](https://davidhavl.com)