#!/bin/bash
# Kubernetes Deployment Script

echo "Building Docker images..."
docker compose build

echo "Loading images into Kubernetes..."
# For Docker Desktop with Kubernetes
kind load docker-image event-sourcing-saga-multiservice-order-service:latest --name docker-desktop 2>/dev/null || true
kind load docker-image event-sourcing-saga-multiservice-payment-service:latest --name docker-desktop 2>/dev/null || true
kind load docker-image event-sourcing-saga-multiservice-inventory-service:latest --name docker-desktop 2>/dev/null || true

echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/kafka.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/inventory-service.yaml

echo "Waiting for services to be ready..."
kubectl -n event-sourcing wait --for=condition=ready pod -l app=kafka --timeout=120s 2>/dev/null || true
kubectl -n event-sourcing wait --for=condition=ready pod -l app=order-service --timeout=120s 2>/dev/null || true
kubectl -n event-sourcing wait --for=condition=ready pod -l app=payment-service --timeout=120s 2>/dev/null || true
kubectl -n event-sourcing wait --for=condition=ready pod -l app=inventory-service --timeout=120s 2>/dev/null || true

echo "Services deployed to Kubernetes!"
echo ""
echo "Check status with:"
echo "  kubectl -n event-sourcing get pods"
echo "  kubectl -n event-sourcing get svc"
echo ""
echo "View logs with:"
echo "  kubectl -n event-sourcing logs -f deployment/order-service"
echo "  kubectl -n event-sourcing logs -f deployment/payment-service"
echo "  kubectl -n event-sourcing logs -f deployment/inventory-service"
