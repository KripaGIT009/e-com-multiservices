# UI Flow Regression Test — Unified Architecture
# Single service: ui-main at http://localhost:4200
#   Customer SPA  : http://localhost:4200/
#   Admin SPA     : http://localhost:4200/admin/
#   All APIs      : http://localhost:4200/api/...

$BASE    = "http://localhost:4200"
$headers = @{ "Content-Type" = "application/json" }
$PASS = 0; $FAIL = 0; $WARN = 0

function OK { param($label, $got, $expected)
  if ($got -eq $expected) { Write-Host "  PASS: $label" -ForegroundColor Green; $script:PASS++ }
  else { Write-Host "  FAIL: $label (got '$got', expected '$expected')" -ForegroundColor Red; $script:FAIL++ }
}
function WarnNote { param($label, $msg)
  Write-Host "  WARN: $label - $msg" -ForegroundColor Yellow; $script:WARN++
}
function SafeGet { param($url, [hashtable]$h = @{})
  try { Invoke-WebRequest -Uri $url -Method GET -Headers $h -UseBasicParsing }
  catch { $_.Exception.Response }
}
function SafePost { param($url, $body, [hashtable]$h = @{})
  try { Invoke-WebRequest -Uri $url -Method POST -Headers $h -Body $body -UseBasicParsing }
  catch { $_.Exception.Response }
}

Write-Host "`n============ UI FLOW REGRESSION TEST (UNIFIED) ============" -ForegroundColor Cyan
Write-Host "  Single service: $BASE`n"

# ─── SECTION 1: Health ───────────────────────────────────────────────────────
Write-Host "[SECTION 1] Health Check" -ForegroundColor Cyan
$r = SafeGet "$BASE/health"
OK "1a. ui-main health" $r.StatusCode 200

# ─── SECTION 2: Customer Auth ────────────────────────────────────────────────
Write-Host "`n[SECTION 2] Customer Auth" -ForegroundColor Cyan

$ts       = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser = "uiunit$ts"
$regBody  = @{ username=$testUser; email="$testUser@test.com"; password="Test@1234"; firstName="UI"; lastName="Tester" } | ConvertTo-Json
$regR     = SafePost "$BASE/api/auth/register" $regBody $headers
OK "2a. POST /api/auth/register" $regR.StatusCode 201
$regData  = $regR.Content | ConvertFrom-Json
$token    = $regData.token
$userId   = $regData.user.id
Write-Host "  userId=$userId, token=$(if($token){'yes'}else{'NO'})"

$loginBody = @{ username=$testUser; password="Test@1234" } | ConvertTo-Json
$loginR    = SafePost "$BASE/api/auth/login" $loginBody $headers
OK "2b. POST /api/auth/login" $loginR.StatusCode 200
$loginData = $loginR.Content | ConvertFrom-Json
$token     = $loginData.token
$userId    = $loginData.user.id
$authH     = @{ "Content-Type"="application/json"; "Authorization"="Bearer $token" }
Write-Host "  userId=$userId"

$verifyR = SafeGet "$BASE/api/auth/verify" @{ "Authorization"="Bearer $token" }
OK "2c. GET /api/auth/verify" $verifyR.StatusCode 200

# ─── SECTION 3: Items & Cart ─────────────────────────────────────────────────
Write-Host "`n[SECTION 3] Customer — Items & Cart" -ForegroundColor Cyan

$itemsR   = SafeGet "$BASE/api/items"
OK "3a. GET /api/items" $itemsR.StatusCode 200
$allItems = $itemsR.Content | ConvertFrom-Json
Write-Host "  Total items: $($allItems.Count)"
OK "3a. Items count >= 20" ($allItems.Count -ge 20) $true

$singleR = SafeGet "$BASE/api/items/1"
OK "3b. GET /api/items/1" $singleR.StatusCode 200

$searchR = SafeGet "$BASE/api/items/search?q=kurta"
OK "3c. GET /api/items/search" ($searchR.StatusCode -in @(200,404)) $true

$cartR    = SafeGet "$BASE/api/cart/$userId"
OK "3d. GET /api/cart/:userId" $cartR.StatusCode 200
$cartData = $cartR.Content | ConvertFrom-Json
$cartId   = $cartData.id
Write-Host "  cartId=$cartId, itemCount=$($cartData.itemCount)"

Write-Host "  Adding items from 3 categories..."
$cats = @(
  @{ itemId=1;  name="Ethnic Kurta" },
  @{ itemId=6;  name="Samsung Galaxy" },
  @{ itemId=12; name="Ramayana book" }
)
foreach ($ci in $cats) {
  $addBody = @{ itemId=$ci.itemId; quantity=1 } | ConvertTo-Json
  $addR    = SafePost "$BASE/api/cart/$userId/items" $addBody $headers
  OK "3e. Add [$($ci.name)] to cart" $addR.StatusCode 200
}

$cartAfterR    = SafeGet "$BASE/api/cart/$userId"
$cartAfterData = $cartAfterR.Content | ConvertFrom-Json
Write-Host "  itemCount after add=$($cartAfterData.itemCount)"
OK "3f. Cart itemCount >= 3" ($cartAfterData.itemCount -ge 3) $true

# ─── SECTION 4: Profile & Inventory ─────────────────────────────────────────
Write-Host "`n[SECTION 4] Customer — Profile & Inventory" -ForegroundColor Cyan

$profR = SafeGet "$BASE/api/profile" $authH
OK "4a. GET /api/profile" $profR.StatusCode 200

$invR = SafeGet "$BASE/api/inventory/IND-ELEC-006"
OK "4b. GET /api/inventory/:sku" $invR.StatusCode 200

# ─── SECTION 5: Orders & Payments ───────────────────────────────────────────
Write-Host "`n[SECTION 5] Customer — Orders & Payments" -ForegroundColor Cyan

$orderBody = @{
  items = @(@{ itemId=1; sku="IND-SHIRT-001"; name="Ethnic Kurta - Men"; price=899.00; quantity=1 })
  notes = "Test order"
} | ConvertTo-Json -Depth 5
$orderR    = SafePost "$BASE/api/orders" $orderBody $authH
OK "5a. POST /api/orders" $orderR.StatusCode 201
$orderData = $orderR.Content | ConvertFrom-Json
$orderId   = $orderData.orderNumber
if (-not $orderId) { $orderId = $orderData.id }
Write-Host "  orderId=$orderId"

if ($orderId) {
  $getOrderR = SafeGet "$BASE/api/orders/$orderId" $authH
  OK "5b. GET /api/orders/:id" $getOrderR.StatusCode 200
}

if ($orderId) {
  $payBody = @{ orderId=$orderId; customerId=$userId; amount=899.00; paymentMethod="CREDIT_CARD" } | ConvertTo-Json
  $payR    = SafePost "$BASE/api/payments" $payBody $headers
  OK "5c. POST /api/payments" $payR.StatusCode 200
}

if ($orderId) {
  $payByOrderR = SafeGet "$BASE/api/payments/order/$orderId"
  OK "5d. GET /api/payments/order/:id" ($payByOrderR.StatusCode -in @(200,404)) $true
}

$myOrdersR = SafeGet "$BASE/api/orders" $authH
OK "5e. GET /api/orders (user history)" ($myOrdersR.StatusCode -in @(200,404)) $true

$returnsR = SafeGet "$BASE/api/returns" $authH
OK "5f. GET /api/returns (user history)" ($returnsR.StatusCode -in @(200,404)) $true

# ─── SECTION 6: Checkout ────────────────────────────────────────────────────
Write-Host "`n[SECTION 6] Customer — Checkout" -ForegroundColor Cyan

$checkoutBody = @{ userId=$userId; cartId=$cartId; totalAmount=12999.00 } | ConvertTo-Json
$coR          = SafePost "$BASE/api/checkout" $checkoutBody $headers
OK "6a. POST /api/checkout" ($coR.StatusCode -in @(200,201)) $true
$checkoutId   = $null
if ($coR.StatusCode -in @(200,201)) {
  $coData     = $coR.Content | ConvertFrom-Json
  $checkoutId = $coData.id
  Write-Host "  checkoutId=$checkoutId"
}

if ($checkoutId) {
  $coGetR = SafeGet "$BASE/api/checkout/$checkoutId"
  OK "6b. GET /api/checkout/:id" $coGetR.StatusCode 200
}

$resolvedOrder = if ($orderId) { $orderId } else { "test-order-001" }
$pay2Body      = @{ orderId=$resolvedOrder; customerId=$userId; amount=12999.00; paymentMethod="WALLET" } | ConvertTo-Json
$pay2R         = SafePost "$BASE/api/payments" $pay2Body $headers
OK "6c. POST /api/payments (wallet)" $pay2R.StatusCode 200

# ─── SECTION 7: Admin ───────────────────────────────────────────────────────
Write-Host "`n[SECTION 7] Admin (http://localhost:4200/admin/)" -ForegroundColor Cyan

$adminLoginBody = @{ username="admin"; password="admin123" } | ConvertTo-Json
$adminLoginR    = SafePost "$BASE/api/admin/login" $adminLoginBody $headers
OK "7a. POST /api/admin/login" ($adminLoginR.StatusCode -in @(200,201)) $true
$adminTok = $null
if ($adminLoginR.StatusCode -in @(200,201)) {
  $adminData = $adminLoginR.Content | ConvertFrom-Json
  $adminTok  = $adminData.token
  Write-Host "  adminToken=$(if($adminTok){'yes'}else{'NO - check admin-service'})"
}
$admH = @{ "Content-Type"="application/json"; "Authorization"="Bearer $adminTok" }

$adminUsersR = SafeGet "$BASE/api/users" $admH
OK "7b. GET /api/users (admin)" ($adminUsersR.StatusCode -in @(200,401,403)) $true
Write-Host "  status=$($adminUsersR.StatusCode)"

$adminItemsR    = SafeGet "$BASE/api/items"
OK "7c. GET /api/items (admin)" $adminItemsR.StatusCode 200
$adminItemsList = $adminItemsR.Content | ConvertFrom-Json
Write-Host "  Admin sees $($adminItemsList.Count) items"

$adminOrdersR = SafeGet "$BASE/api/orders" $admH
OK "7d. GET /api/orders (admin, all)" ($adminOrdersR.StatusCode -in @(200,401,403)) $true

$adminInvR = SafeGet "$BASE/api/inventory" $admH
OK "7e. GET /api/inventory (admin)" ($adminInvR.StatusCode -in @(200,401,403)) $true
Write-Host "  inventory status=$($adminInvR.StatusCode)"

$adminPayR = SafeGet "$BASE/api/payments" $admH
OK "7f. GET /api/payments (admin, all)" ($adminPayR.StatusCode -in @(200,401,403)) $true

# ─── SUMMARY ─────────────────────────────────────────────────────────────────
Write-Host "`n=================================================" -ForegroundColor Cyan
$total = $PASS + $FAIL + $WARN
Write-Host "TOTAL: $total checks | PASSED: $PASS | FAILED: $FAIL | WARNINGS: $WARN" -ForegroundColor $(if ($FAIL -eq 0) { "Green" } else { "Yellow" })
Write-Host "================================================="
Write-Host ""
Write-Host "Single UI service:"
Write-Host "  Customer SPA : http://localhost:4200/"
Write-Host "  Admin SPA    : http://localhost:4200/admin/"
Write-Host "  Health       : http://localhost:4200/health"
