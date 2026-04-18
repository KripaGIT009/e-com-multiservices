-- =====================================================
-- PostgreSQL Database Setup Script
-- E-Commerce Microservices Platform
-- =====================================================
-- Execute this script as postgres superuser
-- psql -U postgres -f database-setup.sql

-- =====================================================
-- DATABASE: admin_db
-- =====================================================
DROP DATABASE IF EXISTS admin_db;
CREATE DATABASE admin_db;

\c admin_db;

-- Tables will be auto-created by Hibernate, but we'll create them manually for consistency
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy admin users
INSERT INTO users (username, email, password, first_name, last_name, role) VALUES
('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'User', 'ADMIN'),
('manager', 'manager@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manager', 'User', 'MANAGER');
-- Password for both: password123

-- =====================================================
-- DATABASE: user_service
-- =====================================================
DROP DATABASE IF EXISTS user_service;
CREATE DATABASE user_service;

\c user_service;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy users
INSERT INTO users (username, email, password, first_name, last_name, role) VALUES
('john_doe', 'john@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John', 'Doe', 'CUSTOMER'),
('jane_smith', 'jane@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane', 'Smith', 'CUSTOMER'),
('bob_wilson', 'bob@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bob', 'Wilson', 'CUSTOMER'),
('alice_brown', 'alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Alice', 'Brown', 'CUSTOMER');
-- Password for all: password123

-- =====================================================
-- DATABASE: item_service
-- =====================================================
DROP DATABASE IF EXISTS item_service;
CREATE DATABASE item_service;

\c item_service;

CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    price DECIMAL(19, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    item_type VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Insert dummy items
INSERT INTO items (sku, name, description, price, quantity, item_type) VALUES
('LAPTOP-001', 'Dell XPS 15', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 50, 'ELECTRONICS'),
('PHONE-001', 'iPhone 14 Pro', 'Latest iPhone with A16 Bionic chip', 999.99, 100, 'ELECTRONICS'),
('TABLET-001', 'iPad Air', '10.9-inch Liquid Retina display', 599.99, 75, 'ELECTRONICS'),
('HEADPHONE-001', 'Sony WH-1000XM5', 'Wireless noise-canceling headphones', 399.99, 120, 'ELECTRONICS'),
('WATCH-001', 'Apple Watch Series 8', 'Fitness and health tracking smartwatch', 429.99, 80, 'ELECTRONICS'),
('BOOK-001', 'Clean Code', 'A Handbook of Agile Software Craftsmanship', 42.99, 200, 'BOOKS'),
('BOOK-002', 'Design Patterns', 'Elements of Reusable Object-Oriented Software', 54.99, 150, 'BOOKS'),
('MOUSE-001', 'Logitech MX Master 3', 'Advanced wireless mouse', 99.99, 250, 'ELECTRONICS'),
('KEYBOARD-001', 'Keychron K2', 'Wireless mechanical keyboard', 79.99, 180, 'ELECTRONICS'),
('MONITOR-001', 'LG UltraWide 34"', '34-inch curved monitor', 449.99, 60, 'ELECTRONICS');

-- Insert dummy reviews
INSERT INTO reviews (item_id, user_id, rating, comment) VALUES
(1, 1, 5, 'Excellent laptop! Very fast and reliable.'),
(1, 2, 4, 'Great performance, but a bit heavy.'),
(2, 1, 5, 'Best phone I have ever owned!'),
(3, 3, 4, 'Good tablet for the price.'),
(4, 2, 5, 'Amazing noise cancellation!');

-- =====================================================
-- DATABASE: cart_service
-- =====================================================
DROP DATABASE IF EXISTS cart_service;
CREATE DATABASE cart_service;

\c cart_service;

CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(19, 2) NOT NULL
);

-- Insert dummy cart items
INSERT INTO cart_items (cart_id, item_id, item_name, quantity, price) VALUES
(1, 1, 'Dell XPS 15', 1, 1299.99),
(1, 8, 'Logitech MX Master 3', 1, 99.99),
(2, 2, 'iPhone 14 Pro', 1, 999.99),
(2, 5, 'Apple Watch Series 8', 1, 429.99),
(3, 6, 'Clean Code', 2, 42.99);

-- =====================================================
-- DATABASE: order_service
-- =====================================================
DROP DATABASE IF EXISTS order_service;
CREATE DATABASE order_service;

\c order_service;

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL UNIQUE,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(19, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(19, 2) NOT NULL,
    description TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Insert dummy orders
INSERT INTO orders (order_number, customer_id, status, total_amount, notes) VALUES
('ORD-2026-0001', '1', 'COMPLETED', 1399.98, 'First order - laptop and mouse'),
('ORD-2026-0002', '2', 'PENDING', 1429.98, 'Phone and watch bundle'),
('ORD-2026-0003', '3', 'PROCESSING', 85.98, 'Book order'),
('ORD-2026-0004', '1', 'SHIPPED', 999.99, 'iPhone order'),
('ORD-2026-0005', '4', 'COMPLETED', 449.99, 'Monitor purchase');

-- Insert dummy order items
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, description) VALUES
(1, '1', 'Dell XPS 15', 1, 1299.99, 'High-performance laptop'),
(1, '8', 'Logitech MX Master 3', 1, 99.99, 'Wireless mouse'),
(2, '2', 'iPhone 14 Pro', 1, 999.99, 'Latest iPhone'),
(2, '5', 'Apple Watch Series 8', 1, 429.99, 'Smartwatch'),
(3, '6', 'Clean Code', 2, 42.99, 'Programming book'),
(4, '2', 'iPhone 14 Pro', 1, 999.99, 'Latest iPhone'),
(5, '10', 'LG UltraWide 34"', 1, 449.99, 'Curved monitor');

-- =====================================================
-- DATABASE: inventory_service
-- =====================================================
DROP DATABASE IF EXISTS inventory_service;
CREATE DATABASE inventory_service;

\c inventory_service;

CREATE TABLE IF NOT EXISTS inventory_items (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(255) NOT NULL UNIQUE,
    quantity INTEGER NOT NULL
);

-- Insert dummy inventory
INSERT INTO inventory_items (sku, quantity) VALUES
('LAPTOP-001', 50),
('PHONE-001', 100),
('TABLET-001', 75),
('HEADPHONE-001', 120),
('WATCH-001', 80),
('BOOK-001', 200),
('BOOK-002', 150),
('MOUSE-001', 250),
('KEYBOARD-001', 180),
('MONITOR-001', 60);

-- =====================================================
-- DATABASE: payment_service
-- =====================================================
DROP DATABASE IF EXISTS payment_service;
CREATE DATABASE payment_service;

\c payment_service;

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(255) NOT NULL UNIQUE,
    order_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255),
    failure_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy payments
INSERT INTO payments (payment_id, order_id, customer_id, amount, status, payment_method, transaction_reference) VALUES
('PAY-2026-0001', 'ORD-2026-0001', '1', 1399.98, 'COMPLETED', 'CREDIT_CARD', 'TXN-CC-123456789'),
('PAY-2026-0002', 'ORD-2026-0002', '2', 1429.98, 'PENDING', 'DEBIT_CARD', NULL),
('PAY-2026-0003', 'ORD-2026-0003', '3', 85.98, 'COMPLETED', 'PAYPAL', 'TXN-PP-987654321'),
('PAY-2026-0004', 'ORD-2026-0004', '1', 999.99, 'COMPLETED', 'CREDIT_CARD', 'TXN-CC-111222333'),
('PAY-2026-0005', 'ORD-2026-0005', '4', 449.99, 'COMPLETED', 'DEBIT_CARD', 'TXN-DC-444555666');

-- =====================================================
-- DATABASE: checkout_service
-- =====================================================
DROP DATABASE IF EXISTS checkout_service;
CREATE DATABASE checkout_service;

\c checkout_service;

CREATE TABLE IF NOT EXISTS checkouts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    cart_id BIGINT NOT NULL,
    total_amount DECIMAL(19, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy checkouts
INSERT INTO checkouts (user_id, cart_id, total_amount, status, payment_status) VALUES
(1, 1, 1399.98, 'COMPLETED', 'PAID'),
(2, 2, 1429.98, 'PENDING', 'PENDING'),
(3, 3, 85.98, 'COMPLETED', 'PAID'),
(1, 4, 999.99, 'COMPLETED', 'PAID');

-- =====================================================
-- DATABASE: logistics_service
-- =====================================================
DROP DATABASE IF EXISTS logistics_service;
CREATE DATABASE logistics_service;

\c logistics_service;

CREATE TABLE IF NOT EXISTS shipments (
    id BIGSERIAL PRIMARY KEY,
    shipment_number VARCHAR(255) NOT NULL UNIQUE,
    order_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    carrier VARCHAR(255),
    tracking_number VARCHAR(255) UNIQUE,
    estimated_delivery TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment_events (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Insert dummy shipments
INSERT INTO shipments (shipment_number, order_id, customer_id, status, carrier, tracking_number, estimated_delivery) VALUES
('SHIP-2026-0001', 'ORD-2026-0001', '1', 'DELIVERED', 'FedEx', 'FDX123456789', '2026-01-05 14:00:00'),
('SHIP-2026-0002', 'ORD-2026-0004', '1', 'IN_TRANSIT', 'UPS', 'UPS987654321', '2026-01-10 16:00:00'),
('SHIP-2026-0003', 'ORD-2026-0005', '4', 'DELIVERED', 'DHL', 'DHL111222333', '2026-01-03 11:00:00');

-- Insert dummy shipment events
INSERT INTO shipment_events (shipment_id, event_type, description, location) VALUES
(1, 'PICKED_UP', 'Package picked up from warehouse', 'New York, NY'),
(1, 'IN_TRANSIT', 'Package in transit', 'Philadelphia, PA'),
(1, 'OUT_FOR_DELIVERY', 'Out for delivery', 'Boston, MA'),
(1, 'DELIVERED', 'Package delivered successfully', 'Boston, MA'),
(2, 'PICKED_UP', 'Package picked up from warehouse', 'Los Angeles, CA'),
(2, 'IN_TRANSIT', 'Package in transit', 'Phoenix, AZ');

-- =====================================================
-- DATABASE: notification_service
-- =====================================================
DROP DATABASE IF EXISTS notification_service;
CREATE DATABASE notification_service;

\c notification_service;

CREATE TABLE IF NOT EXISTS notification_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    channel VARCHAR(50) NOT NULL,
    template_code VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    correlation_id VARCHAR(255),
    payload VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy notification templates
INSERT INTO notification_templates (code, name, channel, subject, body) VALUES
('ORDER_CREATED', 'Order Created', 'EMAIL', 'Order Confirmation', 'Your order {{orderNumber}} has been created successfully.'),
('ORDER_SHIPPED', 'Order Shipped', 'EMAIL', 'Order Shipped', 'Your order {{orderNumber}} has been shipped. Tracking: {{trackingNumber}}'),
('PAYMENT_SUCCESS', 'Payment Success', 'EMAIL', 'Payment Confirmed', 'Payment of ${{amount}} received successfully.'),
('PAYMENT_FAILED', 'Payment Failed', 'EMAIL', 'Payment Failed', 'Payment of ${{amount}} failed. Reason: {{reason}}');

-- Insert dummy notification events
INSERT INTO notification_events (user_id, channel, template_code, status, correlation_id) VALUES
(1, 'EMAIL', 'ORDER_CREATED', 'SENT', 'ORD-2026-0001'),
(1, 'EMAIL', 'PAYMENT_SUCCESS', 'SENT', 'PAY-2026-0001'),
(1, 'EMAIL', 'ORDER_SHIPPED', 'SENT', 'SHIP-2026-0001'),
(2, 'EMAIL', 'ORDER_CREATED', 'PENDING', 'ORD-2026-0002');

-- Insert dummy notification preferences
INSERT INTO notification_preferences (user_id, channel, enabled) VALUES
(1, 'EMAIL', TRUE),
(1, 'SMS', FALSE),
(2, 'EMAIL', TRUE),
(2, 'SMS', TRUE),
(3, 'EMAIL', TRUE),
(4, 'EMAIL', TRUE);

-- =====================================================
-- DATABASE: return_service
-- =====================================================
DROP DATABASE IF EXISTS return_service;
CREATE DATABASE return_service;

\c return_service;

CREATE TABLE IF NOT EXISTS returns (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
    refund_amount DECIMAL(19, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy returns
INSERT INTO returns (order_id, user_id, reason, status, refund_amount) VALUES
(1, 1, 'Item arrived damaged', 'APPROVED', 1299.99),
(3, 3, 'Wrong item received', 'INITIATED', 42.99),
(5, 4, 'Changed my mind', 'REFUNDED', 449.99);

-- =====================================================
-- Summary
-- =====================================================
\c postgres;

SELECT 
    'Database Setup Complete!' as message,
    COUNT(*) as total_databases
FROM pg_database 
WHERE datname IN (
    'admin_db', 'user_service', 'item_service', 'cart_service', 
    'order_service', 'inventory_service', 'payment_service', 
    'checkout_service', 'logistics_service', 'notification_service', 
    'return_service'
);

\echo '================================================='
\echo 'Database setup completed successfully!'
\echo '================================================='
\echo 'Created databases:'
\echo '  - admin_db'
\echo '  - user_service'
\echo '  - item_service'
\echo '  - cart_service'
\echo '  - order_service'
\echo '  - inventory_service'
\echo '  - payment_service'
\echo '  - checkout_service'
\echo '  - logistics_service'
\echo '  - notification_service'
\echo '  - return_service'
\echo '================================================='
\echo 'Default credentials:'
\echo '  Username: postgres'
\echo '  Password: postgres'
\echo '  Test user password: password123'
\echo '================================================='
