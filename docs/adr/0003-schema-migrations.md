# ADR-0003: Replace `ddl-auto: update` with Flyway migrations

- **Status:** Accepted — not yet implemented
- **Date:** 2026-09-08
- **Blocks:** production deployment, the order-model rework

## Context

Every service runs:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

Hibernate infers the schema from the entities at startup. It works locally and is why
the stack boots from empty volumes with no setup.

It is not viable beyond that:

- **`update` never drops or narrows.** Removing a field, renaming a column, changing a
  type or adding a `NOT NULL` to a populated table are all impossible. The schema only
  accretes.
- **No history.** Nothing records what the schema looked like at a release, so there
  is no rollback and no way to reproduce an environment.
- **Nondeterministic across environments.** Dev, staging and production drift
  depending on which entity versions each ever ran.
- **No data migrations.** Adding `shipping_address_snapshot` to `orders` needs a
  backfill for existing rows. `ddl-auto` has no concept of that.
- **Destructive on a race.** Two instances starting concurrently against one database
  both attempt DDL.

This is now blocking. The order-model rework
([order-flow](../flows/order-flow.md)) adds address, tax and shipping columns to a
populated `orders` table, which is exactly what `ddl-auto: update` cannot do safely.

`database-setup.sql` exists at the repository root but is not wired into anything —
it is a stale snapshot, not a migration path.

## Decision

Adopt **Flyway**, one migration history per service database.

```
<service>/src/main/resources/db/migration/
├── V1__baseline.sql
├── V2__add_order_address_snapshot.sql
└── V3__backfill_order_totals.sql
```

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate     # entities must match the migrated schema
  flyway:
    enabled: true
    baseline-on-migrate: true
```

`validate` is the important half: the application refuses to start if the entities and
the schema disagree, converting a silent drift into a loud failure.

### Rollout

1. Generate `V1__baseline.sql` per service from the current schema
   (`pg_dump --schema-only`), since databases with data already exist.
2. Add the Flyway dependency and set `baseline-on-migrate: true` so existing databases
   adopt V1 without re-running it.
3. Flip `ddl-auto` to `validate`, one service at a time, verifying startup.
4. From then on, every entity change ships with a migration in the same commit.

Flyway over Liquibase: plain SQL, no XML/YAML abstraction, and the team is already
writing SQL (`database-setup.sql`). Liquibase's database-agnostic changelogs buy
nothing here — Postgres is the only target.

## Consequences

**Good**

- Reproducible, versioned, reviewable schema. Migrations diff like code.
- Destructive and data migrations become possible.
- `validate` catches entity/schema drift at startup instead of at the first query.
- A migration is a natural place for the index a query needs.

**Bad**

- Every entity change now needs a migration. That friction is the point, but it is
  friction.
- The baseline step is fiddly for databases that already hold data.
- A failed migration blocks startup. Correct, but it makes a bad migration an outage,
  so migrations must be tested against a production-like dump.
- Rolling deploys need migrations to be backward-compatible with the previous version
  for one release: add nullable, backfill, then enforce — never add `NOT NULL` and
  deploy in one step.

## Rules

1. Migrations are immutable once merged. Fix forward with a new version.
2. One logical change per migration.
3. Never edit a schema by hand in any shared environment.
4. Additive first, enforce later: add nullable → backfill → add constraint.
5. Every migration is tested against a restored copy of production before release.
