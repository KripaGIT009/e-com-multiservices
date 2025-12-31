# Quick Reference - Centralized Login System

## 🚀 Quick Start (60 seconds)

### Start All Services
```bash
docker-compose up -d
```

### Access Login Page
```
http://localhost:4200
```

### Test Credentials
```
Username: admin
Password: admin123
```

## 📍 Service Ports

| Service | Port | URL |
|---------|------|-----|
| **UI-Auth** (Login) | 4200 | http://localhost:4200 |
| **UI-Storefront** | 4201 | http://localhost:4201 |
| **UI-Checkout** | 4202 | http://localhost:4202 |
| **UI-Account** | 4203 | http://localhost:4203 |
| **UI-Admin** | 3000 | http://localhost:3000 |
| User Service | 8004 | http://localhost:8004 |

## 🔐 User Roles & Redirects

| Login As | Password | Redirect To | Port |
|----------|----------|-------------|------|
| admin | admin123 | Admin Dashboard | 3000 |
| customer1 | password123 | User Account | 4203 |
| (Guest) | - | Storefront | 4201 |

## 🎯 Login Flow

```
1. User → http://localhost:4200
2. Enter credentials
3. UI-Auth validates with User Service
4. Generate JWT token
5. Redirect to appropriate UI based on role
6. Token stored in localStorage
```

## 📝 API Endpoints (Quick Reference)

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": { "id": 1, "username": "admin", "role": "ADMIN" },
  "redirectUrl": "http://localhost:3000"
}
```

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}
```

### Verify Token
```bash
GET /api/auth/verify
Authorization: Bearer <token>
```

### Get Redirect URL
```bash
GET /api/auth/redirect-url/ADMIN
```

## 🛠️ Common Commands

### Start Services
```bash
# All services with Docker
docker-compose up -d

# Single service (development)
cd ui-auth && npm start
```

### View Logs
```bash
docker-compose logs -f ui-auth
docker-compose logs -f user-service
```

### Create Test User via API
```bash
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "new@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "CUSTOMER"
  }'
```

### Stop Services
```bash
docker-compose down
```

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot reach login page" | Ensure ui-auth service is running on port 4200 |
| "Invalid credentials" | Create user first via API or use test user (admin/admin123) |
| "Blank redirect page" | Check browser console, verify target UI is running |
| CORS errors | CORS is enabled globally - check service configuration |
| Token not working | Verify JWT_SECRET matches, token not expired (24h max) |

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UI-Auth (4200)                       │
│              (Centralized Login Service)                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Login      │  │   Register   │  │   Verify     │ │
│  │   Page       │  │   Page       │  │   Token      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌─────────┐
   │  Admin  │   │ Account  │   │Storefront
   │ (3000)  │   │ (4203)   │   │ (4201)
   └─────────┘   └──────────┘   └─────────┘
```

## 💾 Database Updates

The `users` table now includes:
```sql
- id (PK)
- username
- email
- firstName
- lastName
- role (NEW)
- createdAt
- updatedAt
```

## 🔑 Environment Variables

### ui-auth/.env
```env
PORT=4200
JWT_SECRET=super-secret-key
USER_SERVICE_URL=http://localhost:8004
UI_ADMIN_URL=http://localhost:3000
UI_ACCOUNT_URL=http://localhost:4203
UI_CHECKOUT_URL=http://localhost:4202
UI_STOREFRONT_URL=http://localhost:4201
```

## 💡 Pro Tips

1. **Save Token After Login**
   ```javascript
   localStorage.setItem('token', data.token);
   localStorage.setItem('user', JSON.stringify(data.user));
   ```

2. **Use Token in Requests**
   ```javascript
   fetch('/api/profile', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

3. **Logout**
   ```javascript
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   window.location.href = 'http://localhost:4200';
   ```

## 📚 Documentation Files

- **[CENTRALIZED_LOGIN_SETUP.md](./CENTRALIZED_LOGIN_SETUP.md)** - Complete setup guide
- **[CENTRALIZED_LOGIN_SUMMARY.md](./CENTRALIZED_LOGIN_SUMMARY.md)** - Implementation summary
- **[ui-auth/README.md](./ui-auth/README.md)** - Service documentation

## ✅ Checklist

- [ ] Start all services with `docker-compose up -d`
- [ ] Access login page at http://localhost:4200
- [ ] Test login with admin/admin123
- [ ] Verify redirect to admin dashboard
- [ ] Create new user via registration
- [ ] Test logout functionality
- [ ] Verify other UIs can access the auth service
- [ ] Check environment variables are correct

## 🆘 Need Help?

1. Check logs: `docker-compose logs -f ui-auth`
2. Verify service is running: `curl http://localhost:4200/health`
3. Check user exists: `curl http://localhost:8004/users/username/admin`
4. Review [ui-auth/README.md](./ui-auth/README.md) for detailed docs

---

**Ready to use centralized login! 🎉**
