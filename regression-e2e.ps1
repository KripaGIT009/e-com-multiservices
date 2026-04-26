$ErrorActionPreference = "Continue"
$BASE_USER   = "http://localhost:8004"
$BASE_ITEM   = "http://localhost:8005"
$BASE_INV    = "http://localhost:8003"
$BASE_CART   = "http://localhost:8006"
$BASE_CHKOUT = "http://localhost:8007"
$BASE_ORDER  = "http://localhost:8001"
$BASE_PAY    = "http://localhost:8002"
$BASE_SHIP   = "http://localhost:8009"
$BASE_RETURN = "http://localhost:8008"
$BASE_NOTIF  = "http://localhost:8010"

$PASS = 0; $FAIL = 0; $SKIP = 0

function H { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function OK { param($t) Write-Host "  [PASS] $t" -ForegroundColor Green; $script:PASS++ }
function FL { param($t,$d) Write-Host "  [FAIL] $t : $d" -ForegroundColor Red; $script:FAIL++ }
function SK { param($t) Write-Host "  [SKIP] $t" -ForegroundColor DarkYellow; $script:SKIP++ }

function Invoke-Api {
    param($Method, $Url, $Body, $Label, [switch]$AllowFail)
    try {
        $params = @{ Method=$Method; Uri=$Url; ContentType="application/json"; TimeoutSec=15 }
        if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
        $resp = Invoke-WebRequest @params -UseBasicParsing
        $obj  = $resp.Content | ConvertFrom-Json
        return @{ Ok=$true; Status=$resp.StatusCode; Data=$obj; Raw=$resp.Content }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $msg  = $_.Exception.Message
        if (-not $AllowFail) { FL $Label "HTTP $code - $msg" }
        return @{ Ok=$false; Status=$code; Data=$null; Raw=$msg }
    }
}

H "0. PRE-FLIGHT HEALTH CHECK"
$svcList = @(
    @{N="user-service";        U="$BASE_USER/users"},
    @{N="item-service";        U="$BASE_ITEM/items"},
    @{N="inventory-service";   U="$BASE_INV/inventory/IND-SHIRT-001"},
    @{N="cart-service";        U="$BASE_CART/carts/user/1"},
    @{N="order-service";       U="$BASE_ORDER/api/v1/orders/health"},
    @{N="payment-service";     U="$BASE_PAY/api/v1/payments/health"},
    @{N="logistics-service";   U="$BASE_SHIP/api/shipments/order/ORD-2026-001"},
    @{N="return-service";      U="$BASE_RETURN/api/returns/pending"},
    @{N="notification-service";U="$BASE_NOTIF/api/notifications"}
)
foreach ($h in $svcList) {
    $r = Invoke-Api GET $h.U -Label $h.N -AllowFail
    if ($r.Ok -or ($r.Status -gt 0 -and $r.Status -lt 500)) {
        OK "$($h.N) reachable (HTTP $($r.Status))"
    } else {
        FL "$($h.N)" "Unreachable (HTTP $($r.Status))"
    }
}

H "1. USER SIGNUP"
$ts = Get-Date -Format "yyyyMMddHHmmss"
$newEmail = "regtest_${ts}@myindianstore.com"
$newUser = @{ username="regtest_$ts"; email=$newEmail; password="Secure@1234"; firstName="Reg"; lastName="Tester"; role="CUSTOMER" }
$r1 = Invoke-Api POST "$BASE_USER/users" $newUser "Signup"
if ($r1.Ok) {
    $userId = $r1.Data.id
    OK "Signup OK: userId=$userId email=$newEmail"
} else {
    $userId = 10
    SK "Signup failed - using fallback userId=$userId"
}

H "2. USER LOGIN"
$loginBody = @{ email=$newEmail; password="Secure@1234" }
$r2 = Invoke-Api POST "$BASE_USER/users/login" $loginBody "Login"
if ($r2.Ok) {
    $token = $r2.Data.token
    OK "Login OK: username=$($r2.Data.username) token=$(if($token){'received'}else{'none'})"
} else {
    $token = ""
    FL "Login" "Login failed"
}

H "3. BROWSE ITEMS"
$r3a = Invoke-Api GET "$BASE_ITEM/items" -Label "Get all items"
if ($r3a.Ok) {
    OK "Get all items: $($r3a.Data.Count) items found"
    $item1 = $r3a.Data | Where-Object { $_.sku -eq "IND-SHIRT-001" } | Select-Object -First 1
    $item2 = $r3a.Data | Where-Object { $_.sku -eq "IND-SAREE-002" } | Select-Object -First 1
    if ($item1) { 
        OK "Item 1 found: $($item1.name) Rs.$($item1.price)"
    } else { 
        FL "Item lookup" "IND-SHIRT-001 not found" 
    }
} else {
    SK "Browse items failed - using fallback"
    $item1 = [PSCustomObject]@{id=1; sku="IND-SHIRT-001"; name="Ethnic Kurta"; price=899.00}
    $item2 = [PSCustomObject]@{id=2; sku="IND-SAREE-002"; name="Banarasi Silk Saree"; price=4500.00}
}

$r3b = Invoke-Api GET "$BASE_ITEM/items/sku/IND-SPICE-004" -Label "Get item by SKU"
if ($r3b.Ok) { OK "Item by SKU: $($r3b.Data.name) Rs.$($r3b.Data.price)" }
else { FL "Item by SKU" $r3b.Raw }

H "4. CHECK INVENTORY"
foreach ($sku in @("IND-SHIRT-001","IND-SAREE-002","IND-SPICE-004")) {
    $ri = Invoke-Api GET "$BASE_INV/inventory/$sku" -Label "Inventory $sku"
    if ($ri.Ok) { OK "Inventory [$sku] qty=$($ri.Data.quantity)" }
    else { FL "Inventory $sku" $ri.Raw }
}

H "5. CART OPERATIONS"
$r5a = Invoke-Api GET "$BASE_CART/carts/user/$userId" -Label "Get or create cart" -AllowFail
if ($r5a.Ok) {
    $cartId = $r5a.Data.id
    OK "Cart ready: cartId=$cartId for userId=$userId"
} else {
    $r5b = Invoke-Api POST "$BASE_CART/carts?userId=$userId" -Label "Create cart"
    if ($r5b.Ok) { $cartId = $r5b.Data.id; OK "Cart created: cartId=$cartId" }
    else { SK "Cart creation failed"; $cartId = 1 }
}

$ci1 = @{ itemId=$item1.id; itemName=$item1.name; quantity=2; price=$item1.price }
$r5c = Invoke-Api POST "$BASE_CART/carts/$cartId/items" $ci1 "Add Kurta x2 to cart"
if ($r5c.Ok) { OK "Added Kurta x2 to cart" } else { FL "Add item 1" $r5c.Raw }

$ci2 = @{ itemId=$item2.id; itemName=$item2.name; quantity=1; price=$item2.price }
$r5d = Invoke-Api POST "$BASE_CART/carts/$cartId/items" $ci2 "Add Saree x1 to cart"
if ($r5d.Ok) { OK "Added Saree x1 to cart" } else { FL "Add item 2" $r5d.Raw }

$r5e = Invoke-Api GET "$BASE_CART/carts/$cartId/items" -Label "View cart items"
if ($r5e.Ok) {
    OK "Cart items: $($r5e.Data.Count) items"
    $cartTotal = ($r5e.Data | ForEach-Object { [decimal]$_.price * [int]$_.quantity } | Measure-Object -Sum).Sum
    OK "Cart total: Rs.$cartTotal"
} else {
    FL "View cart" $r5e.Raw
    $cartTotal = [decimal]($item1.price * 2 + $item2.price)
}

H "6. CHECKOUT"
$chkBody = @{ userId=$userId; cartId=$cartId; totalAmount=$cartTotal }
$r6 = Invoke-Api POST "$BASE_CHKOUT/checkouts" $chkBody "Create checkout"
if ($r6.Ok) {
    $checkoutId = $r6.Data.id
    OK "Checkout created: checkoutId=$checkoutId total=Rs.$($r6.Data.totalAmount)"
} else { FL "Checkout" $r6.Raw; $checkoutId = 1 }

H "7. PLACE ORDER"
$orderNum = "ORD-REG-$ts"
if ($r5e.Ok -and $r5e.Data.Count -gt 0) {
    $orderItems = $r5e.Data | ForEach-Object {
        @{ productId=[string]$_.itemId; productName=$_.itemName; quantity=[int]$_.quantity; unitPrice=[decimal]$_.price; description="Regression test" }
    }
} else {
    $orderItems = @(
        @{ productId="1"; productName=$item1.name; quantity=2; unitPrice=[decimal]$item1.price; description="Regression test" },
        @{ productId="2"; productName=$item2.name; quantity=1; unitPrice=[decimal]$item2.price; description="Regression test" }
    )
}
$orderBody = @{ orderNumber=$orderNum; customerId=[string]$userId; totalAmount=$cartTotal; items=$orderItems; notes="E2E regression order" }
$r7 = Invoke-Api POST "$BASE_ORDER/api/v1/orders" $orderBody "Place order"
if ($r7.Ok) {
    $orderId  = $r7.Data.id
    $orderRef = $r7.Data.orderNumber
    OK "Order placed: orderId=$orderId ref=$orderRef status=$($r7.Data.status)"
} else { FL "Place order" $r7.Raw; $orderId = 1; $orderRef = "ORD-2026-001" }

$r7b = Invoke-Api GET "$BASE_ORDER/api/v1/orders/$orderId" -Label "Get order by id"
if ($r7b.Ok) { OK "Order retrieved: status=$($r7b.Data.status) items=$($r7b.Data.items.Count)" }
else { FL "Get order" $r7b.Raw }

$r7c = Invoke-Api GET "$BASE_ORDER/api/v1/orders/customer/$userId" -Label "Orders by customer"
if ($r7c.Ok) { OK "Customer orders: $($r7c.Data.Count) orders" }
else { FL "Orders by customer" $r7c.Raw }

H "8. INVENTORY RESERVATION"
$resBody = @{ orderId=$orderRef; sku="IND-SHIRT-001"; quantity=2 }
$r8 = Invoke-Api POST "$BASE_INV/inventory/reserve" $resBody "Reserve inventory"
if ($r8.Ok) { OK "Inventory reserved: 2x IND-SHIRT-001 for $orderRef" }
else { FL "Inventory reserve" $r8.Raw }

H "9. PAYMENT PROCESSING"
$payBody = @{
    orderId       = $orderRef
    customerId    = [string]$userId
    amount        = $cartTotal
    paymentMethod = "CREDIT_CARD"
    notes         = "E2E regression payment"
}
$r9 = Invoke-Api POST "$BASE_PAY/api/v1/payments" $payBody "Process payment"
if ($r9.Ok) {
    $paymentId = $r9.Data.id
    $payRef    = $r9.Data.paymentId
    OK "Payment processed: ref=$payRef status=$($r9.Data.status) amount=Rs.$($r9.Data.amount)"
} else { FL "Payment" $r9.Raw; $paymentId = 1; $payRef = "PAY-2026-001" }

$r9b = Invoke-Api GET "$BASE_PAY/api/v1/payments/order/$orderRef" -Label "Payment by order"
if ($r9b.Ok -and $r9b.Data.Count -gt 0) { OK "Payment by order: status=$($r9b.Data[0].status)" }
else { FL "Payment by order" $r9b.Raw }

$r9c = Invoke-Api PATCH "$BASE_ORDER/api/v1/orders/$orderId/status?status=PAYMENT_COMPLETED" -Label "Order to PAYMENT_COMPLETED"
if ($r9c.Ok) { OK "Order status -> PAYMENT_COMPLETED" } else { FL "Order status" $r9c.Raw }

$r9d = Invoke-Api PUT "$BASE_CHKOUT/checkouts/$checkoutId/payment-status?paymentStatus=PAID" -Label "Checkout payment to PAID"
if ($r9d.Ok) { OK "Checkout payment status -> PAID" } else { FL "Checkout payment" $r9d.Raw }

H "10. SHIPMENT"
$shipBody = @{
    orderId           = $orderRef
    customerId        = [string]$userId
    carrier           = "BlueDart"
    trackingNumber    = "BD${ts}IN"
    estimatedDelivery = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss")
}
$r10 = Invoke-Api POST "$BASE_SHIP/api/shipments" $shipBody "Create shipment"
if ($r10.Ok) {
    $shipId = $r10.Data.id
    OK "Shipment created: id=$shipId number=$($r10.Data.shipmentNumber) status=$($r10.Data.status)"
} else { FL "Create shipment" $r10.Raw; $shipId = 1 }

$r10b = Invoke-Api PATCH "$BASE_ORDER/api/v1/orders/$orderId/status?status=SHIPPED" -Label "Order to SHIPPED"
if ($r10b.Ok) { OK "Order status -> SHIPPED" } else { FL "Order to SHIPPED" $r10b.Raw }

$r10c = Invoke-Api PUT "$BASE_SHIP/api/shipments/$shipId/status" @{ status="IN_TRANSIT"; description="Package in transit" } "Shipment to IN_TRANSIT"
if ($r10c.Ok) { OK "Shipment -> IN_TRANSIT" } else { FL "Shipment IN_TRANSIT" $r10c.Raw }

$r10d = Invoke-Api GET "$BASE_SHIP/api/shipments/$shipId/events" -Label "Shipment events"
if ($r10d.Ok) { OK "Shipment events: $($r10d.Data.Count)" } else { FL "Shipment events" $r10d.Raw }

$r10e = Invoke-Api PUT "$BASE_SHIP/api/shipments/$shipId/status" @{ status="DELIVERED"; description="Delivered to customer" } "Shipment to DELIVERED"
if ($r10e.Ok) { OK "Shipment -> DELIVERED" } else { FL "Shipment DELIVERED" $r10e.Raw }

$r10f = Invoke-Api PATCH "$BASE_ORDER/api/v1/orders/$orderId/status?status=DELIVERED" -Label "Order to DELIVERED"
if ($r10f.Ok) { OK "Order status -> DELIVERED" } else { FL "Order to DELIVERED" $r10f.Raw }

$r10g = Invoke-Api GET "$BASE_SHIP/api/shipments/order/$orderRef" -Label "Shipment by order"
if ($r10g.Ok) { OK "Shipment by order: status=$($r10g.Data.status)" } else { FL "Shipment by order" $r10g.Raw }

H "11. RETURN & REFUND"
$retBody = @{ orderId=$orderId; userId=$userId; reason="Size issue - item too large"; refundAmount=$item1.price }
$r11 = Invoke-Api POST "$BASE_RETURN/api/returns" $retBody "Create return"
if ($r11.Ok) {
    $returnId = $r11.Data.id
    OK "Return created: id=$returnId status=$($r11.Data.status)"
} else { FL "Create return" $r11.Raw; $returnId = 1 }

$r11b = Invoke-Api GET "$BASE_RETURN/api/returns/$returnId" -Label "Get return"
if ($r11b.Ok) { OK "Return fetched: status=$($r11b.Data.status)" } else { FL "Get return" $r11b.Raw }

$r11c = Invoke-Api PUT "$BASE_RETURN/api/returns/$returnId/approve" -Label "Approve return"
if ($r11c.Ok) { OK "Return approved: status=$($r11c.Data.status)" } else { FL "Approve return" $r11c.Raw }

$r11d = Invoke-Api PUT "$BASE_RETURN/api/returns/$returnId/refund" -Label "Process refund"
if ($r11d.Ok) { OK "Refund processed: status=$($r11d.Data.status)" } else { FL "Refund" $r11d.Raw }

$r11e = Invoke-Api POST "$BASE_PAY/api/v1/payments/$paymentId/refund" -Label "Payment refund"
if ($r11e.Ok) { OK "Payment refund issued: status=$($r11e.Data.status)" } else { FL "Payment refund" $r11e.Raw }

$r11f = Invoke-Api PATCH "$BASE_ORDER/api/v1/orders/$orderId/status?status=REFUNDED" -Label "Order to REFUNDED"
if ($r11f.Ok) { OK "Order status -> REFUNDED" } else { FL "Order to REFUNDED" $r11f.Raw }

H "12. NOTIFICATIONS"
$notifList = @(
    @{ templateCode="ORDER_PLACED";    channel="EMAIL"; payload="{""orderId"":""$orderRef"",""amount"":""$cartTotal"",""name"":""Reg Tester""}" },
    @{ templateCode="ORDER_SHIPPED";   channel="EMAIL"; payload="{""orderId"":""$orderRef"",""carrier"":""BlueDart"",""name"":""Reg Tester""}" },
    @{ templateCode="PAYMENT_OK";      channel="SMS";   payload="{""orderId"":""$orderRef"",""amount"":""$cartTotal""}" },
    @{ templateCode="ORDER_DELIVERED"; channel="EMAIL"; payload="{""orderId"":""$orderRef"",""name"":""Reg Tester""}" },
    @{ templateCode="RETURN_INIT";     channel="EMAIL"; payload="{""orderId"":""$orderRef"",""name"":""Reg Tester""}" }
)
foreach ($n in $notifList) {
    $nb = @{ userId=$userId; channel=$n.channel; templateCode=$n.templateCode; correlationId=$orderRef; payload=$n.payload }
    $rn = Invoke-Api POST "$BASE_NOTIF/api/notifications" $nb "Notification $($n.templateCode)"
    if ($rn.Ok) { OK "Notif $($n.templateCode) via $($n.channel): status=$($rn.Data.status)" }
    else { FL "Notif $($n.templateCode)" $rn.Raw }
}
$rpref = Invoke-Api POST "$BASE_NOTIF/api/preferences" @{ userId=$userId; channel="EMAIL"; enabled=$true } "Set pref EMAIL"
if ($rpref.Ok) { OK "Notification preference set: EMAIL enabled" } else { FL "Notification pref" $rpref.Raw }

H "13. FINAL VERIFICATIONS"
$fv1 = Invoke-Api GET "$BASE_USER/users/$userId" -Label "User exists"
if ($fv1.Ok) { OK "User: $($fv1.Data.username) / $($fv1.Data.email)" } else { FL "User verify" $fv1.Raw }

$fv2 = Invoke-Api GET "$BASE_ORDER/api/v1/orders/$orderId" -Label "Order final state"
if ($fv2.Ok) { OK "Order final: $($fv2.Data.orderNumber) -> $($fv2.Data.status)" } else { FL "Order final" $fv2.Raw }

$fv3 = Invoke-Api GET "$BASE_RETURN/api/returns/pending" -Label "Pending returns"
if ($fv3.Ok) { OK "Pending returns: $($fv3.Data.Count)" } else { FL "Pending returns" $fv3.Raw }

$fv4 = Invoke-Api GET "$BASE_PAY/api/v1/payments" -Label "All payments"
if ($fv4.Ok) { OK "Total payments in system: $($fv4.Data.Count)" } else { FL "All payments" $fv4.Raw }

$fv5 = Invoke-Api GET "$BASE_ORDER/api/v1/orders" -Label "All orders"
if ($fv5.Ok) { OK "Total orders in system: $($fv5.Data.Count)" } else { FL "All orders" $fv5.Raw }

$fv6 = Invoke-Api GET "$BASE_RETURN/api/returns/user/$userId" -Label "Returns by user"
if ($fv6.Ok) { OK "Returns for user $userId : $($fv6.Data.Count)" } else { FL "Returns by user" $fv6.Raw }

$total = $PASS + $FAIL + $SKIP
$pct   = if ($total -gt 0) { [math]::Round(($PASS/$total)*100,1) } else { 0 }
Write-Host ""
Write-Host "================================================" -ForegroundColor White
Write-Host "  REGRESSION TEST RESULTS SUMMARY" -ForegroundColor White
Write-Host "------------------------------------------------" -ForegroundColor White
Write-Host ("  Total  : {0}" -f $total) -ForegroundColor White
Write-Host ("  PASS   : {0}" -f $PASS)  -ForegroundColor Green
Write-Host ("  FAIL   : {0}" -f $FAIL)  -ForegroundColor Red
Write-Host ("  SKIP   : {0}" -f $SKIP)  -ForegroundColor DarkYellow
Write-Host ("  Rate   : {0}%" -f $pct)  -ForegroundColor $(if ($pct -ge 80) {"Green"} elseif ($pct -ge 60) {"Yellow"} else {"Red"})
Write-Host "================================================" -ForegroundColor White
if ($FAIL -eq 0) {
    Write-Host "  ALL TESTS PASSED - System healthy!" -ForegroundColor Green
} else {
    Write-Host "  $FAIL test(s) failed. Review [FAIL] lines above." -ForegroundColor Red
}
Write-Host "================================================`n" -ForegroundColor White
