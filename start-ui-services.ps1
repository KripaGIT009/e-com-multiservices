# Start all UI services
$ErrorActionPreference = "Continue"
$rootDir = "C:\Users\onlyk\Downloads\event-sourcing-saga-multiservice"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Starting UI Services" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$uiServices = @(
    @{Name="ui-storefront"; Port=4200; Dir="ui-storefront"; Description="Customer Shopping"},
    @{Name="ui-admin"; Port=4201; Dir="ui-admin"; Description="Admin Dashboard"},
    @{Name="ui-account"; Port=4202; Dir="ui-account"; Description="Account Management"},
    @{Name="ui-checkout"; Port=4203; Dir="ui-checkout"; Description="Checkout Flow"},
    @{Name="ui-auth"; Port=4204; Dir="ui-auth"; Description="Authentication"}
)

foreach ($svc in $uiServices) {
    $serviceDir = Join-Path $rootDir $svc.Dir
    
    if (Test-Path $serviceDir) {
        Write-Host "Setting up $($svc.Name) ($($svc.Description))..." -ForegroundColor Yellow
        
        # Check if node_modules exists
        $nodeModules = Join-Path $serviceDir "node_modules"
        if (-not (Test-Path $nodeModules)) {
            Write-Host "  Installing dependencies (this may take a few minutes)..." -ForegroundColor Gray
            Push-Location $serviceDir
            npm install 2>&1 | Out-Null
            Pop-Location
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Failed to install dependencies" -ForegroundColor Red
                continue
            }
        } else {
            Write-Host "  ✓ Dependencies already installed" -ForegroundColor Green
        }
        
        # Start the service
        Write-Host "  Starting on port $($svc.Port)..." -ForegroundColor Cyan
        
        # Check if it's an Angular app or Node.js app
        $angularJson = Join-Path $serviceDir "angular.json"
        if (Test-Path $angularJson) {
            # Angular app - use ng serve
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serviceDir'; Write-Host '$($svc.Description) - http://localhost:$($svc.Port)' -ForegroundColor Magenta; ng serve --port $($svc.Port)"
        } else {
            # Node.js app - use npm start or node server.js
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serviceDir'; Write-Host '$($svc.Description) - http://localhost:$($svc.Port)' -ForegroundColor Magenta; npm start"
        }
        
        Write-Host "  ✓ Started $($svc.Name)" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  ⚠ Directory not found: $serviceDir" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "UI Services Started!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the applications:" -ForegroundColor Cyan
Write-Host "  Storefront (Customer): http://localhost:4200" -ForegroundColor White
Write-Host "  Admin Dashboard:       http://localhost:4201" -ForegroundColor White
Write-Host "  Account Management:    http://localhost:4202" -ForegroundColor White
Write-Host "  Checkout:              http://localhost:4203" -ForegroundColor White
Write-Host "  Authentication:        http://localhost:4204" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Services will take 30-60 seconds to compile and start" -ForegroundColor Yellow
Write-Host "   Watch the individual windows for 'Compiled successfully' message" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Note: Close the old UI-Admin window that had the error" -ForegroundColor Cyan
