# Authorization

Enforced in two layers with different granularity —
[ADR-0002](adr/0002-bff-owns-authorization.md).

## Roles today

| Realm | Roles |
|---|---|
| `user_service.users.role` | `CUSTOMER`, `ADMIN`, `GUEST` |
| `admin_db.admin_users.role` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |

The BFF treats a caller as an administrator if either the token came from the admin
realm, or it came from the customer realm with `role === 'ADMIN'`.

## Enforcement points

### 1. Angular route guards — UX only

`AuthGuard` and `RoleGuard` keep users off pages they cannot use. **They are not a
security control** — anyone can edit `localStorage` or call the API directly. Their
job is to avoid showing a page that would only produce 403s.

### 2. BFF guards — the real gate

| Guard | Accepts |
|---|---|
| `authenticateToken` | customer realm only |
| `authenticateAny` | either realm; handler branches on `req.user.isAdmin` |
| `authenticateAdmin` | either realm **and** administrator |

`authenticateAny` is for genuinely role-aware reads where **both branches are safe**,
e.g. `GET /api/orders` returns all orders to an admin and only the caller's to a
customer. It was previously used on write endpoints, which gave every customer admin
rights.

### 3. Service-level — Spring Security

```java
.requestMatchers("/api/admin/dashboard/**").hasAnyRole("SUPER_ADMIN","ADMIN","MODERATOR")
.requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN","ADMIN")
.requestMatchers("/api/manage/**").hasAnyRole("SUPER_ADMIN","ADMIN","MODERATOR")
.requestMatchers("/api/audit/**").hasAnyRole("SUPER_ADMIN","ADMIN")
```

**Use `permitAll()`, never `web.ignoring()`, for public endpoints.** `web.ignoring()`
removes the path from the filter chain entirely — the rules above never run for it.
That single mistake left every management endpoint open with no credentials.

## Ownership

Role is not enough. A customer has `CUSTOMER` on *every* order, so any route taking an
id from the path must also check ownership:

```javascript
if (String(order.customerId) !== String(req.user.id))
  return res.status(404).json({ error: 'Order not found' });
```

**404, not 403** — a 403 confirms the id exists.

Applied to: `/api/orders/:id`, `/api/payments/:id`, `/api/payments/order/:orderId`,
`/api/returns/:id`. Cart routes go further and ignore the `:userId` path parameter
entirely, resolving the cart from the token.

## Target: permissions

Roles are too coarse for the admin RBAC the product needs (`PRODUCT_ADMIN`,
`ORDER_ADMIN`, `FINANCE_ADMIN`, …). Move to permissions, with roles as bundles:

```text
PRODUCT_READ  PRODUCT_CREATE  PRODUCT_UPDATE  PRODUCT_DELETE
ORDER_READ    ORDER_UPDATE    ORDER_CANCEL
INVENTORY_READ  INVENTORY_ADJUST
REFUND_APPROVE  SELLER_APPROVE  USER_MANAGE  AUDIT_READ
```

```text
SUPER_ADMIN      → all
PRODUCT_ADMIN    → PRODUCT_*, INVENTORY_READ
ORDER_ADMIN      → ORDER_*, REFUND_APPROVE
FINANCE_ADMIN    → REFUND_APPROVE, AUDIT_READ
CUSTOMER_SUPPORT → ORDER_READ, USER_READ
```

Tokens carry permissions; endpoints check permissions, not roles. Roles then become a
management convenience rather than a security primitive.

## Checklist for a new endpoint

- [ ] Which BFF guard, and why is a weaker one insufficient?
- [ ] Does the downstream service independently enforce it?
- [ ] Does it take a resource id from the path? Where is the ownership check?
- [ ] Does an unauthorised caller learn whether the resource exists?
- [ ] Is the action audited, if it changes money, stock, permissions or order state?
