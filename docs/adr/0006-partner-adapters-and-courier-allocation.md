# ADR-0006: Partners as registry rows plus adapters; rule-based courier allocation

**Status:** Accepted — 2026-09-14
**Context doc:** [`commerce-architecture.md`](../commerce-architecture.md) §6–§8

## Context

The business needs to add and switch couriers (Delhivery, Shiprocket, Blue Dart, …) and
dropship suppliers (Qikink, eKomn, Bharat Dropship, DropSetu, Dropbarter, Ali Shipping)
without re-engineering each time. Most start without an API integration. For own
products, a default courier must be chosen automatically, change by delivery location,
and be overridable by a person.

## Decision

**Partners.** Each partner is a database row an admin manages, naming an adapter by
`integrationType`. Adapters are Spring beans implementing `CarrierAdapter`
(logistics-service) or `DropshipAdapter` (supplier-service), collected into a registry
by key. A `MANUAL` adapter always exists. Credentials are environment variables read by
the adapter. An unconfigured API adapter degrades to manual handling, labelled as such;
a configured one that fails returns an error.

**Allocation.** logistics-service decides, in order: manual pick → first matching
location rule (pincode prefix or state, scoped by fulfilment model, by priority) →
default courier for the model → fallback strategy (fastest / cheapest / priority). Every
decision records its reason. The same quote endpoint serves checkout, admin, seller and
booking.

## Options rejected

| Option | Why not |
|---|---|
| Hardcoded partner enum and `switch` statements | A deployment per contract change; partner logic leaks everywhere |
| Generic configurable HTTP connector (URL/JSON templates in the DB) | Every partner's auth, signing and error model differs; templates become an untestable programming language and put credentials near the database |
| Credentials in the partner row | Secrets in a database dump and in admin API responses (CLAUDE.md rule 8) |
| Shiprocket as the only courier integration | Useful aggregator, but a single dependency for all shipping and no direct-contract rates |
| Rules engine library (Drools etc.) | Four ordered steps do not justify it; operators need to read and edit rules in a form |
| Pincode-level rule rows | ~19,000 pincodes; prefixes and states cover the operational need and stay editable |
| Writing Qikink / eKomn / … API clients now | No contract, docs or sandbox credentials exist. Code written from marketing pages would look integrated and not be |

## Consequences

- Adding a partner without an API is a data change. With an API it is one class, env
  vars and tests.
- Delhivery and Shiprocket adapters exist but are unverified until sandbox credentials
  are available. Their `BookingRequest` lacks city/state/dimensions and an idempotent
  booking lookup; both are M2 work.
- Out of the box allocation behaves exactly as before (fastest serviceable); choosing a
  default courier is left to the business.
