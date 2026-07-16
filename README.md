# MyIndianStore E-Commerce Platform

A full-stack e-commerce platform built with a microservices architecture. The system features a unified Angular frontend with an Express BFF (Backend For Frontend) serving both customer and admin experiences on a single port.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    unified-ui (:4200)                     │
│  ┌────────────────────┐  ┌───────────────────────────┐  │
│  │   Customer SPA     │  │       Admin SPA           │  │
│  │  (Angular 18)      │  │     (Angular 18)          │  │
│  └────────────────────┘  └───────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Express BFF (server.js)                │   │
│  │       JWT Auth · Proxy · Role Routing            │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            │  /api/*
     ┌──────────────────────┼──────────────────────────┐
     │         Backend Microservices (Java/Spring)      │
     ├──────────────────────────────────────────────────┤
     │  user-service      │  item-service              │
     │  cart-service      │  checkout-service          │
     │  order-service     │  payment-service           │
     │  inventory-service │  return-service            │
     │  logistics-service │  notification-service      │
     │  admin-service     │                            │
     └─────────────────────────────────────────────────┘
```

## Service Ports

| Service              | Port  | Description                    |
|---------------------|-------|--------------------------------|
| unified-ui          | 4200  | Customer & Admin SPA + BFF     |
| order-service       | 8001  | Order management (event-sourced)|
| payment-service     | 8002  | Payment processing             |
| inventory-service   | 8003  | Stock management               |
| user-service        | 8004  | User auth & profiles           |
| item-service        | 8005  | Product catalog                |
| cart-service        | 8006  | Shopping cart                   |
| checkout-service    | 8007  | Checkout orchestration         |
| return-service      | 8008  | Return/refund management       |
| logistics-service   | 8009  | Shipping & logistics           |
| notification-service| 8010  | Notifications                  |
| admin-service       | 8011  | Admin operations               |
| Kafka               | 9092  | Event streaming                |
| Kafka UI            | 8080  | Kafka monitoring               |
| pgAdmin             | 5050  | Database administration        |

## Quick Start

### Prerequisites

- Node.js 20+
- Java 21+
- Docker & Docker Compose
- npm 9+

### Development (Frontend Only)

```bash
cd unified-ui
npm install
npm start
```

The Angular dev server starts at http://localhost:4200 with proxy to backend services.

### Full Stack (Docker)

```bash
docker compose up --build
```

This starts all microservices, databases, Kafka, and the unified-ui on port 4200.

### Build for Production

```bash
cd unified-ui
npm run build -- --configuration production
node server.js
```

## Project Structure

```
myindiansstore/
├── unified-ui/           # Angular 18 SPA + Express BFF
│   ├── src/app/
│   │   ├── core/         # Auth, guards, interceptors, services
│   │   ├── shared/       # Reusable components, styles
│   │   └── features/     # Lazy-loaded feature modules
│   │       ├── auth/       # Login, register
│   │       ├── storefront/ # Home, products, cart
│   │       ├── checkout/   # Stepper, confirmation
│   │       ├── account/    # Profile, orders, returns
│   │       └── admin/      # Dashboard, management
│   ├── server.js         # Express BFF
│   ├── Dockerfile        # Multi-stage build
│   └── nginx.conf        # Static asset configuration
├── order-service/        # Spring Boot microservice
├── payment-service/      # Spring Boot microservice
├── inventory-service/    # Spring Boot microservice
├── user-service/         # Spring Boot microservice
├── item-service/         # Spring Boot microservice
├── cart-service/         # Spring Boot microservice
├── checkout-service/     # Spring Boot microservice
├── return-service/       # Spring Boot microservice
├── logistics-service/    # Spring Boot microservice
├── notification-service/ # Spring Boot microservice
├── admin-service/        # Spring Boot microservice
└── docker-compose.yml    # Full stack orchestration
```

## Tech Stack

### Frontend
- Angular 18 (standalone-ready, lazy-loaded modules)
- SCSS with CSS custom properties
- Poppins font family
- Responsive design (mobile-first)
- Accessible (WCAG 2.1 compliant patterns)

### Backend
- Java 21 + Spring Boot 3
- Event Sourcing with Apache Kafka
- PostgreSQL databases (per service)
- Redis (session/cache for user-service)

### Infrastructure
- Docker + Docker Compose
- Express.js BFF with JWT authentication
- Nginx for static asset optimization

## Theme

- Primary: `#FF6B35` (Saffron/Orange)
- Secondary: `#2D6A4F` (Deep Green)
- Background: `#FFF8F0` (Cream)
- Font: Poppins, Noto Sans (fallback)

## License

Private — All rights reserved.
