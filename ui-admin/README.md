# UI Admin Service (Merged UI + BFF)

This service combines the Angular admin frontend (from `ui-frontend/`) with the Node.js BFF (Backend for Frontend) into a single deployable microservice.

## Overview

- **Name**: ui-admin
- **Port**: 4200 (maps to internal 3000)
- **Technology**: Angular 17+ (Frontend) + Node.js/Express (BFF)
- **Purpose**: Admin operations dashboard for managing all backend microservices

## Structure

```
ui-admin/
├── server.js              # Node.js server (API + static file serving)
├── package.json
├── Dockerfile            # Multi-stage: builds Angular + serves with Node.js
├── .env                  # Environment configuration
└── routes/               # API route modules
    ├── admin.js
    ├── users.js
    ├── items.js
    ├── orders.js
    ├── payments.js
    ├── inventory.js
    ├── returns.js
    ├── shipments.js
    └── audit.js

../ui-frontend/           # Angular source code (built and served by ui-admin)
├── src/
│   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   └── guards/
│   ├── environments/
│   └── index.html
├── angular.json
└── package.json
```

## Features

### Admin Dashboard
- User management (CRUD operations)
- Item catalog management
- Order processing and tracking
- Payment history and reconciliation
- Inventory stock management
- Returns approval workflow
- Shipment tracking
- System notifications
- Audit logs

### Authentication
- JWT-based admin authentication
- Token validation middleware
- Protected API routes
- 24-hour token expiry

## API Endpoints

### Admin Routes
- `POST /api/admin/login` - Admin authentication

### User Management
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Item Management
- `GET /api/items` - List all items
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Order Management
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Payment Management
- `GET /api/payments` - List all payments
- `GET /api/payments/:id` - Payment details

### Inventory Management
- `GET /api/inventory` - List inventory
- `PUT /api/inventory/:itemId` - Update stock

### Returns Management
- `GET /api/returns` - List all returns
- `PUT /api/returns/:id/status` - Approve/reject return

### Shipments
- `GET /api/shipments` - List all shipments
- `GET /api/shipments/:id` - Shipment details

### Notifications
- `GET /api/notifications` - List notifications

### Audit Logs
- `GET /api/audit` - System audit logs

## Running Locally

### Prerequisites
- Node.js 18+
- npm

### Install Dependencies
```bash
cd ui-admin
npm install

# Also install Angular app dependencies
cd ../ui-frontend
npm install
```

### Build Angular App
```bash
cd ../ui-frontend
npm run build
```

### Start Server
```bash
cd ../ui-admin
npm start
```

Access at: http://localhost:3000

## Docker Build

The Dockerfile uses multi-stage builds:

### Stage 1: Build Angular
- Copies Angular source from `../ui-frontend/`
- Installs dependencies
- Builds production bundle
- Output: `dist/ui-frontend/browser/`

### Stage 2: Node.js Server
- Installs Node.js dependencies
- Copies server code
- Copies built Angular app from Stage 1
- Exposes port 3000
- Runs `node server.js`

### Build Command
```bash
docker build -t ui-admin .
```

### Run Container
```bash
docker run -p 4200:3000 \
  -e JWT_SECRET=your-secret \
  ui-admin
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| JWT_SECRET | (required) | JWT signing secret |
| NODE_ENV | production | Environment mode |
| USER_SERVICE_URL | http://user-service:8080 | User service endpoint |
| ITEM_SERVICE_URL | http://item-service:8082 | Item service endpoint |
| ORDER_SERVICE_URL | http://order-service:8081 | Order service endpoint |
| PAYMENT_SERVICE_URL | http://payment-service:8083 | Payment service endpoint |
| INVENTORY_SERVICE_URL | http://inventory-service:8084 | Inventory service endpoint |
| CART_SERVICE_URL | http://cart-service:8085 | Cart service endpoint |
| CHECKOUT_SERVICE_URL | http://checkout-service:8086 | Checkout service endpoint |
| RETURN_SERVICE_URL | http://return-service:8087 | Return service endpoint |
| LOGISTICS_SERVICE_URL | http://logistics-service:8088 | Logistics service endpoint |
| NOTIFICATION_SERVICE_URL | http://notification-service:8089 | Notification service endpoint |

## Request Flow

### UI Page Request (e.g., /dashboard)
```
Browser → http://localhost:4200/dashboard
       ↓
ui-admin:3000 (Node.js)
       ↓
Catch-all route: app.get('*')
       ↓
Serves: dist/ui-frontend/browser/index.html
       ↓
Angular app loads and renders dashboard
```

### API Request (e.g., GET /api/users)
```
Angular App → http://localhost:4200/api/users
           ↓
ui-admin:3000 (Node.js)
           ↓
Route: app.use('/api/users', userRoutes)
           ↓
Proxy to: user-service:8080/users
           ↓
Returns JSON data to Angular
```

## Authentication Flow

1. Admin enters credentials on `/login` page
2. Angular sends `POST /api/admin/login` with username/password
3. Node.js BFF validates with admin service
4. Returns JWT token
5. Angular stores token in localStorage
6. Subsequent API requests include token in `Authorization: Bearer <token>` header
7. Node.js middleware validates token before proxying to backend services

## Development Notes

### Adding New API Route

1. Create route file in `routes/` directory:
```javascript
// routes/example.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  // Proxy to backend service
  const response = await axios.get('http://example-service:8090/data');
  res.json(response.data);
});

module.exports = router;
```

2. Register in `server.js`:
```javascript
const exampleRoutes = require('./routes/example');
app.use('/api/example', exampleRoutes);
```

### Updating Angular UI

1. Make changes in `../ui-frontend/src/`
2. Build: `cd ../ui-frontend && npm run build`
3. Restart Node.js server: `cd ../ui-admin && npm start`

## Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "UP",
  "service": "ui-admin"
}
```

## Migration from ui-backend-service

This service replaces the previous `ui-backend-service`. Key changes:

1. **Renamed**: `ui-backend-service` → `ui-admin`
2. **Merged**: Now serves both API and Angular UI
3. **Static serving**: Added `express.static()` for Angular build
4. **Catch-all route**: `app.get('*')` serves `index.html`
5. **Dockerfile**: Multi-stage build includes Angular compilation

## Related Services

- **ui-storefront** (Port 4201): Customer shopping
- **ui-checkout** (Port 4202): Payment processing
- **ui-account** (Port 4203): User accounts

---

**Service Type**: UI Microservice (Merged Frontend + BFF)  
**Replaces**: ui-backend-service + ui-frontend (now integrated)  
**Deployment**: Docker / Kubernetes
