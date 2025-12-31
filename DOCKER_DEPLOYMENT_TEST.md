# Docker Build & Deployment Testing Guide

## Test Environment
- **Docker Compose Version:** 3.8+
- **Total Services:** 14 (4 UI + 10 Backend)
- **Architecture:** Merged UI+BFF microservices + Spring Boot backend services
- **Networking:** Docker Compose internal networking

## Service Inventory

### UI Microservices (Angular 17 + Node.js Express BFF)
| Service | Port | Purpose | Dependencies |
|---------|------|---------|--------------|
| ui-storefront | 4201 | Customer shopping (products, cart) | item-service, cart-service, inventory-service |
| ui-admin | 3000 | Admin dashboard (CRUD for all services) | All 10 backend services |
| ui-checkout | 4202 | Checkout & payment flow | checkout-service, payment-service, order-service |
| ui-account | 4203 | User account & orders | user-service, order-service, return-service |

### Backend Services (Spring Boot 3.x)
| Service | Port | Database | Kafka |
|---------|------|----------|-------|
| user-service | 8080 | PostgreSQL | Producer/Consumer |
| item-service | 8082 | PostgreSQL | Producer/Consumer |
| order-service | 8081 | PostgreSQL | Producer/Consumer |
| payment-service | 8083 | PostgreSQL | Producer/Consumer |
| inventory-service | 8084 | PostgreSQL | Producer/Consumer |
| cart-service | 8085 | PostgreSQL | Producer/Consumer |
| checkout-service | 8086 | PostgreSQL | Producer/Consumer |
| return-service | 8087 | PostgreSQL | Producer/Consumer |
| logistics-service | 8088 | PostgreSQL | Producer/Consumer |
| notification-service | 8089 | PostgreSQL | Producer/Consumer |

## Test Execution Plan

### Phase 1: Build Verification (Status: IN PROGRESS)
```bash
docker-compose build --no-cache
```
**Expected Results:**
- ✓ All 4 UI services build successfully with multi-stage compilation
- ✓ Angular 17+ builds compile to dist/ui-*/browser directories
- ✓ Node.js Express servers compile and package correctly
- ✓ All 10 backend services compile with Maven/Spring Boot
- ✓ Base images pull successfully

### Phase 2: Container Startup (Status: PENDING)
```bash
docker-compose up -d
```
**Expected Results:**
- ✓ All 14 containers start successfully
- ✓ Kafka broker initializes and is ready
- ✓ All PostgreSQL databases become healthy
- ✓ All services connect to required dependencies
- ✓ No startup errors in container logs

### Phase 3: Health Check Verification (Status: PENDING)
**UI Services:**
```bash
curl http://localhost:4201/health  # ui-storefront
curl http://localhost:3000/health  # ui-admin
curl http://localhost:4202/health  # ui-checkout
curl http://localhost:4203/health  # ui-account
```
**Expected Response:** `{"status":"UP","service":"ui-*"}`

**Backend Services:**
```bash
curl http://localhost:8080/health  # user-service
curl http://localhost:8082/health  # item-service
curl http://localhost:8081/health  # order-service
curl http://localhost:8083/health  # payment-service
curl http://localhost:8084/health  # inventory-service
curl http://localhost:8085/health  # cart-service
curl http://localhost:8086/health  # checkout-service
curl http://localhost:8087/health  # return-service
curl http://localhost:8088/health  # logistics-service
curl http://localhost:8089/health  # notification-service
```
**Expected Response:** Spring Boot actuator health endpoint

### Phase 4: Angular SPA Serving (Status: PENDING)
**Test Static Content:**
```bash
curl http://localhost:4201/                    # ui-storefront
curl http://localhost:3000/                    # ui-admin
curl http://localhost:4202/                    # ui-checkout
curl http://localhost:4203/                    # ui-account
```
**Expected Result:** HTML content with Angular app shell

**Browser Testing:**
- Access: http://localhost:4201 → Storefront app loads
- Access: http://localhost:3000 → Admin app loads
- Access: http://localhost:4202 → Checkout app loads
- Access: http://localhost:4203 → Account app loads

### Phase 5: API Endpoint Testing (Status: PENDING)

**UI-Account Auth Flow:**
```bash
# Login request
curl -X POST http://localhost:4203/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'

# Expected: {"token":"...", "user":{...}}

# Fetch profile (with token)
curl http://localhost:4203/api/profile \
  -H "Authorization: Bearer TOKEN"

# Fetch orders
curl http://localhost:4203/api/orders \
  -H "Authorization: Bearer TOKEN"
```

**UI-Storefront API:**
```bash
# Get items
curl http://localhost:4201/api/items

# Get cart
curl http://localhost:4201/api/cart

# Add to cart
curl -X POST http://localhost:4201/api/cart \
  -H "Content-Type: application/json" \
  -d '{"itemId":1,"quantity":2}'
```

**UI-Checkout API:**
```bash
# Create checkout session
curl -X POST http://localhost:4202/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"orderId":1,"items":[...]}'

# Process payment
curl -X POST http://localhost:4202/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"cardToken":"..."}'
```

**UI-Admin API:**
- Manage users: GET/POST/PUT/DELETE /api/users
- Manage items: GET/POST/PUT/DELETE /api/items
- Manage orders: GET /api/orders
- Manage payments: GET /api/payments
- Manage inventory: GET /api/inventory
- etc.

### Phase 6: Inter-Service Communication (Status: PENDING)

**Backend Service Interaction:**
```bash
# Order Service → User Service (WebClient)
# Create an order that requires user lookup

# Checkout Service → Payment Service (WebClient)
# Process payment request

# All Services → Kafka (Event Sourcing)
# Verify Kafka topics are created and events flow
```

## Expected Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSERS                           │
└──────────┬────────────────┬────────────────┬────────────────┘
           │                │                │
    ┌──────▼──────┐   ┌────▼──────┐   ┌────▼──────┐   ┌──────▼────┐
    │ ui-storefront│   │ ui-admin  │   │ui-checkout│   │ui-account │
    │ :4201        │   │ :3000     │   │ :4202     │   │ :4203     │
    │ (Angular17)  │   │(Angular17)│   │(Angular17)│   │(Angular17)│
    │  +Express    │   │ +Express  │   │ +Express  │   │ +Express  │
    └──────┬──────┘   └────┬──────┘   └────┬──────┘   └──────┬────┘
           │                │                │                │
    ┌──────┴────────────────┴────────────────┴────────────────┘
    │
    │  (HTTP WebClient calls)
    │
    ├──────────────────────────────────────────────────────────┐
    │                  BACKEND SERVICES                        │
    │  (Spring Boot 3.x with JPA, WebClient, Kafka)            │
    │                                                           │
    │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
    │  │user-service│  │item-service│  │order-service          │
    │  │   :8080    │  │   :8082    │  │   :8081    │         │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
    │         │                │                │              │
    │  ┌──────▼──────┐  ┌──────▼──────┐  ┌────▼──────┐       │
    │  │payment-serv │  │inventory-ser│  │cart-servic          │
    │  │   :8083     │  │   :8084     │  │   :8085    │       │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
    │         │                │                │              │
    │  ┌──────▼──────┐  ┌──────▼──────┐  ┌────▼──────┐       │
    │  │checkout-serv│  │return-servic│  │logistics-s          │
    │  │   :8086     │  │   :8087     │  │   :8088    │       │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
    │         │                │                │              │
    │  ┌──────▼──────┐                                         │
    │  │notificatio-s│                                         │
    │  │   :8089     │                                         │
    │  └──────┬──────┘                                         │
    │         │                                                │
    └─────────┼────────────────────────────────────────────────┘
              │
    ┌─────────┼─────────────────────────────────────┐
    │         │                                     │
    │  ┌──────▼────────┐           ┌─────────────┐ │
    │  │   PostgreSQL  │           │   Kafka     │ │
    │  │  (12 DBs)     │           │   Broker    │ │
    │  └───────────────┘           └─────────────┘ │
    │                                               │
    │        Data & Event Sourcing                 │
    └───────────────────────────────────────────────┘
```

## Troubleshooting Guide

### Common Build Issues
1. **Missing Node.js dependencies:** Check package.json, ensure npm install runs in Docker
2. **Angular compilation fails:** Verify TypeScript configs, tsconfig.json, angular.json
3. **Maven build fails:** Check Java version, pom.xml dependencies, Spring Boot version

### Common Runtime Issues
1. **Port conflicts:** Ensure all ports 3000, 4201-4203, 8080-8089 are available
2. **Database connection failures:** Check PostgreSQL health, verify JDBC URLs
3. **Kafka connection issues:** Verify Kafka broker is healthy and topics exist
4. **Service discovery:** Docker Compose internal DNS uses service names (e.g., user-service:8080)

### Health Check Debugging
```bash
# Check service logs
docker-compose logs ui-storefront
docker-compose logs user-service

# Test connectivity between services
docker exec ui-storefront curl http://user-service:8080/health

# Check network
docker network ls
docker network inspect event-sourcing-saga-multiservice_default
```

## Success Criteria

✅ **All 14 services deploy successfully**
✅ **All health check endpoints respond**
✅ **Angular apps load in browsers**
✅ **API routing works end-to-end**
✅ **Database transactions complete**
✅ **Kafka events flow correctly**
✅ **No container restarts or crashes**
✅ **Logs show normal operation**

## Test Coverage
- Unit tests: Backend services (Spring Boot)
- Integration tests: Service-to-service API calls
- End-to-end tests: Full user workflows (UI → Backend)
- Load tests: (Future) Stress test all services with concurrent requests

## Performance Baselines
- UI load time: < 2 seconds
- API response time: < 500ms
- Database query time: < 100ms
- Kafka message latency: < 1 second

## Next Steps After Successful Deployment
1. Generate load test scenarios
2. Set up monitoring (Prometheus, Grafana)
3. Configure centralized logging (ELK Stack)
4. Set up CI/CD pipeline for automated builds
5. Prepare for Kubernetes deployment
6. Document API specifications (OpenAPI/Swagger)
