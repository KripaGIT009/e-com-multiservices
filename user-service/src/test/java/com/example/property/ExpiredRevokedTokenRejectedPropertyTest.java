package com.example.property;

import com.example.dto.RefreshRequest;
import com.example.entity.RefreshToken;
import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.RefreshTokenRepository;
import com.example.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.jqwik.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 5.5, 4.4**
 * Property 7: Expired or revoked refresh tokens are always rejected
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ExpiredRevokedTokenRejectedPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Property(tries = 50)
    void expiredTokensAreRejected(@ForAll("usernames") String username) throws Exception {
        // Create user
        User user = createUser(username);

        // Create expired refresh token
        String tokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken(
                tokenValue,
                user,
                LocalDateTime.now().minusDays(1) // Expired yesterday
        );
        refreshTokenRepository.save(refreshToken);

        // Attempt to use expired token
        RefreshRequest request = new RefreshRequest(tokenValue);
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        // Cleanup
        userRepository.delete(user);
    }

    @Property(tries = 50)
    void revokedTokensAreRejected(@ForAll("usernames") String username) throws Exception {
        // Create user
        User user = createUser(username);

        // Create revoked refresh token
        String tokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken(
                tokenValue,
                user,
                LocalDateTime.now().plusDays(7)
        );
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        // Attempt to use revoked token
        RefreshRequest request = new RefreshRequest(tokenValue);
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        // Cleanup
        userRepository.delete(user);
    }

    private User createUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.CUSTOMER);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Provide
    Arbitrary<String> usernames() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .ofMinLength(5)
                .ofMaxLength(20);
    }
}
