# Cart Flow Regression Test
$headers = @{ "Content-Type" = "application/json" }
$PASS = 0; $FAIL = 0

function CheckResult {
    param($label, $got, $expected)
    if ($got -eq $expected) {
        Write-Host "  PASS: $label" -ForegroundColor Green
        $script:PASS++
    } else {
        Write-Host "  FAIL: $label (got '$got', expected '$expected')" -ForegroundColor Red
        $script:FAIL++
    }
}

Write-Host "`n========== CART FLOW REGRESSION TEST ==========" -ForegroundColor Cyan

# ---------- 1. Register user ----------
Write-Host "`n[STEP 1] Register new test user"
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$uname = "carttest$ts"
$userBody = @{
    username  = $uname
    password  = "Test@1234"
    email     = "$uname@test.com"
    firstName = "Cart"
    lastName  = "Tester"
    role      = "CUSTOMER"
} | ConvertTo-Json
$reg = Invoke-WebRequest -Uri "http://localhost:8004/users" -Method POST -Headers $headers -Body $userBody -UseBasicParsing
CheckResult "Register user (201)" $reg.StatusCode 201
$userId = ($reg.Content | ConvertFrom-Json).id
Write-Host "  userId=$userId"

# ---------- 2. Get/create cart ----------
Write-Host "`n[STEP 2] Get or create cart for user"
$cartResp = Invoke-WebRequest -Uri "http://localhost:8006/carts/user/$userId" -Method GET -UseBasicParsing
CheckResult "Get cart (200 or 201)" ($cartResp.StatusCode -in @(200,201)) $true
$cartObj = $cartResp.Content | ConvertFrom-Json
$cartId = $cartObj.id
Write-Host "  cartId=$cartId, initialItemCount=$($cartObj.itemCount)"

# ---------- 3. Verify categories ----------
Write-Host "`n[STEP 3] Browse items - verify all categories"
$allItems = (Invoke-WebRequest -Uri "http://localhost:8005/items" -UseBasicParsing).Content | ConvertFrom-Json
$cats = $allItems | Select-Object -ExpandProperty itemType -Unique | Sort-Object
Write-Host "  Found $($cats.Count) categories: $($cats -join ', ')"
CheckResult "At least 8 categories" ($cats.Count -ge 8) $true

# ---------- 4. Add one item per category ----------
Write-Host "`n[STEP 4] Add one item from each category"
$addedCartItemIds = @()
foreach ($cat in $cats) {
    $item = $allItems | Where-Object { $_.itemType -eq $cat } | Select-Object -First 1
    $safeName = $item.name -replace '"', ''
    $b = "{`"itemId`":$($item.id),`"itemName`":`"$safeName`",`"quantity`":1,`"price`":$($item.price)}"
    $ar = Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId/items" -Method POST -Headers $headers -Body $b -UseBasicParsing
    CheckResult "Add [$cat] $($item.name)" $ar.StatusCode 201
    $addedCartItemIds += ($ar.Content | ConvertFrom-Json).id
}

# ---------- 5. Verify item count ----------
Write-Host "`n[STEP 5] Verify cart item count"
$cartAfterAdd = (Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId" -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "  itemCount=$($cartAfterAdd.itemCount) (expected $($cats.Count))"
CheckResult "itemCount equals categories added" $cartAfterAdd.itemCount $cats.Count

# ---------- 6. List cart items ----------
Write-Host "`n[STEP 6] Get cart items list"
$cartItemsList = (Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId/items" -UseBasicParsing).Content | ConvertFrom-Json
CheckResult "List returns $($cats.Count) items" $cartItemsList.Count $cats.Count
$cartItemsList | ForEach-Object { Write-Host "  - cartItemId=$($_.id) itemId=$($_.itemId) qty=$($_.quantity) price=$($_.price)" }

# ---------- 7. Update quantity ----------
Write-Host "`n[STEP 7] Update quantity of first item to 3"
$firstId = $addedCartItemIds[0]
$ur = Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId/items/$firstId" -Method PUT -Headers $headers -Body '{"quantity":3}' -UseBasicParsing
CheckResult "Update quantity (200)" $ur.StatusCode 200
CheckResult "Quantity updated to 3" (($ur.Content | ConvertFrom-Json).quantity) 3

# ---------- 8. Remove one item ----------
Write-Host "`n[STEP 8] Remove last cart item"
$lastId = $addedCartItemIds[-1]
$dr = Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId/items/$lastId" -Method DELETE -UseBasicParsing
CheckResult "Delete item (204)" $dr.StatusCode 204
$cartAfterDel = (Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId" -UseBasicParsing).Content | ConvertFrom-Json
CheckResult "itemCount decremented" $cartAfterDel.itemCount ($cats.Count - 1)

# ---------- 9. Clear cart ----------
Write-Host "`n[STEP 9] Clear cart"
$clearR = Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId/clear" -Method DELETE -UseBasicParsing
CheckResult "Clear cart (204)" $clearR.StatusCode 204
$cartAfterClear = (Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId" -UseBasicParsing).Content | ConvertFrom-Json
CheckResult "itemCount=0 after clear" $cartAfterClear.itemCount 0
$emptyList = (Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId/items" -UseBasicParsing).Content | ConvertFrom-Json
CheckResult "0 items after clear" $emptyList.Count 0

# ---------- 10. Re-add 2 items for checkout readiness ----------
Write-Host "`n[STEP 10] Re-add 2 items and verify final state"
$clothingItem = $allItems | Where-Object { $_.itemType -eq "CLOTHING" } | Select-Object -First 1
$electronicsItem = $allItems | Where-Object { $_.itemType -eq "ELECTRONICS" } | Select-Object -First 1

$b1 = "{`"itemId`":$($clothingItem.id),`"itemName`":`"$($clothingItem.name -replace '"','')`",`"quantity`":2,`"price`":$($clothingItem.price)}"
$b2 = "{`"itemId`":$($electronicsItem.id),`"itemName`":`"$($electronicsItem.name -replace '"','')`",`"quantity`":1,`"price`":$($electronicsItem.price)}"
$ra1 = Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId/items" -Method POST -Headers $headers -Body $b1 -UseBasicParsing
$ra2 = Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId/items" -Method POST -Headers $headers -Body $b2 -UseBasicParsing
CheckResult "Re-add CLOTHING (201)" $ra1.StatusCode 201
CheckResult "Re-add ELECTRONICS (201)" $ra2.StatusCode 201
$finalCart = (Invoke-WebRequest -Uri "http://localhost:8006/carts/$cartId" -UseBasicParsing).Content | ConvertFrom-Json
CheckResult "Final itemCount=2" $finalCart.itemCount 2
Write-Host "  Cart ready for checkout: userId=$userId cartId=$cartId items=2"

# ---------- Summary ----------
Write-Host "`n================================================="
$total = $PASS + $FAIL
Write-Host "TOTAL: $total tests | PASSED: $PASS | FAILED: $FAIL" -ForegroundColor $(if ($FAIL -eq 0) { "Green" } else { "Yellow" })
Write-Host "================================================="
