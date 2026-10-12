# Northwind Secure Reference App

A production-quality, **secure** CRUD application over the classic Northwind
dataset. It is the hardened ("secured baseline") reference implementation of the
design in [`docs/northwind-app-design.md`](docs/northwind-app-design.md), with
controls traced to the [STRIDE threat model](docs/stride-threat-model.md) and
[data-flow diagram](docs/data-flow-diagram.md).

> This app is intentionally built **without vulnerabilities**. It demonstrates
> the secure baseline the companion threat model calls for.

## Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Language  | TypeScript (strict)                                               |
| Runtime   | Node.js 22                                                        |
| REST      | Express under `/api/v1`                                           |
| GraphQL   | Apollo Server at `/graphql`                                       |
| Data      | SQLite via `better-sqlite3` (parameterized repository layer)      |
| Migrations| Versioned SQL files applied in order                              |
| Front end | React + Vite + Tailwind CSS                                       |
| API docs  | OpenAPI 3 + Swagger UI (`/docs`)                                  |
| Tests     | Vitest (unit) + Supertest (REST/GraphQL API), Testing Library (web) |

## Layout

```
projects/northwinds-v1/
├── backend/            Express REST + Apollo GraphQL over SQLite (layered)
│   ├── src/
│   │   ├── config/       typed, centralized configuration
│   │   ├── db/           connection, migrations (SQL), seed
│   │   ├── domain/       typed entities
│   │   ├── repositories/ parameterized data access (only layer touching SQL)
│   │   ├── services/     business rules + object-level authorization
│   │   ├── auth/         RS256 JWT verify, RBAC
│   │   ├── http/         middleware (authn, RBAC, CSRF, CORS, headers, errors), routes, validators
│   │   ├── graphql/      schema, resolvers, depth/complexity limits
│   │   ├── util/         SSRF-guarded fetch
│   │   └── openapi/      OpenAPI 3 document
│   └── tests/            unit + API (Supertest) tests
├── frontend/           React + Vite + Tailwind SPA (CRUD screens)
├── tests/postman/      Postman collection + environment
└── docs/               design, STRIDE threat model, DFD
```

## Setup

```bash
cd projects/northwinds-v1
npm install            # installs both workspaces
cp .env.example .env   # safe local defaults; NO real secrets
```

## Run

```bash
# Backend API (http://localhost:4000) — migrates + seeds an empty DB automatically in dev
npm run dev

# Frontend SPA (http://localhost:5173) — proxies /api and /graphql to the backend
npm run dev:web
```

Then open:

- SPA: http://localhost:5173 (sign in with a demo account: `admin`, `sales_alice`, `sales_bob`, `viewer`)
- REST: http://localhost:4000/api/v1
- GraphQL: http://localhost:4000/graphql
- Swagger UI: http://localhost:4000/docs (non-production only)

### Database scripts

```bash
npm run migrate   # apply pending SQL migrations
npm run seed      # (re)seed the Northwind sample dataset
```

## Test / verify

```bash
npm run lint        # ESLint (flat config)
npm run typecheck   # tsc --noEmit, both workspaces
npm run build       # backend tsc + frontend vite build
npm test            # backend Vitest/Supertest + frontend tests
```

### Postman

Import `tests/postman/northwind.postman_collection.json` and
`tests/postman/northwind.postman_environment.json`. Run the **Auth** folder
first (it mints an access token and fetches the CSRF token into collection
variables), then the rest.

## Authentication model

For a self-contained sample, the backend exposes a **development-only** token
mint at `POST /api/v1/auth/dev/token` that stands in for an external OAuth2/OIDC
provider. It is force-disabled when `NODE_ENV=production`. Regardless of how a
token is obtained, the API verifies it the same standards-based way:

- RS256 signature against the public key (private key never leaves the server/secret store);
- `alg` restricted to `RS256` — `none` and HS* downgrades are rejected;
- `iss`, `aud`, and `exp` validated on every request.

In production the SPA performs the OAuth2/OIDC authorization-code + PKCE flow and
the API verifies RS256 tokens via the IdP's JWKS.

## Security controls (traceable to the STRIDE model)

| Control | Where | STRIDE |
| --- | --- | --- |
| RS256 JWT verify (alg/iss/aud/exp; reject none/HS) | `auth/jwt.ts` | S1 |
| Server-side RBAC, deny-by-default | `auth/rbac.ts`, `http/middleware/auth.ts` | E1/E3 |
| Object-level authorization (orders scoped per employee) | `services/orders.service.ts` | I1 (IDOR) |
| Field allow-lists / no mass assignment | `http/validators/entities.ts` (strict), repository column allow-lists | T2 |
| Parameterized SQL only (metadata-driven identifiers) | `repositories/*` | T1 |
| Transactions for multi-table writes | `repositories/orders.repository.ts` | — |
| Anti-CSRF (double-submit, SameSite=Strict) | `http/middleware/csrf.ts` | T4 |
| Strict CORS allow-list (no wildcard-with-credentials) | `http/middleware/security.ts` | S3 |
| CSP + hardening headers (HSTS, nosniff, frame-deny) | `http/middleware/security.ts`, SPA `index.html` | I5/T3 |
| SSRF-guarded outbound fetch (host allow-list, block internal/link-local, no redirect follow) | `util/ssrfFetch.ts` | E2 |
| GraphQL depth + complexity limits; introspection non-prod only | `graphql/limits.ts`, `graphql/server.ts` | D1/I3 |
| Mandatory, capped pagination | `http/validators/common.ts` | D2 |
| Rate limiting | `http/middleware/rateLimit.ts` | D3 |
| Consistent error envelope; no internal detail leakage | `http/middleware/errorHandler.ts` | I2 |
| React output escaping; no `dangerouslySetInnerHTML` | frontend | I5 |
| Secrets via env/config only | `.env.example`, `config/index.ts` | I4 |

## Notes

- Do not commit `node_modules`, build output, the SQLite database file, `.env`,
  or signing keys — all are git-ignored.
- The SQLite file lives under `data/` (outside any web root) by default.
