# Advanced Hono REST API starter kit
### A production-grade REST API built with Hono, Drizzle ORM, and full JSON:API specification, especially designed for Cloudflare Workers.


## Architecture
- Feature-Based / Domain-Driven Structure
- Typescript, 
- Hono, 
- Zod, 
- DrizzleORM, relationships, transactions,
- OpenAPI
- Dynamic error OpenAPI examples documentation,
- Properly implemented JSON:API format for responses and errors,
- API versioning
- Auth using better auth and RBAC,
- Event driven architeture using hono/event-emitter,
- Pagination, Sparse fieldsets
- Scalar UI,
- LLM enabled docs
- Biome linter,
- LogLayer logger + OpenTelemetry transport
- Fully Testing Suite with Vitest and 90% code coverage,
- Specifically tailored to run on cloudflare workers.
- Type checking via TSC, transpiling to JS for compatibility with Cloudflare Workers via wrangler.
- Cloudflare Workers deployment ready (For nodejs deployment, see "nodejs" branch).
- CI/CD with Github Actions.

Adheres to the best practices of the industry such as The 12-Factor App, Clean Architecture, SOLID.
The project is designed to be easily extensible and customizable.


Used in several projects I have worked on.


It is an API for project management SAAS, with the following features:
- User authentication / authorization
- Team management
- Project management
- Task (tasks and lists) management


Testing:
- Unit tests
- Integration tests
- E2E tests



## Get started

### Cloudflare Workers
1. Sign up for [Cloudflare Workers](https://workers.dev).
2. Clone this project and install dependencies with `pnpm install`
3. Rename `wrangler.toml.example` to `wrangler.toml` and fill in the necessary values
4. Run `wrangler login` to login to your Cloudflare account in wrangler
5. Create D1 database in Cloudflare Workers KV and add the `KV_DATABASE_ID` to the wrangler.toml file
6. Create a new KV namespace in Cloudflare Workers KV and add the `KV_NAMESPACE_ID` to the wrangler.toml file
7. Run `wrangler deploy` to publish the API to Cloudflare Workers

### Node.js or other
1. Clone this project and install dependencies with `pnpm install`
2. Run `pnpm build` to build the project
3. Run `pnpm start` to start the server
4. Open `http://localhost:3000/docs` in your browser to see the Swagger interface where you can try the endpoints.
5. Make sure to set the `DATABASE_URL` environment variable to the URL of your database.
6. Run `pnpm migrate` to create the database schema.
7. Run `pnpm seed` to populate the database with some sample data.
8. Run `pnpm start` to start the server.

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

- Scalar UI: is available at root URL "/docs"


## Author
David Havl - [davidhavl.com](https://davidhavl.com)

Contact me, I am available for hire.