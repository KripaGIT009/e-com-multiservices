# Security

Read [`CODE_REVIEW.md`](../CODE_REVIEW.md) alongside this. It records six critical
issues found in review, how each was reproduced, and which are fixed. This document is
the standing model; that one is the audit trail.

## Threat model

| Asset | Threat | Control |
|---|---|---|
| Customer accounts | Takeover via password reset | Reset requires a signed, short-lived, single-purpose token |
| Customer PII | Enumeration via sequential ids | Ownership checks; 404 not 403 on mismatch |
| Catalogue | Unauthorised writes | `authenticateAdmin` at the BFF **and** role checks in admin-service |
| Payments | Forged webhooks | HMAC over the raw request body |
| Order data | Cross-customer reads | Every read scoped by the id in the token |
| Internal services | Direct access | Not routable from the internet in production |

## Lessons from the review

Three of these are worth internalising because they were all invisible in normal use.

**Authorization must be enforced at the layer that owns the data.** admin-service
listed `/api/manage/**` in `web.ignoring()`, which removes a path from Spring
Security's filter chain entirely — the `authorizeHttpRequests` rules below it never
ran. Every management endpoint answered 200 with no credentials. Use `permitAll()` for
public endpoints; reserve `web.ignoring()` for static assets.

**A permissive guard at the gateway is a privilege escalation.** The BFF used
`authenticateAny` — "any valid token" — on admin routes. A plain customer token
created a catalogue product and read every user record. "Authenticated" is not
"authorized".

**Defence in depth is not optional.** Neither of the above alone would have been
exploitable if the other layer had checked. Both were permissive, so the system had no
authorization at all on its admin surface.

## Authentication

Two realms — see [`authentication.md`](authentication.md) and
[ADR-0004](adr/0004-two-identity-realms.md).

- Passwords: BCrypt, cost 10.
- Access tokens: 24 h. Refresh tokens: 7 d, revoked on password change.
- Secrets come from the environment. The BFF **refuses to boot** on a missing, short,
  or known-default secret — previously it fell back to values published in this
  repository, and compose supplied exactly those, so the published defaults were the
  deployed configuration.

## Authorization

See [`authorization.md`](authorization.md). Roles today; permissions are the target.

Checklist for any new endpoint:

- [ ] Which guard? Default to the most restrictive that works.
- [ ] Does it take a resource id from the path? Then verify ownership.
- [ ] Does the downstream service enforce this too?
- [ ] Does an unauthorised caller learn whether the resource exists?

## Input validation

Validate at the boundary — Bean Validation on request DTOs, Angular validators for UX
only. **Client-side validation is not a control.**

- Parameterised queries only. No string-concatenated SQL or JPQL.
- Angular escapes interpolation by default; never use `bypassSecurityTrustHtml` on
  user content.
- Cap request body size and array lengths — an order with 10,000 line items is an
  availability problem.

## Payments

- **Never store PAN, CVV or PIN.** Not in the database, not in logs, not in an event.
- Verify the webhook HMAC over the **raw bytes**. Parsing and re-serialising the body
  changes them and the signature will never match — this was a real bug.
- Payment operations are idempotent on `Idempotency-Key`.
- Amounts are authoritative server-side. A client-supplied amount is a suggestion.

## Transport and headers

HTTPS everywhere in production; HSTS at the edge. Set `Content-Security-Policy`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: DENY`.

CORS is currently `app.use(cors())` — wide open. Acceptable only because the SPA is
served from the same origin. **Restrict it to known origins before production.**

## Rate limiting

Not implemented. Required before launch:

| Endpoint | Limit |
|---|---|
| `/api/auth/login` | 5/min per IP, 10/hour per account |
| `/api/auth/forgot-password` | 3/hour per email, 10/hour per IP |
| `/api/auth/register` | 3/hour per IP |
| Search | 60/min per IP |
| Everything else | 100/min per user |

Account lockout after 10 failed logins, with exponential backoff.

## Secrets

`.env` is git-ignored and `.env.example` carries placeholders only. `unified-ui/.dockerignore`
keeps `.env` out of the build context. Production uses AWS Secrets Manager, not files.

Rotation: change the value, restart. Rotating `JWT_SECRET` invalidates every session,
so roll it during a maintenance window or support two keys during overlap.

## Audit

admin-service writes an audit log. It must cover: login and failed login, password
change, product and price changes, inventory adjustments, order status changes,
refunds, seller approval, permission changes. Each entry: actor, action, entity,
before/after, timestamp, IP, correlation id.

## Pre-production checklist

- [ ] Internal service ports not reachable from the internet
- [ ] CORS restricted to known origins
- [ ] Rate limiting on auth endpoints
- [ ] Real secrets in a secret manager, defaults removed
- [ ] `user-service` `/api/auth/reset-password` no longer `permitAll()` — still open
- [ ] TLS everywhere, HSTS
- [ ] Dependency and container scanning in CI
- [ ] Encryption at rest on RDS
- [ ] Audit log covering the list above
- [ ] Penetration test
