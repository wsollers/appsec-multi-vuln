# Northwind Operations

A sample CRUD application for the Northwind dataset. It includes an Express REST API, Apollo GraphQL endpoint, SQLite storage, and a React web client.

## Stack

- Node.js 22 and TypeScript
- Express REST under `/api/v1` and Apollo GraphQL at `/graphql`
- SQLite with versioned migrations and sample data
- React, Vite, and Tailwind CSS
- OpenAPI 3 with Swagger UI at `/docs`

## Setup

```bash
cd projects/northwinds-v2
npm ci
cp .env.example .env
```

The database is created and seeded at startup in the development profile. Start the API and web client in separate terminals:

```bash
npm run dev
npm run dev:web
```

The API listens on `http://localhost:4000` and the web client on `http://localhost:5173`. The sample users are `admin`, `sales_alice`, `sales_bob`, and `viewer`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

The Postman collection and environment are under `tests/postman/`. The documents under `docs/` describe the product design, data flows, and threat model.

## Local data

`npm run migrate` applies pending migrations. `npm run seed` loads the sample Northwind records. Runtime database files and local environment values are excluded from Git.
