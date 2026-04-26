# Design Document: User Service Enhancement

## Overview

This document describes the technical design for bringing the `user-service` to production readiness. The service is a Spring Boot 3.2 / Java 21 microservice backed by PostgreSQL. The enhancement closes eleven requirement areas: URL prefix alignment, input validation, standardised error responses, dedicated auth endpoints, refresh-token lifecycle, password change, extended profile fields, paginated user list, email-uniqueness on update, Spring Security filter chain, and DataInitializer alignment.

The design follows the existing package structure (`controller`, `service`, `entity`, `dto`, `repository`, `config`) and introduces two new packages: `security` (for the JWT filter and `UserDetailsService`) and `exception` (for the global exception handler and error DTOs).

---

## Architecture

```mermaid
graph TD
    Client -->|HTTP| SecurityFilter[JwtAuthenticationFilter]
    SecurityFilter -->|valid / public| UserController[UserController\n/api/users]
    SecurityFilter -->|valid / public| AuthController[AuthController\n/api/auth]
    UserController --> IUserService
    AuthController --> IAuthService
    IUserService --> UserServiceImpl
    IAuthService --> AuthServiceImpl
    UserServiceImpl --> UserRepository
    AuthServiceImpl --> UserRepository
    AuthServiceImpl --> RefreshTokenRepository
    AuthServiceImpl --> TokenBlacklistService
    TokenBlacklistService -->|in-memory Set| BlacklistStore
    UserRepository --> PostgreSQL[(PostgreSQL\nusers)]
    RefreshTokenRepository --> PostgreSQL2[(PostgreSQL\nrefresh_tokens)]
    GlobalExceptionHandler -->|@RestControllerAdvice| ErrorResponse
```

Key design decisions:
- **Token blacklist** is kept in-memory (`ConcurrentHashSet`) for simplicity; a Redis store can replace it later without changing the interface.
- **Refresh tokens** are persisted in a dedicated `refresh_tokens` table so they can be revoked individually.
- **Spring Security** is added as a full dependency; the existing `PasswordConfig` bean is retained and the new `SecurityConfig` replaces the absent filter chain.
- **Validation** uses `spring-boot-starter-validation` (Bean Validation 3.0 / Hibernate Validator); constraint annotations are placed on DTO classes.

---

## Components and Interfaces

### New / Modified Controllers

**`AuthController`** — `@RequestMapping("/api/auth")`
- `POST /login` → `AuthService.login(LoginRequest)`
- `POST /refresh` → `AuthService.refresh(RefreshRequest)`
- `POST /logout` → `AuthService.logout(String bearerToken)`
- `GET  /validate` → `AuthService.validate(String bearerToken)`
- `POST /change-password` → `AuthService.changePassword(ChangePasswordRequest, String bearerToken)`

**`UserController`** — `@RequestMapping("/api/users")`  
Mapping changed from `/users` to `/api/users`. All existing endpoints retained; `getAllUsers` upgraded to return `Page<UserResponse>`.

### New Service Interfaces

```java
public interface IAuthService {
    LoginResponse login(LoginRequest request);
    TokenPairResponse refresh(String refreshToken);
    void logout(String accessToken);
    ValidateResponse validate(String accessToken);
    void changePassword(ChangePasswordRequest request, Long userId);
}

public interface ITokenBlacklistService {
    void blacklist(String token);
    boolean isBlacklisted(String token);
}
```

### Modified `IUserService`

```java
Page<UserResponse> getAllUsers(Pageable pageable);
UserResponse createUser(UserRequest request);
UserResponse getUserById(Long id);
UserResponse updateUser(Long id, UserUpdateRequest request);
boolean deleteUser(Long id);
```

### Security Components

**`JwtAuthenticationFilter`** extends `OncePerRequestFilter`  
Extracts `Bearer` token from `Authorization` header, validates it, checks blacklist, sets `SecurityContextHolder`.

**`SecurityConfig`** — `@Configuration @EnableWebSecurity`  
Configures `HttpSecurity`: stateless session, CSRF disabled, permit-list for public endpoints, role-based rules for admin endpoints.

**`CustomUserDetailsService`** implements `UserDetailsService`  
Loads `UserDetails` by username for Spring Security integration.

---

## Data Models

### `User` entity (modified)

```java
@Entity @Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true) private String username;
    @Column(nullable = false, unique = true) private String email;
    @Column(nullable = false)               private String password;
    @Column(nullable = false)               private String firstName;
    @Column(nullable = false)               private String lastName;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)               private Role role;
    @Column(length = 20)                    private String phoneNumber;      // NEW
    @Column(length = 500)                   private String profilePictureUrl; // NEW
    @Column(updatable = false)              private LocalDateTime createdAt;
                                            private LocalDateTime updatedAt;
}
```

### `Role` enum (new)

```java
public enum Role { ADMIN, CUSTOMER, MANAGER, GUEST }
```

### `RefreshToken` entity (new)

```java
@Entity @Table(name = "refresh_tokens")
public class RefreshToken {
    @Id @GeneratedValue(strategy = IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true) private String token;   // UUID
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id")            private User user;
    @Column(nullable = false)                private LocalDateTime expiresAt;
    @Column(nullable = false)                private boolean revoked;
}
```

### DTOs

| DTO | Purpose |
|-----|---------|
| `UserRequest` | POST /api/users — with `@NotBlank`, `@Email`, `@Size(min=8)` |
| `UserUpdateRequest` | PUT /api/users/{id} — optional fields, same constraints when present |
| `UserResponse` | Read model returned to clients (no password) |
| `LoginRequest` | `@NotBlank` on email and password |
| `LoginResponse` | accessToken, refreshToken, userId, username, email, role |
| `RefreshRequest` | refreshToken string |
| `TokenPairResponse` | new accessToken + refreshToken |
| `ValidateResponse` | userId, username, email, role |
| `ChangePasswordRequest` | `@NotBlank` currentPassword, `@NotBlank @Size(min=8)` newPassword |
| `ErrorResponse` | timestamp, status, error, message, path, fieldErrors? |

### `ErrorResponse` schema

```json
{
  "timestamp": "2025-01-01T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/users",
  "fieldErrors": [
    { "field": "email", "message": "must be a well-formed email address" }
  ]
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Validation rejects all short passwords

*For any* string of length 0–7 submitted as `password` in a registration or update request, the service SHALL reject the request with HTTP 400 and include a `fieldErrors` entry for the `password` field.

**Validates: Requirements 2.3, 2.6, 2.8**

---

### Property 2: Validation rejects all malformed email addresses

*For any* string that does not conform to RFC 5321 email format submitted as `email` in a registration or update request, the service SHALL reject the request with HTTP 400 and include a `fieldErrors` entry for the `email` field.

**Validates: Requirements 2.2, 2.5**

---

### Property 3: Error responses always conform to the ErrorResponse schema

*For any* request that causes a 4xx or 5xx response, the response body SHALL contain all required fields: `timestamp`, `status`, `error`, `message`, and `path`.

**Validates: Requirements 3.1, 3.3**

---

### Property 4: Login round-trip returns correct user claims

*For any* registered user, a login request with that user's correct credentials SHALL return an `accessToken` and `refreshToken`, and the response body SHALL contain the user's `id`, `username`, `email`, and `role` matching the stored values.

**Validates: Requirements 4.1**

---

### Property 5: Token validation round-trip preserves claims

*For any* access token issued by the service, a call to `GET /api/auth/validate` with that token SHALL return `userId`, `username`, `email`, and `role` values that match the claims embedded in the token at issuance.

**Validates: Requirements 4.6**

---

### Property 6: Refresh token rotation — old token is revoked after use

*For any* valid refresh token, calling `POST /api/auth/refresh` SHALL mark the old token as `revoked = true` in the database before returning the new token pair.

**Validates: Requirements 4.3, 5.2**

---

### Property 7: Expired or revoked refresh tokens are always rejected

*For any* refresh token whose `expiresAt` is in the past or whose `revoked` flag is `true`, a call to `POST /api/auth/refresh` SHALL return HTTP 401.

**Validates: Requirements 5.5, 4.4**

---

### Property 8: User deletion revokes all associated refresh tokens

*For any* user with any number of active refresh tokens, deleting that user SHALL set `revoked = true` on every refresh token associated with that `userId`.

**Validates: Requirements 5.3**

---

### Property 9: Password change revokes all existing refresh tokens

*For any* user with any number of active sessions (refresh tokens), a successful password change SHALL revoke all of that user's refresh tokens, and subsequent refresh attempts with those tokens SHALL return HTTP 401.

**Validates: Requirements 6.1, 6.4**

---

### Property 10: Phone number and profile picture URL round-trip

*For any* user updated with a valid `phoneNumber` and/or `profilePictureUrl`, a subsequent `GET /api/users/{id}` SHALL return those exact values in the response body.

**Validates: Requirements 7.1, 7.2, 7.5**

---

### Property 11: Phone number validation accepts valid patterns and rejects invalid ones

*For any* string matching `^\+?[0-9\s\-\(\)]{7,20}$`, the validator SHALL accept it; for any string not matching that pattern, the validator SHALL reject it with HTTP 400.

**Validates: Requirements 7.3**

---

### Property 12: Paginated user list always returns correct structure and bounded size

*For any* `page` and `size` query parameters (including `size > 100`), the response SHALL contain `content`, `totalElements`, `totalPages`, `page`, and `size` fields, and the `content` array length SHALL never exceed `min(size, 100)`.

**Validates: Requirements 8.1, 8.2, 8.5**

---

### Property 13: Protected endpoints reject requests without a valid token

*For any* protected `/api/**` endpoint, a request without a valid, non-blacklisted `Authorization: Bearer` token SHALL receive HTTP 401.

**Validates: Requirements 10.2, 10.3, 10.4**

---

### Property 14: Non-ADMIN roles are forbidden from admin-only endpoints

*For any* access token whose `role` claim is `CUSTOMER`, `MANAGER`, or `GUEST`, requests to `DELETE /api/users/{id}` and `GET /api/users` SHALL return HTTP 403.

**Validates: Requirements 10.5**

---

### Property 15: DataInitializer is idempotent

*For any* non-empty `users` table, running the `DataInitializer` SHALL leave the row count and all existing row values unchanged.

**Validates: Requirements 11.4**

---

## Error Handling

### Global Exception Handler (`@RestControllerAdvice`)

| Exception | HTTP Status | Notes |
|-----------|-------------|-------|
| `MethodArgumentNotValidException` | 400 | Populates `fieldErrors` array |
| `ConstraintViolationException` | 400 | Path/query param violations |
| `UsernameNotFoundException` | 404 | User not found |
| `EntityNotFoundException` | 404 | Generic not-found |
| `DuplicateResourceException` (custom) | 409 | Username/email conflict |
| `BadCredentialsException` | 401 | Login failure (generic message) |
| `InvalidTokenException` (custom) | 401 | Expired, malformed, or blacklisted token |
| `AccessDeniedException` | 403 | Insufficient role |
| `Exception` (catch-all) | 500 | No stack trace in body |

All handlers produce an `ErrorResponse` with `timestamp`, `status`, `error`, `message`, and `path`. The 400 handler additionally populates `fieldErrors`.

### Security Error Handling

Spring Security's `AuthenticationEntryPoint` and `AccessDeniedHandler` are customised to return `ErrorResponse` JSON instead of the default HTML pages, ensuring consistent error format for 401 and 403 responses from the filter chain.

---

## Testing Strategy

### Dependencies to add to `pom.xml`

```xml
<!-- Full Spring Security (replaces spring-security-crypto only) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<!-- Bean Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
<!-- Property-based testing -->
<dependency>
    <groupId>net.jqwik</groupId>
    <artifactId>jqwik</artifactId>
    <version>1.8.4</version>
    <scope>test</scope>
</dependency>
<!-- Spring Security Test -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

### Unit Tests (example-based)

- `AuthServiceImplTest` — login with invalid credentials returns 401 without field discrimination; logout blacklists token; change-password with wrong current password returns 400 with correct message; non-existent user returns 404.
- `UserServiceImplTest` — duplicate username/email on create returns 409; same-email update returns 200; different-user email update returns 409.
- `DataInitializerTest` — seeds one user per role when table empty; skips when table non-empty; seeded users have null phoneNumber and profilePictureUrl; refresh_tokens table empty after init.
- `SecurityConfigTest` — public endpoints accessible without token; missing header returns 401; blacklisted token returns 401.

### Property-Based Tests (jqwik)

Each property test runs a minimum of 100 iterations. Each test is tagged with a comment referencing the design property.

**Feature: user-service-enhancement, Property 1: Validation rejects all short passwords**
- Arbitraries: `Arbitraries.strings().ofMaxLength(7)` for password field
- Assert: MockMvc response status is 400, body contains `fieldErrors` with `field = "password"`

**Feature: user-service-enhancement, Property 2: Validation rejects all malformed email addresses**
- Arbitraries: generate strings without `@`, with double `@`, with no domain, etc.
- Assert: 400 with `fieldErrors` containing `field = "email"`

**Feature: user-service-enhancement, Property 3: Error responses always conform to ErrorResponse schema**
- Arbitraries: generate various invalid request bodies
- Assert: response body always has `timestamp`, `status`, `error`, `message`, `path`

**Feature: user-service-enhancement, Property 4: Login round-trip returns correct user claims**
- Arbitraries: generate random valid `username`, `email`, `password` (≥8 chars), `role`
- Assert: login response contains matching `userId`, `username`, `email`, `role`

**Feature: user-service-enhancement, Property 5: Token validation round-trip preserves claims**
- Arbitraries: generate random user data, issue token via `JwtTokenProvider`
- Assert: `validate` endpoint returns matching claims

**Feature: user-service-enhancement, Property 6: Refresh token rotation — old token revoked**
- Arbitraries: generate random users, issue refresh tokens
- Assert: after refresh, old token has `revoked = true` in DB

**Feature: user-service-enhancement, Property 7: Expired or revoked refresh tokens rejected**
- Arbitraries: generate tokens with past `expiresAt` or `revoked = true`
- Assert: refresh endpoint returns 401

**Feature: user-service-enhancement, Property 8: User deletion revokes all refresh tokens**
- Arbitraries: generate users with 1–10 refresh tokens
- Assert: after delete, all tokens have `revoked = true`

**Feature: user-service-enhancement, Property 9: Password change revokes all refresh tokens**
- Arbitraries: generate users with 1–5 active sessions
- Assert: after change-password, all tokens revoked; subsequent refresh returns 401

**Feature: user-service-enhancement, Property 10: Phone/profile URL round-trip**
- Arbitraries: generate valid phone numbers and HTTPS URLs
- Assert: GET response contains exact stored values

**Feature: user-service-enhancement, Property 11: Phone number validation**
- Arbitraries: generate strings matching and not matching `^\+?[0-9\s\-\(\)]{7,20}$`
- Assert: matching → 200, non-matching → 400

**Feature: user-service-enhancement, Property 12: Paginated list structure and size cap**
- Arbitraries: generate `page` ∈ [0, 10], `size` ∈ [1, 500]
- Assert: response has required fields; `content.size() ≤ min(size, 100)`

**Feature: user-service-enhancement, Property 13: Protected endpoints reject invalid tokens**
- Arbitraries: generate random protected endpoint paths, random invalid/missing tokens
- Assert: response status is 401

**Feature: user-service-enhancement, Property 14: Non-ADMIN roles forbidden from admin endpoints**
- Arbitraries: generate tokens with roles CUSTOMER, MANAGER, GUEST
- Assert: DELETE /api/users/{id} and GET /api/users return 403

**Feature: user-service-enhancement, Property 15: DataInitializer idempotency**
- Arbitraries: generate 1–20 pre-existing users
- Assert: after DataInitializer.run(), row count unchanged and all original rows intact
