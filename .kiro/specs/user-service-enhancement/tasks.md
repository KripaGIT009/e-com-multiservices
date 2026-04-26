# Tasks

## Task List

- [x] 1. Add missing Maven dependencies
  - [x] 1.1 Add `spring-boot-starter-security` to pom.xml
  - [x] 1.2 Add `spring-boot-starter-validation` to pom.xml
  - [x] 1.3 Add `jqwik` 1.8.4 (test scope) to pom.xml
  - [x] 1.4 Add `spring-security-test` (test scope) to pom.xml

- [x] 2. Introduce `Role` enum and update `User` entity
  - [x] 2.1 Create `com.example.entity.Role` enum with values `ADMIN`, `CUSTOMER`, `MANAGER`, `GUEST`
  - [x] 2.2 Change `User.role` field from `String` to `Role` with `@Enumerated(EnumType.STRING)`
  - [x] 2.3 Add `phoneNumber` field (`@Column(length = 20)`) to `User`
  - [x] 2.4 Add `profilePictureUrl` field (`@Column(length = 500)`) to `User`
  - [x] 2.5 Update all `User` constructors and getters/setters for the new fields and `Role` type

- [x] 3. Create `RefreshToken` entity and repository
  - [x] 3.1 Create `com.example.entity.RefreshToken` with fields: `id`, `token` (UUID string, unique), `user` (ManyToOne), `expiresAt`, `revoked`
  - [x] 3.2 Create `com.example.repository.RefreshTokenRepository` extending `JpaRepository<RefreshToken, Long>` with methods: `findByToken`, `findAllByUser`, `revokeAllByUser`

- [x] 4. Create DTOs
  - [x] 4.1 Update `UserRequest` — add `@NotBlank` on required fields, `@Email` on email, `@Size(min=8)` on password, add `phoneNumber` and `profilePictureUrl` fields
  - [x] 4.2 Create `UserUpdateRequest` — same fields as `UserRequest` but all optional; same constraints when present
  - [x] 4.3 Create `UserResponse` — all user fields except password; includes `phoneNumber` and `profilePictureUrl`
  - [x] 4.4 Update `LoginRequest` — add `@NotBlank` on `email` and `password`
  - [x] 4.5 Update `LoginResponse` — add `refreshToken` field alongside existing `token` (accessToken)
  - [x] 4.6 Create `RefreshRequest` — single `@NotBlank String refreshToken` field
  - [x] 4.7 Create `TokenPairResponse` — `accessToken` and `refreshToken` fields
  - [x] 4.8 Create `ValidateResponse` — `userId`, `username`, `email`, `role` fields
  - [x] 4.9 Create `ChangePasswordRequest` — `@NotBlank String currentPassword`, `@NotBlank @Size(min=8) String newPassword`
  - [x] 4.10 Create `ErrorResponse` — `timestamp`, `status`, `error`, `message`, `path`, `List<FieldError> fieldErrors` (nullable)
  - [x] 4.11 Create `ErrorResponse.FieldError` inner/nested class with `field` and `message`

- [x] 5. Update `JwtTokenProvider` and create `TokenBlacklistService`
  - [x] 5.1 Move `JwtTokenProvider` from `config` package to `security` package
  - [x] 5.2 Add `extractUserId`, `extractEmail`, `extractRole` methods to `JwtTokenProvider`
  - [x] 5.3 Fix deprecated `SignatureAlgorithm.HS512` usage — use `Jwts.SIG.HS512` (jjwt 0.12.x API)
  - [x] 5.4 Create `com.example.security.TokenBlacklistService` with in-memory `ConcurrentHashSet`; implement `blacklist(String token)` and `isBlacklisted(String token)`

- [x] 6. Create Spring Security configuration
  - [x] 6.1 Create `com.example.security.CustomUserDetailsService` implementing `UserDetailsService`; loads user by username from `UserRepository`
  - [x] 6.2 Create `com.example.security.JwtAuthenticationFilter` extending `OncePerRequestFilter`; extracts Bearer token, validates, checks blacklist, sets `SecurityContextHolder`
  - [x] 6.3 Create `com.example.config.SecurityConfig` (`@Configuration @EnableWebSecurity`); configure stateless session, CSRF disabled, permit `POST /api/auth/login`, `POST /api/users`, `GET /api/auth/validate`; require ADMIN for `DELETE /api/users/**` and `GET /api/users`; authenticate all other `/api/**`
  - [x] 6.4 Add custom `AuthenticationEntryPoint` returning `ErrorResponse` JSON for 401 responses
  - [x] 6.5 Add custom `AccessDeniedHandler` returning `ErrorResponse` JSON for 403 responses
  - [x] 6.6 Remove `PasswordConfig` standalone bean — move `PasswordEncoder` bean into `SecurityConfig`

- [x] 7. Create global exception handler
  - [x] 7.1 Create `com.example.exception.DuplicateResourceException` (RuntimeException subclass)
  - [x] 7.2 Create `com.example.exception.InvalidTokenException` (RuntimeException subclass)
  - [x] 7.3 Create `com.example.exception.GlobalExceptionHandler` (`@RestControllerAdvice`) handling: `MethodArgumentNotValidException` → 400 with fieldErrors; `DuplicateResourceException` → 409; `InvalidTokenException` → 401; `EntityNotFoundException` / `NoSuchElementException` → 404; `AccessDeniedException` → 403; `Exception` catch-all → 500 (no stack trace)

- [x] 8. Create `IAuthService` and `AuthServiceImpl`
  - [x] 8.1 Create `com.example.service.IAuthService` interface with methods: `login`, `refresh`, `logout`, `validate`, `changePassword`
  - [x] 8.2 Implement `AuthServiceImpl`:
    - `login`: authenticate via `PasswordEncoder`, generate access + refresh tokens, persist `RefreshToken`, return `LoginResponse`
    - `refresh`: look up token, check not revoked/expired, revoke old token, issue new pair, return `TokenPairResponse`
    - `logout`: blacklist access token, revoke associated refresh token
    - `validate`: parse and validate JWT, check blacklist, return `ValidateResponse`
    - `changePassword`: verify current password, encode and save new password, revoke all user refresh tokens

- [x] 9. Update `IUserService` and `UserServiceImpl`
  - [x] 9.1 Update `IUserService` — replace `List<User> getAllUsers()` with `Page<UserResponse> getAllUsers(Pageable pageable)`; change return types to use `UserResponse`; add email-uniqueness check on update
  - [x] 9.2 Update `UserServiceImpl.createUser` — check username and email uniqueness, throw `DuplicateResourceException` on conflict
  - [x] 9.3 Update `UserServiceImpl.updateUser` — check email uniqueness against other users, throw `DuplicateResourceException` on conflict; map to `UserResponse`
  - [x] 9.4 Update `UserServiceImpl.getAllUsers` — accept `Pageable`, cap `size` at 100, return `Page<UserResponse>`
  - [x] 9.5 Update `UserServiceImpl.deleteUser` — revoke all refresh tokens for the user before deletion (call `RefreshTokenRepository.revokeAllByUser`)

- [x] 10. Create `AuthController` and update `UserController`
  - [x] 10.1 Create `com.example.controller.AuthController` (`@RequestMapping("/api/auth")`) with endpoints: `POST /login`, `POST /refresh`, `POST /logout`, `GET /validate`, `POST /change-password`; annotate request bodies with `@Valid`
  - [x] 10.2 Update `UserController` — change `@RequestMapping` from `/users` to `/api/users`; remove login endpoint (moved to `AuthController`); update `getAllUsers` to accept `Pageable` and return `Page<UserResponse>`; annotate request bodies with `@Valid`; update `createUser` and `updateUser` to use `UserRequest` / `UserUpdateRequest`

- [x] 11. Update `DataInitializer`
  - [x] 11.1 Add a `GUEST` role seed user to `DataInitializer` (one user per Role: ADMIN, CUSTOMER, MANAGER, GUEST)
  - [x] 11.2 Set `phoneNumber = null` and `profilePictureUrl = null` explicitly on all seeded users
  - [x] 11.3 Ensure `DataInitializer` does not create any `RefreshToken` records

- [x] 12. Update `application.yml`
  - [x] 12.1 Add `jwt.secret` and `jwt.expiration` (access token, default 86400000 ms) properties
  - [x] 12.2 Add `jwt.refresh-expiration` property (default 604800000 ms = 7 days)
  - [x] 12.3 Expose actuator health endpoint properly (fix existing misconfigured `endpoints` block)

- [x] 13. Write unit and property-based tests
  - [ ] 13.1 Write `PasswordValidationPropertyTest` (jqwik) — Property 1: strings of length 0–7 rejected with 400 and fieldErrors for password
  - [ ] 13.2 Write `EmailValidationPropertyTest` (jqwik) — Property 2: malformed email strings rejected with 400 and fieldErrors for email
  - [ ] 13.3 Write `ErrorResponseSchemaPropertyTest` (jqwik) — Property 3: all error responses contain required schema fields
  - [ ] 13.4 Write `LoginRoundTripPropertyTest` (jqwik) — Property 4: login returns correct user claims for any valid user
  - [ ] 13.5 Write `TokenValidationRoundTripPropertyTest` (jqwik) — Property 5: validate endpoint returns claims matching token
  - [ ] 13.6 Write `RefreshTokenRotationPropertyTest` (jqwik) — Property 6: old refresh token revoked after use
  - [ ] 13.7 Write `ExpiredRevokedTokenRejectedPropertyTest` (jqwik) — Property 7: expired/revoked tokens return 401
  - [ ] 13.8 Write `UserDeletionRevokesTokensPropertyTest` (jqwik) — Property 8: all refresh tokens revoked on user deletion
  - [ ] 13.9 Write `PasswordChangeRevokesTokensPropertyTest` (jqwik) — Property 9: password change revokes all refresh tokens
  - [ ] 13.10 Write `ProfileFieldsRoundTripPropertyTest` (jqwik) — Property 10: phone/profile URL persisted and returned correctly
  - [ ] 13.11 Write `PhoneNumberValidationPropertyTest` (jqwik) — Property 11: phone number pattern validation
  - [ ] 13.12 Write `PaginationPropertyTest` (jqwik) — Property 12: paginated response structure and size cap
  - [ ] 13.13 Write `ProtectedEndpointPropertyTest` (jqwik) — Property 13: protected endpoints reject invalid/missing tokens
  - [ ] 13.14 Write `RoleAuthorizationPropertyTest` (jqwik) — Property 14: non-ADMIN roles get 403 on admin endpoints
  - [ ] 13.15 Write `DataInitializerIdempotencyPropertyTest` (jqwik) — Property 15: DataInitializer does not modify existing rows
  - [x] 13.16 Write `AuthServiceImplTest` (JUnit 5) — example-based: invalid credentials, logout blacklists token, wrong current password, non-existent user
  - [ ] 13.17 Write `UserServiceImplTest` (JUnit 5) — example-based: duplicate username/email on create, same-email update accepted, different-user email update rejected
  - [ ] 13.18 Write `DataInitializerTest` (JUnit 5) — seeds one user per role; seeded users have null phoneNumber/profilePictureUrl; refresh_tokens empty after init
  - [ ] 13.19 Write `SecurityConfigTest` (JUnit 5 + MockMvc) — public endpoints accessible without token; missing header returns 401; blacklisted token returns 401; legacy /users path returns 404
