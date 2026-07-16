# Start unified UI service only (unified-ui)
$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Starting Unified UI (unified-ui)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

Push-Location $rootDir
try {
    Write-Host "Bringing up unified-ui via Docker Compose..." -ForegroundColor Yellow
    docker compose up -d --build unified-ui

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start unified-ui via docker compose."
    }

    Write-Host "" 
    Write-Host "Unified UI started successfully." -ForegroundColor Green
    Write-Host "Customer app: http://localhost:4200/" -ForegroundColor White
    Write-Host "Admin app:    http://localhost:4200/admin/" -ForegroundColor White
    Write-Host "Health:       http://localhost:4200/health" -ForegroundColor White
}
finally {
    Pop-Location
}
