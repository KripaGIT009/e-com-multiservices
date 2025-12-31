# Quick Test Users Commands

## ⚡ Fastest Way (30 seconds)

### 1. Start Services
```bash
docker-compose up -d
```

### 2. Seed Test Users
```bash
node seed-test-users.js
```

### 3. Open Login Page
```
http://localhost:4200
```

---

## 🔐 Test Credentials

### ADMIN Account
```
Username: admin
Password: (anything)
Redirect: http://localhost:3000 (Admin Dashboard)
```

### CUSTOMER Accounts
```
Username: customer1
Password: (anything)
Redirect: http://localhost:4203 (User Account)
---
Username: customer2
Password: (anything)
Redirect: http://localhost:4203 (User Account)
---
Username: customer3
Password: (anything)
Redirect: http://localhost:4203 (User Account)
```

### GUEST Accounts
```
Username: guest1
Password: (anything)
Redirect: http://localhost:4201 (Storefront)
---
Username: guest2
Password: (anything)
Redirect: http://localhost:4201 (Storefront)
```

### Guest Login (No Password Needed)
```
Click "Continue as Guest" button
Redirect: http://localhost:4201 (Storefront)
```

---

## 📝 Create Individual Users via API

### Create Admin
```bash
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","firstName":"Admin","lastName":"User","role":"ADMIN"}'
```

### Create Customer
```bash
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{"username":"customer1","email":"customer1@example.com","firstName":"John","lastName":"Customer","role":"CUSTOMER"}'
```

### Create Guest
```bash
curl -X POST http://localhost:8004/users \
  -H "Content-Type: application/json" \
  -d '{"username":"guest1","email":"guest1@example.com","firstName":"Guest","lastName":"User","role":"GUEST"}'
```

---

## ✅ Verify Users

### Get All Users
```bash
curl http://localhost:8004/users
```

### Check Specific User
```bash
curl http://localhost:8004/users/username/admin
```

---

## 🔄 Reset Database

### Stop and Remove Volumes
```bash
docker-compose down -v
```

### Start Fresh
```bash
docker-compose up -d
node seed-test-users.js
```

---

## 🧪 Test Login Flow

### 1. Open Login Page
```
http://localhost:4200
```

### 2. Test Each Role

**For ADMIN:**
- Enter: `admin` / any password
- Should see redirect to: http://localhost:3000
- Check browser console

**For CUSTOMER:**
- Enter: `customer1` / any password  
- Should see redirect to: http://localhost:4203
- Check browser console

**For GUEST:**
- Enter: `guest1` / any password
- Should see redirect to: http://localhost:4201
- Or click "Continue as Guest"

### 3. Verify Token
```javascript
// Open browser console and run:
localStorage.getItem('token')
localStorage.getItem('user')
```

---

## 📊 Service URLs

| Service | URL | Port |
|---------|-----|------|
| UI-Auth (Login) | http://localhost:4200 | 4200 |
| UI-Admin | http://localhost:3000 | 3000 |
| UI-Account | http://localhost:4203 | 4203 |
| UI-Storefront | http://localhost:4201 | 4201 |
| User Service | http://localhost:8004 | 8004 |

---

## 🐛 Troubleshooting

### Service won't start
```bash
docker-compose logs user-service
```

### User creation fails
```bash
curl http://localhost:8004/health
# Should return: {"status":"UP","service":"user-service"}
```

### Delete all users and reseed
```bash
docker-compose down -v
docker-compose up -d
# Wait 10 seconds for services to start
node seed-test-users.js
```

---

## 💾 Batch Create All Users (One Command)

```bash
# Windows PowerShell
node seed-test-users.js

# Or run batch file
seed-test-users.bat

# Or run shell script
./seed-test-users.sh
```

---

**That's it! You're ready to test all roles and redirects! 🚀**
