# Home-Web

This is the frontend for the Home-Web application. It is built using React, Vite, Fluent UI, and Apollo Client.

## Architecture

We follow a strict structural pattern to keep our codebase scalable:

- **Routing (`src/pages`)**: We use React Router DOM. Top-level route components are defined here.
- **Components (`src/components`)**: Contains both Presentational (dumb) components that focus only on UI, and Container (smart) components that fetch data or handle state. We do NOT use a separate `containers/` folder; they live together by feature.
- **Layouts (`src/layout`)**: Contains structural components like `BaseLayout` which provides the Header, Sidebar, and a main content area.
- **Hooks (`src/hooks`)**: Reusable custom React hooks.
- **Providers (`src/providers`)**: React Context definitions and `useReducer` implementations for state management. `AppProviders` wraps the entire application with Apollo and Fluent UI contexts.

## Tooling

### GraphQL Codegen
We use `@graphql-codegen/cli` to generate fully typed React hooks from our GraphQL operations.
Queries and mutations are written in `.graphql` files (e.g., `src/graphql/queries.graphql`).

To generate the hooks, run:
```bash
yarn nx run home-web:generate:graphql
```
This reads the backend schema directly and outputs to `src/graphql/generated/`.

## Running Locally

To start the development server, run:
```bash
yarn nx serve home-web
```
