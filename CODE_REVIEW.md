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
