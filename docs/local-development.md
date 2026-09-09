# Local Development

## Prerequisites

Node 20+, Java 21, Maven 3.9+, Docker with Compose v2.

## First run

```bash
cp .env.example .env
```

Fill in the two secrets it asks for:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"  # ADMIN_JWT_SECRET
```

`ADMIN_JWT_SECRET` must be at least 64 bytes — admin-service signs with HS512 and
`Keys.hmacShaKeyFor` rejects anything shorter. The BFF refuses to start on a missing,
short, or known-default secret; that is deliberate, not a bug.

Java services ship as prebuilt jars, so package them before the first image build:

```bash
for s in */; do [ -f "$s/pom.xml" ] && (cd "$s" && mvn -DskipTests package); done
docker compose up --build
```

The app is at **http://localhost:4200**. First boot takes several minutes — Spring
Boot startup is slow in these containers (~2 minutes each) and they start in parallel.

## Seeded accounts

Created automatically on first boot. **Local only.**

| Who | Email | Password | Realm |
|---|---|---|---|
| Admin | `admin@example.com` | `password123` | user-service, `role=ADMIN` |
| Customer | `customer1@example.com` | `password123` | user-service |
| Customer | `customer2@example.com` | `password123` | user-service |
| admin-service admin | username `admin` | `admin123` | admin-service |

The first three log in at `/auth/login`. The last is admin-service's own account,
used only when calling `POST /api/admin/login` directly — the UI does not use it.

## Ports

| | Port | | Port |
|---|---|---|---|
| App (SPA + BFF) | 4200 | Kafka | 9092 |
| order | 8001 | Kafka UI | 8080 |
| payment | 8002 | Redis | 6379 |
| inventory | 8003 | pgAdmin | 5050 |
| user | 8004 | order DB | 5432 |
| item | 8005 | payment DB | 5433 |
| cart | 8006 | inventory DB | 5434 |
| checkout | 8007 | user DB | 5435 |
| return | 8008 | item DB | 5436 |
| logistics | 8009 | cart DB | 5437 |
| notification | 8010 | checkout DB | 5438 |
| admin | 8011 | return DB | 5439 |
| | | logistics DB | 5440 |
| | | notification DB | 5441 |
| | | admin DB | 5442 |

Service ports are published for debugging. They must not be reachable in production —
several services trust anything that can reach them.

## Frontend-only development

```bash
cd unified-ui && npm install && npm start     # ng serve on :4200, proxies to the BFF
```

Run the BFF separately so `/api/*` resolves:

```bash
set -a; . ./.env; set +a
cd unified-ui && node server.js
```

## After a change

**Angular:**
```bash
cd unified-ui && npm run build
```

**Java — the jar is what gets containerised, so packaging is not optional:**
```bash
cd <service> && mvn -DskipTests package
docker compose build <service>
docker compose up -d --force-recreate <service>
```

Skipping `mvn package` is the most common reason a fix appears to do nothing.

**BFF only** — restart the process; nothing to rebuild.

## Useful commands

```bash
docker compose ps
docker compose logs -f <service>
docker exec myindiansstore-user_postgres-1 psql -U postgres -d user_service -c "\dt"

# Which endpoints does a service really expose?
grep -rn "Mapping" <service>/src/main/java --include=*Controller.java

# Is a jar stale relative to its source?
find <service>/src -name "*.java" -newer <service>/target/*.jar
```

## Smoke test

```bash
TOKEN=$(curl -s -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer1@example.com","password":"password123"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')

curl -s http://localhost:4200/api/items | head -c 200
curl -s -X POST http://localhost:4200/api/cart/1/items \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"itemId":1,"quantity":2}'
curl -s http://localhost:4200/api/cart/1 -H "Authorization: Bearer $TOKEN"
```

The `1` in the cart path is ignored — the BFF resolves the cart from the token. It
stays in the route for backward compatibility.

## Troubleshooting

**BFF exits with `FATAL: ... secret`** — working as designed. Set the secret in `.env`.

**Admin pages load but every call 403s** — the BFF's `ADMIN_JWT_SECRET` and
admin-service's `JWT_SECRET` must be the same value. Compose wires both from
`ADMIN_JWT_SECRET`. Check:
```bash
docker exec myindiansstore-admin-service-1 printenv JWT_SECRET
```

**Port 4200 already in use** —
```powershell
Get-NetTCPConnection -LocalPort 4200 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**A code change had no effect** — the jar is stale. See "After a change".

**Wiping data** — `docker compose down -v` drops every volume, including seeded users
and the catalogue.
