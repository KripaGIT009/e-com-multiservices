package com.example.property;

import com.example.dto.ChangePasswordRequest;
import com.example.dto.RefreshRequest;
import com.example.entity.RefreshToken;
import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.RefreshTokenRepository;
import com.example.repository.UserRepository;
import com.example.security.JwtTokenProvider;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 6.1, 6.4**
 * Property 9: Password change revokes all existing refresh tokens
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PasswordChangeRevokesTokensPropertyTest {

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

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Property(tries = 30)
    void passwordChangeRevokesAllRefreshTokens(
            @ForAll("usernames") String username,
            @ForAll("tokenCounts") int tokenCount) throws Exception {

        // Create user
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword(passwordEncoder.encode("oldPassword123"));
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.CUSTOMER);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        // Create multiple refresh tokens
        List<String> tokenValues = new ArrayList<>();
        for (int i = 0; i < tokenCount; i++) {
            String tokenValue = UUID.randomUUID().toString();
            tokenValues.add(tokenValue);
            RefreshToken refreshToken = new RefreshToken(
                    tokenValue,
                    savedUser,
                    LocalDateTime.now().plusDays(7)
            );
            refreshTokenRepository.save(refreshToken);
        }

        // Generate access token
        String accessToken = jwtTokenProvider.generateToken(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getRole()
        );

        // Change password
        ChangePasswordRequest changeRequest = new ChangePasswordRequest("oldPassword123", "newPassword123");
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeRequest)))
                .andExpect(status().isOk());

        // Verify all refresh tokens are revoked
        List<RefreshToken> tokens = refreshTokenRepository.findAllByUser(savedUser);
        assertThat(tokens).hasSize(tokenCount);
        assertThat(tokens).allMatch(RefreshToken::isRevoked);

        // Verify subsequent refresh attempts fail
        for (String tokenValue : tokenValues) {
            RefreshRequest refreshRequest = new RefreshRequest(tokenValue);
            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(refreshRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // Cleanup
        userRepository.delete(savedUser);
    }

    @Provide
    Arbitrary<String> usernames() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .ofMinLength(5)
                .ofMaxLength(20);
    }

    @Provide
    Arbitrary<Integer> tokenCounts() {
        return Arbitraries.integers().between(1, 5);
    }
}
