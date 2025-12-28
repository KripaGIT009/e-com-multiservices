# Merged UI Microservices Architecture

This project implements **UI Microservices** where each UI service combines both the frontend (Angular) and backend (Node.js BFF) into a single deployable unit.

## 🏗️ Architecture Overview

### UI Microservices (Merged UI + BFF)

Each UI microservice is a self-contained service that includes:
- **Angular Frontend**: Compiled and served as static files
- **Node.js BFF**: Provides API endpoints and serves the UI
- **Single Port**: One service, one port, simplified deployment

| Service | Port | Description | Backend Services |
|---------|------|-------------|------------------|
| **ui-storefront** | 4201 | Customer product browsing & shopping | item-service, cart-service, inventory-service |
| **ui-checkout** | 4202 | Checkout flow & payment processing | checkout-service, payment-service, order-service |
| **ui-account** | 4203 | User login, orders, returns, profile | user-service, order-service, return-service |
| **ui-admin** | 4200 | Admin operations dashboard | All 10 backend services |

## 📁 Project Structure

```
event-sourcing-saga-multiservice/
├── ui-storefront/           # Storefront UI + BFF (Port 4201)
│   ├── server.js            # Node.js server with API + static serving
│   ├── package.json
│   ├── Dockerfile           # Multi-stage: Angular build + Node.js
│   └── dist/                # Built Angular app (served by Node.js)
├── ui-checkout/             # Checkout UI + BFF (Port 4202)
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── ui-account/              # Account UI + BFF (Port 4203)
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── ui-admin/                # Admin UI + BFF (Port 4200)
│   ├── server.js
│   ├── routes/              # API routes
│   ├── package.json
│   └── Dockerfile
├── ui-frontend/             # Angular source for admin (built into ui-admin)
├── storefront-ui/           # Angular source for storefront (built into ui-storefront)
└── docker-compose-merged-ui.yml
```

## 🚀 Running the Services

### Using Docker Compose

```bash
# Start all services (backend + UI microservices)
docker-compose -f docker-compose-merged-ui.yml up -d

# Stop all services
docker-compose -f docker-compose-merged-ui.yml down

# View logs for specific UI service
docker-compose -f docker-compose-merged-ui.yml logs -f ui-storefront
docker-compose -f docker-compose-merged-ui.yml logs -f ui-admin
```

### Running Locally (Development)

#### UI-Storefront
```bash
cd ui-storefront
npm install
npm start
# Access at http://localhost:4201
```

#### UI-Checkout
```bash
cd ui-checkout
npm install
npm start
# Access at http://localhost:4202
```

#### UI-Account
```bash
cd ui-account
npm install
npm start
# Access at http://localhost:4203
```

#### UI-Admin
```bash
cd ui-admin
npm install
npm start
# Access at http://localhost:4200
```

## 🌐 Service Endpoints

### UI-Storefront (Port 4201)
**API Routes:**
- `GET /api/items` - List all products
- `GET /api/items/:id` - Get product details
- `GET /api/items/search?query=` - Search products
- `GET /api/cart/:userId` - Get user cart
- `POST /api/cart/:userId/items` - Add to cart
- `PUT /api/cart/:userId/items/:itemId` - Update cart
- `DELETE /api/cart/:userId/items/:itemId` - Remove from cart
- `GET /api/inventory/:itemId` - Check stock

**UI Routes:**
- `GET /` - Home page
- `GET /products` - Product listing
- `GET /products/:id` - Product details
- `GET /cart` - Shopping cart

### UI-Checkout (Port 4202)
**API Routes:**
- `POST /api/checkout` - Process checkout
- `GET /api/checkout/:id` - Get checkout status
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/orders/:orderId` - Order confirmation

**UI Routes:**
- `GET /` - Checkout page
- `GET /confirmation` - Order confirmation

### UI-Account (Port 4203)
**API Routes:**
- `POST /api/login` - User login (returns JWT)
- `POST /api/register` - User registration
- `GET /api/profile` - Get profile (auth required)
- `PUT /api/profile` - Update profile (auth required)
- `GET /api/orders` - Order history (auth required)
- `GET /api/returns` - Returns list (auth required)
- `POST /api/returns` - Create return (auth required)

**UI Routes:**
- `GET /login` - Login page
- `GET /register` - Registration
- `GET /profile` - User profile
- `GET /orders` - Order history
- `GET /returns` - Returns management

### UI-Admin (Port 4200)
**API Routes:**
- `POST /api/admin/login` - Admin login
- `GET /api/users` - User management
- `GET /api/items` - Item catalog
- `GET /api/orders` - Order processing
- `GET /api/payments` - Payment tracking
- `GET /api/inventory` - Stock management
- `GET /api/returns` - Returns approval
- `GET /api/shipments` - Shipment tracking
- `GET /api/notifications` - System notifications

**UI Routes:**
- `GET /` - Admin dashboard
- `GET /users` - User management
- `GET /items` - Catalog management
- `GET /orders` - Order management
- (All admin pages)

## 🔐 Authentication

### JWT-Based Authentication (ui-account & ui-admin)
- **Token expiry**: 24 hours
- **Header format**: `Authorization: Bearer <token>`

**Login Flow:**
1. POST credentials to `/api/login`
2. Receive JWT token in response
3. Include token in Authorization header for protected routes
4. UI automatically handles token storage and inclusion

## 📦 How It Works

### Request Flow

#### For UI Pages (e.g., http://localhost:4201/)
```
Browser → ui-storefront:4201 
       → Node.js catches route with `app.get('*')`
       → Serves index.html from dist/storefront-ui/browser/
       → Angular app loads and renders UI
```

#### For API Calls (e.g., http://localhost:4201/api/items)
```
Angular App → ui-storefront:4201/api/items
           → Node.js BFF catches route with `app.get('/api/items')`
           → Proxies to item-service:8082/items
           → Returns data to Angular
```

### Multi-Stage Docker Build

Each Dockerfile uses multi-stage builds:

```dockerfile
# Stage 1: Build Angular app
FROM node:18-alpine AS angular-build
WORKDIR /app
COPY ../storefront-ui/ ./
RUN npm install && npm run build

# Stage 2: Node.js server with built UI
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
COPY --from=angular-build /app/dist ./dist
EXPOSE 4201
CMD ["node", "server.js"]
```

## 🎯 Benefits of Merged Architecture

### ✅ Simplified Deployment
- **One container per UI domain** instead of two (UI + BFF)
- Reduced orchestration complexity
- Single port per service

### ✅ Performance
- **No network hop** between UI and BFF (localhost communication)
- Faster API responses for UI
- Reduced latency

### ✅ Development Experience
- **Single service to run** for each UI domain
- Easier local development
- Simplified debugging (one process, one log stream)

### ✅ Resource Efficiency
- **Fewer containers** to manage
- Lower memory footprint
- Reduced network overhead

### ✅ Deployment Independence
- Each UI domain can be deployed independently
- Security-sensitive operations (checkout, payments) remain isolated
- Faster rollbacks per domain

## 🛠️ Development Workflow

### Adding a New API Endpoint

Example: Add featured items to ui-storefront

```javascript
// ui-storefront/server.js
app.get('/api/featured-items', async (req, res) => {
  try {
    const response = await axios.get(`${ITEM_SERVICE}/items/featured`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured items' });
  }
});
```

### Adding a New UI Route

The Angular router handles all UI routes. The Node.js catch-all route ensures Angular routing works:

```javascript
// Catch-all route (must be LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/storefront-ui/browser/index.html'));
});
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- `http://localhost:4201/health` - ui-storefront
- `http://localhost:4202/health` - ui-checkout
- `http://localhost:4203/health` - ui-account
- `http://localhost:4200/health` - ui-admin

### Viewing Logs
```bash
# All UI services
docker-compose -f docker-compose-merged-ui.yml logs -f

# Specific service
docker-compose -f docker-compose-merged-ui.yml logs -f ui-storefront
```

## 🚧 Migration from Separate BFF

### What Changed?
1. **Directories renamed**: `storefront-bff` → `ui-storefront`
2. **Ports consolidated**: BFF and UI now share one port
3. **Static file serving**: Node.js serves Angular build artifacts
4. **Dockerfiles updated**: Multi-stage builds compile Angular + serve with Node

### What Stayed the Same?
- API endpoints remain identical
- Backend service communication unchanged
- Angular application code unchanged
- Authentication flows unchanged

## 🌐 Service URLs

### Production Access
- **Customer Storefront**: http://localhost:4201
- **Checkout & Payments**: http://localhost:4202
- **User Account**: http://localhost:4203
- **Admin Dashboard**: http://localhost:4200

### Backend Services (Internal)
- user-service: 8080
- order-service: 8081
- item-service: 8082
- payment-service: 8083
- inventory-service: 8084
- cart-service: 8085
- checkout-service: 8086
- return-service: 8087
- logistics-service: 8088
- notification-service: 8089

## 📝 Environment Variables

### ui-storefront (.env)
```env
PORT=4201
ITEM_SERVICE_URL=http://item-service:8082
CART_SERVICE_URL=http://cart-service:8085
INVENTORY_SERVICE_URL=http://inventory-service:8084
```

### ui-checkout (.env)
```env
PORT=4202
CHECKOUT_SERVICE_URL=http://checkout-service:8086
PAYMENT_SERVICE_URL=http://payment-service:8083
ORDER_SERVICE_URL=http://order-service:8081
```

### ui-account (.env)
```env
PORT=4203
JWT_SECRET=your-super-secret-key-change-in-production
USER_SERVICE_URL=http://user-service:8080
ORDER_SERVICE_URL=http://order-service:8081
RETURN_SERVICE_URL=http://return-service:8087
```

### ui-admin (.env)
```env
PORT=3000
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=production
```

---

**Architecture**: Merged UI Microservices (UI + BFF in one service)  
**Pattern**: Domain-driven UI separation with consolidated deployment  
**Tech Stack**: Angular 17+ (Frontend) + Node.js/Express (BFF) + Spring Boot (Backend Services)  
**Event Sourcing**: Kafka-based event streaming  
**Deployment**: Docker Compose / Kubernetes-ready
