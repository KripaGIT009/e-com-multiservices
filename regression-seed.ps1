Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " MyIndianStore - Regression Seed Data   " -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

function Run-SQL {
    param($Container, $DbName, $User, $Password, $Sql, $Label)
    Write-Host ">>> Seeding: $Label" -ForegroundColor Yellow
    $result = $Sql | docker exec -i -e "PGPASSWORD=$Password" $Container psql -U $User -d $DbName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    OK" -ForegroundColor Green
    } else {
        Write-Host "    WARN: $result" -ForegroundColor Red
    }
}

# ─────────────────────────────────────────────
# 1. USER SERVICE  (user_postgres / user_service)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO users (username, email, password, first_name, last_name, role, created_at, updated_at)
VALUES
  ('ravi_kumar',    'ravi@example.com',  '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Ravi',  'Kumar',  'CUSTOMER', NOW(), NOW()),
  ('priya_sharma',  'priya@example.com', '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Priya', 'Sharma', 'CUSTOMER', NOW(), NOW()),
  ('amit_singh',    'amit@example.com',  '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Amit',  'Singh',  'CUSTOMER', NOW(), NOW())
ON CONFLICT DO NOTHING;
"@
Run-SQL "myindiansstore-user_postgres-1" "user_service" "postgres" "postgres" $sql "users"

# ─────────────────────────────────────────────
# 2. ITEM SERVICE  (item_postgres / item_service)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO items (sku, name, description, price, quantity, item_type, created_at, updated_at)
VALUES
  ('IND-SHIRT-001', 'Ethnic Kurta - Men',      'Traditional Indian kurta for men in cotton fabric', 899.00,  100, 'CLOTHING', NOW(), NOW()),
  ('IND-SAREE-002', 'Banarasi Silk Saree',      'Handwoven silk saree from Varanasi',               4500.00,  50, 'CLOTHING', NOW(), NOW()),
  ('IND-KURTA-003', 'Anarkali Suit - Women',    'Designer anarkali suit with dupatta',              2200.00,  75, 'CLOTHING', NOW(), NOW()),
  ('IND-SPICE-004', 'Garam Masala Premium 200g','Authentic Indian spice blend, 200g pack',           199.00, 200, 'FOOD',     NOW(), NOW()),
  ('IND-JEWEL-005', 'Kundan Necklace Set',      'Traditional Kundan jewellery necklace set',        3500.00,  30, 'JEWELLERY',NOW(), NOW())
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_reviews (item_id, reviewer_name, reviewer_email, rating, comment, created_at)
VALUES
  (1, 'Ravi Kumar',   'ravi@example.com',  5, 'Excellent quality! Fast delivery.',       NOW()),
  (1, 'Amit Singh',   'amit@example.com',  4, 'Good fit, great fabric.',                 NOW()),
  (2, 'Priya Sharma', 'priya@example.com', 5, 'Beautiful saree, true to color.',         NOW()),
  (3, 'Priya Sharma', 'priya@example.com', 4, 'Love the design, dupatta is stunning.',   NOW()),
  (4, 'Ravi Kumar',   'ravi@example.com',  5, 'Authentic taste, very aromatic.',         NOW())
ON CONFLICT DO NOTHING;

INSERT INTO compare_lists (user_id, created_at, updated_at)
VALUES (1, NOW(), NOW()), (2, NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO compare_items (compare_id, item_id)
VALUES (1, 1), (1, 2), (1, 3), (2, 2), (2, 5)
ON CONFLICT DO NOTHING;
"@
Run-SQL "myindiansstore-item_postgres-1" "item_service" "postgres" "postgres" $sql "items / reviews / compare_lists"

# ─────────────────────────────────────────────
# 3. INVENTORY SERVICE  (inventory_postgres)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO inventory_items (sku, quantity)
VALUES
  ('IND-SHIRT-001', 100),
  ('IND-SAREE-002',  50),
  ('IND-KURTA-003',  75),
  ('IND-SPICE-004', 200),
  ('IND-JEWEL-005',  30)
ON CONFLICT (sku) DO NOTHING;
"@
Run-SQL "myindiansstore-inventory_postgres-1" "inventory_service" "postgres" "postgres" $sql "inventory_items"

# ─────────────────────────────────────────────
# 4. CART SERVICE  (cart_postgres)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO carts (user_id, item_count, status, created_at, updated_at)
VALUES
  (1, 2, 'ACTIVE',    NOW(), NOW()),
  (2, 1, 'ACTIVE',    NOW(), NOW()),
  (3, 1, 'CHECKED_OUT', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO cart_items (cart_id, item_id, item_name, quantity, price)
VALUES
  (1, 1, 'Ethnic Kurta - Men',   2, 899.00),
  (1, 2, 'Banarasi Silk Saree',  1, 4500.00),
  (2, 3, 'Anarkali Suit - Women',1, 2200.00),
  (3, 4, 'Garam Masala 200g',    2, 199.00)
ON CONFLICT DO NOTHING;
"@
Run-SQL "myindiansstore-cart_postgres-1" "cart_service" "postgres" "postgres" $sql "carts / cart_items"

# ─────────────────────────────────────────────
# 5. ORDER SERVICE  (order_postgres)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO orders (order_number, customer_id, status, total_amount, created_at, updated_at, notes)
VALUES
  ('ORD-2026-001', '1', 'PAYMENT_COMPLETED', 6298.00, NOW(), NOW(), 'Kurta x2 + Saree x1'),
  ('ORD-2026-002', '2', 'PENDING',           2200.00, NOW(), NOW(), 'Anarkali Suit x1'),
  ('ORD-2026-003', '3', 'DELIVERED',          398.00, NOW(), NOW(), 'Spice pack x2')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, description)
VALUES
  (1, '1', 'Ethnic Kurta - Men',    2,  899.00, 'Traditional Indian kurta in cotton'),
  (1, '2', 'Banarasi Silk Saree',   1, 4500.00, 'Handwoven silk saree from Varanasi'),
  (2, '3', 'Anarkali Suit - Women', 1, 2200.00, 'Designer anarkali suit with dupatta'),
  (3, '4', 'Garam Masala 200g',     2,  199.00, 'Authentic Indian spice blend')
ON CONFLICT DO NOTHING;

INSERT INTO discounts (code, description, discount_type, discount_value, min_purchase_amount, max_uses, used_count, is_active, valid_from, valid_until)
VALUES
  ('SAVE10',    '10% off on orders above Rs.500',    1, 10.00, 500.00, 100, 5,  true, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days'),
  ('FLAT50',    'Flat Rs.50 off on Rs.200+',         2, 50.00, 200.00, 200, 12, true, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days'),
  ('WELCOME20', '20% off for new users',             1, 20.00, 100.00, 500, 0,  true, NOW(),                       NOW() + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;
"@
Run-SQL "myindiansstore-order_postgres-1" "order_service" "postgres" "postgres" $sql "orders / order_items / discounts"

# ─────────────────────────────────────────────
# 6. PAYMENT SERVICE  (payment_postgres)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO payments (payment_id, order_id, customer_id, amount, status, payment_method, transaction_reference, notes, created_at, updated_at)
VALUES
  ('PAY-2026-001', 'ORD-2026-001', '1', 6298.00, 'COMPLETED', 'CREDIT_CARD',  'TXN-CC-001234',  'Payment for ORD-2026-001', NOW(), NOW()),
  ('PAY-2026-002', 'ORD-2026-002', '2', 2200.00, 'PENDING',   'WALLET',       'TXN-WLT-005678', 'Payment for ORD-2026-002', NOW(), NOW()),
  ('PAY-2026-003', 'ORD-2026-003', '3',  398.00, 'COMPLETED', 'DEBIT_CARD',   'TXN-DC-009012',  'Payment for ORD-2026-003', NOW(), NOW())
ON CONFLICT (payment_id) DO NOTHING;
"@
Run-SQL "myindiansstore-payment_postgres-1" "payment_service" "postgres" "postgres" $sql "payments"

# ─────────────────────────────────────────────
# 7. CHECKOUT SERVICE  (checkout_postgres)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO checkouts (user_id, cart_id, total_amount, status, payment_status, created_at, updated_at)
VALUES
  (1, 1, 6298.00, 'COMPLETED', 'PAID',    NOW(), NOW()),
  (2, 2, 2200.00, 'PENDING',   'PENDING', NOW(), NOW()),
  (3, 3,  398.00, 'COMPLETED', 'PAID',    NOW(), NOW())
ON CONFLICT DO NOTHING;
"@
Run-SQL "myindiansstore-checkout_postgres-1" "checkout_service" "postgres" "postgres" $sql "checkouts"

# ─────────────────────────────────────────────
# 8. RETURN SERVICE  (return_postgres)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO returns (order_id, user_id, reason, status, refund_amount, created_at, updated_at)
VALUES
  (1, 1, 'Item does not fit - size issue',        'INITIATED', 899.00,  NOW(), NOW()),
  (3, 3, 'Wrong item delivered - spice variant',  'APPROVED',  199.00,  NOW(), NOW())
ON CONFLICT DO NOTHING;
"@
Run-SQL "myindiansstore-return_postgres-1" "return_service" "postgres" "postgres" $sql "returns"

# ─────────────────────────────────────────────
# 9. LOGISTICS SERVICE  (logistics_postgres)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO shipments (shipment_number, order_id, customer_id, status, carrier, tracking_number, estimated_delivery, created_at, updated_at)
VALUES
  ('SHP-2026-001', 'ORD-2026-001', '1', 'IN_TRANSIT', 'BlueDart', 'BD123456789IN',   NOW() + INTERVAL '3 days', NOW(), NOW()),
  ('SHP-2026-002', 'ORD-2026-002', '2', 'CREATED',    'DTDC',     'DTDC987654321IN', NOW() + INTERVAL '5 days', NOW(), NOW()),
  ('SHP-2026-003', 'ORD-2026-003', '3', 'DELIVERED',  'Delhivery','DLV111222333IN',  NOW() - INTERVAL '1 day',  NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (shipment_number) DO NOTHING;

INSERT INTO shipment_events (shipment_id, event_type, description, event_time)
VALUES
  (1, 'CREATED',    'Shipment created and label generated at Mumbai warehouse', NOW() - INTERVAL '3 days'),
  (1, 'PICKED_UP',  'Package picked up by BlueDart courier',                   NOW() - INTERVAL '2 days'),
  (1, 'IN_TRANSIT', 'In transit - Delhi sorting hub',                          NOW() - INTERVAL '1 day'),
  (2, 'CREATED',    'Shipment created, awaiting pickup by DTDC',               NOW()),
  (3, 'CREATED',    'Shipment created',                                        NOW() - INTERVAL '5 days'),
  (3, 'PICKED_UP',  'Package picked up by Delhivery',                          NOW() - INTERVAL '4 days'),
  (3, 'IN_TRANSIT', 'Package out for delivery',                                NOW() - INTERVAL '2 days'),
  (3, 'DELIVERED',  'Package delivered to customer at address',                NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;
"@
Run-SQL "myindiansstore-logistics_postgres-1" "logistics_service" "postgres" "postgres" $sql "shipments / shipment_events"

# ─────────────────────────────────────────────
# 10. NOTIFICATION SERVICE  (notification_postgres)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO notification_templates (code, channel, subject, body, created_at, updated_at)
VALUES
  ('ORDER_PLACED',   'EMAIL', 'Your order has been placed!',    'Dear {{name}}, your order {{orderId}} worth Rs.{{amount}} has been placed.', NOW(), NOW()),
  ('ORDER_SHIPPED',  'EMAIL', 'Your order is on its way!',      'Dear {{name}}, order {{orderId}} shipped via {{carrier}}. Track: {{tracking}}.', NOW(), NOW()),
  ('PAYMENT_OK',     'SMS',   NULL,                              'Payment of Rs.{{amount}} received for order {{orderId}}. Thank you!',         NOW(), NOW()),
  ('RETURN_INIT',    'EMAIL', 'Return request received',         'Dear {{name}}, your return for order {{orderId}} has been initiated.',        NOW(), NOW()),
  ('ORDER_DELIVERED','EMAIL', 'Your order has been delivered!',  'Dear {{name}}, order {{orderId}} delivered. Rate your experience.',           NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO notification_preferences (user_id, channel, enabled, created_at, updated_at)
VALUES
  (1, 'EMAIL', true,  NOW(), NOW()),
  (1, 'SMS',   true,  NOW(), NOW()),
  (2, 'EMAIL', true,  NOW(), NOW()),
  (2, 'SMS',   false, NOW(), NOW()),
  (3, 'EMAIL', true,  NOW(), NOW()),
  (3, 'SMS',   true,  NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO notification_events (user_id, channel, template_code, status, correlation_id, payload, created_at, updated_at)
VALUES
  (1, 'EMAIL', 'ORDER_PLACED',   'SENT', 'ORD-2026-001', '{\"orderId\":\"ORD-2026-001\",\"amount\":\"6298.00\",\"name\":\"Ravi Kumar\"}',    NOW(), NOW()),
  (1, 'EMAIL', 'ORDER_SHIPPED',  'SENT', 'SHP-2026-001', '{\"orderId\":\"ORD-2026-001\",\"carrier\":\"BlueDart\",\"name\":\"Ravi Kumar\"}',  NOW(), NOW()),
  (1, 'SMS',   'PAYMENT_OK',     'SENT', 'PAY-2026-001', '{\"orderId\":\"ORD-2026-001\",\"amount\":\"6298.00\"}',                            NOW(), NOW()),
  (2, 'EMAIL', 'ORDER_PLACED',   'SENT', 'ORD-2026-002', '{\"orderId\":\"ORD-2026-002\",\"amount\":\"2200.00\",\"name\":\"Priya Sharma\"}',  NOW(), NOW()),
  (3, 'EMAIL', 'ORDER_PLACED',   'SENT', 'ORD-2026-003', '{\"orderId\":\"ORD-2026-003\",\"amount\":\"398.00\",\"name\":\"Amit Singh\"}',     NOW(), NOW()),
  (3, 'EMAIL', 'ORDER_DELIVERED','SENT', 'ORD-2026-003', '{\"orderId\":\"ORD-2026-003\",\"name\":\"Amit Singh\"}',                           NOW(), NOW()),
  (1, 'EMAIL', 'RETURN_INIT',    'SENT', 'RET-2026-001', '{\"orderId\":\"ORD-2026-001\",\"name\":\"Ravi Kumar\"}',                           NOW(), NOW())
ON CONFLICT DO NOTHING;
"@
Run-SQL "myindiansstore-notification_postgres-1" "notification_service" "postgres" "postgres" $sql "notification templates / preferences / events"

# ─────────────────────────────────────────────
# 11. ADMIN SERVICE  (admin_postgres / admin_db)
# ─────────────────────────────────────────────
$sql = @"
INSERT INTO admin_users (username, email, password, role, active, created_at, updated_at)
VALUES
  ('superadmin',  'superadmin@myindianstore.com', '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SUPER_ADMIN', true, NOW(), NOW()),
  ('admin_ops',   'ops@myindianstore.com',        '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN',       true, NOW(), NOW()),
  ('mod_support', 'support@myindianstore.com',    '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'MODERATOR',   true, NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (admin_username, action, entity_type, entity_id, details, ip_address, timestamp)
VALUES
  ('superadmin', 'CREATE', 'ITEM',  '1', 'Created item: Ethnic Kurta - Men',    '192.168.1.10', NOW() - INTERVAL '2 days'),
  ('superadmin', 'CREATE', 'ITEM',  '2', 'Created item: Banarasi Silk Saree',   '192.168.1.10', NOW() - INTERVAL '2 days'),
  ('admin_ops',  'UPDATE', 'ORDER', '1', 'Updated order ORD-2026-001 to SHIPPED','192.168.1.11', NOW() - INTERVAL '1 day'),
  ('admin_ops',  'VIEW',   'USER',  '1', 'Viewed user profile: ravi_kumar',      '192.168.1.11', NOW()),
  ('mod_support','UPDATE', 'RETURN','1', 'Approved return request for order 1',  '192.168.1.12', NOW())
ON CONFLICT DO NOTHING;
"@
Run-SQL "myindiansstore-admin_postgres-1" "admin_db" "admin" "admin123" $sql "admin_users / audit_logs"

# ─────────────────────────────────────────────
# VERIFICATION SUMMARY
# ─────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Verification - Row Counts              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$checks = @(
    @{ Container="myindiansstore-user_postgres-1";        DB="user_service";         User="postgres"; Pass="postgres"; Table="users" },
    @{ Container="myindiansstore-item_postgres-1";        DB="item_service";         User="postgres"; Pass="postgres"; Table="items" },
    @{ Container="myindiansstore-item_postgres-1";        DB="item_service";         User="postgres"; Pass="postgres"; Table="product_reviews" },
    @{ Container="myindiansstore-inventory_postgres-1";   DB="inventory_service";    User="postgres"; Pass="postgres"; Table="inventory_items" },
    @{ Container="myindiansstore-cart_postgres-1";        DB="cart_service";         User="postgres"; Pass="postgres"; Table="carts" },
    @{ Container="myindiansstore-cart_postgres-1";        DB="cart_service";         User="postgres"; Pass="postgres"; Table="cart_items" },
    @{ Container="myindiansstore-order_postgres-1";       DB="order_service";        User="postgres"; Pass="postgres"; Table="orders" },
    @{ Container="myindiansstore-order_postgres-1";       DB="order_service";        User="postgres"; Pass="postgres"; Table="order_items" },
    @{ Container="myindiansstore-order_postgres-1";       DB="order_service";        User="postgres"; Pass="postgres"; Table="discounts" },
    @{ Container="myindiansstore-payment_postgres-1";     DB="payment_service";      User="postgres"; Pass="postgres"; Table="payments" },
    @{ Container="myindiansstore-checkout_postgres-1";    DB="checkout_service";     User="postgres"; Pass="postgres"; Table="checkouts" },
    @{ Container="myindiansstore-return_postgres-1";      DB="return_service";       User="postgres"; Pass="postgres"; Table="returns" },
    @{ Container="myindiansstore-logistics_postgres-1";   DB="logistics_service";    User="postgres"; Pass="postgres"; Table="shipments" },
    @{ Container="myindiansstore-logistics_postgres-1";   DB="logistics_service";    User="postgres"; Pass="postgres"; Table="shipment_events" },
    @{ Container="myindiansstore-notification_postgres-1";DB="notification_service"; User="postgres"; Pass="postgres"; Table="notification_templates" },
    @{ Container="myindiansstore-notification_postgres-1";DB="notification_service"; User="postgres"; Pass="postgres"; Table="notification_preferences" },
    @{ Container="myindiansstore-notification_postgres-1";DB="notification_service"; User="postgres"; Pass="postgres"; Table="notification_events" },
    @{ Container="myindiansstore-admin_postgres-1";       DB="admin_db";             User="admin";    Pass="admin123"; Table="admin_users" },
    @{ Container="myindiansstore-admin_postgres-1";       DB="admin_db";             User="admin";    Pass="admin123"; Table="audit_logs" }
)

foreach ($c in $checks) {
    $count = "SELECT COUNT(*) FROM $($c.Table);" | docker exec -i -e "PGPASSWORD=$($c.Pass)" $c.Container psql -U $c.User -d $c.DB -t 2>&1
    $count = $count.Trim()
    Write-Host ("  {0,-35} {1,-30} rows: {2}" -f $c.DB, $c.Table, $count) -ForegroundColor White
}

Write-Host "`n Regression seed completed!" -ForegroundColor Green
