# ADR-0002: The BFF authorizes, and so does every service

- **Status:** Accepted
- **Date:** 2026-09-08
- **Related:** [ADR-0004](0004-two-identity-realms.md), [`../security.md`](../security.md)

## Context

An Express BFF sits between the browser and eleven services. The question is where
authorization lives.

The empirical answer came from a security review. Both layers had been left
permissive, independently:

- admin-service listed `/api/manage/**` and `/api/admin/dashboard/**` in
  `web.ignoring()`, removing them from Spring Security's filter chain entirely.
  Unauthenticated `curl` returned 200 for every user, order, payment and refund
  operation.
- The BFF guarded those same routes with `authenticateAny` — "any valid token" — so a
  plain customer token created a catalogue product and dumped every user record.

Either layer checking would have prevented exploitation. Neither did.

## Decision

**Authorize in both places, with different questions.**

| Layer | Question |
|---|---|
| BFF | Is this caller allowed to make this request at all? Coarse-grained: authenticated? administrator? does the resource belong to them? |
| Service | Is this caller allowed to perform this operation on this entity? Fine-grained: role/permission on the endpoint, plus domain rules |

The BFF is the only door open to the internet, so it must be strict. Services must not
assume they are only ever called by the BFF — during local development every service
port is published, and in production a misconfigured security group is one mistake away.

### BFF guards

- `authenticateToken` — customer realm only.
- `authenticateAny` — either realm; the handler branches on `req.user.isAdmin`. Use
  **only** for genuinely role-aware reads where both branches are safe.
- `authenticateAdmin` — either realm and administrator. Everything that writes
  catalogue, users, inventory, order status, refunds or returns.

### Ownership

Any route taking a resource id from the path compares the owner against the id in the
token and returns **404, not 403**, on mismatch — 403 confirms the resource exists.

```javascript
const order = (await axios.get(`${ORDER_SERVICE}/api/v1/orders/${id}`)).data;
if (String(order.customerId) !== String(req.user.id))
  return res.status(404).json({ error: 'Order not found' });
```

### Never

- Do not trust an identifier from the URL or body when the token carries it. The cart
  routes took `:userId` from the path; any caller could read any cart. The path
  parameter is now ignored.
- Do not use `web.ignoring()` for anything but static assets. Use `permitAll()` — it
  keeps the request inside the filter chain.

## Consequences

**Good**

- Two independent failures are needed to expose data.
- Services stay safe if ever reached directly.
- The BFF is one place to see the whole authorization surface.

**Bad**

- Rules are expressed twice and can drift — a permission tightened in a service but
  not the BFF gives users confusing 403s from the wrong layer.
- Extra token verification per request. Negligible.
- Contributors must remember both. Mitigated by the endpoint checklist in
  [`security.md`](../security.md).

## Enforcement

Every new endpoint answers, in review:

1. Which BFF guard, and why is a weaker one insufficient?
2. Does the downstream service independently enforce it?
3. If it takes an id from the path, where is the ownership check?
4. Does an unauthorised caller learn whether the resource exists?
