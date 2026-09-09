# CLAUDE.md — MyIndianStore

Context for AI coding agents working in this repository. Read this before changing code.

## What this is

A full-stack e-commerce and marketplace platform for India: Angular 18 SPA + Express
BFF on a single port, backed by Java 21 / Spring Boot 3 microservices, PostgreSQL
(database-per-service), Redis and Kafka.

The **target** architecture is specified in [`docs/architecture.md`](docs/architecture.md)
and the full service list in [`docs/service-catalog.md`](docs/service-catalog.md).
Eleven of the twenty-six planned services exist today. **Do not assume a service
exists because the spec lists it** — check the catalogue, which marks each one
`built` / `partial` / `planned`.

## Ground truth

When the docs and the code disagree, the code wins and the doc is a bug. Verify before
you rely on something:

```bash
# What endpoints does a service actually expose?
grep -rn "Mapping" <service>/src/main/java --include=*Controller.java
```

Several defects found in review came from exactly this: the BFF proxying to routes
that were never implemented. [`CODE_REVIEW.md`](CODE_REVIEW.md) records what was
broken, what was fixed, and what is still open — read its Appendix A before assuming
a subsystem works.

## Repository layout

Services live at the repository root, one directory each (`order-service/`,
`item-service/`, …). The spec's `services/` grouping is a future mechanical move; do
not start it as a side effect of another change.

```
myindiansstore/
├── unified-ui/          Angular 18 SPA + Express BFF (server.js)
├── <name>-service/      Spring Boot service + Dockerfile + pom.xml
├── docs/                Architecture, contracts, flows, ADRs
├── docker-compose.yml   Full local stack
├── .env                 Local secrets — never committed
└── .env.example         Template
```

## Running locally

```bash
cp .env.example .env       # then fill in the secrets it asks for
docker compose up --build  # http://localhost:4200
```

Full instructions, seeded credentials and per-service ports:
[`docs/local-development.md`](docs/local-development.md).

**Java services are packaged before the image is built.** Every service Dockerfile is
`COPY target/*.jar` — there is no Maven stage. After changing Java source you must:

```bash
cd <service> && mvn -DskipTests package
docker compose build <service> && docker compose up -d --force-recreate <service>
```

Forgetting this is the single most common way to "fix" something and see no change.

## Architectural rules

These are not stylistic preferences. Breaking one is a defect.

1. **A service owns its database.** No cross-database reads. Talk over REST or Kafka.
2. **Never trust a price, total or quantity sent by the browser.** Recalculate server-side.
3. **The browser talks to the BFF, never to a service directly.** Service ports are
   published in compose for local debugging only.
4. **Authorization is enforced in the backend, not by hiding UI.** Both, ideally —
   but the backend check is the one that counts.
5. **Orders store immutable snapshots** of price, product name, address and tax.
   Never render order history by joining to the live product record.
6. **Money is `BigDecimal`.** Never `double`, never `float`.
7. **Payment, order creation, refunds and inventory reservation must be idempotent.**
8. **Secrets come from the environment.** No fallback default in code — the BFF
   deliberately refuses to boot without `JWT_SECRET` and `ADMIN_JWT_SECRET`.

## Authentication — read this before touching auth

There are **two identity realms**, and this trips people up:

| Realm | Store | Signed with | Used by |
|---|---|---|---|
| Customer | `user-service` (`users` table, `role` column) | `JWT_SECRET`, HS256, minted by the BFF | Storefront, account, checkout |
| Admin | `admin-service` (`admin_users` table) | `ADMIN_JWT_SECRET`, HS512, minted by admin-service | admin-service's own API |

The BFF bridges them: `resolveUser()` accepts a token from either realm, and
`adminAuth()` mints a short-lived admin-realm token for an already-authorised caller
rather than forwarding the caller's own. A `user-service` account with `role=ADMIN`
therefore reaches admin endpoints through the BFF, but its token is **not** valid
against admin-service directly.

Consolidating the two stores is open work — see
[`docs/adr/0004-two-identity-realms.md`](docs/adr/0004-two-identity-realms.md).

Guards in `unified-ui/server.js`:

- `authenticateToken` — customer realm only.
- `authenticateAny` — either realm; sets `req.user.isAdmin` for role-aware routes.
- `authenticateAdmin` — either realm **and** administrator. Use this for anything
  that writes catalogue, users, inventory, order status, refunds or returns.

## Conventions

- **Java** — constructor injection, DTOs at the boundary (never expose entities),
  `@Transactional` on the service method, Bean Validation on request DTOs.
- **Angular** — feature modules lazy-loaded; shared singletons in `core/services`;
  `HttpClient` calls go to `/api/*` so the BFF proxy and JWT interceptor apply.
- **Do not fabricate data to fill a UI.** If a value has no source yet, omit it or
  show an empty state. Randomised ratings and a sine-wave revenue chart both shipped
  in this codebase and both read as real to users. See `CODE_REVIEW.md` §3.1 and §3.3.
- **JPA `@Modifying`** — if the query is preceded by an entity write in the same
  transaction, it needs `flushAutomatically = true`. Omitting it silently discarded
  every password change in this repo (`CODE_REVIEW.md` §2.1).

## Definition of done

A feature is complete when the vertical slice works: UI → BFF → service → database →
Kafka event (where applicable) → consumer, with error handling, tests and updated
docs. Compiling is not done. Generated files are not done.
