# Test Users Setup Guide

## Overview

This guide explains how to seed test users with different roles into the database for testing the centralized login system and verifying role-based redirects.

## Test Users Overview

| Username | Email | Role | Password | Redirect To | Port |
|----------|-------|------|----------|------------|------|
| admin | admin@example.com | ADMIN | (any) | Admin Dashboard | 3000 |
| customer1 | customer1@example.com | CUSTOMER | (any) | User Account | 4203 |
| customer2 | customer2@example.com | CUSTOMER | (any) | User Account | 4203 |
| customer3 | customer3@example.com | CUSTOMER | (any) | User Account | 4203 |
| guest1 | guest1@example.com | GUEST | (any) | Storefront | 4201 |
| guest2 | guest2@example.com | GUEST | (any) | Storefront | 4201 |

## Setup Methods

### Method 1: Automated Seeding Script (Recommended)

#### Windows
```bash
# From project root directory
seed-test-users.bat
```

#### Linux/Mac
```bash
# From project root directory
chmod +x seed-test-users.sh
./seed-test-users.sh
```

#### Direct Node Command
```bash
# From project root directory
node seed-test-users.js
```

### Method 2: Manual API Requests

#### Create Admin User
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

#### Create Customer Users
```bash
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer1",
    "email": "customer1@example.com",
    "firstName": "John",
    "lastName": "Customer",
    "role": "CUSTOMER"
  }'

curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer2",
    "email": "customer2@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }'

curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer3",
    "email": "customer3@example.com",
    "firstName": "Robert",
    "lastName": "Smith",
    "role": "CUSTOMER"
  }'
```

#### Create Guest Users
```bash
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "guest1",
    "email": "guest1@example.com",
    "firstName": "Guest",
    "lastName": "User",
    "role": "GUEST"
  }'

curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "guest2",
    "email": "guest2@example.com",
    "firstName": "Guest",
    "lastName": "Browser",
    "role": "GUEST"
  }'
```

### Method 3: SQL Script

#### Using PostgreSQL CLI
```bash
# Connect to PostgreSQL
psql -U postgres -h localhost -p 5435 -d user_service

# Run the init script
\i user-service/src/main/resources/db/init_test_users.sql
```

#### Using SQL Tool/pgAdmin
1. Open your PostgreSQL client
2. Connect to `user_service` database
3. Execute the contents of `user-service/src/main/resources/db/init_test_users.sql`

## Quick Start

### 1. Start Services
```bash
docker-compose up -d
```

### 2. Seed Test Users (Choose one method)

**Option A: Automated Script (Windows)**
```bash
seed-test-users.bat
```

**Option B: Automated Script (Linux/Mac)**
```bash
./seed-test-users.sh
```

**Option C: Node Script**
```bash
node seed-test-users.js
```

### 3. Access Login Page
```
http://localhost:4200
```

### 4. Test Login Flow

#### Test ADMIN Role
1. Username: `admin`
2. Password: (any password, demo mode accepts anything)
3. Click "Sign In"
4. ✅ Should redirect to: **http://localhost:3000** (Admin Dashboard)

#### Test CUSTOMER Role
1. Username: `customer1` (or customer2, customer3)
2. Password: (any password)
3. Click "Sign In"
4. ✅ Should redirect to: **http://localhost:4203** (User Account)

#### Test GUEST Role
1. Username: `guest1` (or guest2)
2. Password: (any password)
3. Click "Sign In"
4. ✅ Should redirect to: **http://localhost:4201** (Storefront)

#### Test Guest Login (No Credentials)
1. Click "Continue as Guest" button
2. ✅ Should redirect to: **http://localhost:4201** (Storefront)

## Verify Users in Database

### Using PostgreSQL CLI
```bash
psql -U postgres -h localhost -p 5435 -d user_service
SELECT id, username, email, role FROM users ORDER BY id;
```

### Using API
```bash
curl http://localhost:8004/users
```

Expected response:
```json
[
  {"id": 1, "username": "admin", "email": "admin@example.com", "role": "ADMIN", ...},
  {"id": 2, "username": "customer1", "email": "customer1@example.com", "role": "CUSTOMER", ...},
  {"id": 3, "username": "customer2", "email": "customer2@example.com", "role": "CUSTOMER", ...},
  ...
]
```

## Troubleshooting

### Users Not Created

**Issue:** Script fails with "Connection refused"

**Solution:** 
1. Ensure all services are running: `docker-compose ps`
2. Wait 10 seconds for user-service to start
3. Check user-service logs: `docker-compose logs user-service`

### Duplicate User Error

**Issue:** "User already exists" or 409 error

**Solution:**
1. This is normal - users already in database
2. Script automatically skips existing users
3. To reset, either:
   - Delete the docker volume: `docker-compose down -v`
   - Or manually delete users from database

### User Service Not Responding

**Issue:** "ECONNREFUSED" error

**Solution:**
1. Check if services are running: `docker-compose ps`
2. Restart user-service: `docker-compose restart user-service`
3. Check logs: `docker-compose logs -f user-service`

### Port Already in Use

**Issue:** "Port 8004 already in use"

**Solution:**
1. Check what's using the port
2. Either stop the other service or change port in docker-compose.yml
3. Update `USER_SERVICE_URL` in seed-test-users.js if needed

## Advanced: Custom Users

### Edit seed-test-users.js

Add more users to the `testUsers` array:

```javascript
const testUsers = [
  // ... existing users ...
  {
    username: 'superadmin',
    email: 'superadmin@example.com',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'ADMIN'
  },
  {
    username: 'vip_customer',
    email: 'vip@example.com',
    firstName: 'VIP',
    lastName: 'Customer',
    role: 'CUSTOMER'
  }
];
```

Then run:
```bash
node seed-test-users.js
```

## Testing Checklist

After seeding users, verify everything works:

- [ ] Admin user can login and redirect to port 3000
- [ ] Customer1 can login and redirect to port 4203
- [ ] Customer2 can login and redirect to port 4203
- [ ] Customer3 can login and redirect to port 4203
- [ ] Guest1 can login and redirect to port 4201
- [ ] Guest2 can login and redirect to port 4201
- [ ] Guest button works without credentials
- [ ] Token is stored in localStorage
- [ ] Protected routes are accessible with token
- [ ] Invalid credentials show error message
- [ ] Logout clears token and redirects to login

## Performance Notes

- Script runs in ~1-2 seconds for all 6 users
- Uses concurrent requests for faster execution
- Automatically handles duplicate users
- Provides detailed feedback on what was created

## Security Notes

⚠️ **These are TEST users only**
- For development/testing purposes only
- Use strong passwords in production
- Change credentials before deploying to production
- Remove or modify this script for production environments
- Never hardcode credentials in production code

## Files Included

- `seed-test-users.js` - Main seeding script (Node.js)
- `seed-test-users.bat` - Windows batch wrapper
- `seed-test-users.sh` - Linux/Mac shell wrapper
- `user-service/src/main/resources/db/init_test_users.sql` - SQL initialization script
- `TEST_USERS_SETUP.md` - This file

## Support

If you encounter issues:

1. Check service logs: `docker-compose logs`
2. Verify database connection: `docker-compose ps`
3. Run script with verbose output: `USER_SERVICE_URL=http://localhost:8004 node seed-test-users.js`
4. Verify user-service is responsive: `curl http://localhost:8004/health`

---

**Ready to test! 🚀**
