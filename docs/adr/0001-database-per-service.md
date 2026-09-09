# ADR-0001: Database per service

- **Status:** Accepted — implemented
- **Date:** 2026-09-08 (documenting a decision already in force)

## Context

Twelve PostgreSQL instances run in `docker-compose.yml`, one per service, on host
ports 5432–5442. No service holds credentials for another's database.

The alternative — one database with a schema per service — is cheaper to run and
allows joins across domains. That last property is precisely the problem: a join is
invisible coupling. It compiles, it is fast, and it silently makes two services
undeployable independently.

## Decision

Each service owns its database exclusively. Cross-domain data moves over REST
(synchronous, when the caller needs an answer) or Kafka (asynchronous, when other
domains react). See [architecture §4](../architecture.md#4-synchronous-vs-asynchronous).

## Consequences

**Good**

- Services deploy, scale and fail independently. One database under load does not
  degrade unrelated domains.
- Schema changes are local. Adding a column to `orders` cannot break payment.
- Each store can be tuned or replaced on its own merits.
- Blast radius of a compromise is one domain.

**Bad**

- **No cross-domain joins.** "Orders with customer names" needs two calls and a join in
  the caller. This is the cost, and it is deliberate.
- **No cross-service transactions.** Distributed workflows need sagas with explicit
  compensation ([checkout-flow](../flows/checkout-flow.md)).
- **Duplication is required, not a smell.** An order stores the product name and price
  as a snapshot rather than referencing the catalogue. That is correct: order history
  must not change when a product is renamed.
- **Operational weight.** Twelve databases to back up, monitor and patch. Locally this
  is twelve containers and a meaningful memory footprint.
- **Reporting is harder.** Analytics needs its own store fed by events, not a query
  across production databases.

## Rules

1. A service connects only to its own database. No exceptions, including "just for a
   report" and "only reading".
2. Foreign keys stay within a service boundary. A cross-service reference is a plain
   id column with no constraint.
3. Denormalise deliberately. Snapshot what must not change; cache what may go stale;
   document which is which.
4. Analytics reads from `analytics-service`'s own store, populated from Kafka.

## Known violation

`admin-service` calls every other service over REST to build its dashboard — a
correct pattern, but it makes admin-service the widest dependency in the system and
the most exposed to cascading latency. It mitigates this with a per-call timeout
(default 4000 ms) and per-service fallbacks that surface as `warnings` on the
response. Watch it: if the dashboard grows, move it to a read model fed by events.
