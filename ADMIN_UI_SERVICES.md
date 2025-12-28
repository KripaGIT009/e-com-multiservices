# Admin Service & UI Microservices

This document describes the newly added Admin Service (backend) and UI Service (Angular + Node.js frontend) for the E-Commerce platform.

## Overview

### Admin Service (Port 8011)
**Spring Boot 3.2.12** microservice that provides:
- Centralized administration for all platform entities
- JWT-based authentication and authorization
- Audit logging for all administrative actions
- WebClient integration to call other microservices
- CRUD operations for users, items, inventory, orders, payments, returns, shipments

### UI Backend Service (Port 3000)
**Node.js + Express** Backend-for-Frontend (BFF) that:
- Aggregates calls to all Spring Boot services
- Provides RESTful API for Angular frontend
- Handles JWT token validation
- Acts as API gateway for frontend

### UI Frontend (Port 4200)
**Angular 17 + Material + Bootstrap** responsive admin dashboard featuring:
- Login with JWT authentication
- Dashboard with entity management cards
- User management (CRUD operations)
- Item management (CRUD operations)
- Order management with status tracking
- Audit log viewing
- Responsive design with Material UI components

## Architecture

```
┌─────────────────┐
│  UI Frontend    │  Angular 17 + Material + Bootstrap
│  (Port 4200)    │  - Login / Dashboard / CRUD Views
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  UI Backend     │  Node.js + Express
│  (Port 3000)    │  - BFF Pattern / API Gateway
└────────┬────────┘
         │ HTTP/REST + JWT
         ▼
┌─────────────────┐
│  Admin Service  │  Spring Boot + JWT + WebClient
│  (Port 8011)    │  - User/Item/Order/Payment/Inventory Management
│                 │  - Audit Logging
│                 │  - Calls to all other services
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Existing Microservices                          │
│  - order-service (8001)                          │
│  - payment-service (8002)                        │
│  - inventory-service (8003)                      │
│  - user-service (8004)                          │
│  - item-service (8005)                          │
│  - cart-service (8006)                          │
│  - checkout-service (8007)                      │
│  - return-service (8008)                        │
│  - logistics-service (8009)                     │
│  - notification-service (8010)                  │
└─────────────────────────────────────────────────┘
```

## Admin Service Details

### Features
1. **Admin User Management** (`/api/admin`)
   - Create admin users with roles (SUPER_ADMIN, ADMIN, MODERATOR)
   - Password encryption with BCrypt
   - JWT token generation and validation
   - User activation/deactivation

2. **Entity Management** (`/api/manage`)
   - Users: GET, POST, PUT, DELETE
   - Items: GET, POST, PUT, DELETE
   - Inventory: GET, POST, Reserve, Release
   - Orders: GET, Update Status
   - Payments: GET, Refund
   - Shipments: GET, Update Status
   - Returns: GET, Approve, Reject
   - System Health: Check all services

3. **Audit Logging** (`/api/audit`)
   - Tracks all admin actions (CREATE, UPDATE, DELETE, VIEW)
   - Records entity type, entity ID, admin username, timestamp, IP address
   - Query logs by admin, entity type, or date range

### Security
- **Spring Security** with JWT authentication
- **Role-based access control**:
  - `SUPER_ADMIN`, `ADMIN`: Full access to admin and management endpoints
  - `MODERATOR`: Read/write access to management endpoints
- **Public endpoints**: `/api/admin/login`, `/actuator/health`
- **Protected endpoints**: All others require JWT token

### Database
- **PostgreSQL** database: `admin_db` on port 5442
- **Tables**:
  - `admin_users`: Admin account information
  - `audit_logs`: Action audit trail

### Configuration (`application.yml`)
```yaml
server:
  port: 8011

spring:
  datasource:
    url: jdbc:postgresql://localhost:5442/admin_db
    username: admin
    password: admin123

service:
  urls:
    order: http://localhost:8001
    payment: http://localhost:8002
    # ... (all 10 services)

jwt:
  secret: adminSecretKeyForJWTTokenGenerationAndValidation2025
  expiration: 86400000  # 24 hours
```

## UI Backend Service Details

### Features
1. **API Gateway** - Routes requests to appropriate microservices
2. **Authentication Middleware** - Validates JWT tokens
3. **RESTful Routes**:
   - `/api/admin` - Admin user operations
   - `/api/users` - User management
   - `/api/items` - Item management
   - `/api/inventory` - Inventory management
   - `/api/orders` - Order management
   - `/api/payments` - Payment management
   - `/api/shipments` - Shipment tracking
   - `/api/returns` - Return management
   - `/api/audit` - Audit log retrieval

### Dependencies
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "axios": "^1.6.0",
  "dotenv": "^16.3.1",
  "helmet": "^7.1.0",
  "morgan": "^1.10.0",
  "jsonwebtoken": "^9.0.2"
}
```

### Environment Variables (`.env`)
```
PORT=3000
ADMIN_SERVICE_URL=http://localhost:8011
ORDER_SERVICE_URL=http://localhost:8001
# ... (all service URLs)
JWT_SECRET=adminSecretKeyForJWTTokenGenerationAndValidation2025
```

## UI Frontend Details

### Features
1. **Authentication**
   - Login page with username/password
   - JWT token storage in localStorage
   - Auth guard for route protection
   - Auto-redirect to login when unauthenticated

2. **Dashboard**
   - 8 entity management cards (Users, Items, Inventory, Orders, Payments, Shipments, Returns, Audit)
   - Click-to-navigate functionality
   - Material icon integration

3. **Entity List Views**
   - Users: Table with edit/delete actions
   - Items: Table with SKU, name, price
   - Orders: Table with status chips (color-coded)
   - Material Table with sorting/pagination ready

4. **Styling**
   - **Bootstrap 5.3.2** for responsive grid and utilities
   - **Angular Material 17** for components (toolbar, cards, tables, buttons, icons)
   - **SCSS** for custom styling
   - **Material Indigo-Pink** theme

### Project Structure
```
ui-frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── user-list/
│   │   │   ├── item-list/
│   │   │   └── order-list/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── item.service.ts
│   │   │   └── order.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── styles.scss
├── nginx.conf
├── Dockerfile
└── package.json
```

### Routes
```typescript
{
  path: 'login',      component: LoginComponent
  path: 'dashboard',  component: DashboardComponent, canActivate: [AuthGuard]
  path: 'users',      component: UserListComponent, canActivate: [AuthGuard]
  path: 'items',      component: ItemListComponent, canActivate: [AuthGuard]
  path: 'orders',     component: OrderListComponent, canActivate: [AuthGuard]
  path: '',           redirectTo: '/dashboard'
}
```

## Deployment

### Docker Compose
The services are integrated into the main `docker-compose.yml`:

```yaml
services:
  admin-service:        # Spring Boot on 8011
  admin_postgres:       # PostgreSQL on 5442
  ui-backend-service:   # Node.js on 3000
  ui-frontend:          # Angular/nginx on 4200 (mapped to 80 in container)
```

Total containers: **31**
- 11 backend services (including admin)
- 11 PostgreSQL databases
- 1 Kafka broker
- 1 UI backend (Node.js)
- 1 UI frontend (Angular + nginx)

### Build & Run

**Build Admin Service:**
```bash
cd admin-service
mvn clean package
```

**Build UI Backend:**
```bash
cd ui-backend-service
npm install
npm start
```

**Build UI Frontend:**
```bash
cd ui-frontend
npm install
npm run build
```

**Docker Compose:**
```bash
docker-compose up --build
```

### Access URLs
- **UI Frontend**: http://localhost:4200
- **UI Backend API**: http://localhost:3000/api
- **Admin Service API**: http://localhost:8011/api

### Default Admin Credentials
*To be created via POST to `/api/admin`:*
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "SUPER_ADMIN"
}
```

## Testing

### 1. Create Admin User
```bash
curl -X POST http://localhost:8011/api/admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "SUPER_ADMIN"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8011/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. Get All Users (with JWT token)
```bash
curl http://localhost:8011/api/manage/users \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 4. Access UI
1. Navigate to http://localhost:4200
2. Login with admin credentials
3. View dashboard and manage entities

## Audit Logging Example

Every admin action is logged:
```json
{
  "id": 1,
  "adminUsername": "admin",
  "action": "CREATE",
  "entityType": "USER",
  "entityId": "123",
  "details": "Created user: john.doe@example.com",
  "ipAddress": "192.168.1.100",
  "timestamp": "2025-01-15T10:30:00"
}
```

## Future Enhancements

1. **Admin Service**:
   - Implement pagination for entity lists
   - Add advanced search and filtering
   - Bulk operations for entities
   - Export audit logs to CSV/PDF
   - Real-time notifications via WebSocket

2. **UI Service**:
   - Add form validation and error handling
   - Implement create/edit modals for entities
   - Add charts and analytics dashboard
   - Implement real-time updates with WebSocket
   - Add dark mode theme toggle

3. **Security**:
   - Implement refresh tokens
   - Add rate limiting
   - Implement API key authentication for service-to-service calls
   - Add HTTPS/TLS support

## Service Comparison

| Feature | Admin Service | UI Backend | UI Frontend |
|---------|--------------|------------|-------------|
| **Technology** | Spring Boot 3 | Node.js + Express | Angular 17 |
| **Language** | Java 21 | JavaScript | TypeScript |
| **Port** | 8011 | 3000 | 4200 |
| **Database** | PostgreSQL (5442) | N/A | N/A |
| **Authentication** | JWT (generates) | JWT (validates) | JWT (stores) |
| **Primary Role** | Backend API + Service Orchestration | BFF / API Gateway | User Interface |
| **Dependencies** | WebClient, Security, JPA | Axios, Express, JWT | HttpClient, Material, Bootstrap |

## Conclusion

The Admin and UI services complete the e-commerce platform by providing:
- **Centralized administration** for all microservices
- **User-friendly web interface** for platform management
- **Comprehensive audit logging** for compliance
- **Role-based access control** for security
- **Scalable architecture** following BFF pattern

All services follow the established interface-based architecture pattern (I*Service + *ServiceImpl) ensuring consistency across the platform.
