# 🚀 Local Testing Status - E-Commerce Microservices

## ✅ Setup Complete

All components have been configured and started for local development and testing.

---

## 📊 Component Status

### 1. **PostgreSQL Databases** ✅
- **Status**: All 11 databases created and populated
- **Host**: localhost:5432
- **Credentials**: postgres/postgres

| Database | Tables | Sample Data |
|----------|--------|-------------|
| admin_db | users | 2 admin users |
| user_service | users | 4 customers |
| item_service | items, reviews | 10 products, 5 reviews |
| cart_service | cart_items | 5 cart items |
| order_service | orders, order_items | 5 orders with items |
| inventory_service | inventory_items | 10 inventory records |
| payment_service | payments | 5 payment records |
| checkout_service | checkouts | 4 checkout sessions |
| logistics_service | shipments, shipment_events | 3 shipments with tracking |
| notification_service | notification_events, templates, preferences | 4 templates, 4 events |
| return_service | returns | 3 return requests |

### 2. **Kafka Message Broker** ✅
- **Status**: Running in Docker
- **URL**: localhost:9092
- **Container**: event-sourcing-saga-multiservice-kafka-1

### 3. **Microservices** ✅ All Built

All services have been built and started in separate PowerShell windows:

| Service | Port | Status | Endpoint |
|---------|------|--------|----------|
| Admin Service | 8011 | 🟢 Running | http://localhost:8011 |
| User Service | 8081 | 🟢 Running | http://localhost:8081 |
| Cart Service | 8082 | 🟢 Running | http://localhost:8082 |
| Checkout Service | 8083 | 🟢 Running | http://localhost:8083 |
| Item Service | 8084 | 🟢 Running | http://localhost:8084 |
| Payment Service | 8085 | 🟢 Running | http://localhost:8085 |
| Notification Service | 8086 | 🟢 Running | http://localhost:8086 |
| Order Service | 8087 | 🟢 Running | http://localhost:8087 |
| Logistics Service | 8088 | 🟢 Running | http://localhost:8088 |
| Inventory Service | 8089 | 🟢 Running | http://localhost:8089 |
| Return Service | 8008 | 🟢 Running | http://localhost:8008 |

---

## 🧪 Testing Your Services

### Health Checks

Check if services are responding:

```powershell
# Admin Service
Invoke-RestMethod http://localhost:8011/actuator/health

# User Service
Invoke-RestMethod http://localhost:8081/actuator/health

# Item Service
Invoke-RestMethod http://localhost:8084/actuator/health
```

Expected response:
```json
{
  "status": "UP"
}
```

### Test Sample Data

#### 1. Get All Users
```powershell
Invoke-RestMethod http://localhost:8081/api/users
```

Expected: List of 4 users (john_doe, jane_smith, bob_wilson, alice_brown)

#### 2. Get All Items/Products
```powershell
Invoke-RestMethod http://localhost:8084/api/items
```

Expected: List of 10 products (Dell XPS 15, iPhone 14 Pro, etc.)

#### 3. Get All Orders
```powershell
Invoke-RestMethod http://localhost:8087/api/orders
```

Expected: List of 5 orders

#### 4. Get Inventory
```powershell
Invoke-RestMethod http://localhost:8089/api/inventory
```

Expected: Inventory for 10 SKUs

#### 5. Get Cart Items
```powershell
# Get cart items for cart ID 1
Invoke-RestMethod http://localhost:8082/api/cart/1
```

---

## 🔍 Troubleshooting

### Service Not Starting

1. **Check the service window** for error messages
2. **Database connection issues**: Ensure PostgreSQL is running on port 5432
3. **Kafka issues**: Check if Kafka container is running:
   ```powershell
   docker ps --filter "name=kafka"
   ```

### Port Already in Use

If a port is already in use, you'll see an error like:
```
Web server failed to start. Port 8081 was already in use.
```

**Solution**: Stop the conflicting process or modify the port in the service's `application.yml`

### Database Connection Failed

If you see `Connection refused` errors:

1. Verify PostgreSQL is running:
   ```powershell
   Get-Service postgresql*
   ```

2. Test database connection:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT 1"
   ```

3. Verify databases exist:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "\l"
   ```

---

## 📝 Test Credentials

### Database
- **Username**: postgres
- **Password**: postgres

### Application Users
All users have password: `password123` (BCrypt hashed)

**Customers:**
- john_doe / john@example.com
- jane_smith / jane@example.com
- bob_wilson / bob@example.com
- alice_brown / alice@example.com

**Admins:**
- admin / admin@example.com (ADMIN role)
- manager / manager@example.com (MANAGER role)

---

## 🔄 Restart Services

### Stop All Services
Close all the PowerShell windows running the services, or:
```powershell
Get-Process java | Stop-Process -Force
```

### Restart a Single Service
Navigate to the service directory and run:
```powershell
cd C:\Users\onlyk\Downloads\event-sourcing-saga-multiservice\<service-name>
java -jar target\<service-name>-*.jar
```

### Rebuild and Restart All
```powershell
cd C:\Users\onlyk\Downloads\event-sourcing-saga-multiservice
.\quick-start.ps1
```

---

## 📚 API Endpoints

### User Service (8081)
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Item Service (8084)
- `GET /api/items` - Get all items
- `GET /api/items/{id}` - Get item by ID
- `GET /api/items/sku/{sku}` - Get item by SKU
- `POST /api/items` - Create item
- `PUT /api/items/{id}` - Update item

### Cart Service (8082)
- `GET /api/cart/{cartId}` - Get cart items
- `POST /api/cart/{cartId}/items` - Add item to cart
- `DELETE /api/cart/{cartId}/items/{itemId}` - Remove item

### Order Service (8087)
- `GET /api/orders` - Get all orders
- `GET /api/orders/{id}` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/{id}/status` - Update order status

### Payment Service (8085)
- `GET /api/payments` - Get all payments
- `GET /api/payments/{id}` - Get payment by ID
- `POST /api/payments` - Process payment

### Inventory Service (8089)
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/{sku}` - Check stock by SKU
- `POST /api/inventory/reserve` - Reserve inventory
- `POST /api/inventory/release` - Release inventory

---

## 🛠 Useful Commands

### Check All Service Status
```powershell
$ports = 8011, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8008
foreach ($port in $ports) {
    $conn = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    if ($conn.TcpTestSucceeded) {
        Write-Host "✓ Port $port is open" -ForegroundColor Green
    } else {
        Write-Host "✗ Port $port is closed" -ForegroundColor Red
    }
}
```

### View Kafka Topics
```powershell
docker exec -it event-sourcing-saga-multiservice-kafka-1 /opt/kafka/bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

### Database Quick Check
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d user_service -c "SELECT COUNT(*) FROM users;"
```

---

## 📖 Next Steps

1. **Test the APIs** using PowerShell or a tool like Postman
2. **Monitor service logs** in the PowerShell windows
3. **Test the event-driven flows** by creating orders and watching events propagate
4. **Explore the sample data** in each database

---

## 🎯 Success Indicators

✅ All 11 services show "UP" status in health checks
✅ Can retrieve data from each service's API
✅ Kafka is accepting connections
✅ PostgreSQL databases are accessible
✅ No connection errors in service logs

**You're all set for local testing! 🎉**
