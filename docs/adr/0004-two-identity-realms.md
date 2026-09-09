# ADR-0004: Bridge the two identity realms in the BFF

- **Status:** Accepted
- **Date:** 2026-09-08
- **Supersedes:** nothing
- **Related:** [ADR-0002](0002-bff-owns-authorization.md), [`../authentication.md`](../authentication.md)

## Context

The system grew two independent identity stores:

| | Customer realm | Admin realm |
|---|---|---|
| Store | `user-service.users` (has a `role` column, including `ADMIN`) | `admin-service.admin_users` |
| Token | HS256, signed by the BFF with `JWT_SECRET` | HS512, signed by admin-service with `ADMIN_JWT_SECRET` |
| Claims | `{id, username, email, role}` | `{sub, role}` |

The Angular app has exactly one login page, and it posts to `/api/auth/login`, which
authenticates against user-service. There is no UI route to admin-service's
`POST /api/admin/login`.

The consequence, verified before this decision: a user-service account with
`role=ADMIN` passed the Angular `RoleGuard`, landed on `/admin`, and then received
403 from every endpoint guarded by `authenticateAdmin` — shipments, audit logs, admin
user management and the legacy dashboard were all unreachable. The endpoints that did
work only worked because they used a guard so permissive that ordinary customers had
admin rights too.

So the two realms had to be reconciled as part of fixing the authorization holes; they
could not be deferred.

## Options considered

**A. Merge admin accounts into user-service.** The correct end state — one identity
store, one token format, roles and permissions in one place. But admin-service has its
own `AdminUser` entity, `SUPER_ADMIN`/`ADMIN`/`MODERATOR` roles, a `CustomUserDetailsService`,
and an audit log keyed by admin username. Merging is a multi-service migration with a
data move. Too large to bundle into a security fix.

**B. Add an admin login page against admin-service.** Small, but gives the product two
login pages and two session models in one SPA, and an `ADMIN` user in user-service
still cannot administer anything. It entrenches the split.

**C. Bridge in the BFF.** Accept a token from either realm; when the caller is an
administrator, mint a short-lived admin-realm token for the downstream call instead of
forwarding the caller's own.

## Decision

Option C.

```javascript
// Accepts either realm, asserts nothing.
const resolveUser = (req) => {
  try { return { ...jwt.verify(token, ADMIN_JWT_SECRET), isAdmin: true }; } catch (_) {}
  try { const u = jwt.verify(token, JWT_SECRET); return { ...u, isAdmin: u.role === 'ADMIN' }; }
  catch (_) { return null; }
};

// Mints a token admin-service can verify, for an already-authorised caller.
const adminAuth = (req) => ({
  Authorization: `Bearer ${jwt.sign({ sub: username, role }, ADMIN_JWT_SECRET,
                                    { algorithm: 'HS512', expiresIn: '5m' })}`
});
```

The caller's own token is deliberately **not** forwarded: a user-service `ADMIN` holds
a token admin-service cannot verify, which is exactly the original failure.

## Consequences

**Good**

- One login page. An `ADMIN` in user-service can actually administer.
- admin-service's own security is now enabled (`web.ignoring()` no longer covers
  `/api/manage/**`), so the minted token is genuinely checked.
- Minted tokens live 5 minutes, so a leaked one has a small window.
- Merging the stores later changes only `resolveUser`.

**Bad**

- The BFF can mint admin credentials. Its `ADMIN_JWT_SECRET` is now as sensitive as
  admin-service's own — a BFF compromise is an admin compromise.
- Every `adminAuth()` call signs a JWT. Negligible at current volume; cache per request
  if it ever shows up in a profile.
- Two stores still exist. `role=ADMIN` in user-service and `SUPER_ADMIN` in
  admin-service are separate grants that can drift.
- admin-service's audit log records the minted `sub`, which is the user-service
  username. Acceptable, but the realms must not reuse usernames for different people.

## Invariants

1. `adminAuth()` is only ever called from a route already behind `authenticateAdmin`.
   It performs no check of its own.
2. Minted tokens are never returned to a client.
3. The BFF's `ADMIN_JWT_SECRET` and admin-service's `JWT_SECRET` are the same value,
   supplied from `.env` to both.

## Revisit when

Permission-based authorization arrives (Phase 1 of the target spec) or a second
consumer needs admin APIs. At that point do the merge in option A: move `admin_users`
into user-service, model `ADMIN`/`SUPER_ADMIN`/`MODERATOR` as roles with permissions,
issue one token type, and delete this bridge.
