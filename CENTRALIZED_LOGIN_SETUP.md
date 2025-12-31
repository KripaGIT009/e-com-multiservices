# Centralized Login System - Setup Guide

## Quick Start

### 1. Install Dependencies (ui-auth)

```bash
cd ui-auth
npm install
cd ..
```

### 2. Start Services

#### Option A: Docker Compose (Recommended)
```bash
docker-compose up -d
```

This will start all services including the new ui-auth service on port 4200.

#### Option B: Local Development
Start each service in separate terminals:

```bash
# Terminal 1 - user-service (Java/Spring Boot)
cd user-service
mvn spring-boot:run

# Terminal 2 - ui-auth (Node.js)
cd ui-auth
npm start

# Terminal 3 - ui-account (Node.js)
cd ui-account
npm start

# Terminal 4 - ui-storefront (Node.js)
cd ui-storefront
npm start

# Terminal 5 - ui-admin (Node.js)
cd ui-admin
npm start
```

### 3. Access the Login Page

Open your browser and navigate to:
```
http://localhost:4200
```

## Login Flow

### Architecture Flow

```
User Browser
    │
    ├─→ Login at http://localhost:4200 (ui-auth)
    │       │
    │       └─→ Validates credentials via user-service
    │
    ├─→ Receives JWT token and redirect URL
    │
    └─→ Redirected to appropriate UI based on role:
        ├─ ADMIN → http://localhost:3000 (ui-admin)
        ├─ CUSTOMER → http://localhost:4203 (ui-account)
        └─ GUEST → http://localhost:4201 (ui-storefront)
```

## Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| ui-auth | 4200 | Centralized Login & Auth |
| ui-storefront | 4201 | Public Storefront |
| ui-checkout | 4202 | Checkout Flow |
| ui-account | 4203 | User Account Dashboard |
| ui-admin | 3000 | Admin Dashboard |
| user-service | 8004 | User Management API |
| order-service | 8001 | Order Management API |
| payment-service | 8002 | Payment Processing |
| inventory-service | 8003 | Inventory Management |
| item-service | 8005 | Item Catalog |
| cart-service | 8006 | Shopping Cart |
| checkout-service | 8007 | Checkout Processing |
| return-service | 8008 | Returns Management |
| logistics-service | 8009 | Logistics Management |
| notification-service | 8010 | Notifications |
| admin-service | 8011 | Admin Operations |

## Test Users

### Admin User
```json
{
  "username": "admin",
  "password": "admin123"
}
```
**Redirects to:** Admin Dashboard (http://localhost:3000)

### Customer User
```json
{
  "username": "customer1",
  "password": "password123"
}
```
**Redirects to:** User Account (http://localhost:4203)

### Guest
Click "Continue as Guest" button
**Redirects to:** Storefront (http://localhost:4201)

## Creating Test Users

### Method 1: Via Frontend Registration
1. Go to http://localhost:4200
2. Click "Create Account"
3. Fill in the form and submit
4. User will be created with CUSTOMER role

### Method 2: Via API
```bash
# Create Admin User
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'

# Create Customer User
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer1",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Customer",
    "role": "CUSTOMER"
  }'
```

## Environment Variables

### ui-auth (.env)
```env
PORT=4200
JWT_SECRET=your-super-secret-key-change-in-production
USER_SERVICE_URL=http://localhost:8004

# UI URLs for redirects
UI_ADMIN_URL=http://localhost:3000
UI_ACCOUNT_URL=http://localhost:4203
UI_CHECKOUT_URL=http://localhost:4202
UI_STOREFRONT_URL=http://localhost:4201
```

### ui-account (.env)
```env
PORT=4203
JWT_SECRET=your-super-secret-key-change-in-production
USER_SERVICE_URL=http://localhost:8004
ORDER_SERVICE_URL=http://localhost:8001
RETURN_SERVICE_URL=http://localhost:8007
AUTH_SERVICE_URL=http://localhost:4200
```

## API Endpoints

### Login
```bash
curl -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  },
  "redirectUrl": "http://localhost:3000"
}
```

### Register
```bash
curl -X POST http://localhost:4200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "CUSTOMER"
  }'
```

### Verify Token
```bash
curl -X GET http://localhost:4200/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Redirect URL
```bash
curl -X GET http://localhost:4200/api/auth/redirect-url/ADMIN
```

Response:
```json
{
  "redirectUrl": "http://localhost:3000"
}
```

## Database Changes

The `users` table in user-service has been updated to include a `role` column:

```sql
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'CUSTOMER';
```

## Frontend Integration

### Store Token After Login
```javascript
// The login page automatically stores the token
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));
```

### Use Token for Authenticated Requests
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Logout
```javascript
localStorage.removeItem('token');
localStorage.removeItem('user');
window.location.href = 'http://localhost:4200'; // Redirect to login
```

## Troubleshooting

### Issue: "Cannot POST /api/auth/login"
**Solution:** Ensure ui-auth service is running on port 4200
```bash
npm start  # from ui-auth directory
```

### Issue: "Invalid credentials" on login
**Solution:** 
1. Check if user exists in database
2. Verify user-service is running on port 8004
3. Create a test user via API (see above)

### Issue: "Cannot read property 'redirectUrl' of undefined"
**Solution:**
1. Check user has a role assigned
2. Update user in database:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
   ```

### Issue: Token not verified
**Solution:**
1. Ensure JWT_SECRET matches between services
2. Check token hasn't expired (24 hour expiration)
3. Verify Authorization header format: `Bearer <token>`

### Issue: CORS errors
**Solution:** CORS is enabled globally. Check browser console for details.

## Docker Deployment

### Build Images
```bash
docker-compose build
```

### Start All Services
```bash
docker-compose up -d
```

### Check Service Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ui-auth
```

### Stop Services
```bash
docker-compose down
```

### Clean Up (Delete volumes)
```bash
docker-compose down -v
```

## Development Workflow

### 1. Code Changes in ui-auth
```bash
# Terminal 1
cd ui-auth
npm start
```

### 2. Code Changes in user-service
```bash
# Terminal 2
cd user-service
mvn clean compile && mvn spring-boot:run
```

### 3. Test Login Flow
1. Open http://localhost:4200
2. Enter credentials
3. Verify redirect to correct UI
4. Check browser console for any errors

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS in production
- [ ] Implement password hashing (bcrypt)
- [ ] Add CORS restrictions to known domains
- [ ] Implement rate limiting on login endpoint
- [ ] Add email verification for registration
- [ ] Implement token refresh mechanism
- [ ] Add password reset functionality
- [ ] Enable request logging and monitoring
- [ ] Implement audit logging for auth events

## Performance Optimization

### Caching
- Cache user roles to reduce database queries
- Implement token caching to verify tokens faster

### Database Indexing
```sql
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);
```

### Load Testing
```bash
# Install Apache Bench
ab -n 1000 -c 10 http://localhost:4200/health
```

## Next Steps

1. **Implement UI Updates**
   - Update ui-admin login integration
   - Update ui-checkout login integration
   - Add logout functionality to all UIs

2. **Add Advanced Features**
   - Multi-factor authentication (MFA)
   - Social login (Google, GitHub)
   - Password reset via email
   - Email verification
   - Role-based access control (RBAC)

3. **Production Deployment**
   - Set up SSL/TLS certificates
   - Configure environment variables for production
   - Set up monitoring and alerting
   - Implement backup and recovery procedures
   - Set up CI/CD pipeline

4. **Testing**
   - Unit tests for auth endpoints
   - Integration tests with user-service
   - End-to-end tests for login flow
   - Performance testing

---

**Centralized Login System is now ready! 🎉**

For more details, see [ui-auth README.md](./ui-auth/README.md)
