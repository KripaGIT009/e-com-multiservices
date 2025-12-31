# Test Users - Visual Guide

## 📊 Test Users Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   TEST USERS BY ROLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 👨‍💼 ADMIN ROLE                                           │  │
│  │ ├─ Username: admin                                       │  │
│  │ ├─ Email: admin@example.com                             │  │
│  │ ├─ Password: (any value, demo mode)                     │  │
│  │ └─ Redirects to: http://localhost:3000 ✅              │  │
│  │                  (Admin Dashboard)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 👤 CUSTOMER ROLE (3 Users)                               │  │
│  │ ├─ customer1 (customer1@example.com)                    │  │
│  │ ├─ customer2 (customer2@example.com)                    │  │
│  │ ├─ customer3 (customer3@example.com)                    │  │
│  │ ├─ Password: (any value, demo mode)                     │  │
│  │ └─ Redirects to: http://localhost:4203 ✅              │  │
│  │                  (User Account Dashboard)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 👥 GUEST ROLE (2 Users)                                 │  │
│  │ ├─ guest1 (guest1@example.com)                          │  │
│  │ ├─ guest2 (guest2@example.com)                          │  │
│  │ ├─ Password: (any value, demo mode)                     │  │
│  │ └─ Redirects to: http://localhost:4201 ✅              │  │
│  │                  (Public Storefront)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🚀 GUEST LOGIN (No Credentials)                         │  │
│  │ ├─ Click "Continue as Guest" button                    │  │
│  │ ├─ No username/password needed                          │  │
│  │ └─ Redirects to: http://localhost:4201 ✅              │  │
│  │                  (Public Storefront)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Test Flow Diagram

```
                        http://localhost:4200
                        (Login Page)
                              │
                              ▼
                   ┌──────────────────────┐
                   │  Enter Credentials   │
                   │  or Click "Guest"    │
                   └──────────┬───────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
        │  Admin User   │ │Customer User │ │ Guest User   │
        │  (admin)      │ │(customer1-3) │ │ (guest1-2)   │
        └───────┬───────┘ └──────┬───────┘ └──────┬───────┘
                │                │               │
                │ Role: ADMIN    │ Role:         │ Role:
                │                │ CUSTOMER      │ GUEST
                │                │               │
                ▼                ▼               ▼
        ┌───────────────────┐ ┌──────────────┐ ┌──────────────┐
        │  REDIRECT TO:     │ │ REDIRECT TO: │ │ REDIRECT TO: │
        │  :3000            │ │ :4203        │ │ :4201        │
        │  Admin Dashboard  │ │ User Account │ │ Storefront   │
        │  ✅ Logged In     │ │ ✅ Logged In │ │ ✅ Guest     │
        └───────────────────┘ └──────────────┘ └──────────────┘
```

## 📋 Testing Checklist

### ✅ Pre-Setup
```
□ Services running: docker-compose up -d
□ User service healthy: curl http://localhost:8004/health
□ Test users seeded: node seed-test-users.js
□ Users verified: curl http://localhost:8004/users
```

### ✅ ADMIN Role Test
```
□ Open http://localhost:4200
□ Enter username: admin
□ Enter any password
□ Click "Sign In"
□ Verify redirect to http://localhost:3000
□ Check localStorage for token
```

### ✅ CUSTOMER Role Tests
```
□ Test with customer1
  □ Open http://localhost:4200
  □ Enter username: customer1
  □ Click "Sign In"
  □ Verify redirect to http://localhost:4203
  □ Check localStorage for token

□ Test with customer2
  □ Follow same steps
  □ Should also redirect to http://localhost:4203

□ Test with customer3
  □ Follow same steps
  □ Should also redirect to http://localhost:4203
```

### ✅ GUEST Role Tests
```
□ Test with guest1
  □ Open http://localhost:4200
  □ Enter username: guest1
  □ Click "Sign In"
  □ Verify redirect to http://localhost:4201
  □ Check localStorage for token

□ Test with guest2
  □ Follow same steps
  □ Should also redirect to http://localhost:4201

□ Test guest login button
  □ Open http://localhost:4200
  □ Click "Continue as Guest"
  □ Verify redirect to http://localhost:4201
```

### ✅ Error Handling
```
□ Invalid credentials (user doesn't exist)
  □ Enter username: nonexistent
  □ Should show "Invalid credentials" error
  □ Stay on login page

□ Empty fields
  □ Try to submit without username
  □ Should show validation error
  □ Try to submit without password
  □ Should show validation error
```

### ✅ Token Verification
```
□ After login, check localStorage:
  localStorage.getItem('token')    // Should exist
  localStorage.getItem('user')     // Should contain user object

□ Test token in protected routes:
  □ Navigate to /api/profile
  □ Should include Authorization header: Bearer <token>

□ Test logout:
  □ Click logout
  □ Token should be cleared from localStorage
  □ Should redirect to login page
```

## 📊 Expected Results Table

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Admin Login | admin / any | Redirect to :3000 | ✅ |
| Customer1 Login | customer1 / any | Redirect to :4203 | ✅ |
| Customer2 Login | customer2 / any | Redirect to :4203 | ✅ |
| Customer3 Login | customer3 / any | Redirect to :4203 | ✅ |
| Guest1 Login | guest1 / any | Redirect to :4201 | ✅ |
| Guest2 Login | guest2 / any | Redirect to :4201 | ✅ |
| Guest Button | Click button | Redirect to :4201 | ✅ |
| Invalid User | invalid / any | Error message | ✅ |
| Empty Username | (empty) / pass | Validation error | ✅ |
| Empty Password | user / (empty) | Validation error | ✅ |
| Token Stored | After login | localStorage has token | ✅ |
| Token Cleared | After logout | localStorage empty | ✅ |

## 🚀 Quick Start (3 Steps)

### Step 1️⃣: Start Services
```bash
docker-compose up -d
```

### Step 2️⃣: Create Test Users
```bash
node seed-test-users.js
```

Output should show:
```
✅ Successfully created: admin
✅ Successfully created: customer1
✅ Successfully created: customer2
✅ Successfully created: customer3
✅ Successfully created: guest1
✅ Successfully created: guest2

📊 Seeding Summary:
✅ Created: 6
⏭️  Skipped: 0
❌ Failed: 0
```

### Step 3️⃣: Test Login
```
Open: http://localhost:4200
Login with any test user above
Verify redirect matches user role
```

## 💾 File Reference

| File | Purpose |
|------|---------|
| seed-test-users.js | Main Node.js seeding script |
| seed-test-users.bat | Windows batch wrapper |
| seed-test-users.sh | Linux/Mac shell wrapper |
| init_test_users.sql | SQL initialization script |
| TEST_USERS_SETUP.md | Detailed setup guide |
| QUICK_TEST_COMMANDS.md | Command reference |
| TEST_USERS_VISUAL_GUIDE.md | This file |

## 🔗 URLs Reference

```
Login Page:        http://localhost:4200
Admin Dashboard:   http://localhost:3000
User Account:      http://localhost:4203
Storefront:        http://localhost:4201
User Service API:  http://localhost:8004
```

## 📝 Notes

- **Password**: In demo mode, any password is accepted
- **Production**: Implement proper password hashing with bcrypt
- **User Count**: 6 test users (1 admin, 3 customers, 2 guests)
- **Redirect**: Based on user role automatically
- **Storage**: Token stored in localStorage after login
- **Logout**: Clears token and redirects to login

---

## ⚠️ Important

These test users are for **development/testing only**. Before production:
1. Remove test data
2. Implement password hashing
3. Add proper authentication
4. Configure HTTPS
5. Set strong JWT secrets

---

**Ready to test all redirect scenarios! 🎯**
