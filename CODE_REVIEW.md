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

---

# Appendix A — Fix status

Applied on branch `fix/security-and-correctness-review`. Each "verified" line was
re-run against the rebuilt stack after the fix; the reproductions in the body above
are the *before* state.

## Fixed and verified

| § | Finding | Verification |
|---|---|---|
| 1.1 | admin-service bypassed auth on `/api/manage/**` and `/api/admin/dashboard/**` | Both now 403 unauthenticated; `/api/audit` unchanged |
| 1.2 | Customers held admin privileges through `authenticateAny` | Customer token: create item 403, list users 403, delete user 403 |
| 1.3 | Password reset on email alone | Now a two-step token flow; no-token and forged-token both 400; request returns a neutral, non-enumerating response |
| 1.4 | Cart/order/payment/return IDOR | Cart resolves from the token (asking for user 2's cart returns the caller's); another customer's order 404; payments now require auth |
| 1.5 | Committed default JWT secrets | BFF exits on a missing/weak/short secret; compose reads `${JWT_SECRET:?}` from `.env`; added `.env.example` |
| 1.6 | `.env` entering the build context | Added `unified-ui/.dockerignore` |
| 2.1 | Password changes silently discarded | `users.updated_at` now advances and the new password authenticates |
| 2.2 | Cart quantity/remove always 404 | Update 200, remove 204, both keyed by product id as the UI sends |
| 2.5 | `/api/items/search` returned 400 | `?q=saree` → 200, 1 result ("Banarasi Silk Saree") |
| 2.6 | Cart survived checkout | `DELETE /api/cart/:id/clear` → 204, cart empty; checkout calls it after payment |
| 2.7 | Duplicate cart lines | Adding a product twice merges: 1 line, quantities accumulate 2+3=5 |
| 2.8 | Missing `/api/auth/refresh` | Endpoint added, login issues a refresh token, refresh → 200; the interceptor no longer force-logs-out on a bad password |
| 2.9 | Webhook HMAC over a re-serialised body | Raw body preserved for that route only |
| 3.1 | Fabricated revenue chart | Monthly series total **249,255** now equals the Total Sales KPI **249,255** |
| 3.2 | Hardcoded "Recent Orders" | Renders the five most recent real orders |
| 3.3 | Randomised ratings/discounts/stock | Derived from the product; discount is computed from M.R.P. so the badge matches; ratings omitted rather than invented |
| 3.5 | Search and category links did nothing | Both now filter server-side |
| 3.6 | Brand mark was the letter "W" | Uses `logo-white.svg` |
| 3.8 | Duplicate Razorpay script, `alert()`, raster logo on the auth card | All replaced |

## Fixed but not independently verifiable here

- **2.9 webhook** — correct by construction (the route keeps its raw body), but
  confirming it needs a real signed Razorpay delivery.

## Known remaining

- **2.3 — shipping address is still dropped.** `CreateOrderRequest` has no address
  field, so checkout still posts an address that order-service ignores. This needs a
  schema change (address snapshot on the order), which belongs with the order-model
  rework rather than a patch.
- **2.10 — top-products is still empty.** The URL now points at order-service's real
  base path (`/api/v1/orders/top-products`), but that endpoint does not exist yet;
  order-service must expose the aggregation.
- **2.4 — one login, two realms.** The BFF now bridges them: it accepts a
  user-service `ADMIN` and mints a short-lived admin-service token. Consolidating the
  two identity stores properly is still open.
- **3.4 — product imagery** is still random `picsum.photos` stock photos, because
  `ItemResponse` carries no image or category field.
- **3.7 — palette incoherence** (orange header / green nav / navy hero / purple auth
  gradient / green footer) is unchanged; it needs a design decision, not a patch.
- **user-service `/api/auth/reset-password` is still `permitAll()`.** Acceptable only
  while the service is not reachable from outside the Docker network.
- **`logistics-service`'s jar is stale** relative to its sources.

---

# Appendix B — Design pass and further fixes

A second round after the initial audit, taking design direction from a commercial
reference the user supplied (layout rhythm and component structure only — no markup
or CSS was copied, and the project stays on SCSS rather than adopting Tailwind).

## Design system

The storefront was running **five unrelated colour systems at once**: a saffron
header, a bright-green (`#138808`) category nav, a navy (`#232F3E`) hero, a purple
auth gradient (`#667eea` → `#764ba2`) and a green footer.

Three palettes were tried before the current one. Brand green read heavy across large
areas and muddied the saffron; a neutral charcoal chrome read flat; and a warm
off-black was rejected as still too dark. Green and black are both retired as UI
colours. The palette is now warm end to end:

| Role | Colour | Used for |
|---|---|---|
| Brand / action | `--mis-primary` `#FF6B35` | CTAs, nav pill, cart, search, focus rings, card hover |
| Chrome | `--mis-chrome` `#A63A16` / `#7C2A0F` | Utility bar, footer, admin sidebar |
| Dark note | `--mis-plum` `#6B2151` | Second hero panel, auth gradient end, success states |
| Accent | `--mis-accent` `#E11D62` | Deals and urgency only — promo strip, hero gradient |
| Text | `--mis-ink` `#43281B` | Deep warm brown, not black |
| Canvas | `--mis-page-bg` `#FFF9F5` | Warm cream page background |

Saffron is reserved for things you can click, so it reads as an action rather than
decoration; hot pink has a single job — one promotional message — so it keeps
signalling. Neutrals were re-tempered from cool slate to warm stone, and every
near-black literal, shadow and overlay was moved into the brown scale: 272 + 106
colour values across 23 stylesheets. Admin follows the same system rather than its
own indigo-black.

### Contrast

White on saffron measured **2.84:1**, below even the 3.0 large-text floor — a real
accessibility failure that predated this work but mattered more once saffron became
the primary action colour. Rather than dull the saffron, saffron fills now take a dark
label (`#43281B`, **4.75:1**) and *lighten* on hover (`#FF7F4F`, 5.39:1) so contrast
rises rather than falls. 17 label/hover pairs across 8 stylesheets.

Measured on the running app:

| | Ratio |
|---|---|
| White on utility bar `#7C2A0F` | 9.57:1 |
| White on footer `#A63A16` | 6.49:1 |
| Dark label on saffron CTA | 4.75:1 |
| White on plum hero | 10.71:1 |
| White on pink promo | 4.61:1 |
| Body text on canvas | 12.91:1 |
| Muted text on white card | 4.84:1 |

All pass WCAG AA for body text.

### Verification

Checked by reading computed styles from the running app rather than by eye, since this
session's image budget was exhausted. A sweep of every visible element on the home,
products, login and admin dashboard pages found **no black and no green** on any of
them, and no white-on-saffron combination remaining.

## Changed

- **Header** rebuilt as three rows — a deep-green utility bar (support, delivery,
  locale), a white row with the logo, a pill search and circular account/cart
  actions, and a white category nav with a green "All" pill. It was a solid saffron
  block above a bright-green bar.
- **Home** replaced the navy hero — whose "hero image" was a random `picsum` photo of
  a fog-covered railway line — with a two-panel green/saffron hero, plus a four-card
  trust strip.
- **Product cards** unified across home and listing: square image panel, clamped
  two-line title, price, stock, saffron add-to-cart.
- **Listing page** given a proper filter rail, results bar and breadcrumb (which was
  rendering as a numbered list, "1. Home 2. Products").
- **Login** moved onto the same shared auth layout as register, via a new
  `shared/styles/_auth.scss` partial so the two pages cannot drift apart.
- **Mobile** product grids go two-up instead of one-up; the home page is now 3,747px
  tall rather than 7,616px (nine screens). No horizontal overflow at 390px.

## Fabricated data removed

§3.3 was only half-fixed the first time. Deriving M.R.P. as `price × 1.3` made the
discount badge arithmetically consistent, but every product in the catalogue then
showed an identical "−23% off" — which is not a discount, it is an invented one.
Also removed a hardcoded "FREE Delivery by Tomorrow" on every card.

Ratings, review counts, M.R.P., discounts, sponsored flags and delivery promises are
now omitted entirely, each with a comment naming the service that will supply it
(review-service, pricing-service, promotion-service). The rating and discount
**filters** were removed with them — left in place they would have filtered on fields
nothing populates and silently emptied the grid.

**§3.4 product imagery** — `picsum.photos/seed/<name>` returned an arbitrary photo per
seed: the Golden Gate Bridge for "Ethnic Kurta – Men", the Flatiron Building for
"Banarasi Silk Saree". Replaced with `core/utils/product-image.ts`, which generates a
deterministic branded SVG tile from the product's initials. No external service, no
blank tiles, and honest about there being no photograph. Category tiles likewise use
icons instead of random photography.

## New finding — anonymous visitors shared one cart — **VERIFIED**

Not previously reported. Every unauthenticated visitor was mapped to `userId 999999`,
so they all shared a single cart:

```
visitor A: cartId 27, userId 999999, 4 items
visitor B: cartId 27, userId 999999, 4 items   ← same basket
```

One shopper's basket was visible to every other anonymous visitor. Each browser now
gets its own guest id above a reserved floor, carried in a **signed, httpOnly**
cookie so it cannot be claimed by editing it:

```
visitor A: cartId 32, userId 918363875   A adds 2 units -> A sees 2
visitor B: cartId 33, userId 910192491                  -> B still sees 0
```

## Registration

See the commit for detail. The Sign-up button was silently dead: the phone validator
`/^\d{10}$/` rejected every shape a browser autofills (`09250444838`,
`+91 92504 44838`), and an invalid form returned early without saying anything. Phone
and gender were collected but never stored; the display name became the username
verbatim, spaces included. The email and phone "Verify" buttons were removed — they
set a flag and showed "OTP sent" without contacting anything.

---

# Appendix C — Guest-to-signed-in flow

Reported as "after adding item in cart and then login going to my profile section".
The redirect was the visible half; underneath it, the cart was being lost.

## Signing in silently emptied the cart — **VERIFIED**

Guest carts and user carts are separate rows keyed by different ids, and nothing
joined them at sign-in. Everything added before signing in stayed on the orphaned
guest cart:

```
guest cart before sign-in : 2 lines, 3 units
signed-in cart after      : 0 lines          ← basket gone
guest cart still holds    : 2 lines          ← orphaned
```

The BFF now merges the guest cart into the account on both login and registration,
then clears the guest cookie. Quantities are **added** to any line the user already
had for the same product rather than overwriting it:

```
signed-in cart : item1 x3
guest cart     : item1 x2, item5 x1
after sign-in  : item1 x5, item5 x1
```

The merge is never allowed to fail the sign-in — a merge error is logged and
swallowed, because losing a cart is bad but refusing the login is worse.

## Sign-in dumped shoppers on their profile

`login.component.ts` sent every `CUSTOMER` to `/account` regardless of where they
came from, and nothing captured the page they were on.

- `AuthGuard` now passes the attempted URL as `returnUrl`.
- The header's sign-in and register links pass the current URL.
- Login and registration honour it, defaulting to `/home` — back to shopping, not the
  account page.
- Only same-origin relative paths are accepted, so the parameter cannot be used to
  bounce someone to another site.

### The guard's returnUrl was being thrown away

`AuthGuard` navigated to `/login`, which `app-routing.module.ts` redirects to
`/auth/login` — and Angular's `redirectTo` **drops query parameters**. The guard now
navigates to `/auth/login` directly.

## The cart badge did not update on add

`CartService` owns the badge and refreshes on identity change, but the product list
and product detail pages posted to `/api/cart/...` directly, so the count stayed stale
until the next navigation. Both now go through `CartService.addItem()`.

## Verified in a browser

```
cart badge as guest        : 1
sign-in page url           : /auth/login?returnUrl=%2Fstorefront%2Fproducts
landed on after sign-in    : /storefront/products
cart badge after sign-in   : 1  (kept)

/checkout while signed out -> /auth/login?returnUrl=%2Fcheckout
after sign-in              -> /checkout
```

---

# Appendix D — Admin order details were blank

Reported as the admin portal showing a product and amount but an empty
Customer / Phone / Email / Address / Expected block. This is §2.3 surfacing in the UI:
the data was never stored, so there was nothing to render.

## Root cause

`active-orders.component.ts` hardcoded the fields it could not get:

```ts
customerName: `Customer #${o.customerId}`,
customerPhone: '',
customerEmail: '',
deliveryAddress: '',
expectedDelivery: '',
```

because `order-service` had no columns for any of it. The checkout form collected a
full address, posted it, and Jackson discarded it silently.

## Fixed

**order-service** gained a `ShippingAddress` embeddable (`ship_*` columns) plus
`customer_name`, `customer_email` and `customer_phone`. All nullable, so
`ddl-auto: update` added them without touching existing rows — this particular change
did not need Flyway, which only blocks destructive or narrowing migrations.

Address and customer are **snapshots**, not references: an order must show where it
was actually sent and who placed it even after the customer edits their profile or
deletes the address ([order-flow](flows/order-flow.md)).

**The BFF** now maps `shippingAddress` explicitly instead of spreading it into `rest`
where it fell out, normalises the phone, and snapshots the customer from the token and
their profile. **An order without a deliverable address is now rejected with 400**
rather than silently accepted as undeliverable.

**The admin list** reads the real values, falling back to `Customer #id` only for
orders placed before the fields existed. `expectedDelivery` is derived as order date
plus five days — a standard window, clearly labelled, not a fabricated promise;
logistics-service will supply a real date.

Orders are also now sorted newest-first. They came back in creation order, so with
10 to a page the newest — the ones an admin is most likely acting on — were on the
last page.

## Verified

An order placed through the real checkout UI:

```
name : Priya Sharma
phone: 9876543299
email: e2e.1788933701282@example.com
addr : 88 MG Road, Indiranagar, Bengaluru, Karnataka - 560038
```

and rendered in the admin panel with Phone, Email, Address and Expected all populated.
Orders created before this change correctly show `(none)` rather than inventing values.

## Still open

`/admin/orders/:id` (`order-details.component.ts`) is **entirely mock** — it calls
`loadMockOrder()` and never touches the API, returning a hardcoded "Rajesh Kumar" and
turmeric order. Nothing links to it, so it is only reachable by typing the URL, but it
is the same fabricated-data problem and should either be wired to the API or removed.

---

# Appendix E — Seed data, marketplace and delivery partners

## Seed data

`seed-data.js` replaces the mock fallbacks with real records, created **through the
APIs** rather than SQL — so if the seed runs, the API works. Idempotent; re-running
skips what exists.

- **4 sellers** — Varanasi Silk House, Malabar Spice Traders, Jaipur Craft Bazaar
  (approved) and Nashik Organics (left pending, so the admin approval queue has
  something in it). GSTINs follow the real 15-character format so they pass
  validation; they are not registered numbers.
- **25 products** with real categories and plausible Indian retail prices, spread
  across three sellers plus first-party stock.
- **3 customers** with real Indian addresses, and an order each.

```
Customer  ananya.iyer@example.com     / Passw0rd@123
Seller    seller.varanasi@example.com / Passw0rd@123  (approved)
Seller    seller.nashik@example.com   / Passw0rd@123  (awaiting approval)
Admin     admin@example.com           / password123
```

## seller-service (8021)

Registration, login, GSTIN, pickup address, and a `PENDING_APPROVAL → APPROVED /
REJECTED / SUSPENDED` lifecycle. Sellers authenticate against seller-service but hold
a token this BFF signs, so the browser keeps one token format — the same bridge as
[ADR-0004](docs/adr/0004-two-identity-realms.md).

Enforced and verified:

| Rule | Result |
|---|---|
| New sellers start unapproved | `PENDING_APPROVAL` |
| Unapproved sellers cannot publish | 403 |
| Sellers see only their own catalogue | scoped |
| Editing another seller's product | 404 |
| A customer token on the seller API | 403 |
| A customer reaching the approval queue | 403 |
| Suspended seller signing in | 403 **with the admin's reason** |

Ownership comes from the token, never the request body — otherwise a seller could
list a product under someone else's name.

## Delivery partners

Six real Indian carriers seeded in logistics-service with their real public tracking
URLs: Blue Dart (2 days), Delhivery (3), DTDC, Ecom Express, XpressBees (4), India
Post (7). Rates and transit times are indicative defaults for an admin to replace with
contracted figures — starting values, not quoted prices.

Serviceability is by pincode prefix, so a carrier can be limited to the regions it
actually covers. At checkout the BFF picks the fastest carrier that serves the
delivery pincode and records it **on the order**, with an expected date, so the
promise made to the customer is the one stored.

## Gaps found by testing, and closed

Running every flow end to end surfaced three:

1. **Orders recorded no delivery partner** — the partners existed but nothing assigned
   one. Now chosen at order time from those serving the pincode.
2. **Order lines did not record the seller** — a marketplace order could not be routed
   to whoever had to pack it. `OrderItem` now carries `sellerId` and `sellerName`.
3. **Sellers could not see their orders.** `/api/seller/orders` did not exist; the
   request was being answered by the SPA catch-all, which returns 200 and HTML — so it
   looked like it worked. Added, returning only that seller's lines and their share of
   the total. Verified a second seller does not see another's order.

### A price-integrity bug found on the way

Order lines took `price` from the request body. A crafted request could set any price:

```
client sent  ₹1
order stored ₹649   ← now resolved from the catalogue
```

Every line is now resolved server-side against item-service — price, name and seller.
This is architectural rule 8 ("never trust a frontend-calculated price") which the
code was violating.

## Still open

- Shipments are not handed to a carrier API. Tracking numbers are generated locally,
  so a tracking link only resolves for a consignment that really exists.
- No inventory reservation at checkout, so stock can still be oversold
  ([checkout-flow](docs/flows/checkout-flow.md)).
- Seller settlement and payouts are not modelled.
- `/admin/orders/:id` is still entirely mock.

---

# Appendix F — The seller portal was unreachable

Reported as valid seller credentials being rejected with "Invalid email or password".

The credentials were fine. Seller sign-in lives at `/seller/login`, and **nothing in
the UI linked to it** — so the natural thing is to try the normal login page, which
authenticates against user-service, where no seller exists. A correct password looked
like a wrong one.

Two fixes, because either alone leaves the trap:

**Discoverability.** The account menu's "Your Seller Account" and "Register for a free
Business Account" were still marked `pending: 'seller-service'` from when that service
did not exist. They now route to `/seller` and `/seller/register`. Added a
"Sell on MyIndianStore" footer link and a "Seller sign in" line on the login page.

**A useful failure.** When a customer login fails, the BFF now retries against
seller-service. If the password matches *there*, it says so and the login page offers
a link to the seller portal.

This reveals nothing to someone without valid credentials — the seller password has to
be correct before the different message appears. Verified:

| Input | Response |
|---|---|
| Seller email + correct seller password | "That is a seller account…" + link |
| Seller email + wrong password | `Invalid credentials` |
| Unknown email | `Invalid credentials` |
| Customer credentials | 200, unaffected |

It deliberately does not sign them in across realms — silently switching realm on a
login attempt would be surprising. It points at the right door.

Verified end to end in a browser: the message and link appear, the link lands on
`/seller/login`, signing in there reaches the dashboard showing "Approved — your
listings are live", and both menu entries render live rather than "Soon".

---

# Appendix G — Seller Central

The seller dashboard was one page: a status banner, three tiles and a product table.
It is now a five-view portal behind a persistent shell, in the shape of a real seller
console.

## Structure

A sticky top bar and sidebar wrap every view, so account standing is visible wherever
the seller is:

| View | What it shows |
|---|---|
| **Dashboard** | Revenue, orders (with how many are still open), units sold, listings and stock value; a 14-day sales chart; restock-soon list; best sellers |
| **Products** | The catalogue, with add / edit / remove |
| **Orders** | Orders containing their items, filterable by *to fulfil* / *closed*, expandable to the customer, address and courier — and a **Mark shipped** action |
| **Delivery partners** | All six couriers, which of them collect from this seller's pincode, transit time and base rate |
| **Account** | Business details and pickup address (which decides courier availability) |

## Every number is derived, none are padded

`GET /api/seller/stats` computes from the seller's real order lines and listings. A
seller with no orders sees zeros and an explicit *"No sales in the last 14 days yet"* —
not a decorative chart. Verified both ways:

```
Varanasi Silk House (no orders)   ₹0        0 orders   0 units   7 listings   0 chart bars
Malabar Spice Traders (2 orders)  ₹1,947    2 orders   3 units   6 listings  14 chart bars
```

The chart is plain CSS bars — no charting library, and it renders nothing rather than
a fabricated shape when there is no data.

## Fulfilment

**Mark shipped** creates a real shipment in logistics-service with the chosen carrier,
a tracking number, the delivery address and an ETA from the carrier's transit time:

```
shipment DEL942523205 via Delhivery — tracking DEL942523205
```

The courier list offered is restricted to those that collect from the seller's pickup
pincode, defaulting to whichever was assigned at checkout.

**The tracking number is generated by us, not the carrier.** There is no carrier API
integration, so it identifies the shipment in MyIndianStore only and the tracking link
will not resolve on the courier's own site. Both the orders view and the delivery view
say this in as many words, rather than implying a real consignment.

## Authorization

Unchanged and still enforced server-side: `/api/seller/orders/:id/ship` verifies the
order actually contains one of that seller's lines before creating anything, and
publishing still requires an approved account. The sidebar dims gated entries, but
that is a hint, not the boundary.

---

# Appendix H — Shopper chrome leaking into the seller portal

Sellers were seeing a search box, the full shopper category nav (Bestsellers, Mobiles,
Fashion, Today's Deals…), a cart badge and the storefront footer stacked above Seller
Central's own top bar and sidebar. None of it applies to a seller.

`app.component.ts` suppressed the storefront shell for exactly one prefix:

```ts
this.showStorefrontShell = !event.urlAfterRedirects.startsWith('/admin');
```

`/seller` was added after that line was written and never included, so the portal
inherited the shopper header and footer on top of its own chrome.

Replaced with a list of sections that bring their own chrome, matched on a path
boundary so a future `/sellers-report` route cannot be swallowed by a `/seller`
prefix match:

```ts
private static readonly OWN_SHELL = ['/admin', '/seller'];
...
this.showStorefrontShell = !AppComponent.OWN_SHELL.some(
  (prefix) => url === prefix || url.startsWith(prefix + '/')
);
```

Verified across all four surfaces:

| Route | Shopper header / nav / cart / footer | Seller chrome |
|---|---|---|
| `/seller/dashboard` | absent | present |
| `/seller/orders` | absent | present |
| `/seller/login` | absent | absent (full-page auth) |
| `/admin/dashboard` | absent | absent (admin chrome) |
| `/home` | present | absent |

---

# Appendix I — Where you assign a delivery partner, and three bugs behind it

The question "how do I assign a delivery partner?" had an answer already, but a
poor one: the control existed and the assignment did not survive contact with
the rest of the system.

## Where the assignment lives

Two places, for two different jobs:

| Who | Where | What they decide |
|---|---|---|
| Seller | Seller Central → **Orders** → expand an order → **Hand to courier** | Which courier collects *this* parcel |
| Admin | Admin → **Delivery Partners** | Which couriers exist, their rates, transit times and pincode coverage |

The admin page also carries a coverage probe — type a pincode, see which
couriers could serve it and which would be picked — so the question "can we
deliver here?" can be answered without placing a test order.

Both were reachable only by typing the URL until this pass; they now have
sidebar entries.

## 1. The seller's choice was discarded

Checkout provisionally assigns the fastest serviceable courier. The seller can
pick a different one when they actually hand the parcel over — and that choice
was written to the *shipment* but never back to the *order*.

Shipping order 34 with Delhivery produced:

| | Courier | Expected |
|---|---|---|
| Shipment created | Delhivery | 12 Sep |
| Order still said | Blue Dart | 11 Sep |

The order is what the customer's tracking reads from, so the customer would
have been told to expect a courier that never collected the parcel.

There was no endpoint to correct it. Added `PATCH /api/v1/orders/{id}/delivery`
(`UpdateDeliveryRequest`, patch semantics — only supplied fields change), and
the BFF now calls it after creating the shipment.

## 2. Shipping did not mark the order shipped

The seller pressed **Mark shipped**, the row moved, and on the next reload it
was back under *To fulfil* — the ship route created a shipment but never
advanced the order's status. It now patches the order to `SHIPPED`.

## 3. A Kafka outage destroyed the shipment

`POST /api/shipments` hung for exactly 30s and returned
`{"error":"Could not create the shipment"}`. The logistics log gave it away:

```
Exception thrown when sending a message ... to topic shipment-events:
org.apache.kafka.common.errors.TimeoutException:
  Topic shipment-events not present in metadata after 60000 ms.
... Request processing failed: org.springframework.kafka.KafkaException: Send failed
```

`KafkaTemplate.send` is only asynchronous once the producer knows the topic.
For an unknown topic it blocks the calling HTTP thread for `max.block.ms`
(default 60s) and then throws — inside the request, so the hand-off failed
entirely even though the shipment row had already been written.

Announcing a shipment is a side effect of shipping, not part of it. Two changes:

- `max.block.ms: 5000` (with matching request/delivery timeouts) so the producer
  fails fast instead of holding a request thread for a minute.
- The `send` is wrapped and non-fatal, logging which event could not be
  published rather than losing the shipment.

Earlier shipments succeeded only because the producer still had cached metadata
from before the broker went unreachable — the failure was latent, not new.

## Verified

- `PATCH /api/v1/orders/34/delivery` → `code=DELHIVERY name=Delhivery expected=2026-09-12T09:39:24`
- Seller Central: chose Delhivery (not the default first option), pressed
  Mark shipped → `201`, shipment carrier Delhivery, and the order card then read
  **Assigned courier Delhivery / Expected 12 Sep 2026**
- Read back through `/api/seller/orders`: `id=34 courier=Delhivery expected=2026-09-12T09:49:13`
- Admin → Delivery Partners: 6 rows, "6 of 6 active", coverage probe for 560025
  reports *Blue Dart would be assigned (2 days). Also available: 5 others.*
- Admin → Sellers: 5 sellers across Awaiting approval (1) / Approved (3) / Suspended (1)
- Both sidebar entries navigate to their pages

## Still open

- **The logistics fix is built but not deployed.** `mvn package` succeeds; the
  container rebuild fails because Docker Desktop's engine is currently returning
  500/502 on image operations and cannot reach the registry. It needs
  `docker compose up -d --build logistics-service` once Docker is healthy.
- **The `shipment-events` topic does not exist** and the broker is unreachable
  from the logistics producer. With the change above this degrades to a logged
  warning instead of a failed shipment, but no consumer is receiving shipment
  events in the meantime.
- Tracking numbers are still generated locally — no carrier API is integrated,
  so a tracking link will not resolve on the courier's own site.

---

# Appendix J — One commerce core: marketplace + dropshipping + pluggable couriers

Design in [`docs/commerce-architecture.md`](docs/commerce-architecture.md); decisions in
ADR-0005 and ADR-0006. This appendix records what was built and, separately, what was
actually exercised against the running stack on 2026-09-14.

## What changed

| Area | Change |
|---|---|
| item-service | `fulfilmentModel` / `fulfilmentPartnerCode` on items, validated; legacy rows resolve from `sellerId`; `GET /items/fulfilment/{model}` |
| order-service | Both fields snapshotted on order lines; `deliveryAssignmentReason` on orders; unknown ids are 404 not 500 |
| logistics-service | Carrier adapter SPI (`MANUAL`, `DELHIVERY`, `SHIPROCKET`); courier allocation (manual → location rule → default → strategy) with rules and per-model settings; shipments keyed by fulfilment group with idempotent booking; Shiprocket seeded **inactive**; Dockerfile aligned with the other services |
| supplier-service (**new**, 8027) | Dropship partners (the six named ones, seeded inactive), private SKU/cost listings, supplier orders with a status machine, idempotent dispatch that refuses unpaid orders, manual adapter |
| payment-service | `POST /api/v1/payments/captured` records a gateway-captured payment idempotently; it never runs the random-decline simulation |
| BFF | `bff/fulfilment.js` (group derivation, pure, unit-tested), `bff/commerce-core.js`, `bff/shipping-routes.js`, `bff/dropship-routes.js`; Razorpay amount from the order and verification bound to `notes.orderId`; order lines that fail to resolve are rejected instead of priced from the client |
| Admin console | Fulfilment queue, Courier allocation (settings, rules, probe), Delivery partners (add, integration status), Dropshipping (partners, catalogue, supplier orders), real order details (the mock page is gone), mock fallbacks removed from active/closed orders |
| Seller Central | Courier suggested by allocation with its reason; manual override checked server-side; own tracking number; per-seller shipment on closed orders; unpaid orders cannot be shipped |
| Storefront / checkout | "Sold by / ships from" label; per-group delivery estimate before payment; per-group tracking in order history |

## Two payment defects fixed on the way — **VERIFIED**

1. `POST /api/payments/razorpay/create-order` took `amount` from the browser. A request
   with `amount: 1` for a ₹10,348 order now gets a Razorpay order for **1,034,800 paise**:
   the amount is read from order-service and the client value is ignored.
2. `verify` checked the HMAC but never *which* order the payment was for. It now fetches
   the Razorpay order and requires `notes.orderId` and `amount` to match ours. Demo mode
   (no keys) still refuses another customer's order and an already-paid one.

A third: order lines whose catalogue lookup failed were priced from the request body.
They are now rejected with 422.

## Verified against the running stack

Full stack rebuilt (`mvn package` for every changed service, `docker compose up -d
--build`), seeded through the APIs, then a scripted run of 54 checks through the BFF at
`http://localhost:4200` with real customer, seller and admin tokens. First run 53/54; the
one failure was the script assuming a fresh database (Delhivery's row keeps `MANUAL` on an
existing database until an admin switches it, exactly as §8.1 says). The check was
corrected to switch the row first. After the queue fix below and a UI rebuild the script
passed **54/54** — once its seller tracking number was made unique per run, because
`shipments.tracking_number` is unique and the service rightly refused the repeat with 409.

Unit tests: logistics 61, supplier 90, item 21, order 5, BFF 9 — all passing.

| Check | Seen |
|---|---|
| Allocation: rule `56,60,50 → Blue Dart`, default `Delhivery`, manual `XpressBees` | 560038 → `BLUEDART RULE`; 110001 → `DELHIVERY DEFAULT`; manual → `XPRESSBEES MANUAL`; SELLER model → `STRATEGY` |
| Rule with unknown partner | 400 |
| Customer on any `/api/admin/**` route | 403 |
| Six dropship partners | seeded, all inactive; Qikink activated via the API |
| Listing priced at or below cost | 400 |
| Dropship listing | catalogue item created as `DROPSHIP`, margin ₹349 reported |
| Mixed basket (own + seller + dropship), client prices `1` | order total **10,348** from the catalogue; courier `BLUEDART` reason `RULE`; every line carries its model |
| Razorpay create-order with client `amount: 1` | 1,034,800 paise |
| Verify (demo) | order → `PAYMENT_COMPLETED`; payment row `10348.00 COMPLETED` keyed by the gateway id; **1 supplier order** created at cost 350.00, `AWAITING_MANUAL_PLACEMENT` |
| Pay a paid order | 409 |
| Customer fulfilment view | 3 groups, none shipped; response contains no `QIKINK` and no `costPrice` |
| Admin ships own group with DTDC | 201, `bookingMode MANUAL`, `trackingGenerated true`; repeat → 200 `alreadyBooked`; order courier updated to DTDC; order **still** `PAYMENT_COMPLETED` |
| Seller: another seller ships this order | 404 |
| Seller: manual pick of the inactive Shiprocket | quote says "Shiprocket is disabled"; ship with it → 422 |
| Seller ships with own AWB `MYAWB123` | 201, `trackingGenerated false` |
| Supplier order: `SHIPPED` without tracking | 400; illegal transition → 409; dispatch again → `created 0 existing 1` |
| Supplier order shipped | order becomes **`SHIPPED` only now**, after all three groups |
| Unpaid order: ship / dispatch | 409 / 409 |
| Unconfigured Delhivery API adapter | booking degrades to `MANUAL` with the note "Delhivery integration not configured (DELHIVERY_API_TOKEN, DELHIVERY_BASE_URL, DELHIVERY_PICKUP_LOCATION) — booked manually" |

Database rows read back with `psql`: `shipments` rows `FIRST_PARTY / DTDC / MANUAL /
generated` and `SELLER:1 / BLUEDART / MANUAL / not generated`; `supplier_orders`
`QIKINK SHIPPED QK-1 QKTRACK1 350.00`; `order_items` carry `FIRST_PARTY`, `SELLER` and
`DROPSHIP QIKINK`; `allocation_settings` `FIRST_PARTY DELHIVERY CHEAPEST`.

### Found and fixed during verification

The admin fulfilment queue listed orders that were `SHIPPED`/`DELIVERED` before shipments
were recorded per group as still open. Groups on such orders now count as shipped from
the order status (`bff/fulfilment.js`, with a test), while a live supplier order that is
still open is believed over the status.

## Not verified — say so before relying on it

- **Delhivery and Shiprocket adapters** are checked only against a mock HTTP server (23
  tests). No sandbox account was available; request shapes follow the carriers' published
  APIs. Known gaps (M2): no city/state/dimensions in `BookingRequest`, no idempotent
  lookup of a half-finished booking, no label retrieval.
- **No dropship partner API is integrated.** All six run through the manual adapter by
  design; none has supplied documentation or credentials.
- **The Angular pages were built (`ng build`, no errors) but not opened in a browser** in
  this session. Layout at 390 px is unchecked.
- The Razorpay flow ran in demo mode (no keys). The signature and order-binding checks are
  not exercised against Razorpay itself.

## Still open

- `GET /api/items/:id` returns `fulfilmentPartnerCode` publicly. It is a code, not a
  name, and the storefront never renders it, but the field should be stripped from public
  catalogue responses in the BFF.
- Dispatch to suppliers is a REST call from the BFF after verification (idempotent,
  server-guarded). M2 replaces it with an `OrderPaid` event via an outbox.
- The `payment.captured` webhook still only logs; a browser that closes before `verify`
  leaves the order `PENDING` until the customer retries.
- Order status has no `PARTIALLY_SHIPPED` value (enum CHECK constraint under
  `ddl-auto: update`); partial progress is visible per group instead.
- `/api/seller/stats` counts open orders by order status, not by whether this seller's
  own group has shipped.
- Settlement, commission, GST/TCS are not modelled (M3).

---

# Appendix K — Dropship partner APIs: what exists, and the Qikink adapter

Asked to "write dropship partner APIs" for the six partners. The honest first step was
to find out which of them *have* one. Findings (2026-09-14, sources in
[`docs/commerce-architecture.md`](docs/commerce-architecture.md) §8.2):

| Partner | Public API? | Result |
|---|---|---|
| Qikink | **Yes** — token exchange + order create; no status, tracking or webhook endpoint documented | `QikinkDropshipAdapter` written against it |
| eKomn | No — CSV templates and a WooCommerce plugin | stays `MANUAL` |
| Bharat Dropship | No documentation found despite "API + webhooks advertised" | stays `MANUAL`; ask them |
| DropSetu | No — waitlist-only, Shopify/WooCommerce plugin | stays `MANUAL` |
| Dropbarter | No | stays `MANUAL` |
| Ali Shipping | No — a managed service, not a platform | stays `MANUAL` |

Writing clients for the other five would have meant inventing endpoints. Each partner
row now carries this finding in `notes`, with its website, so an operator sees *why* a
partner is manual.

## Qikink adapter

`supplier-service/src/main/java/com/example/dropship/qikink/` — adapter, payload
builder, token cache; 13 unit tests with `MockRestServiceServer`. Env:
`QIKINK_CLIENT_ID`, `QIKINK_CLIENT_SECRET`, `QIKINK_BASE_URL` (sandbox default),
`QIKINK_SEARCH_FROM_MY_PRODUCTS`. Supplier orders now snapshot the customer's email,
which Qikink's shipping address carries.

Rules from the published API that the code enforces: `order_number` ≤ 15 characters;
`quantity`, `price`, `total_order_value` as strings; form-encoded token exchange; one
re-login on 401; partner errors reported in the partner's words. It claims only
`ORDER_SUBMISSION`, because nothing else is documented.

## Verified — against a stand-in, not Qikink

Qikink's Postman reference has been taken down and no account credentials exist here,
so the adapter was exercised end to end through the BFF against a local server shaped
like Qikink's documented responses (`QIKINK_BASE_URL` pointed at it). That proves our
side of the conversation, not Qikink's. 21/21:

| Check | Seen |
|---|---|
| Integration list | `QIKINK configured=true capabilities=[ORDER_SUBMISSION]` |
| Paid dropship order | supplier order `SUBMITTED`, `partnerOrderRef 90004`, note names the Qikink dashboard for tracking |
| Token call | `POST /api/token`, form-encoded `ClientId=…&client_secret=…` |
| Order call | `POST /api/order/create` with `ClientId` + `Accesstoken` headers; `order_number ORD-C8B539A8`, `gateway Prepaid`, `qikink_shipping "1"`, `quantity "1"`, `price "699"`, address with `zip`, `province`, `country_code IN`, customer email |
| Cost price | never present in the partner payload |
| Second order | token reused, no second login |
| SKU Qikink rejects | supplier order `FAILED` with *"Qikink did not accept the order: Invalid SKU"*; the customer's payment unaffected |
| Operator fixes SKU, retries | `SUBMITTED`, `attempts 2`, `order_number ORD-B590D4B5-2` |
| Credentials removed, service restarted | integration `configured=false`; new Qikink order → `AWAITING_MANUAL_PLACEMENT`, note *"Qikink API integration is not configured (missing QIKINK_CLIENT_ID, …); handled manually"* |

Unit tests: supplier-service 103 (was 90), all passing.

## Still open

- **Unverified against Qikink itself.** Request live/sandbox credentials from
  Qikink's dashboard (Integration → Custom API), set the four variables, place a
  sandbox order, and record the outcome here. Sandbox needs
  `QIKINK_SEARCH_FROM_MY_PRODUCTS=0` and Qikink's own test SKUs.
- Qikink tracking stays manual (dashboard → Admin → Supplier orders) until Qikink
  documents a status or webhook endpoint.
- Bharat Dropship's advertised API: nothing public; an adapter needs their docs.
