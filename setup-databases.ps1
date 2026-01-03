# PowerShell script to setup PostgreSQL databases
# Make sure PostgreSQL is running before executing this script

Write-Host "=================================================" -ForegroundColor Green
Write-Host "PostgreSQL Database Setup Script" -ForegroundColor Green
Write-Host "E-Commerce Microservices Platform" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL is running
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($null -eq $pgService) {
    Write-Host "WARNING: PostgreSQL service not found!" -ForegroundColor Yellow
    Write-Host "Please ensure PostgreSQL is installed and running." -ForegroundColor Yellow
    Write-Host ""
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "database-setup.sql"

# Check if SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: database-setup.sql not found in $scriptDir" -ForegroundColor Red
    exit 1
}

Write-Host "SQL File: $sqlFile" -ForegroundColor Cyan
Write-Host ""

# Prompt for PostgreSQL credentials
$pgUser = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($pgUser)) {
    $pgUser = "postgres"
}

$pgHost = Read-Host "Enter PostgreSQL host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($pgHost)) {
    $pgHost = "localhost"
}

$pgPort = Read-Host "Enter PostgreSQL port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($pgPort)) {
    $pgPort = "5432"
}

Write-Host ""
Write-Host "Connecting to PostgreSQL..." -ForegroundColor Yellow
Write-Host "Host: $pgHost" -ForegroundColor Cyan
Write-Host "Port: $pgPort" -ForegroundColor Cyan
Write-Host "User: $pgUser" -ForegroundColor Cyan
Write-Host ""

# Set PGPASSWORD environment variable (will prompt for password via psql)
$env:PGPASSWORD = $null

# Execute the SQL script
Write-Host "Executing database setup script..." -ForegroundColor Yellow
Write-Host ""

try {
    & psql -h $pgHost -p $pgPort -U $pgUser -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=================================================" -ForegroundColor Green
        Write-Host "Database setup completed successfully!" -ForegroundColor Green
        Write-Host "=================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Created 11 databases with tables and sample data:" -ForegroundColor Green
        Write-Host "  ✓ admin_db" -ForegroundColor Green
        Write-Host "  ✓ user_service" -ForegroundColor Green
        Write-Host "  ✓ item_service" -ForegroundColor Green
        Write-Host "  ✓ cart_service" -ForegroundColor Green
        Write-Host "  ✓ order_service" -ForegroundColor Green
        Write-Host "  ✓ inventory_service" -ForegroundColor Green
        Write-Host "  ✓ payment_service" -ForegroundColor Green
        Write-Host "  ✓ checkout_service" -ForegroundColor Green
        Write-Host "  ✓ logistics_service" -ForegroundColor Green
        Write-Host "  ✓ notification_service" -ForegroundColor Green
        Write-Host "  ✓ return_service" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now start your microservices!" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "ERROR: Database setup failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to execute psql command!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL is installed" -ForegroundColor Yellow
    Write-Host "  2. PostgreSQL bin directory is in your PATH" -ForegroundColor Yellow
    Write-Host "  3. PostgreSQL service is running" -ForegroundColor Yellow
    exit 1
}
