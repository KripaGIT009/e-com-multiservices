# MyIndianStore E-Commerce Platform

A full-stack e-commerce and marketplace platform for India. A unified Angular frontend
with an Express BFF (Backend For Frontend) serves both customer and admin experiences
on a single port, backed by Java 21 / Spring Boot microservices.

## Documentation

| | |
|---|---|
| [docs/](docs/) | Architecture, API and event contracts, flows, ADRs |
| [CLAUDE.md](CLAUDE.md) | Conventions and architectural rules — read before changing code |
| [CODE_REVIEW.md](CODE_REVIEW.md) | Security and correctness audit; **Appendix A lists what is still open** |

**Eleven of twenty-six planned services exist.** The
[service catalog](docs/service-catalog.md) marks each one `built`, `partial` or
`planned` — check it before assuming a capability is present.

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
- Maven 3.9+
- Docker & Docker Compose
- npm 9+

### Configuration

```bash
cp .env.example .env
```

Generate the two secrets it asks for. The BFF deliberately refuses to start without
them — there is no fallback default.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"  # ADMIN_JWT_SECRET
```

### Development (Frontend Only)

```bash
cd unified-ui
npm install
npm start
```

The Angular dev server starts at http://localhost:4200 with proxy to backend services.

### Full Stack (Docker)

Java services are containerised from a prebuilt jar (`COPY target/*.jar`, no Maven
stage), so package them first — otherwise the image ships whatever was last built:

```bash
for s in */; do [ -f "$s/pom.xml" ] && (cd "$s" && mvn -DskipTests package); done
docker compose up --build
```

This starts all microservices, databases, Kafka, and the unified-ui on port 4200.
First boot takes several minutes. Seeded accounts and per-service ports are in
[docs/local-development.md](docs/local-development.md).

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
- Angular 18 (lazy-loaded feature modules)
- SCSS with CSS custom properties (design tokens in `shared/styles/_variables.scss`)
- Poppins / Noto Sans
- Responsive — single-column below 768px; no horizontal overflow at 390px
- Accessibility: ARIA landmarks and live regions are in place; **not yet audited
  against WCAG 2.1**

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
