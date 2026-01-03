# Database Setup Guide

This guide explains how to set up all PostgreSQL databases required for the E-Commerce Microservices Platform.

## Prerequisites

- PostgreSQL 12 or higher installed and running
- PostgreSQL client tools (`psql`) available in your PATH
- Postgres user credentials (default: postgres/postgres)

## Quick Setup

### Option 1: Using PowerShell Script (Recommended for Windows)

1. Open PowerShell in this directory
2. Run the setup script:
   ```powershell
   .\setup-databases.ps1
   ```
3. Enter your PostgreSQL credentials when prompted
4. Wait for the script to complete

### Option 2: Using psql Command Directly

```bash
psql -U postgres -f database-setup.sql
```

Or on Windows PowerShell:
```powershell
psql -U postgres -f database-setup.sql
```

Enter your PostgreSQL password when prompted.

## What Gets Created

The setup script will create **11 databases** with tables and sample data:

### 1. **admin_db**
- **Tables**: users
- **Purpose**: Admin service authentication and management
- **Sample Data**: 2 admin users (admin, manager)

### 2. **user_service**
- **Tables**: users
- **Purpose**: User management and authentication
- **Sample Data**: 4 customer users

### 3. **item_service**
- **Tables**: items, reviews
- **Purpose**: Product catalog management
- **Sample Data**: 10 products, 5 reviews

### 4. **cart_service**
- **Tables**: cart_items
- **Purpose**: Shopping cart management
- **Sample Data**: 5 cart items across 3 carts

### 5. **order_service**
- **Tables**: orders, order_items
- **Purpose**: Order processing and management
- **Sample Data**: 5 orders with items

### 6. **inventory_service**
- **Tables**: inventory_items
- **Purpose**: Inventory tracking
- **Sample Data**: 10 inventory items matching products

### 7. **payment_service**
- **Tables**: payments
- **Purpose**: Payment processing
- **Sample Data**: 5 payment records

### 8. **checkout_service**
- **Tables**: checkouts
- **Purpose**: Checkout process management
- **Sample Data**: 4 checkout sessions

### 9. **logistics_service**
- **Tables**: shipments, shipment_events
- **Purpose**: Shipping and logistics management
- **Sample Data**: 3 shipments with tracking events

### 10. **notification_service**
- **Tables**: notification_events, notification_templates, notification_preferences
- **Purpose**: Notification management
- **Sample Data**: 4 templates, 4 events, 6 user preferences

### 11. **return_service**
- **Tables**: returns
- **Purpose**: Return and refund management
- **Sample Data**: 3 return requests

## Sample Data Overview

### Test Users
All users have the password: `password123` (BCrypt hashed)

| Username | Email | Role | Database |
|----------|-------|------|----------|
| admin | admin@example.com | ADMIN | admin_db |
| manager | manager@example.com | MANAGER | admin_db |
| john_doe | john@example.com | CUSTOMER | user_service |
| jane_smith | jane@example.com | CUSTOMER | user_service |
| bob_wilson | bob@example.com | CUSTOMER | user_service |
| alice_brown | alice@example.com | CUSTOMER | user_service |

### Sample Products

| SKU | Name | Price | Quantity |
|-----|------|-------|----------|
| LAPTOP-001 | Dell XPS 15 | $1,299.99 | 50 |
| PHONE-001 | iPhone 14 Pro | $999.99 | 100 |
| TABLET-001 | iPad Air | $599.99 | 75 |
| HEADPHONE-001 | Sony WH-1000XM5 | $399.99 | 120 |
| WATCH-001 | Apple Watch Series 8 | $429.99 | 80 |

### Sample Orders

| Order Number | Customer | Status | Total |
|--------------|----------|--------|-------|
| ORD-2026-0001 | john_doe | COMPLETED | $1,399.98 |
| ORD-2026-0002 | jane_smith | PENDING | $1,429.98 |
| ORD-2026-0003 | bob_wilson | PROCESSING | $85.98 |
| ORD-2026-0004 | john_doe | SHIPPED | $999.99 |
| ORD-2026-0005 | alice_brown | COMPLETED | $449.99 |

## Connection Details

All services connect to PostgreSQL using these default credentials:

- **Host**: localhost
- **Port**: 5432
- **Username**: postgres
- **Password**: postgres

Each service connects to its own database as configured in `application.yml` files.

## Verification

After running the setup script, verify the databases were created:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- List all databases
\l

-- Check a specific database
\c user_service
\dt
SELECT COUNT(*) FROM users;
```

You should see 4 users in the user_service database.

## Troubleshooting

### Error: "psql: command not found"
- Ensure PostgreSQL bin directory is in your system PATH
- On Windows: Usually `C:\Program Files\PostgreSQL\<version>\bin`

### Error: "database already exists"
- The script drops existing databases before creating new ones
- If you get this error, you may have active connections to the databases
- Close all connections and try again

### Error: "permission denied"
- Ensure you're running as a user with CREATE DATABASE privileges
- The postgres superuser should work by default

### Connection refused
- Ensure PostgreSQL service is running
- Check if PostgreSQL is listening on the correct port (default: 5432)
- Verify firewall settings

## Cleaning Up

To remove all databases:

```sql
DROP DATABASE IF EXISTS admin_db;
DROP DATABASE IF EXISTS user_service;
DROP DATABASE IF EXISTS item_service;
DROP DATABASE IF EXISTS cart_service;
DROP DATABASE IF EXISTS order_service;
DROP DATABASE IF EXISTS inventory_service;
DROP DATABASE IF EXISTS payment_service;
DROP DATABASE IF EXISTS checkout_service;
DROP DATABASE IF EXISTS logistics_service;
DROP DATABASE IF EXISTS notification_service;
DROP DATABASE IF EXISTS return_service;
```

## Next Steps

After setting up the databases:

1. Ensure all microservices' `application.yml` files are configured correctly
2. Start Kafka (required for event sourcing)
3. Start each microservice
4. Test the APIs using the sample data

## Support

For issues or questions, please check:
- PostgreSQL logs: Usually in `data/log` directory
- Application logs: Each microservice logs to console
- Connection settings in `application.yml` files
