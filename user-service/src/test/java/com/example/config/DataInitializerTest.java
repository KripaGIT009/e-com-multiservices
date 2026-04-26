package com.example.config;

import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.RefreshTokenRepository;
import com.example.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for DataInitializer
 * Tests: seeds one user per role; seeded users have null phoneNumber/profilePictureUrl; refresh_tokens empty after init
 */
@SpringBootTest
@Transactional
class DataInitializerTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        // Clear all users before each test
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void dataInitializerSeedsOneUserPerRole() throws Exception {
        // Run initializer
        dataInitializer.run();

        // Verify one user per role exists
        List<User> allUsers = userRepository.findAll();
        assertThat(allUsers).hasSizeGreaterThanOrEqualTo(4);

        // Check each role has at least one user
        assertThat(allUsers.stream().anyMatch(u -> u.getRole() == Role.ADMIN)).isTrue();
        assertThat(allUsers.stream().anyMatch(u -> u.getRole() == Role.CUSTOMER)).isTrue();
        assertThat(allUsers.stream().anyMatch(u -> u.getRole() == Role.MANAGER)).isTrue();
        assertThat(allUsers.stream().anyMatch(u -> u.getRole() == Role.GUEST)).isTrue();
    }

    @Test
    void seededUsersHaveNullPhoneNumberAndProfilePictureUrl() throws Exception {
        // Run initializer
        dataInitializer.run();

        // Get all seeded users
        List<User> allUsers = userRepository.findAll();

        // Verify all seeded users have null phoneNumber and profilePictureUrl
        for (User user : allUsers) {
            assertThat(user.getPhoneNumber()).isNull();
            assertThat(user.getProfilePictureUrl()).isNull();
        }
    }

    @Test
    void refreshTokensTableIsEmptyAfterInit() throws Exception {
        // Run initializer
        dataInitializer.run();

        // Verify no refresh tokens were created
        long tokenCount = refreshTokenRepository.count();
        assertThat(tokenCount).isEqualTo(0);
    }

    @Test
    void dataInitializerIsIdempotent() throws Exception {
        // Run initializer first time
        dataInitializer.run();
        long countAfterFirst = userRepository.count();

        // Run initializer second time
        dataInitializer.run();
        long countAfterSecond = userRepository.count();

        // Verify count didn't change
        assertThat(countAfterSecond).isEqualTo(countAfterFirst);
    }

    @Test
    void seededUsersHaveValidCredentials() throws Exception {
        // Run initializer
        dataInitializer.run();

        // Get all seeded users
        List<User> allUsers = userRepository.findAll();

        // Verify all users have required fields
        for (User user : allUsers) {
            assertThat(user.getUsername()).isNotNull();
            assertThat(user.getEmail()).isNotNull();
            assertThat(user.getPassword()).isNotNull();
            assertThat(user.getFirstName()).isNotNull();
            assertThat(user.getLastName()).isNotNull();
            assertThat(user.getRole()).isNotNull();
            assertThat(user.getCreatedAt()).isNotNull();
            assertThat(user.getUpdatedAt()).isNotNull();
        }
    }
}
