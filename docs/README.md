# Documentation

Baseline for MyIndianStore. Written against the **actual** state of the repository —
where something is specified but not built, it says so.

Start with [`../CLAUDE.md`](../CLAUDE.md) if you are about to change code.

## Index

| Document | What it covers |
|---|---|
| [architecture.md](architecture.md) | System context, request path, current vs target, gaps |
| [commerce-architecture.md](commerce-architecture.md) | Own retail + marketplace + dropshipping on one core: fulfilment models, courier allocation, partner adapters, contracts, AWS target, roadmap |
| [claude-code-master-prompt.md](claude-code-master-prompt.md) | The prompt to hand Claude Code for each subsequent phase |
| [service-catalog.md](service-catalog.md) | All 26 services with verified `built`/`partial`/`planned` status |
| [database-design.md](database-design.md) | Per-service schemas, conventions, target catalogue model |
| [api-contracts.md](api-contracts.md) | The BFF's real surface with auth per route; response conventions |
| [event-contracts.md](event-contracts.md) | Kafka envelope, topics, versioning, outbox, DLQ |
| [security.md](security.md) | Threat model, lessons from the review, pre-production checklist |
| [authentication.md](authentication.md) | Two realms, login, refresh, password reset |
| [authorization.md](authorization.md) | Guards, ownership checks, target permission model |
| [testing-strategy.md](testing-strategy.md) | What would have caught the known defects, and in what order to build |
| [local-development.md](local-development.md) | Setup, ports, seeded accounts, troubleshooting |
| [observability.md](observability.md) | Correlation ids, logging, metrics, tracing |
| [deployment.md](deployment.md) | Docker Compose today, AWS target |

### Flows

| Document | What it covers |
|---|---|
| [flows/checkout-flow.md](flows/checkout-flow.md) | Today's unsafe sequence and the target saga with compensation |
| [flows/order-flow.md](flows/order-flow.md) | Order state machine, snapshot data model, the missing address |

### Decisions

| ADR | Decision |
|---|---|
| [0001](adr/0001-database-per-service.md) | Database per service |
| [0002](adr/0002-bff-owns-authorization.md) | Authorize at the BFF *and* every service |
| [0003](adr/0003-schema-migrations.md) | Replace `ddl-auto: update` with Flyway |
| [0004](adr/0004-two-identity-realms.md) | Bridge the two identity realms in the BFF |
| [0005](adr/0005-one-commerce-core-with-fulfilment-models.md) | One commerce core; fulfilment model on the offer |
| [0006](adr/0006-partner-adapters-and-courier-allocation.md) | Partners as rows plus adapters; rule-based courier allocation |

## Related

- [`../CODE_REVIEW.md`](../CODE_REVIEW.md) — full audit with reproductions, and
  Appendix A listing what is fixed versus still open. **Read Appendix A before
  assuming a subsystem works.**
- [`../CLAUDE.md`](../CLAUDE.md) — conventions and architectural rules.

## Rules for these documents

1. **The code is ground truth.** If a document disagrees with the code, the document
   is the bug — unless it is explicitly labelled *target*.
2. **Mark what is not built.** A reader must never have to guess whether something
   exists. Use `built` / `partial` / `planned`.
3. **Update docs in the same commit as the change.** A doc updated later is a doc that
   is wrong in between.
4. **Record decisions as ADRs**, including the options rejected and why. The *why* is
   the part that is expensive to reconstruct.

## Not yet written

Deferred until the corresponding work starts, so they do not describe things that do
not exist: `flows/payment-flow.md`, `flows/inventory-flow.md`, `flows/return-flow.md`,
`search.md`, `pricing.md`, `marketplace.md`.
