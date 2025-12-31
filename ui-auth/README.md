# Centralized Login System - UI-Auth Service

A centralized authentication and login service that provides role-based redirects to different user interfaces.

## Overview

The **ui-auth** service is a centralized authentication gateway that:
- Provides a unified login and registration interface
- Handles JWT token generation and validation
- Redirects users to appropriate UIs based on their role
- Supports multiple user roles (ADMIN, CUSTOMER, GUEST)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ui-auth (Port 4200)                      │
│               (Centralized Login Service)                   │
└────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼──────┐  ┌──▼──────────┐ ┌▼────────────────┐
        │ user-service │  │  ui-admin   │ │ ui-account      │
        │  (Port 8004) │  │ (Port 3000) │ │ (Port 4203)     │
        └──────────────┘  └─────────────┘ └─────────────────┘
                │
                │
        ┌───────▼──────────────┐
        │ ui-storefront        │
        │ (Port 4201)          │
        └──────────────────────┘
```

## User Roles & Redirects

| Role | Redirect URL | Description |
|------|--------------|-------------|
| ADMIN | `http://localhost:3000` | Admin Dashboard |
| CUSTOMER | `http://localhost:4203` | User Account Dashboard |
| GUEST | `http://localhost:4201` | Public Storefront |

## API Endpoints

### 1. Login
**POST** `/api/auth/login`

Request:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
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

### 2. Register
**POST** `/api/auth/register`

Request:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... },
  "redirectUrl": "http://localhost:4203"
}
```

### 3. Verify Token
**GET** `/api/auth/verify`

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Response:
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### 4. Get Redirect URL
**GET** `/api/auth/redirect-url/:role`

Response:
```json
{
  "redirectUrl": "http://localhost:3000"
}
```

### 5. Logout
**POST** `/api/auth/logout`

Response:
```json
{
  "message": "Logged out successfully"
}
```

## Setup & Installation

### 1. Install Dependencies
```bash
cd ui-auth
npm install
```

### 2. Environment Configuration

Edit `.env` file:
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

### 3. Start the Service
```bash
npm start
```

The service will be available at `http://localhost:4200`

## Frontend Integration

### Login Example (JavaScript)

```javascript
// Fetch login endpoint
const response = await fetch('http://localhost:4200/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const data = await response.json();

// Store token
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));

// Redirect based on role
window.location.href = data.redirectUrl;
```

### Token Verification

```javascript
// Verify token before accessing protected resources
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:4200/api/auth/verify', {
  headers: { 'Authorization': `Bearer ${token}` }
});

if (response.ok) {
  const data = await response.json();
  if (data.valid) {
    // Token is valid, user is authenticated
  }
} else {
  // Token is invalid, redirect to login
  window.location.href = 'http://localhost:4200';
}
```

## User Backend Integration

### Update User Entity with Role

The `user-service` has been updated to include a `role` field:

```java
@Column(name = "role", nullable = false)
private String role;
```

### Create Admin User

```bash
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

### Create Customer User

```bash
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer1",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }'
```

## Features

✅ **Centralized Login Page**
- Clean, responsive UI
- Support for login and registration
- Guest browsing option

✅ **Role-Based Redirects**
- Automatic routing based on user role
- Customizable redirect URLs via environment variables

✅ **JWT Token Management**
- Secure token generation
- Token verification endpoints
- Automatic expiration (24 hours)

✅ **Multiple Services Support**
- Integrates with user-service for user management
- Distributes tokens to other UIs via backend proxies

✅ **Cross-Service Communication**
- BFFs (Backend for Frontend) in each UI handle auth delegation
- Centralized token validation

## Updating Other UIs

All UIs have been updated to delegate authentication to the centralized auth service:

### ui-account (Port 4203)
- `/api/login` → delegates to ui-auth
- `/api/register` → delegates to ui-auth
- `/api/auth/verify` → delegates to ui-auth

### ui-admin (Port 3000)
- To be updated similarly

### ui-checkout (Port 4202)
- Can include login for checkout users

### ui-storefront (Port 4201)
- Can include login option for returning customers

## Database Schema

The User table now includes a `role` column:

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **JWT_SECRET**: Change the secret key in production
2. **HTTPS**: Always use HTTPS in production
3. **Password Hashing**: Implement password hashing in production (bcrypt)
4. **Token Blacklist**: Implement token blacklist for logout in production
5. **CORS**: Restrict CORS origins to known domains in production
6. **Environment Variables**: Never commit `.env` with real secrets

## Testing

### Test Login
```bash
curl -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Test Registration
```bash
curl -X POST http://localhost:4200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "CUSTOMER"
  }'
```

### Access Login UI
```
http://localhost:4200
```

## Troubleshooting

### Login returns 404
- Ensure user-service is running on port 8004
- Check USER_SERVICE_URL in .env

### Redirect not working
- Verify UI_*_URL environment variables
- Check browser console for errors
- Ensure target UI services are running

### Token verification fails
- Check JWT_SECRET matches between ui-auth and other services
- Verify token hasn't expired
- Check Authorization header format: `Bearer <token>`

## Future Enhancements

- [ ] Password hashing with bcrypt
- [ ] Email verification
- [ ] Password reset functionality
- [ ] OAuth2/OpenID Connect integration
- [ ] Multi-factor authentication (MFA)
- [ ] Token refresh mechanism
- [ ] Role-based access control (RBAC) middleware
- [ ] Audit logging

---

**Centralized Login System Setup Complete!** 🎉
