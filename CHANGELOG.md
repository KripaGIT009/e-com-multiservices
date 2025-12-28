# Changelog

## v1.1.0 (2025-12-27)

- Upgrade all services to Java 21 (LTS)
- Align Docker base images to Eclipse Temurin 21 JRE
- Bump service artifact versions to `1.1.0`
- Pin Kubernetes deployment images to `:1.1.0`
- Add explicit image tags in `docker-compose.yml`
- Inventory Service:
  - Add `spring-boot-starter-actuator` and enable health probes
  - Configure Kafka `JsonDeserializer` for `SagaEvent`
- Order/Payment Services:
  - Point datasource URLs to in-stack Postgres services
  - Point Kafka bootstrap to `kafka:9092`
  - Normalize `server.port` to `8080`
- Add Postgres services with health checks to Compose and set `depends_on` with health conditions
- Remove obsolete `version` key from Compose per Docker warning
