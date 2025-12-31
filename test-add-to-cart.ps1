# Test Add to Cart Functionality
Write-Host "=== Testing Add to Cart Functionality ===" -ForegroundColor Cyan

# First, get a cart for guest user
Write-Host "1. Getting/Creating cart for guest user..." -ForegroundColor Yellow
$cartResponse = Invoke-RestMethod -Uri "http://localhost:8006/carts/user/guest" -Method Get -ErrorAction Continue

if ($cartResponse) {
    Write-Host "✓ Cart retrieved for guest user" -ForegroundColor Green
    Write-Host "Cart ID: $($cartResponse.id)" -ForegroundColor Gray
    
    $cartId = $cartResponse.id
    
    # Now add an item to cart
    Write-Host "2. Adding item to cart..." -ForegroundColor Yellow
    
    $itemPayload = @{
        itemId = "ITEM-001"
        itemName = "Test Product"
        quantity = 1
        price = 99.99
    } | ConvertTo-Json
    
    Write-Host "Payload: $itemPayload" -ForegroundColor Gray
    
    $addResponse = Invoke-RestMethod -Uri "http://localhost:8006/carts/$cartId/items" `
        -Method Post `
        -Body $itemPayload `
        -ContentType "application/json" `
        -ErrorAction Continue
    
    if ($addResponse) {
        Write-Host "✓ Item added to cart successfully!" -ForegroundColor Green
        Write-Host "Response: $($addResponse | ConvertTo-Json)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to add item to cart" -ForegroundColor Red
    }
    
    # Get cart to verify item is there
    Write-Host "3. Verifying cart contents..." -ForegroundColor Yellow
    $verifyResponse = Invoke-RestMethod -Uri "http://localhost:8006/carts/user/guest" -Method Get -ErrorAction Continue
    
    if ($verifyResponse) {
        Write-Host "✓ Cart response received" -ForegroundColor Green
        if ($verifyResponse.items -and $verifyResponse.items.Count -gt 0) {
            Write-Host "✓ Cart contains items:" -ForegroundColor Green
            $verifyResponse.items | ForEach-Object {
                Write-Host "  - Item ID: $($_.itemId), Name: $($_.itemName), Qty: $($_.quantity), Price: $($_.price)" -ForegroundColor Gray
            }
        } else {
            Write-Host "! Cart is empty" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Cart verification failed" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Failed to get cart" -ForegroundColor Red
}

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
