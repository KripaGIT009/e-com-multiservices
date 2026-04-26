package com.example.config;

import com.example.dto.LoginRequest;
import com.example.dto.UserRequest;
import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.UserRepository;
import com.example.security.JwtTokenProvider;
import com.example.security.TokenBlacklistService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for SecurityConfig
 * Tests: public endpoints accessible without token; missing header returns 401; blacklisted token returns 401; legacy /users path returns 404
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(Role.CUSTOMER);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        testUser = userRepository.save(testUser);
    }

    @Test
    void publicEndpointsAccessibleWithoutToken() throws Exception {
        // POST /api/auth/login should be accessible
        LoginRequest loginRequest = new LoginRequest("test@example.com", "password123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());

        // POST /api/users (registration) should be accessible
        UserRequest userRequest = new UserRequest(
                "newuser",
                "newuser@example.com",
                "password123",
                "New",
                "User",
                Role.CUSTOMER,
                null,
                null
        );
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRequest)))
                .andExpect(status().isCreated());

        // GET /api/auth/validate should be accessible (though it will fail without token, it's not blocked by security)
        // Actually, based on the design, validate should require a token, so let's test with a valid token
        String token = jwtTokenProvider.generateToken(
                testUser.getId(),
                testUser.getUsername(),
                testUser.getEmail(),
                testUser.getRole()
        );
        mockMvc.perform(get("/api/auth/validate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpointsReturnUnauthorizedWithoutToken() throws Exception {
        // GET /api/users/{id} should return 401 without token
        mockMvc.perform(get("/api/users/" + testUser.getId()))
                .andExpect(status().isUnauthorized());

        // PUT /api/users/{id} should return 401 without token
        mockMvc.perform(put("/api/users/" + testUser.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        // DELETE /api/users/{id} should return 401 without token
        mockMvc.perform(delete("/api/users/" + testUser.getId()))
                .andExpect(status().isUnauthorized());

        // POST /api/auth/logout should return 401 without token
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void missingAuthorizationHeaderReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/" + testUser.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void blacklistedTokenReturnsUnauthorized() throws Exception {
        // Generate token
        String token = jwtTokenProvider.generateToken(
                testUser.getId(),
                testUser.getUsername(),
                testUser.getEmail(),
                testUser.getRole()
        );

        // Blacklist the token
        tokenBlacklistService.blacklist(token);

        // Try to use blacklisted token
        mockMvc.perform(get("/api/users/" + testUser.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void legacyUsersPathReturnsNotFound() throws Exception {
        // Legacy /users path should return 404
        mockMvc.perform(get("/users"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/users/" + testUser.getId()))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void validTokenAllowsAccessToProtectedEndpoints() throws Exception {
        // Generate valid token
        String token = jwtTokenProvider.generateToken(
                testUser.getId(),
                testUser.getUsername(),
                testUser.getEmail(),
                testUser.getRole()
        );

        // Should be able to access protected endpoint
        mockMvc.perform(get("/api/users/" + testUser.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void invalidTokenReturnsUnauthorized() throws Exception {
        // Use an invalid token
        mockMvc.perform(get("/api/users/" + testUser.getId())
                        .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }
}
