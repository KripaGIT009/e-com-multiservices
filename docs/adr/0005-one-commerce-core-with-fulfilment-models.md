# ADR-0005: One commerce core; fulfilment model on the offer

**Status:** Accepted — 2026-09-14
**Context doc:** [`commerce-architecture.md`](../commerce-architecture.md)

## Context

MyIndianStore sells its own stock, lets approved sellers list products, and is adding
dropshipping partners. Each model differs in who owns stock, who ships, and who is paid.
Everything the shopper experiences — catalogue, cart, checkout, payment, order history,
returns — is the same.

The code already had one catalogue and one order, with `sellerId` distinguishing own
stock from seller listings.

## Decision

1. Keep one catalogue, cart, checkout, order and payment for all models.
2. Record the model as `fulfilmentModel` (`FIRST_PARTY` / `SELLER` / `DROPSHIP`) plus
   `fulfilmentPartnerCode` on the catalogue item, and snapshot both onto each order line.
3. Split an order into **fulfilment groups** derived from its lines at read time. Each
   group has its own shipment (logistics-service) or supplier order (supplier-service).
   The order is shipped when every group is.
4. Put dropshipping's own data — partners, private SKU/cost links, supplier purchase
   orders — in a new `supplier-service` that owns its database.

## Options rejected

| Option | Why not |
|---|---|
| Separate marketplace and dropship order systems | Two carts and two checkouts for one basket; a mixed basket would need two payments; every report, return and support tool doubles |
| Sub-order table per seller in order-service | Stores what can be derived, and drifts from the lines on every edit. Can be introduced later as a read model if query volume needs it |
| Dropship data in item-service | Cost price and partner references are private supplier-relationship data with a different lifecycle; item-service is read by the public storefront |
| Model inferred at runtime from `sellerId` / partner lookups | A product's sourcing can change; history must keep how it was actually fulfilled (CLAUDE.md rule 5) |

## Consequences

- A multi-seller order can no longer be marked shipped by the first seller who ships.
- Every shipment now carries a `fulfilmentKey`; pre-existing shipments without one are
  treated as covering the whole order.
- No new `OrderStatus` value for partial shipment until Flyway (ADR-0003): Hibernate's
  enum CHECK constraint cannot be widened by `ddl-auto: update`.
- Seller settlement is a later phase and will read the same order lines.
