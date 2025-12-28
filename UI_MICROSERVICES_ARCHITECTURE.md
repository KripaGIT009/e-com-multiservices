# UI Microservices Architecture

This project implements a **Multi-UI Microservices** architecture with **Backend for Frontend (BFF)** pattern for an event-sourcing e-commerce system.

## 🏗️ Architecture Overview

### UI Microservices

1. **Storefront UI** (Port 4201)
   - **Purpose**: Customer-facing product browsing and shopping
   - **Features**: Product listing, search, cart preview, item details
   - **BFF**: `storefront-bff` (Port 3001)
   - **Backend Services**: item-service, cart-service, inventory-service

2. **Checkout UI** (Port 4202)
   - **Purpose**: Secure checkout and payment processing
   - **Features**: Address selection, payment gateway, order confirmation
   - **BFF**: `checkout-bff` (Port 3002)
   - **Backend Services**: checkout-service, payment-service, order-service

3. **Account UI** (Port 4203)
   - **Purpose**: User account and order management
   - **Features**: Login/signup, order history, returns, profile
   - **BFF**: `account-bff` (Port 3003)
   - **Backend Services**: user-service, order-service, return-service

4. **Admin UI** (Port 4200)
   - **Purpose**: Admin operations and management
   - **Features**: User management, inventory, orders, payments, returns, shipments, notifications
   - **BFF**: `admin-bff` (Port 3000)
   - **Backend Services**: All 10 microservices

## 📁 Project Structure

```
event-sourcing-saga-multiservice/
├── storefront-bff/          # BFF for storefront UI
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── checkout-bff/            # BFF for checkout UI
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── account-bff/             # BFF for account UI
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── admin-bff/               # BFF for admin UI
│   ├── server.js
│   ├── routes/
│   └── Dockerfile
├── storefront-ui/           # Angular - Customer storefront
├── ui-frontend/             # Angular - Admin UI (to be renamed admin-ui)
├── user-service/            # Spring Boot - User management
├── item-service/            # Spring Boot - Product catalog
├── order-service/           # Spring Boot - Order management
├── payment-service/         # Spring Boot - Payment processing
├── inventory-service/       # Spring Boot - Stock management
├── cart-service/            # Spring Boot - Shopping cart
├── checkout-service/        # Spring Boot - Checkout flow
├── return-service/          # Spring Boot - Returns management
├── logistics-service/       # Spring Boot - Shipment tracking
├── notification-service/    # Spring Boot - Notifications
└── docker-compose-ui-microservices.yml
```

## 🚀 Running the Services

### Using Docker Compose

```bash
# Start all services
docker-compose -f docker-compose-ui-microservices.yml up -d

# Stop all services
docker-compose -f docker-compose-ui-microservices.yml down

# View logs
docker-compose -f docker-compose-ui-microservices.yml logs -f
```

### Running Individual BFFs Locally

#### Storefront BFF
```bash
cd storefront-bff
npm install
npm start
# Runs on http://localhost:3001
```

#### Checkout BFF
```bash
cd checkout-bff
npm install
npm start
# Runs on http://localhost:3002
```

#### Account BFF
```bash
cd account-bff
npm install
npm start
# Runs on http://localhost:3003
```

#### Admin BFF
```bash
cd admin-bff
npm install
npm start
# Runs on http://localhost:3000
```

## 🌐 Service Endpoints

### Storefront BFF (Port 3001)
- `GET /api/items` - List all products
- `GET /api/items/:id` - Get product details
- `GET /api/items/search?query=` - Search products
- `GET /api/cart/:userId` - Get user cart
- `POST /api/cart/:userId/items` - Add item to cart
- `PUT /api/cart/:userId/items/:itemId` - Update cart item
- `DELETE /api/cart/:userId/items/:itemId` - Remove from cart
- `GET /api/inventory/:itemId` - Check stock availability

### Checkout BFF (Port 3002)
- `POST /api/checkout` - Process checkout
- `GET /api/checkout/:checkoutId` - Get checkout status
- `GET /api/payments` - List payments
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/order/:orderId` - Get payment by order
- `POST /api/payments` - Create payment
- `GET /api/orders/:orderId` - Get order confirmation

### Account BFF (Port 3003)
- `POST /api/login` - User login (returns JWT)
- `POST /api/register` - User registration
- `GET /api/profile` - Get user profile (requires auth)
- `PUT /api/profile` - Update profile (requires auth)
- `GET /api/orders` - Get user orders (requires auth)
- `GET /api/orders/:orderId` - Get order details (requires auth)
- `GET /api/returns` - Get user returns (requires auth)
- `POST /api/returns` - Create return request (requires auth)

### Admin BFF (Port 3000)
- `POST /api/admin/login` - Admin login
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/items` - List all items
- `GET /api/orders` - List all orders
- `GET /api/payments` - List all payments
- `GET /api/inventory` - List all inventory
- `GET /api/returns` - List all returns
- `GET /api/shipments` - List all shipments
- `GET /api/notifications` - List all notifications

## 🔐 Authentication

### Account BFF & Admin BFF
- **JWT-based authentication**
- **Token expiry**: 24 hours
- **Secret**: Configured via `JWT_SECRET` environment variable

### Login Flow
1. POST credentials to `/api/login`
2. Receive JWT token
3. Include token in `Authorization: Bearer <token>` header for protected routes

## 🎨 UI Microservices Details

### 1. Storefront UI
- **Framework**: Angular 17+
- **API**: Points to `storefront-bff` (Port 3001)
- **Features**:
  - Product catalog with search and filters
  - Product detail pages
  - Shopping cart preview
  - Stock availability indicators

### 2. Checkout UI (To be created)
- **Framework**: Angular/React
- **API**: Points to `checkout-bff` (Port 3002)
- **Features**:
  - Multi-step checkout form
  - Address management
  - Payment gateway integration
  - Order confirmation page

### 3. Account UI (To be created)
- **Framework**: Angular/React
- **API**: Points to `account-bff` (Port 3003)
- **Features**:
  - User authentication (login/signup)
  - Order history with tracking
  - Returns and refunds management
  - Profile settings

### 4. Admin UI
- **Framework**: Angular 17+
- **API**: Points to `admin-bff` (Port 3000)
- **Features**:
  - Complete admin dashboard
  - User management
  - Inventory management
  - Order processing
  - Payment tracking
  - Returns approval
  - Shipment tracking
  - Notifications

## 📦 Backend Microservices

All backend services run on Spring Boot 3.x with:
- H2 in-memory database
- Kafka event streaming
- REST APIs
- Event sourcing pattern

### Service Ports
- `user-service`: 8080
- `order-service`: 8081
- `item-service`: 8082
- `payment-service`: 8083
- `inventory-service`: 8084
- `cart-service`: 8085
- `checkout-service`: 8086
- `return-service`: 8087
- `logistics-service`: 8088
- `notification-service`: 8089

## 🔄 BFF Pattern Benefits

1. **Security**: Sensitive operations isolated in BFF
2. **Optimized APIs**: Tailored endpoints for each UI
3. **Independent Deployment**: UI + BFF deployed separately
4. **Faster Rollback**: Issues in one UI don't affect others
5. **Team Autonomy**: Separate teams can own UI + BFF pairs
6. **Performance**: Reduced round-trips, aggregated API calls

## 🛠️ Development

### Adding a New BFF Route

Example: Adding a new endpoint to `storefront-bff`

```javascript
// storefront-bff/server.js
app.get('/api/featured-items', async (req, res) => {
  try {
    const response = await axios.get(`${ITEM_SERVICE}/items/featured`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured items' });
  }
});
```

### Environment Variables

Create `.env` files in each BFF directory:

```env
PORT=3001
ITEM_SERVICE_URL=http://localhost:8082
CART_SERVICE_URL=http://localhost:8085
INVENTORY_SERVICE_URL=http://localhost:8084
```

## 📊 Monitoring

### Health Checks
- Storefront BFF: `http://localhost:3001/health`
- Checkout BFF: `http://localhost:3002/health`
- Account BFF: `http://localhost:3003/health`
- Admin BFF: `http://localhost:3000/health`

### Logs
```bash
# View BFF logs
docker-compose -f docker-compose-ui-microservices.yml logs -f storefront-bff
docker-compose -f docker-compose-ui-microservices.yml logs -f checkout-bff
docker-compose -f docker-compose-ui-microservices.yml logs -f account-bff
docker-compose -f docker-compose-ui-microservices.yml logs -f admin-bff
```

## 🚧 Next Steps

1. ✅ Create `storefront-bff` and `storefront-ui`
2. ✅ Create `checkout-bff`
3. ✅ Create `account-bff`
4. ✅ Restructure `admin-bff` from `ui-backend-service`
5. ⏳ Create `checkout-ui` Angular application
6. ⏳ Create `account-ui` Angular application
7. ⏳ Add API Gateway for unified routing
8. ⏳ Implement distributed tracing
9. ⏳ Add service mesh (Istio/Linkerd)

## 📝 Notes

- All BFFs use Node.js + Express
- UIs use Angular 17+ (standalone components)
- Backend services use Spring Boot 3.x
- Event streaming via Kafka
- In-memory H2 databases (can be replaced with PostgreSQL/MySQL)

---

**Architecture**: Multi-UI Microservices + BFF Pattern  
**Event Sourcing**: Kafka-based event streaming  
**Deployment**: Docker Compose / Kubernetes-ready
