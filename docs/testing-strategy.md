# Testing Strategy

## Current state

Essentially untested. `unified-ui` has Karma/Jasmine configured with two spec files
(`status-badge`, `admin-top-bar`). Java services have JUnit on the classpath and
almost no tests. Every defect in [`CODE_REVIEW.md`](../CODE_REVIEW.md) reached a
running system.

Worth noting **what kind** of tests would have caught them, because it shapes where to
invest:

| Defect | Caught by |
|---|---|
| Admin endpoints unauthenticated | An API test asserting 401/403 with no token |
| Customers holding admin rights | An API test with a customer token expecting 403 |
| Password change silently discarded | An integration test re-reading the row, or logging in with the new password |
| Cart update always 404 | Any end-to-end cart test |
| `/items/search` 400 | A contract test between BFF and item-service |
| Revenue chart fabricated | An assertion that the series total equals the revenue KPI |

None needed a unit test. **Integration and API tests are where the value is here.**

## Pyramid

```text
        ╱ E2E ╲          Playwright — the journeys below
      ╱─────────╲
    ╱ Integration ╲      Testcontainers: real Postgres, Kafka, Redis
  ╱─────────────────╲
╱    Unit             ╲  Domain logic, pricing, state machines
```

## Unit

Backend: JUnit 5, Mockito, AssertJ. Test behaviour, not implementation — total
calculation, state transitions, reservation arithmetic, permission checks.

Frontend: Jasmine/Karma for services and pure component logic.

Do not write a unit test that only asserts a mock was called.

## Integration

Testcontainers, against real dependencies. In-memory H2 will not catch the Postgres
behaviour that actually breaks — this codebase's worst bug was a Hibernate
persistence-context interaction that no mock would reproduce.

```java
@SpringBootTest
@Testcontainers
class PasswordResetIT {
    @Container static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");

    @Test
    void resetPersistsAndTheNewPasswordAuthenticates() {
        authService.resetPasswordByEmail("a@b.com", "NewPassw0rd1");
        // Re-read from the database — do not assert on the in-memory entity,
        // which is exactly how the original bug hid.
        User reloaded = userRepository.findByEmail("a@b.com").orElseThrow();
        assertThat(passwordEncoder.matches("NewPassw0rd1", reloaded.getPassword())).isTrue();
    }
}
```

Cover: repository queries, `@Modifying` flush behaviour, transaction boundaries, Kafka
produce/consume, idempotent replay, optimistic-locking races.

## API / contract

REST Assured per service, plus BFF-level tests. **Every endpoint gets an authorization
test**, not just a happy path:

```text
no token            → 401
customer token      → 403 on admin routes
admin token         → 200
another user's id   → 404 (not 403)
```

Contract tests pin the BFF's assumptions about each service. `/api/items/search`
proxied to a route that never existed; a contract test fails the moment the two drift.

## End-to-end

Playwright. Keep the suite small and about journeys, not pages.

```text
Register → login → browse → search → product → add to cart → checkout →
  address → payment → confirmation → order appears in history
Cancel an order
Request a return → admin approves → refund
Admin: create a product → it appears in the storefront
Admin: adjust inventory → stock reflects it
Wrong password shows "invalid credentials", not "session expired"
Adding the same product twice yields one cart line
```

Run against the Docker Compose stack, seeded to a known state.

## What to assert

Beyond status codes, assert the things that were wrong here:

- **Cross-layer consistency.** The revenue series total must equal the revenue KPI.
  Both were "working"; they disagreed by 60×.
- **Persistence.** After a write, re-read from the database. A 200 is not evidence.
- **Determinism.** Load a product list twice; ratings, stock and discounts must match.
  They were `Math.random()`.
- **Arithmetic shown to users.** If the badge says −21%, then
  `(mrp - price) / mrp` must round to 21.

## CI gates

```text
build → unit → static analysis → security scan → integration → API → docker build → container scan → E2E → deploy
```

Fail the build on: any test failure, a new critical/high vulnerability, coverage
dropping on changed files, or a migration that is not backward-compatible.

## Priority

Given a limited budget, in order:

1. Authorization API tests on every BFF route — the highest-severity findings were all here.
2. Integration tests for the checkout and payment path.
3. Contract tests between the BFF and each service.
4. The E2E purchase journey.
5. Unit tests for pricing, tax and inventory arithmetic.
