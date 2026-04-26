# Requirements Document

## Introduction

The MyIndianStore user-service is a Spring Boot 3.2 / Java 21 microservice responsible for user identity, authentication, and profile management within the platform. The current implementation has several production-readiness gaps: missing input validation, no Spring Security filter chain, no refresh-token support, no email-uniqueness guard on update, no password-change or token-validation endpoints, no pagination on the user list, inconsistent URL prefixes, and non-standardised error responses. This enhancement closes all of those gaps and adds phone number and profile picture fields, making the service fully production-ready before downstream services depend on it.

---

## Glossary

- **User_Service**: The Spring Boot microservice that manages user accounts for MyIndianStore.
- **User**: A registered account with fields: id, username, email, password (BCrypt-hashed), firstName, lastName, role, phoneNumber, profilePictureUrl, createdAt, updatedAt.
- **Role**: One of the enumerated values `ADMIN`, `CUSTOMER`, `MANAGER`, or `GUEST`.
- **JWT**: A JSON Web Token signed with HS512 used to authenticate subsequent requests.
- **Access_Token**: A short-lived JWT (default 24 h) returned on successful login.
- **Refresh_Token**: A long-lived opaque token (default 7 days) stored server-side, used to obtain a new Access_Token without re-authentication.
- **Token_Blacklist**: A server-side store of invalidated Access_Tokens, checked on every protected request.
- **Validator**: The Bean Validation layer (`@Valid` + constraint annotations) applied to all inbound request bodies.
- **Error_Response**: A standardised JSON object with fields `timestamp`, `status`, `error`, `message`, and `path`.
- **DataInitializer**: The `CommandLineRunner` component that seeds test users on first startup.
- **Pageable**: Spring Data's pagination abstraction (`page`, `size`, `sort` query parameters).

---

## Requirements

### Requirement 1: URL Prefix Alignment

**User Story:** As a developer integrating with the user-service, I want all endpoints to be reachable under `/api/users`, so that the URL structure matches the documented API and the API gateway routing rules.

#### Acceptance Criteria

1. THE User_Service SHALL expose all user-management endpoints under the `/api/users` path prefix.
2. THE User_Service SHALL expose all authentication endpoints under the `/api/auth` path prefix.
3. WHEN a request arrives at a legacy `/users/**` path, THE User_Service SHALL return HTTP 404 so that callers are not silently routed to the wrong handler.

---

### Requirement 2: Input Validation

**User Story:** As a system operator, I want all inbound request bodies to be validated before processing, so that malformed data never reaches the database.

#### Acceptance Criteria

1. WHEN a `POST /api/users` request body is missing `username`, `email`, `password`, `firstName`, or `lastName`, THE Validator SHALL reject the request with HTTP 400 and an Error_Response listing each violated field.
2. WHEN a `POST /api/users` request body contains an `email` field that does not conform to RFC 5321 format, THE Validator SHALL reject the request with HTTP 400.
3. WHEN a `POST /api/users` request body contains a `password` field shorter than 8 characters, THE Validator SHALL reject the request with HTTP 400.
4. WHEN a `POST /api/auth/login` request body is missing `email` or `password`, THE Validator SHALL reject the request with HTTP 400 and an Error_Response.
5. WHEN a `PUT /api/users/{id}` request body contains an `email` field that does not conform to RFC 5321 format, THE Validator SHALL reject the request with HTTP 400.
6. WHEN a `PUT /api/users/{id}` request body contains a `password` field shorter than 8 characters, THE Validator SHALL reject the request with HTTP 400.
7. WHEN a `POST /api/auth/change-password` request body is missing `currentPassword` or `newPassword`, THE Validator SHALL reject the request with HTTP 400.
8. WHEN a `POST /api/auth/change-password` request body contains a `newPassword` field shorter than 8 characters, THE Validator SHALL reject the request with HTTP 400.

---

### Requirement 3: Standardised Error Responses

**User Story:** As a frontend developer, I want all error responses to follow a consistent JSON structure, so that I can handle errors uniformly without parsing different formats.

#### Acceptance Criteria

1. WHEN the User_Service returns any 4xx or 5xx HTTP response, THE User_Service SHALL include a JSON body conforming to the Error_Response schema (`timestamp`, `status`, `error`, `message`, `path`).
2. WHEN a validation failure occurs, THE User_Service SHALL include a `fieldErrors` array in the Error_Response, where each entry contains `field` and `message`.
3. WHEN an unhandled exception occurs, THE User_Service SHALL return HTTP 500 with an Error_Response and SHALL NOT expose internal stack traces in the response body.
4. THE User_Service SHALL return HTTP 409 with an Error_Response when a `POST /api/users` request contains a `username` or `email` that already exists.
5. THE User_Service SHALL return HTTP 409 with an Error_Response when a `PUT /api/users/{id}` request changes `email` to a value already owned by a different User.

---

### Requirement 4: Authentication Endpoints

**User Story:** As a client application, I want dedicated `/api/auth` endpoints for login, logout, token refresh, and token validation, so that authentication concerns are separated from user-management CRUD.

#### Acceptance Criteria

1. WHEN a `POST /api/auth/login` request provides valid `email` and `password` credentials, THE User_Service SHALL return HTTP 200 with an Access_Token, a Refresh_Token, and the authenticated User's `id`, `username`, `email`, and `role`.
2. WHEN a `POST /api/auth/login` request provides invalid credentials, THE User_Service SHALL return HTTP 401 with an Error_Response and SHALL NOT reveal whether the email or password was incorrect.
3. WHEN a `POST /api/auth/refresh` request provides a valid, non-expired Refresh_Token, THE User_Service SHALL return HTTP 200 with a new Access_Token and a new Refresh_Token, and SHALL invalidate the old Refresh_Token.
4. WHEN a `POST /api/auth/refresh` request provides an expired or unknown Refresh_Token, THE User_Service SHALL return HTTP 401 with an Error_Response.
5. WHEN a `POST /api/auth/logout` request provides a valid Access_Token in the `Authorization` header, THE User_Service SHALL add the token to the Token_Blacklist and return HTTP 204.
6. WHEN a `GET /api/auth/validate` request provides a valid, non-blacklisted Access_Token in the `Authorization` header, THE User_Service SHALL return HTTP 200 with the token's `userId`, `username`, `email`, and `role` claims.
7. WHEN a `GET /api/auth/validate` request provides an expired, malformed, or blacklisted Access_Token, THE User_Service SHALL return HTTP 401 with an Error_Response.

---

### Requirement 5: Refresh Token Lifecycle

**User Story:** As a security engineer, I want refresh tokens to be stored and managed server-side, so that they can be revoked individually without requiring a full re-login.

#### Acceptance Criteria

1. THE User_Service SHALL persist each issued Refresh_Token with its associated `userId`, `expiresAt` timestamp, and a `revoked` flag in the database.
2. WHEN a Refresh_Token is used to obtain a new Access_Token, THE User_Service SHALL mark the old Refresh_Token as revoked before issuing the new pair.
3. WHEN a User account is deleted, THE User_Service SHALL revoke all Refresh_Tokens associated with that `userId`.
4. WHEN a `POST /api/auth/logout` request is processed, THE User_Service SHALL revoke the Refresh_Token associated with the authenticated session in addition to blacklisting the Access_Token.
5. THE User_Service SHALL reject any Refresh_Token whose `expiresAt` is in the past or whose `revoked` flag is `true`.

---

### Requirement 6: Password Change

**User Story:** As a registered user, I want to change my password without losing my session, so that I can maintain account security without being forced to log in again.

#### Acceptance Criteria

1. WHEN a `POST /api/auth/change-password` request provides a valid Access_Token and a correct `currentPassword`, THE User_Service SHALL update the User's password to the BCrypt-encoded `newPassword` and return HTTP 200.
2. WHEN a `POST /api/auth/change-password` request provides an incorrect `currentPassword`, THE User_Service SHALL return HTTP 400 with an Error_Response containing the message "Current password is incorrect".
3. WHEN a `POST /api/auth/change-password` request provides an Access_Token that does not correspond to an existing User, THE User_Service SHALL return HTTP 404 with an Error_Response.
4. AFTER a successful password change, THE User_Service SHALL revoke all existing Refresh_Tokens for that User so that other active sessions are terminated.

---

### Requirement 7: Extended User Profile Fields

**User Story:** As a product manager, I want users to optionally store a phone number and profile picture URL, so that the platform can support richer profile pages and contact features.

#### Acceptance Criteria

1. THE User_Service SHALL persist an optional `phoneNumber` field (max 20 characters) on the User entity.
2. THE User_Service SHALL persist an optional `profilePictureUrl` field (max 500 characters) on the User entity.
3. WHEN a `PUT /api/users/{id}` request includes a `phoneNumber` value, THE Validator SHALL accept values matching the pattern `^\+?[0-9\s\-\(\)]{7,20}$` and reject all others with HTTP 400.
4. WHEN a `PUT /api/users/{id}` request includes a `profilePictureUrl` value, THE Validator SHALL accept values that are valid HTTP or HTTPS URLs and reject all others with HTTP 400.
5. WHEN a `GET /api/users/{id}` request is processed, THE User_Service SHALL include `phoneNumber` and `profilePictureUrl` in the response body (null if not set).

---

### Requirement 8: Paginated User List

**User Story:** As an admin, I want to retrieve the user list with pagination and sorting, so that the endpoint remains performant as the user base grows.

#### Acceptance Criteria

1. WHEN a `GET /api/users` request is received, THE User_Service SHALL return a paginated response containing `content`, `totalElements`, `totalPages`, `page`, and `size` fields.
2. WHEN a `GET /api/users` request includes `page` and `size` query parameters, THE User_Service SHALL return the corresponding page of results.
3. WHEN a `GET /api/users` request omits `page` and `size`, THE User_Service SHALL default to `page=0` and `size=20`.
4. WHEN a `GET /api/users` request includes a `sort` query parameter, THE User_Service SHALL sort results by the specified field in the specified direction.
5. WHEN a `GET /api/users` request includes a `size` value greater than 100, THE User_Service SHALL cap the page size at 100 and return the capped result.

---

### Requirement 9: Email Uniqueness on Update

**User Story:** As a data integrity guardian, I want the update endpoint to enforce email uniqueness, so that two users can never share the same email address.

#### Acceptance Criteria

1. WHEN a `PUT /api/users/{id}` request changes the `email` field to a value already associated with a different User, THE User_Service SHALL return HTTP 409 with an Error_Response.
2. WHEN a `PUT /api/users/{id}` request sets the `email` field to the same value already held by the same User, THE User_Service SHALL accept the request and return HTTP 200.

---

### Requirement 10: Security Filter Chain

**User Story:** As a security engineer, I want a Spring Security filter chain to protect endpoints, so that unauthenticated or unauthorised requests are rejected at the framework level.

#### Acceptance Criteria

1. THE User_Service SHALL configure a Spring Security filter chain that permits unauthenticated access to `POST /api/auth/login`, `POST /api/users` (registration), and `GET /api/auth/validate`.
2. THE User_Service SHALL require a valid, non-blacklisted Access_Token for all other `/api/**` endpoints.
3. WHEN a request to a protected endpoint arrives without an `Authorization: Bearer <token>` header, THE User_Service SHALL return HTTP 401 with an Error_Response.
4. WHEN a request to a protected endpoint arrives with a blacklisted or expired Access_Token, THE User_Service SHALL return HTTP 401 with an Error_Response.
5. WHEN a request to `DELETE /api/users/{id}` or `GET /api/users` arrives with an Access_Token whose `role` is not `ADMIN`, THE User_Service SHALL return HTTP 403 with an Error_Response.

---

### Requirement 11: DataInitializer Alignment

**User Story:** As a developer running the service locally, I want the DataInitializer to seed users that are compatible with all new fields and constraints, so that the service starts cleanly without migration errors.

#### Acceptance Criteria

1. WHEN the User_Service starts and the `users` table is empty, THE DataInitializer SHALL seed at least one user per Role (`ADMIN`, `CUSTOMER`, `MANAGER`, `GUEST`).
2. THE DataInitializer SHALL set `phoneNumber` and `profilePictureUrl` to `null` for all seeded users.
3. THE DataInitializer SHALL NOT seed any Refresh_Tokens; seeded users must authenticate normally to obtain tokens.
4. WHEN the `users` table already contains rows, THE DataInitializer SHALL skip seeding and SHALL NOT modify existing data.
