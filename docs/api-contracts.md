# API Contracts

## Surface

The browser calls **only** the BFF at `/api/*`. Service APIs are internal.

Routes below are the BFF's current surface, verified against the running system. The
`Auth` column is what is enforced **today**, after the authorization fixes in
`CODE_REVIEW.md`.

| Auth | Meaning |
|---|---|
| — | public |
| customer | valid customer-realm token |
| any | either realm; handler branches on `req.user.isAdmin` |
| admin | either realm **and** administrator |

### Auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | — | Returns `{token, refreshToken, user}` |
| POST | `/api/auth/register` | — | |
| POST | `/api/auth/refresh` | — | Requires a valid refresh token |
| POST | `/api/auth/logout` | — | Client-side only today |
| GET | `/api/auth/verify` | — | |
| POST | `/api/auth/forgot-password` | — | Issues a 15-min reset token. Neutral response — does not reveal whether the account exists |
| POST | `/api/auth/reset-password` | — | Requires the token from above |
| POST | `/api/auth/admin-login` | — | admin-service realm |

### Catalogue

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/items` | — | Full catalogue, unpaginated |
| GET | `/api/items/:id` | — | |
| GET | `/api/items/search?q=&category=` | — | Filtered in the BFF; see note below |
| GET | `/api/items/sku/:sku` | admin | |
| POST / PUT / DELETE | `/api/items[/:id]` | **admin** | Was `any` — any customer could write to the catalogue |

`/api/items/search` filters an in-memory copy of the full catalogue. That is a
deliberate stopgap: item-service exposes no search route, and proxying to one that did
not exist returned 400. It will not survive a real catalogue and is replaced by
`search-service` in Phase 3.

### Cart

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/cart/:userId` | — | `:userId` **is ignored**; the cart resolves from the token |
| POST | `/api/cart/:userId/items` | — | Merges into an existing line for the same product |
| PUT | `/api/cart/:userId/items/:itemId` | — | `:itemId` is the **product** id; the BFF maps it to the cart-item row |
| DELETE | `/api/cart/:userId/items/:itemId` | — | 204 |
| DELETE | `/api/cart/:userId/clear` | — | 204 |

`:userId` stays in the path only for backward compatibility. Trusting it was an IDOR
(`CODE_REVIEW.md` §1.4). Unauthenticated callers get a shared guest cart.

### Orders, payments, returns

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/orders` | any | Admin sees all; customer sees their own |
| GET | `/api/orders/:id` | any | Ownership checked — 404 on mismatch |
| POST | `/api/orders` | customer | **Drops `shippingAddress`** — see order-flow |
| PUT | `/api/orders/:id/status` | **admin** | |
| GET | `/api/payments` | any | Customer branch is scoped to their own |
| GET | `/api/payments/:id` | any | Ownership checked |
| GET | `/api/payments/order/:orderId` | any | Ownership checked |
| POST | `/api/payments/:id/refund` | **admin** | |
| GET | `/api/returns[/:id]` | any | Ownership checked |
| POST | `/api/returns` | customer | |
| PUT | `/api/returns/:id/approve\|reject` | **admin** | |

### Admin

| Method | Path | Auth |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/users[/:id]` | **admin** |
| GET/POST | `/api/inventory` | **admin** |
| GET/PUT | `/api/shipments/*` | admin |
| GET | `/api/audit/*` | admin |
| GET | `/api/admin/dashboard/*` | **admin** |

Bolded entries were `authenticateAny` before the review — any customer token was
accepted.

### Payments (Razorpay)

| Method | Path | Auth |
|---|---|---|
| GET | `/api/payments/razorpay/key` | — |
| POST | `/api/payments/razorpay/create-order` | customer |
| POST | `/api/payments/razorpay/verify` | customer |
| POST | `/api/payments/razorpay/webhook` | signature |

The webhook keeps its **raw request body** — JSON parsing it makes signature
verification impossible, which was the original bug.

## Target conventions

Current responses return the domain object directly and errors as `{"error": "..."}`.
New endpoints should adopt the envelope below; existing ones migrate under `/api/v1`.

**Success**
```json
{ "success": true, "data": {}, "error": null,
  "timestamp": "2026-09-08T12:00:00Z", "correlationId": "req-7c21..." }
```

**Error**
```json
{ "success": false, "data": null,
  "error": { "code": "PRODUCT_NOT_FOUND", "message": "Product not found", "details": [] },
  "timestamp": "2026-09-08T12:00:00Z", "correlationId": "req-7c21..." }
```

Never return a stack trace. Log the detail with the `correlationId` and give the
client the code.

### Status codes

| Code | Use |
|---|---|
| 200 / 201 / 204 | OK / created / deleted |
| 400 | Malformed or failing validation |
| 401 | No credentials, or expired |
| 403 | Authenticated, not permitted |
| 404 | Not found — **also** what a caller gets for a resource they don't own |
| 409 | Conflict: stock gone, price changed, illegal transition |
| 422 | Well-formed but semantically rejected |
| 429 | Rate limited |

404-not-403 for someone else's resource is deliberate: 403 confirms the id exists.

### Error codes

`PRODUCT_NOT_FOUND`, `OUT_OF_STOCK`, `PRICE_CHANGED`, `INVALID_COUPON`,
`COUPON_EXPIRED`, `PAYMENT_FAILED`, `PAYMENT_ALREADY_PROCESSED`,
`INVALID_ORDER_TRANSITION`, `RETURN_WINDOW_EXPIRED`, `INSUFFICIENT_PERMISSIONS`,
`VALIDATION_FAILED`, `RATE_LIMITED`.

### Idempotency

`POST /api/v1/checkout`, `/orders`, `/payments`, `/returns` and inventory
reservation accept `Idempotency-Key`. The key is stored with the response; a replay
returns the original result rather than repeating the effect.

### Pagination

```text
GET /api/v1/products?page=0&size=20&sort=price,asc
```
```json
{ "content": [], "page": 0, "size": 20, "totalElements": 0, "totalPages": 0 }
```

`GET /api/items` is unpaginated today and returns the whole catalogue. That must not
survive Phase 2.
