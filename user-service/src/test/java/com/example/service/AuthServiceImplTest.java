package com.example.service;

import com.example.dto.ChangePasswordRequest;
import com.example.dto.LoginRequest;
import com.example.dto.LoginResponse;
import com.example.entity.RefreshToken;
import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.RefreshTokenRepository;
import com.example.repository.UserRepository;
import com.example.security.JwtTokenProvider;
import com.example.security.TokenBlacklistService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for AuthServiceImpl
 * Tests: invalid credentials, logout blacklists token, wrong current password, non-existent user
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceImplTest {

    @Autowired
    private IAuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

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
    void loginWithInvalidCredentialsThrowsBadCredentialsException() {
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void loginWithNonExistentEmailThrowsBadCredentialsException() {
        LoginRequest request = new LoginRequest("nonexistent@example.com", "password123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void logoutBlacklistsAccessToken() {
        // Generate access token
        String accessToken = jwtTokenProvider.generateToken(
                testUser.getId(),
                testUser.getUsername(),
                testUser.getEmail(),
                testUser.getRole()
        );

        // Verify token is not blacklisted initially
        assertThat(tokenBlacklistService.isBlacklisted(accessToken)).isFalse();

        // Logout
        authService.logout(accessToken);

        // Verify token is now blacklisted
        assertThat(tokenBlacklistService.isBlacklisted(accessToken)).isTrue();
    }

    @Test
    void changePasswordWithWrongCurrentPasswordThrowsException() {
        ChangePasswordRequest request = new ChangePasswordRequest("wrongpassword", "newPassword123");

        assertThatThrownBy(() -> authService.changePassword(request, testUser.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Current password is incorrect");
    }

    @Test
    void changePasswordWithNonExistentUserThrowsEntityNotFoundException() {
        ChangePasswordRequest request = new ChangePasswordRequest("password123", "newPassword123");

        assertThatThrownBy(() -> authService.changePassword(request, 99999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void successfulLoginReturnsTokensAndUserInfo() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        LoginResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(testUser.getId());
        assertThat(response.getUsername()).isEqualTo(testUser.getUsername());
        assertThat(response.getEmail()).isEqualTo(testUser.getEmail());
        assertThat(response.getRole()).isEqualTo(testUser.getRole());
        assertThat(response.getToken()).isNotNull();
        assertThat(response.getRefreshToken()).isNotNull();
    }

    @Test
    void successfulPasswordChangeRevokesAllRefreshTokens() {
        // Create some refresh tokens
        for (int i = 0; i < 3; i++) {
            RefreshToken token = new RefreshToken(
                    "token" + i,
                    testUser,
                    LocalDateTime.now().plusDays(7)
            );
            refreshTokenRepository.save(token);
        }

        // Change password
        ChangePasswordRequest request = new ChangePasswordRequest("password123", "newPassword123");
        authService.changePassword(request, testUser.getId());

        // Verify all tokens are revoked
        var tokens = refreshTokenRepository.findAllByUser(testUser);
        assertThat(tokens).hasSize(3);
        assertThat(tokens).allMatch(RefreshToken::isRevoked);
    }
}
