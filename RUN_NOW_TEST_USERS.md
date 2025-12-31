# ⚡ RUN NOW - Test Users Setup

## 🚀 3-Step Quick Start

### Step 1: Start All Services
```bash
docker-compose up -d
```

Wait 15 seconds for services to fully start.

### Step 2: Seed Test Users
```bash
node seed-test-users.js
```

You should see:
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

🔑 Test Credentials:
...
```

### Step 3: Test in Browser
Open: **http://localhost:4200**

---

## 🧪 Test Each Role

### Test ADMIN
```
URL: http://localhost:4200
Username: admin
Password: (any)
Expected: Redirect to http://localhost:3000 ✅
```

### Test CUSTOMER  
```
URL: http://localhost:4200
Username: customer1 (or customer2, customer3)
Password: (any)
Expected: Redirect to http://localhost:4203 ✅
```

### Test GUEST
```
URL: http://localhost:4200
Username: guest1 (or guest2)
Password: (any)
Expected: Redirect to http://localhost:4201 ✅
```

### Test Guest Button
```
URL: http://localhost:4200
Click: "Continue as Guest" button
Expected: Redirect to http://localhost:4201 ✅
```

---

## ✅ Success Indicators

After seeding, you should see:
- ✅ 6 users created
- ✅ No errors or failures
- ✅ Login page accessible
- ✅ Each role redirects to correct dashboard
- ✅ Token stored in localStorage

---

## 🔍 Verify Users in Database

### Check All Users
```bash
curl http://localhost:8004/users
```

Should return JSON with all 6 users.

### Check Specific User
```bash
curl http://localhost:8004/users/username/admin
```

---

## 🆘 If Something Goes Wrong

### Services Not Running?
```bash
docker-compose ps
```

If services aren't running:
```bash
docker-compose up -d
sleep 15
```

### Seeding Fails?
```bash
# Check if user service is responding
curl http://localhost:8004/health

# Should return:
# {"status":"UP","service":"user-service"}
```

### User Already Exists Error?
This is normal - script automatically skips existing users.

To reset everything:
```bash
docker-compose down -v
docker-compose up -d
sleep 15
node seed-test-users.js
```

---

## 📍 All URLs

| Service | URL |
|---------|-----|
| **Login Page** | http://localhost:4200 |
| Admin Dashboard | http://localhost:3000 |
| User Account | http://localhost:4203 |
| Storefront | http://localhost:4201 |
| User Service API | http://localhost:8004 |

---

## 👥 All Test Users

| Username | Role | Redirect |
|----------|------|----------|
| admin | ADMIN | :3000 |
| customer1 | CUSTOMER | :4203 |
| customer2 | CUSTOMER | :4203 |
| customer3 | CUSTOMER | :4203 |
| guest1 | GUEST | :4201 |
| guest2 | GUEST | :4201 |

**Password**: Any value (demo mode)

---

## 📊 Expected Test Results

```
✅ Admin login    → Redirects to localhost:3000
✅ Customer login → Redirects to localhost:4203  
✅ Guest login    → Redirects to localhost:4201
✅ Token stored   → Available in localStorage
✅ Guest button   → Redirects to localhost:4201
✅ Logout         → Clears token, back to login
```

---

## 💾 What Gets Created

When you run `node seed-test-users.js`:

1. **Database Records**: 6 user records in PostgreSQL
2. **JWT Ready**: Each user can receive JWT token on login
3. **Roles Set**: Each user has appropriate role field
4. **Redirects Active**: Role-based redirect logic works

---

## 🎯 Complete Testing Workflow

```
1. Start services
   docker-compose up -d
   
2. Wait 15 seconds
   
3. Create users
   node seed-test-users.js
   
4. Open login page
   http://localhost:4200
   
5. Login as admin
   ✅ Should redirect to :3000
   
6. Logout and login as customer1
   ✅ Should redirect to :4203
   
7. Logout and click guest button
   ✅ Should redirect to :4201
   
8. Verify localStorage
   localStorage.getItem('token')
   ✅ Should return JWT token
```

---

## 📝 Files You Have

After seeding setup is complete:

- ✅ **seed-test-users.js** - Main script
- ✅ **seed-test-users.bat** - Windows wrapper
- ✅ **seed-test-users.sh** - Linux/Mac wrapper
- ✅ **init_test_users.sql** - SQL script
- ✅ Documentation files (guides and references)

---

## 🎓 Learning Path

1. **First Time?** 
   - Read: TEST_USERS_VISUAL_GUIDE.md
   - Follow: This file

2. **Need Details?**
   - Read: TEST_USERS_SETUP.md
   - Reference: QUICK_TEST_COMMANDS.md

3. **Want to Extend?**
   - Edit: seed-test-users.js
   - Add more users to testUsers array
   - Run again

---

## ⏱️ Time Estimate

- Start services: 15 seconds
- Seed users: 2 seconds
- First test: 30 seconds
- **Total: ~1 minute** ⚡

---

## 🚀 Ready?

```bash
# Step 1
docker-compose up -d

# Wait 15 seconds

# Step 2
node seed-test-users.js

# Step 3
Open: http://localhost:4200
```

**That's it! You're ready to test! 🎉**

---

## 💡 Pro Tips

1. **Testing Multiple Users Fast**
   - Open multiple browser windows
   - Login as different users in each
   - Compare redirects side-by-side

2. **Debugging Redirects**
   - Open browser console (F12)
   - Check Network tab for auth calls
   - Check Application tab for localStorage

3. **Reset Everything**
   ```bash
   docker-compose down -v
   docker-compose up -d
   sleep 15
   node seed-test-users.js
   ```

---

**Everything is ready! Go test! 🚀**
