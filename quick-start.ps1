# Quick start script - Build and run one service at a time
# Run this after databases and Kafka are ready

$ErrorActionPreference = "Continue"
$rootDir = "C:\Users\onlyk\Downloads\event-sourcing-saga-multiservice"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Building and Starting Services" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Service list with ports
$services = @(
    @{Name="admin-service"; Port=8011},
    @{Name="user-service"; Port=8081},
    @{Name="item-service"; Port=8084},
    @{Name="cart-service"; Port=8082},
    @{Name="inventory-service"; Port=8089},
    @{Name="payment-service"; Port=8085},
    @{Name="order-service"; Port=8087},
    @{Name="checkout-service"; Port=8083},
    @{Name="logistics-service"; Port=8088},
    @{Name="notification-service"; Port=8086},
    @{Name="return-service"; Port=8008}
)

foreach ($svc in $services) {
    $serviceDir = Join-Path $rootDir $svc.Name
    
    Write-Host "Building $($svc.Name)..." -ForegroundColor Yellow
    cd $serviceDir
    mvn clean package -DskipTests 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Built successfully" -ForegroundColor Green
        
        # Find JAR file
        $jarFile = Get-ChildItem "$serviceDir\target\*.jar" -Exclude "*.original" | Select-Object -First 1
        
        if ($jarFile) {
            Write-Host "  Starting on port $($svc.Port)..." -ForegroundColor Cyan
            
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serviceDir'; Write-Host '$($svc.Name) - Port $($svc.Port)' -ForegroundColor Green; java -jar '$($jarFile.FullName)'"
            
            Start-Sleep -Seconds 3
            Write-Host "  ✓ Started" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✗ Build failed" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "All services started!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  http://localhost:8011  - Admin Service" -ForegroundColor White
Write-Host "  http://localhost:8081  - User Service" -ForegroundColor White
Write-Host "  http://localhost:8082  - Cart Service" -ForegroundColor White
Write-Host "  http://localhost:8083  - Checkout Service" -ForegroundColor White
Write-Host "  http://localhost:8084  - Item Service" -ForegroundColor White
Write-Host "  http://localhost:8085  - Payment Service" -ForegroundColor White
Write-Host "  http://localhost:8086  - Notification Service" -ForegroundColor White
Write-Host "  http://localhost:8087  - Order Service" -ForegroundColor White
Write-Host "  http://localhost:8088  - Logistics Service" -ForegroundColor White
Write-Host "  http://localhost:8089  - Inventory Service" -ForegroundColor White
Write-Host "  http://localhost:8008  - Return Service" -ForegroundColor White
