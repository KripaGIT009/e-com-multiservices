package com.example.property;

import com.example.dto.RefreshRequest;
import com.example.dto.TokenPairResponse;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 4.3, 5.2**
 * Property 6: Refresh token rotation — old token is revoked after use
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class RefreshTokenRotationPropertyTest {

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
    void oldRefreshTokenIsRevokedAfterUse(@ForAll("usernames") String username) throws Exception {
        // Create user
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.CUSTOMER);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        // Create refresh token
        String tokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken(
                tokenValue,
                savedUser,
                LocalDateTime.now().plusDays(7)
        );
        refreshTokenRepository.save(refreshToken);

        // Use refresh token
        RefreshRequest request = new RefreshRequest(tokenValue);
        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        TokenPairResponse response = objectMapper.readValue(responseBody, TokenPairResponse.class);

        // Verify new tokens were issued
        assertThat(response.getAccessToken()).isNotNull();
        assertThat(response.getRefreshToken()).isNotNull();
        assertThat(response.getRefreshToken()).isNotEqualTo(tokenValue);

        // Verify old token is revoked
        RefreshToken oldToken = refreshTokenRepository.findByToken(tokenValue).orElse(null);
        assertThat(oldToken).isNotNull();
        assertThat(oldToken.isRevoked()).isTrue();

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
}
