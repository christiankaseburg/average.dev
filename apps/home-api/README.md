# Home API

This is the backend for the average.dev home application. It is built using Go, Gin, and GraphQL.

## Architecture

We follow a strict layered architecture to ensure separation of concerns:

- **Driver Layer (`internal/driver/graphql`)**: Handles HTTP requests and maps them to GraphQL resolvers via `gqlgen`.
- **Service Layer (`internal/service`)**: Contains all business logic. Dependencies like repositories are injected here.
- **Repository Layer (`internal/repository/generated`)**: Handles data access. Code is automatically generated from SQL queries using `sqlc`.

## Tooling

### GraphQL (`gqlgen`)
We use a schema-first approach. The GraphQL schema is defined in `internal/graphql/schema.graphqls`.
To generate the Go boilerplate code after modifying the schema, run:
```bash
yarn nx run home-api:generate:graphql
```

### Database Access (`sqlc`)
We use `sqlc` to generate typesafe Go code from SQL queries.
Queries are located in `db/queries/`. To generate the code, run:
```bash
yarn nx run home-api:generate:sqlc
```

### Migrations (`goose`)
We use `goose` for database migrations. Migrations are located in `db/migrations/`.
To apply migrations:
```bash
yarn nx run home-api:migrate:up
```
To rollback migrations:
```bash
yarn nx run home-api:migrate:down
```

## Running Locally

Ensure your local PostgreSQL database is running (via `docker-compose up -d postgres`), then start the API:

```bash
yarn nx serve home-api
```
