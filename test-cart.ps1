Write-Host "Testing Add to Cart" -ForegroundColor Cyan

try {
    $cartResponse = Invoke-RestMethod -Uri "http://localhost:8006/carts/user/guest" -Method Get
    Write-Host "Cart Response: $($cartResponse | ConvertTo-Json)" -ForegroundColor Green
    
    $cartId = $cartResponse.id
    Write-Host "Cart ID: $cartId" -ForegroundColor Green
    
    $payload = @{
        itemId = 1
        itemName = "Test Product"
        quantity = 1
        price = 99.99
    } | ConvertTo-Json
    
    $addResponse = Invoke-RestMethod -Uri "http://localhost:8006/carts/$cartId/items" -Method Post -Body $payload -ContentType "application/json"
    Write-Host "Add Response: $($addResponse | ConvertTo-Json)" -ForegroundColor Green
}
catch {
    Write-Host "Error: $($_)" -ForegroundColor Red
}
