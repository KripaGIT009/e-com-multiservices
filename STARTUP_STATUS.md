# Startup Summary and Testing Guide

## ✅ Completed Setup

### 1. Database Setup
- ✓ 11 PostgreSQL databases created with sample data
- ✓ All services configured to use localhost:5432

### 2. Kafka Setup
- ✓ Kafka running on localhost:9092
- ✓ All services configured to connect to localhost Kafka

### 3. Service Configuration
- ✓ All services assigned unique ports (no conflicts)
- ✓ Database connections configured
- ✓ Kafka connections configured

## 🚀 Services and Ports

| Service | Port | Status | Health Check URL |
|---------|------|--------|------------------|
| Admin Service | 8011 | ✓ Running | http://localhost:8011/actuator/health |
| User Service | 8081 | Building | http://localhost:8081/actuator/health |
| Cart Service | 8082 | Pending | http://localhost:8082/actuator/health |
| Checkout Service | 8083 | Pending | http://localhost:8083/actuator/health |
| Item Service | 8084 | Pending | http://localhost:8084/actuator/health |
| Payment Service | 8085 | Pending | http://localhost:8085/actuator/health |
| Notification Service | 8086 | Pending | http://localhost:8086/actuator/health |
| Order Service | 8087 | Pending | http://localhost:8087/actuator/health |
| Logistics Service | 8088 | Pending | http://localhost:8088/actuator/health |
| Inventory Service | 8089 | Pending | http://localhost:8089/actuator/health |
| Return Service | 8008 | Pending | http://localhost:8008/actuator/health |

## 📋 Manual Build & Start Instructions

If the automated script doesn't work, build and start each service manually:

```powershell
# Build a service
cd C:\Users\onlyk\Downloads\event-sourcing-saga-multiservice\<service-name>
mvn clean package -DskipTests

# Start a service in new window
$jar = Get-ChildItem target\*.jar -Exclude "*.original" | Select-Object -First 1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "java -jar $($jar.FullName)"
```

### Build Order (recommended):
1. admin-service (8011) - ✓ DONE
2. user-service (8081)
3. item-service (8084)
4. inventory-service (8089)
5. cart-service (8082)
6. payment-service (8085)
7. order-service (8087)
8. checkout-service (8083)
9. logistics-service (8088)
10. notification-service (8086)
11. return-service (8008)

## 🧪 Testing the Services

### 1. Check Service Health

```powershell
# Test each service
Invoke-RestMethod -Uri "http://localhost:8011/actuator/health"
Invoke-RestMethod -Uri "http://localhost:8081/actuator/health"
# ... repeat for other ports
```

### 2. Test Database Connections

Each service should automatically connect to its database and create tables on startup (ddl-auto: update).

Check the console output for each service window - you should see:
- Hibernate initializing
- Tables being created/updated
- Application started successfully

### 3. Test Sample Data

#### Get Users
```powershell
# User Service - Get all users
Invoke-RestMethod -Uri "http://localhost:8081/api/users"
```

#### Get Items
```powershell
# Item Service - Get all items
Invoke-RestMethod -Uri "http://localhost:8084/api/items"
```

#### Get Orders
```powershell
# Order Service - Get all orders
Invoke-RestMethod -Uri "http://localhost:8087/api/orders"
```

## 🔍 Troubleshooting

### Service Won't Start

**Check Java Version:**
```powershell
java -version
# Should be Java 21
```

**Check Database Connection:**
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "\l"
# Should list all 11 databases
```

**Check Kafka:**
```powershell
docker ps --filter "name=kafka"
# Should show kafka container running
```

### Port Already in Use

Check if port is in use:
```powershell
netstat -ano | findstr :<port>
```

Kill process using the port:
```powershell
Stop-Process -Id <PID> -Force
```

### Database Connection Failed

1. Ensure PostgreSQL is running
2. Verify credentials (postgres/postgres)
3. Check if database exists:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "\l"
```

### Kafka Connection Failed

Restart Kafka:
```powershell
cd C:\Users\onlyk\Downloads\event-sourcing-saga-multiservice
docker-compose restart kafka
```

## 📊 Next Steps

1. **Build remaining services** - Run Maven build for each service
2. **Start all services** - Launch each JAR in separate PowerShell windows
3. **Verify health** - Check /actuator/health endpoints
4. **Test APIs** - Use sample data to test endpoints
5. **Monitor logs** - Watch console output for errors

## 🛠️ Quick Commands

### Stop All Services
Close each PowerShell window, or:
```powershell
Get-Process java | Stop-Process -Force
```

### Restart Kafka
```powershell
docker-compose restart kafka
```

### Reset Databases
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f database-setup.sql
```

### View Service Logs
Check the PowerShell window for each service - logs appear in real-time.

## 📝 Configuration Files Updated

The following files were modified to work with local development:

- ✓ All `application.yml` files: Updated database URLs to localhost
- ✓ All `application.yml` files: Updated Kafka bootstrap-servers to localhost
- ✓ All `application.yml` files: Assigned unique ports to avoid conflicts

## 🎯 Success Criteria

Your local environment is ready when:
- [ ] All 11 services are running without errors
- [ ] All health check endpoints return "UP"
- [ ] You can query the sample data from each service
- [ ] No connection errors in service logs
- [ ] Kafka is accepting connections
- [ ] PostgreSQL databases are accessible

---

**Current Status:** Admin service running, ready to build and start remaining services.
