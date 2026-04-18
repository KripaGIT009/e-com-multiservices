# PowerShell script to run all microservices locally
# Prerequisites: PostgreSQL running with databases created, Kafka running

param(
    [switch]$BuildAll,
    [switch]$SkipBuild,
    [switch]$StartKafka
)

$ErrorActionPreference = "Continue"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "E-Commerce Microservices - Local Startup Script" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define all Java services
$javaServices = @(
    @{Name="admin-service"; Port=8011; Dir="admin-service"},
    @{Name="user-service"; Port=8081; Dir="user-service"},
    @{Name="item-service"; Port=8084; Dir="item-service"},
    @{Name="cart-service"; Port=8082; Dir="cart-service"},
    @{Name="order-service"; Port=8087; Dir="order-service"},
    @{Name="inventory-service"; Port=8089; Dir="inventory-service"},
    @{Name="payment-service"; Port=8085; Dir="payment-service"},
    @{Name="checkout-service"; Port=8083; Dir="checkout-service"},
    @{Name="logistics-service"; Port=8088; Dir="logistics-service"},
    @{Name="notification-service"; Port=8086; Dir="notification-service"},
    @{Name="return-service"; Port=8008; Dir="return-service"}
)

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check if PostgreSQL is accessible
try {
    $pgTest = psql -U postgres -c "SELECT 1" 2>&1
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL not accessible!" -ForegroundColor Red
    Write-Host "  Please ensure PostgreSQL is running and accessible" -ForegroundColor Yellow
    exit 1
}

# Check if Maven is installed
try {
    $mvnVersion = mvn -version 2>&1 | Select-Object -First 1
    Write-Host "✓ Maven is installed: $mvnVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Maven not found!" -ForegroundColor Red
    Write-Host "  Please install Apache Maven and add it to PATH" -ForegroundColor Yellow
    exit 1
}

# Check if Java is installed
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "✓ Java is installed: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Java not found!" -ForegroundColor Red
    Write-Host "  Please install Java 21 and add it to PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Start Kafka if requested
if ($StartKafka) {
    Write-Host "Starting Kafka with Docker..." -ForegroundColor Yellow
    docker-compose up -d kafka
    Write-Host "Waiting for Kafka to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Write-Host "✓ Kafka started" -ForegroundColor Green
    Write-Host ""
}

# Check if Kafka is running
Write-Host "Checking Kafka connectivity..." -ForegroundColor Yellow
try {
    $kafkaTest = Test-NetConnection -ComputerName localhost -Port 9092 -WarningAction SilentlyContinue
    if ($kafkaTest.TcpTestSucceeded) {
        Write-Host "✓ Kafka is accessible on localhost:9092" -ForegroundColor Green
    } else {
        Write-Host "⚠ Kafka not accessible on localhost:9092" -ForegroundColor Yellow
        Write-Host "  Services may fail to start. Run with -StartKafka flag" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not check Kafka connectivity" -ForegroundColor Yellow
}

Write-Host ""

# Build services if requested
if ($BuildAll -or -not $SkipBuild) {
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "Building all Java services..." -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($service in $javaServices) {
        $serviceDir = Join-Path $rootDir $service.Dir
        
        if (Test-Path $serviceDir) {
            Write-Host "Building $($service.Name)..." -ForegroundColor Yellow
            Push-Location $serviceDir
            
            $buildOutput = mvn clean package -DskipTests 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ $($service.Name) built successfully" -ForegroundColor Green
            } else {
                Write-Host "  ✗ $($service.Name) build failed" -ForegroundColor Red
                Write-Host "  Check the output above for errors" -ForegroundColor Yellow
            }
            
            Pop-Location
            Write-Host ""
        }
    }
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Starting all microservices..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Array to store service processes
$serviceProcesses = @()

# Start each service in a new PowerShell window
foreach ($service in $javaServices) {
    $serviceDir = Join-Path $rootDir $service.Dir
    $jarPattern = Join-Path $serviceDir "target\*.jar"
    
    # Find the JAR file (excluding .original files)
    $jarFiles = Get-ChildItem -Path $jarPattern -Exclude "*.original" -ErrorAction SilentlyContinue
    
    if ($jarFiles) {
        $jarFile = $jarFiles[0].FullName
        
        Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Yellow
        Write-Host "  JAR: $jarFile" -ForegroundColor Gray
        
        # Start the service in a new window
        $processArgs = @{
            FilePath = "powershell.exe"
            ArgumentList = @(
                "-NoExit",
                "-Command",
                "cd '$serviceDir'; Write-Host '$($service.Name) Starting...' -ForegroundColor Cyan; java -jar '$jarFile'"
            )
            WindowStyle = "Normal"
        }
        
        $process = Start-Process @processArgs -PassThru
        $serviceProcesses += @{
            Name = $service.Name
            Process = $process
            Port = $service.Port
        }
        
        Write-Host "  ✓ Started $($service.Name) (PID: $($process.Id))" -ForegroundColor Green
        
        # Small delay between service starts
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  ✗ JAR file not found for $($service.Name)" -ForegroundColor Red
        Write-Host "    Run with -BuildAll flag to build all services" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "All services started!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Service Endpoints:" -ForegroundColor Cyan
Write-Host "  Admin Service:        http://localhost:8011" -ForegroundColor White
Write-Host "  User Service:         http://localhost:8081" -ForegroundColor White
Write-Host "  Cart Service:         http://localhost:8082" -ForegroundColor White
Write-Host "  Checkout Service:     http://localhost:8083" -ForegroundColor White
Write-Host "  Item Service:         http://localhost:8084" -ForegroundColor White
Write-Host "  Payment Service:      http://localhost:8085" -ForegroundColor White
Write-Host "  Notification Service: http://localhost:8086" -ForegroundColor White
Write-Host "  Order Service:        http://localhost:8087" -ForegroundColor White
Write-Host "  Logistics Service:    http://localhost:8088" -ForegroundColor White
Write-Host "  Inventory Service:    http://localhost:8089" -ForegroundColor White
Write-Host "  Return Service:       http://localhost:8008" -ForegroundColor White
Write-Host ""

Write-Host "Press Ctrl+C to stop monitoring (services will continue running)" -ForegroundColor Gray
Write-Host "To stop all services, close their respective windows or use Task Manager" -ForegroundColor Gray
Write-Host ""

# Monitor services
Write-Host "Monitoring services (press Ctrl+C to exit)..." -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        $runningCount = 0
        foreach ($svc in $serviceProcesses) {
            if (-not $svc.Process.HasExited) {
                $runningCount++
            }
        }
        
        Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $runningCount/$($serviceProcesses.Count) services running" -ForegroundColor Green
    }
} catch {
    Write-Host ""
    Write-Host "Monitoring stopped." -ForegroundColor Yellow
    Write-Host "Services are still running in separate windows." -ForegroundColor Yellow
}
