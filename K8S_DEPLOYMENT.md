# Event Sourcing Saga Multi-Service - Kubernetes Deployment Guide

## Prerequisites

### Option 1: Docker Desktop with Kubernetes (Recommended for Windows)
1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Enable Kubernetes in Docker Desktop:
   - Open Docker Desktop Settings
   - Navigate to Resources → Kubernetes
   - Check "Enable Kubernetes"
   - Click "Apply & Restart"
3. Wait for Kubernetes to be ready (5-10 minutes)
4. Verify with: `kubectl cluster-info`

### Option 2: Minikube (Alternative)
```powershell
# Install Minikube
choco install minikube

# Start Minikube
minikube start --driver=docker

# Verify
kubectl cluster-info
```

### Option 3: Kind (Kubernetes in Docker)
```powershell
# Install Kind
choco install kind

# Create cluster
kind create cluster

# Verify
kubectl cluster-info
```

## Building the Services

Services are pre-built as JAR files (target/ directories exist). The Dockerfiles simply copy the JAR files into images.

To rebuild the JAR files if needed:
```powershell
cd order-service
mvn clean package -DskipTests
cd ../payment-service
mvn clean package -DskipTests
cd ../inventory-service
mvn clean package -DskipTests
```

## Building Docker Images

```powershell
docker compose build
```

This creates three images:
- `event-sourcing-saga-multiservice-order-service:latest`
- `event-sourcing-saga-multiservice-payment-service:latest`
- `event-sourcing-saga-multiservice-inventory-service:latest`

## Deploying to Kubernetes

### Step 1: Build Images (if not already done)
```powershell
docker compose build
```

### Step 2: Run Deployment Script
```powershell
.\deploy-k8s.ps1
```

This will:
- Apply Kubernetes manifests
- Create the `event-sourcing` namespace
- Deploy Kafka and all services
- Wait for services to be ready

### Step 3: Verify Deployment
```powershell
kubectl -n event-sourcing get pods
kubectl -n event-sourcing get svc
```

Expected output:
```
NAME                                  READY   STATUS    RESTARTS   AGE
kafka-0                               1/1     Running   0          2m
order-service-xxxxx-xxxxx             1/1     Running   0          1m
payment-service-xxxxx-xxxxx           1/1     Running   0          1m
inventory-service-xxxxx-xxxxx         1/1     Running   0          1m
```

## Accessing Services

Services are deployed within the Kubernetes cluster network.

### Port Forwarding (to access from host)
```powershell
# Order Service (port 8001)
kubectl -n event-sourcing port-forward svc/order-service 8001:8080

# Payment Service (port 8002)
kubectl -n event-sourcing port-forward svc/payment-service 8002:8080

# Inventory Service (port 8003)
kubectl -n event-sourcing port-forward svc/inventory-service 8003:8080
```

Then access at `http://localhost:8001`, etc.

## Viewing Logs

```powershell
# Kafka logs
kubectl -n event-sourcing logs -f kafka-0

# Order Service logs
kubectl -n event-sourcing logs -f deployment/order-service

# Payment Service logs
kubectl -n event-sourcing logs -f deployment/payment-service

# Inventory Service logs
kubectl -n event-sourcing logs -f deployment/inventory-service
```

## Cleaning Up

Remove all deployments:
```powershell
kubectl delete namespace event-sourcing
```

## Troubleshooting

### Pods stuck in Pending
```powershell
kubectl -n event-sourcing describe pod <pod-name>
```

### Image pull errors
Make sure images are built:
```powershell
docker images | Select-String "event-sourcing"
```

### Kafka not starting
Check Kafka logs:
```powershell
kubectl -n event-sourcing logs kafka-0
```

### Services cannot connect to Kafka
Ensure `SPRING_KAFKA_BOOTSTRAP_SERVERS` environment variable is set to `kafka:9092`

## Manifest Files

- `k8s/namespace.yaml` - Creates the event-sourcing namespace
- `k8s/kafka.yaml` - Kafka StatefulSet with ConfigMap and Service
- `k8s/order-service.yaml` - Order Service Deployment and Service
- `k8s/payment-service.yaml` - Payment Service Deployment and Service
- `k8s/inventory-service.yaml` - Inventory Service Deployment and Service

Each service includes:
- Service for internal cluster communication
- Deployment with liveness and readiness probes
- Resource requests and limits
- Environment variables for Kafka connectivity
