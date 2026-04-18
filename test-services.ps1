# Test all microservices health endpoints
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Testing Microservices Health" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="Admin"; Url="http://localhost:8011/actuator/health"},
    @{Name="User"; Url="http://localhost:8081/actuator/health"},
    @{Name="Cart"; Url="http://localhost:8082/actuator/health"},
    @{Name="Checkout"; Url="http://localhost:8083/actuator/health"},
    @{Name="Item"; Url="http://localhost:8084/actuator/health"},
    @{Name="Payment"; Url="http://localhost:8085/actuator/health"},
    @{Name="Notification"; Url="http://localhost:8086/actuator/health"},
    @{Name="Order"; Url="http://localhost:8087/actuator/health"},
    @{Name="Logistics"; Url="http://localhost:8088/actuator/health"},
    @{Name="Inventory"; Url="http://localhost:8089/actuator/health"},
    @{Name="Return"; Url="http://localhost:8008/actuator/health"}
)

Write-Host "Waiting 30 seconds for services to fully start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`nChecking service health..." -ForegroundColor Cyan
Write-Host ""

$healthy = 0
$unhealthy = 0

foreach ($svc in $services) {
    try {
        $response = Invoke-RestMethod -Uri $svc.Url -TimeoutSec 5 -ErrorAction Stop
        if ($response.status -eq "UP") {
            Write-Host "✓ $($svc.Name) Service" -ForegroundColor Green -NoNewline
            Write-Host " - $($svc.Url.Replace('/actuator/health', ''))" -ForegroundColor Gray
            $healthy++
        } else {
            Write-Host "⚠ $($svc.Name) Service - Status: $($response.status)" -ForegroundColor Yellow
            $unhealthy++
        }
    } catch {
        Write-Host "✗ $($svc.Name) Service - Not responding" -ForegroundColor Red
        $unhealthy++
    }
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Summary: $healthy/$($services.Count) services healthy" -ForegroundColor $(if ($healthy -eq $services.Count) { "Green" } else { "Yellow" })
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

if ($healthy -eq $services.Count) {
    Write-Host "🎉 All services are running successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try these test commands:" -ForegroundColor Cyan
    Write-Host "  # Get all users" -ForegroundColor Gray
    Write-Host "  Invoke-RestMethod http://localhost:8081/api/users" -ForegroundColor White
    Write-Host ""
    Write-Host "  # Get all items" -ForegroundColor Gray
    Write-Host "  Invoke-RestMethod http://localhost:8084/api/items" -ForegroundColor White
    Write-Host ""
    Write-Host "  # Get all orders" -ForegroundColor Gray
    Write-Host "  Invoke-RestMethod http://localhost:8087/api/orders" -ForegroundColor White
} else {
    Write-Host "Some services are not responding. Please check the service windows for errors." -ForegroundColor Yellow
}
