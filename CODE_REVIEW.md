# MyIndianStore — Codebase Review

**Date:** 2026-09-08
**Scope:** Full stack — `unified-ui` (Angular 18 SPA + Express BFF) and the 11 Spring Boot microservices, plus Docker Compose orchestration.
**Method:** Static review of all source, followed by a live end-to-end run of the full stack in Docker with the real APIs exercised via HTTP and the UI rendered in a headless browser.

Every finding marked **VERIFIED** was reproduced against the running system; the reproduction is shown. Findings without that marker are read from source and not separately executed.

---

## Summary

| Severity | Count | Theme |
|---|---|---|
| Critical — security | 6 | Admin endpoints unauthenticated; customers hold admin powers; account takeover; cart IDOR |
| Critical — correctness | 10 | Password changes silently discarded; cart edits 404; shipping address dropped; admin SPA can't authenticate |
| Medium | 7 | Broken search, missing refresh endpoint, webhook signature, stale downstream URLs |
| Design / UI | 12 | Fabricated dashboard revenue, randomised product data, incoherent palette, unrelated imagery |

The system boots cleanly and the happy path (browse → register → login → add to cart → place order) completes. The failures cluster in three places: **authorization is effectively absent on the admin surface**, **several write paths silently do nothing or 404**, and **a significant amount of what the UI presents as business data is fabricated at runtime**.

---

## 1. Critical — Security

### 1.1 All admin management endpoints are completely unauthenticated — **VERIFIED**

`admin-service/src/main/java/com/example/config/SecurityConfig.java`

```java
return (web) -> web.ignoring()
    .requestMatchers("/api/admin/login", "/actuator/health",
        "/api/admin/dashboard/**", "/api/manage/**");
```

`web.ignoring()` removes these paths from the Spring Security filter chain entirely — the `authorizeHttpRequests` rules below it never run. Every management operation (users, orders, items, payments, refunds, returns, shipments) is reachable with no credentials at all.

```
$ curl -o /dev/null -w "%{http_code}" http://localhost:8011/api/manage/users     → 200
$ curl -o /dev/null -w "%{http_code}" http://localhost:8011/api/manage/orders    → 200
$ curl -o /dev/null -w "%{http_code}" http://localhost:8011/api/admin/dashboard/summary → 200
$ curl -o /dev/null -w "%{http_code}" http://localhost:8011/api/audit            → 403   ← correctly protected
```

`/api/audit` returning 403 while `/api/manage/**` returns 200 confirms the filter chain works and that the ignore list is the hole.

**Fix:** drop `/api/admin/dashboard/**` and `/api/manage/**` from the ignore list; the existing `authorizeHttpRequests` rules already grant them to the right roles.

### 1.2 Any logged-in customer holds full admin privileges — **VERIFIED**

`unified-ui/server.js` guards admin-only proxies with `authenticateAny`, which accepts a customer token and then forwards the request to admin-service — which (per 1.1) does not check anything anyway.

Affected routes: `POST/PUT/DELETE /api/items`, all of `/api/users`, `/api/inventory`, `PUT /api/orders/:id/status`, `POST /api/payments/:id/refund`, `PUT /api/returns/:id/approve|reject`, and every `/api/admin/dashboard/*`.

Reproduced with an ordinary `CUSTOMER` account:

```
$ curl -X POST http://localhost:4200/api/items -H "Authorization: Bearer <CUSTOMER token>" \
       -d '{"sku":"ESCALATE-1","name":"Created by customer",...}'
  → 201 {"id":21,"sku":"ESCALATE-1",...}          ← customer wrote to the product catalog

$ curl http://localhost:4200/api/users -H "Authorization: Bearer <CUSTOMER token>"
  → 200 [{"id":1,"username":"admin","email":"admin@example.com",...}, ...]
                                                   ← customer read every user record
```

**Fix:** `authenticateAdmin` on all admin-only routes.

### 1.3 Password reset requires only knowledge of an email address — **VERIFIED (endpoint), latent**

`server.js` → `POST /api/auth/forgot-password` takes `{ email, newPassword }`, is unauthenticated, and carries no reset token, OTP, or mail round-trip. Anyone who knows a registered address can set that account's password.

```
$ curl -X POST http://localhost:4200/api/auth/forgot-password \
       -d '{"email":"customer1@example.com","newPassword":"HijackedPass1"}'
  → 200 {"message":"Password reset successfully..."}
```

The takeover does not currently complete only because the write is silently discarded by the unrelated bug in §2.1 — the row's `updated_at` never changes. **Fixing §2.1 turns this into a live account-takeover vulnerability**, so the two must be fixed together.

The same hole exists one layer down: `user-service` `SecurityConfig` marks `/api/auth/reset-password` `permitAll()`, so anything that can reach port 8004 can reset any password directly.

### 1.4 Cart endpoints have no authentication and no ownership check

Every `/api/cart/:userId*` route in `server.js` is registered without a guard, and `:userId` is taken from the URL rather than the token. Any caller can read, add to, or modify any user's cart by iterating ids. All cart calls in the reproductions below were made with no `Authorization` header at all.

`POST /api/checkout`, `GET /api/checkout/:id`, `POST /api/payments` and `GET /api/payments/order/:orderId` are likewise unguarded.

### 1.5 Hardcoded fallback JWT secrets

`server.js` defaults to `'your-unified-secret-key'` and a literal admin secret string; `docker-compose.yml` commits both in plaintext and the Compose file supplies exactly those values, so the defaults *are* the deployed configuration. Anyone with the repo can mint valid tokens for either realm.

### 1.6 `unified-ui/.env` reaches the Docker build context

There is no `unified-ui/.dockerignore`, so the builder stage's `COPY . .` pulls the real Razorpay key/secret/webhook-secret into an image layer. The final runtime stage does not copy it forward, which limits the exposure, but the secret is still written into build cache. (`.env` is correctly git-ignored and is **not** committed — that part is fine.)

---

## 2. Critical — Correctness

### 2.1 Every password change and reset is silently discarded — **VERIFIED**

`user-service/.../AuthServiceImpl.java`, in both `changePassword` and `resetPasswordByEmail`:

```java
user.setPassword(passwordEncoder.encode(newPassword));
userRepository.save(user);
refreshTokenRepository.revokeAllByUser(user);   // ← @Modifying(clearAutomatically = true)
```

`RefreshTokenRepository.revokeAllByUser` is annotated `@Modifying(clearAutomatically = true)` **without `flushAutomatically = true`**. `flushAutomatically` defaults to `false`, so inside the transaction:

1. `save()` queues the password UPDATE in the persistence context — not yet flushed.
2. The bulk JPQL UPDATE runs **without flushing first**, then **clears the persistence context**.
3. Clearing discards the pending password UPDATE.
4. The transaction commits with nothing to write.

The endpoint returns `200 OK` and nothing changes:

```
$ curl -X POST http://localhost:8004/api/auth/reset-password \
       -d '{"email":"customer1@example.com","newPassword":"HijackedPass1"}'   → 200

$ psql -c "select id,email,updated_at from users where id=2;"
   2 | customer1@example.com | 2026-07-16 17:59:25.474679      ← unchanged

$ curl -X POST .../api/auth/login -d '{"email":"customer1@example.com","password":"HijackedPass1"}' → 401
```

So users can never change their password, and the UI reports success every time.

**Fix:** `@Modifying(clearAutomatically = true, flushAutomatically = true)`.

### 2.2 Changing quantity and removing a cart item always fail — **VERIFIED**

`server.js` forwards the URL segments straight through:

```js
app.put('/api/cart/:userId/items/:itemId', ... `${CART_SERVICE}/carts/${req.params.userId}/items/${req.params.itemId}` ...)
```

Two mismatches: cart-service expects a **cart id** in the first position (not a user id) and a **cart-item id** in the second, while the Angular cart component sends the user id and the *product* id (`item.itemId`). Cart ids come from a DB sequence and never coincide with user ids.

```
$ cart for user 6 → {"id":30, items:[{"id":84,"itemId":1,...}]}   (cartId 30, cartItemId 84, productId 1)
$ curl -X PUT    http://localhost:4200/api/cart/6/items/1 -d '{"quantity":5}'  → 404
$ curl -X DELETE http://localhost:4200/api/cart/6/items/1                       → 404
```

The cart page's `+`/`−` buttons and the remove button are dead for every user.

### 2.3 Shipping addresses are silently discarded — **VERIFIED**

The checkout stepper collects and validates a full Indian address (6-digit PIN, `[6-9]`-prefixed mobile) and posts it, but `order-service`'s `CreateOrderRequest` only declares `customerId`, `items` and `notes`. Spring Boot's Jackson default ignores unknown properties, so the address vanishes without error:

```
$ curl -X POST /api/orders -d '{"items":[...],"shippingAddress":{"fullName":"E2E Test","addressLine1":"12 MG Road",...},"totalAmount":1798}'
  → 201 {"id":24,"orderNumber":"ORD-6A66F4D6","customerId":"6","status":"PENDING","totalAmount":1798,
         "items":[...],"notes":null}                    ← no address anywhere
```

Every order in the system is undeliverable. The BFF also drops the client's `totalAmount`; order-service recomputes it from line items, which is correct behaviour, but nothing validates the two agree.

### 2.4 The admin SPA cannot authenticate against admin endpoints — **VERIFIED**

There are two disjoint identity systems and the UI only speaks to one:

- `user-service` has an `admin` account with role `ADMIN`; the login page posts to `/api/auth/login` and gets a token signed with `JWT_SECRET`.
- `admin-service` has its own separate admin account and mints tokens signed with `ADMIN_JWT_SECRET`.

The BFF's `authenticateAdmin` only accepts the latter, and no UI route reaches `/api/auth/admin-login`. So a user with role `ADMIN` passes the Angular `RoleGuard`, lands on `/admin`, and then gets 403 from every strictly-guarded endpoint:

```
Logged in as admin@example.com (role ADMIN):
  /api/shipments        → 403
  /api/audit            → 403
  /api/admin            → 403
  /api/admin/dashboard  → 403
  /api/users            → 200   ← only because these use the permissive authenticateAny
```

Shipments, audit logs, admin-user management and the legacy dashboard are unreachable from the UI. Once §1.2 is fixed correctly, the pages that *currently* work would break too — the identity bridge has to be built as part of that fix.

### 2.5 `/api/items/search` hits a route that does not exist — **VERIFIED**

The BFF proxies to `${ITEM_SERVICE}/items/search`, but `ItemController` has no `search` mapping. The request falls through to `@GetMapping("/{id}")`, which fails to bind `"search"` to a `Long`:

```
$ curl "http://localhost:8005/items/search?q=test"
  → 400 {"status":400,"error":"Bad Request","path":"/items/search"}
```

### 2.6 The cart is never cleared after a successful order

`checkout-stepper.component.ts` navigates to the confirmation page without calling `DELETE /carts/{id}/clear` (which exists in cart-service but is not exposed by the BFF). After checking out, the user's cart still holds everything they just bought.

### 2.7 Adding the same product twice creates duplicate cart lines

`CartServiceImpl.addItemToCart` unconditionally constructs a new `CartItem` instead of incrementing an existing line. It also does `cart.setItemCount(getItemCount() + 1)` regardless of the quantity added, so `itemCount` tracks neither lines nor units accurately.

### 2.8 A wrong password logs the user out with "session expired"

`JwtInterceptor.handle401Error` fires on *every* 401, including the one from submitting bad credentials on the login form. It calls `AuthService.refreshToken()` → `POST /api/auth/refresh`, **an endpoint the BFF does not implement**. The refresh fails, the interceptor calls `logout()` and redirects to `/login?reason=session_expired`. The BFF also never issues a `refreshToken`, so the stored value is always `null` and refresh could never work even if the route existed.

### 2.9 The Razorpay webhook signature can never validate

`app.use(bodyParser.json())` is registered globally at the top of `server.js` and consumes the request stream, so by the time the webhook's `express.raw()` runs, `req.body` is already a parsed object and `raw()` skips it. The handler then computes the HMAC over `JSON.stringify(req.body)`, a re-serialisation that will not match the bytes Razorpay signed. Every webhook is rejected as an invalid signature.

### 2.10 The admin top-products widget calls a nonexistent endpoint — **VERIFIED**

`DashboardAnalyticsService` requests `orderServiceUrl + "/api/orders/top-products"`, but order-service maps its controller at `/api/v1/orders` and has no `top-products` route:

```
$ curl -o /dev/null -w "%{http_code}" "http://localhost:8001/api/orders/top-products?limit=10" → 404
$ curl .../api/admin/dashboard/products/top-selling                                            → 200 []
```

The table is permanently empty and the 404 is swallowed.

---

## 3. Design & UI

### 3.1 The admin revenue chart is fabricated — **VERIFIED**

`DashboardAnalyticsService.generateRevenueValue` does not query anything. It returns a sine wave:

```java
double baseRevenue = switch (period) { case "monthly" -> 1350000.0; ... };
double variation = Math.sin(offset * 0.5) * baseRevenue * 0.2 + baseRevenue;
```

The rendered dashboard therefore shows twelve months of smooth ₹12–16 L revenue directly above a **Total Sales KPI of ₹2,49,255** computed from real orders — the chart claims roughly sixty times the actual revenue. This is the most damaging item in the review: it is not a broken widget, it is a business dashboard presenting invented numbers as fact.

### 3.2 "Recent Orders" on the dashboard is hardcoded

`admin-dashboard.component.ts` → `generateRecentOrders()` returns five literal rows (`ORD-2024-001` / "Rahul Sharma", …). Real orders exist and are counted in the KPI card directly above, but are never listed.

### 3.3 Product ratings, discounts, stock and "Sponsored" flags are randomised per page load

`product-list.component.ts` synthesises display data on every fetch:

```js
originalPrice: Math.round(item.price * 1.3),
discount:     Math.floor(Math.random() * 40) + 10,
rating:       +(Math.random() * 2 + 3).toFixed(1),
reviewCount:  Math.floor(Math.random() * 5000) + 100,
inStock:      Math.random() > 0.1,
sponsored:    Math.random() > 0.7,
```

Consequences visible in the rendered page: star ratings and review counts change on every refresh; ~10% of products randomly show **Out of stock** with a disabled Add-to-Cart; and because `originalPrice` is a fixed ×1.3 while `discount` is independently random, the badge contradicts the arithmetic — *Milton Thermosteel Flask, ₹899, M.R.P. ₹1,169, "−49%"*, where ₹1,169→₹899 is −23%.

### 3.4 Product imagery is random unrelated stock photography

Both the home page and product list build image URLs as `https://picsum.photos/seed/<name>/300/300`, which returns an arbitrary photo per seed. The rendered storefront shows the Golden Gate Bridge for "Ethnic Kurta – Men", the Flatiron Building for "Banarasi Silk Saree", and a waterfall for "Anarkali Suit – Women". Several tiles also rendered blank when the external service was slow. The underlying cause is that `ItemResponse` carries no `imageUrl` or `category` field at all.

### 3.5 Search and category navigation do nothing

`product-list.component.ts` reads `params['category']` and `params['search']` into fields used only for the heading, then calls `loadProducts()`, which fetches `/api/items` and applies price/rating/discount filters only. Every one of the ~30 category links in the header, side menu and home page — and every header search — lands on the same unfiltered list of all products. `Product.category` is also always `undefined` because the API does not return it (§3.4).

### 3.6 The brand mark is the literal letter "W"

`app-header.component.html` renders `<span class="brand-icon">W</span>` next to "myindianstore", while `assets/images/logo.svg` and `logo-white.svg` — proper saffron shopping-bag marks — sit unused. The stray "W" is visible on every customer page.

### 3.7 Five unrelated colour systems on one screen

The rendered pages stack: an **orange** (`#FF6B35`) top header, a **green** (`#067D62`) category nav, a **navy** (`#232F3E`) hero, a **purple** auth gradient (`--mis-auth-gradient-start: #667eea` → `#764ba2`), and a **green** footer. The design tokens define `--mis-header-dark: #232F3E` for the header, but the header does not use it. The login page in particular reads as a different product from the storefront it sits inside. `styles.scss` also hardcodes `body { background: #EAEDED }`, overriding the documented `--mis-background: #FFF8F0`.

### 3.8 Smaller items

- **Cart badge is permanently 0** — `app-header.component.ts` declares `cartCount = 0` and never updates it.
- **`alert()` for dashboard warnings** — `admin-dashboard.component.ts` `showWarnings()` uses a blocking browser dialog while the app has a `NotificationService` toast system.
- **Duplicate Razorpay script** — `index.html` includes `checkout.razorpay.com/v1/checkout.js` twice; the browser console shows a resulting failed request to `checkout-static-next.razorpay.com/build/undefined`.
- **Login logo** — the auth card points at `logo.png` (a 1.4 KB raster) rather than the vector `logo.svg`, and renders as a blurred orange square.
- **Emoji as UI icons** — 🔒 ✉ 👁 🙈 in the auth forms, though Material Icons is already loaded in `index.html`.
- **Mobile density** — at 390 px both categories and products fall to a single column, making the home page 7,616 px tall (≈9 screens). No horizontal overflow, though: layout is otherwise sound.
- **No pagination** — the list reports "1-21 of 21 results" with no paging control; it renders the entire catalogue.
- **Link hover colour** — global `a:hover` shifts teal `#007185` → orange `#E55A24`, an unrelated hue jump.

---

## 4. Notes, not defects

- **Prebuilt jars.** All service Dockerfiles `COPY target/*.jar`; the repo ships prebuilt jars and no Maven stage. Builds therefore depend on someone having run `mvn package` first. `logistics-service` currently has 8 source files newer than its jar — that image is stale.
- **Root `.dockerignore` is inert.** It excludes `**/target/`, which would break every Java image, but Docker reads `.dockerignore` from the *build context* root (`./order-service/` etc.), and none of those exist. It has no effect today; adding per-service contexts later would break the builds.
- **Kafka is wired but idle** on these paths — order creation returned successfully with no consumer interaction observed.

---

## 5. Recommended order of work

1. **§1.1 + §1.2 + §2.4 together** — closing the BFF hole without bridging the two identity systems would break the admin UI. Fix the filter chain, switch to `authenticateAdmin`, and give the admin SPA a real login against admin-service.
2. **§2.1 then §1.3 together** — the flush bug currently masks the account-takeover hole; fixing it in isolation would activate the vulnerability.
3. **§2.2, §2.3, §2.5, §2.6** — the broken storefront write paths.
4. **§3.1 + §3.2 + §3.3** — stop presenting invented data as real.
5. Remaining UI and design consistency work.
