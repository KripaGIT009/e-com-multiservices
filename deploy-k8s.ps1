# Kubernetes Deployment Script for Windows

Write-Host "Building Docker images..." -ForegroundColor Green
docker compose build

Write-Host "Applying Kubernetes manifests..." -ForegroundColor Green
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/kafka.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/inventory-service.yaml

Write-Host "Waiting for Kafka to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
kubectl -n event-sourcing wait --for=condition=ready pod -l app=kafka --timeout=300s

Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
kubectl -n event-sourcing wait --for=condition=ready pod -l app=order-service --timeout=120s
kubectl -n event-sourcing wait --for=condition=ready pod -l app=payment-service --timeout=120s
kubectl -n event-sourcing wait --for=condition=ready pod -l app=inventory-service --timeout=120s

Write-Host "Services deployed to Kubernetes!" -ForegroundColor Green
Write-Host ""
Write-Host "Check status with:" -ForegroundColor Cyan
Write-Host "  kubectl -n event-sourcing get pods"
Write-Host "  kubectl -n event-sourcing get svc"
Write-Host ""
Write-Host "View logs with:" -ForegroundColor Cyan
Write-Host "  kubectl -n event-sourcing logs -f deployment/order-service"
Write-Host "  kubectl -n event-sourcing logs -f deployment/payment-service"
Write-Host "  kubectl -n event-sourcing logs -f deployment/inventory-service"
