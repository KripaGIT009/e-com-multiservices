# Enable Kubernetes in Docker Desktop and Deploy

Write-Host "Checking Docker Desktop..." -ForegroundColor Green

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "Docker is running." -ForegroundColor Green

# Check if Kubernetes is enabled
Write-Host "Checking Kubernetes..." -ForegroundColor Green
try {
    kubectl cluster-info | Out-Null
    Write-Host "Kubernetes is already enabled." -ForegroundColor Green
} catch {
    Write-Host "Kubernetes is not enabled. Please:" -ForegroundColor Yellow
    Write-Host "1. Open Docker Desktop Settings"
    Write-Host "2. Go to Resources > Kubernetes"
    Write-Host "3. Check 'Enable Kubernetes'"
    Write-Host "4. Click 'Apply & Restart'"
    Write-Host "5. Wait 5-10 minutes for Kubernetes to start"
    Write-Host "6. Run this script again"
    exit 1
}

Write-Host ""
Write-Host "Prerequisites met! Proceeding with deployment..." -ForegroundColor Green
Write-Host ""

# Build images
Write-Host "Building Docker images..." -ForegroundColor Green
docker compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Images built successfully!" -ForegroundColor Green
Write-Host ""

# Deploy to Kubernetes
Write-Host "Deploying to Kubernetes..." -ForegroundColor Green
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/kafka.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/inventory-service.yaml

Write-Host ""
Write-Host "Waiting for Kafka to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "Waiting for Kafka pod to be ready..." -ForegroundColor Yellow
kubectl -n event-sourcing wait --for=condition=ready pod -l app=kafka --timeout=300s

Write-Host "Waiting for service pods to be ready..." -ForegroundColor Yellow
try {
    kubectl -n event-sourcing wait --for=condition=ready pod -l app=order-service --timeout=120s
} catch {
    Write-Host "Order service did not become ready within timeout." -ForegroundColor Yellow
}
try {
    kubectl -n event-sourcing wait --for=condition=ready pod -l app=payment-service --timeout=120s
} catch {
    Write-Host "Payment service did not become ready within timeout." -ForegroundColor Yellow
}
try {
    kubectl -n event-sourcing wait --for=condition=ready pod -l app=inventory-service --timeout=120s
} catch {
    Write-Host "Inventory service did not become ready within timeout." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Check pod status:" -ForegroundColor Cyan
Write-Host "  kubectl -n event-sourcing get pods"
Write-Host ""
Write-Host "View service details:" -ForegroundColor Cyan
Write-Host "  kubectl -n event-sourcing get svc"
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "  kubectl -n event-sourcing logs -f deployment/order-service"
Write-Host "  kubectl -n event-sourcing logs -f deployment/payment-service"
Write-Host "  kubectl -n event-sourcing logs -f deployment/inventory-service"
Write-Host "  kubectl -n event-sourcing logs -f kafka-0"
Write-Host ""
Write-Host "Port forward to access services:" -ForegroundColor Cyan
Write-Host "  kubectl -n event-sourcing port-forward svc/order-service 8001:8080"
Write-Host "  kubectl -n event-sourcing port-forward svc/payment-service 8002:8080"
Write-Host "  kubectl -n event-sourcing port-forward svc/inventory-service 8003:8080"
