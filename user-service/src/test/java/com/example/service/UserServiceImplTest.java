package com.example.service;

import com.example.dto.UserRequest;
import com.example.dto.UserResponse;
import com.example.dto.UserUpdateRequest;
import com.example.entity.Role;
import com.example.entity.User;
import com.example.exception.DuplicateResourceException;
import com.example.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for UserServiceImpl
 * Tests: duplicate username/email on create, same-email update accepted, different-user email update rejected
 */
@SpringBootTest
@Transactional
class UserServiceImplTest {

    @Autowired
    private IUserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = new User();
        existingUser.setUsername("existinguser");
        existingUser.setEmail("existing@example.com");
        existingUser.setPassword(passwordEncoder.encode("password123"));
        existingUser.setFirstName("Existing");
        existingUser.setLastName("User");
        existingUser.setRole(Role.CUSTOMER);
        existingUser.setCreatedAt(LocalDateTime.now());
        existingUser.setUpdatedAt(LocalDateTime.now());
        existingUser = userRepository.save(existingUser);
    }

    @Test
    void createUserWithDuplicateUsernameThrowsDuplicateResourceException() {
        UserRequest request = new UserRequest(
                "existinguser", // Duplicate username
                "newemail@example.com",
                "password123",
                "New",
                "User",
                Role.CUSTOMER,
                null,
                null
        );

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username already exists");
    }

    @Test
    void createUserWithDuplicateEmailThrowsDuplicateResourceException() {
        UserRequest request = new UserRequest(
                "newusername",
                "existing@example.com", // Duplicate email
                "password123",
                "New",
                "User",
                Role.CUSTOMER,
                null,
                null
        );

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email already exists");
    }

    @Test
    void updateUserWithSameEmailIsAccepted() {
        UserUpdateRequest request = new UserUpdateRequest();
        request.setEmail("existing@example.com"); // Same email
        request.setFirstName("Updated");

        UserResponse response = userService.updateUser(existingUser.getId(), request);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("existing@example.com");
        assertThat(response.getFirstName()).isEqualTo("Updated");
    }

    @Test
    void updateUserWithDifferentUserEmailThrowsDuplicateResourceException() {
        // Create another user
        User anotherUser = new User();
        anotherUser.setUsername("anotheruser");
        anotherUser.setEmail("another@example.com");
        anotherUser.setPassword(passwordEncoder.encode("password123"));
        anotherUser.setFirstName("Another");
        anotherUser.setLastName("User");
        anotherUser.setRole(Role.CUSTOMER);
        anotherUser.setCreatedAt(LocalDateTime.now());
        anotherUser.setUpdatedAt(LocalDateTime.now());
        anotherUser = userRepository.save(anotherUser);

        // Try to update existingUser with anotherUser's email
        UserUpdateRequest request = new UserUpdateRequest();
        request.setEmail("another@example.com"); // Email belongs to different user

        assertThatThrownBy(() -> userService.updateUser(existingUser.getId(), request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email already exists");
    }

    @Test
    void createUserWithUniqueCredentialsSucceeds() {
        UserRequest request = new UserRequest(
                "newuser",
                "newuser@example.com",
                "password123",
                "New",
                "User",
                Role.CUSTOMER,
                "+1234567890",
                "https://example.com/pic.jpg"
        );

        UserResponse response = userService.createUser(request);

        assertThat(response).isNotNull();
        assertThat(response.getUsername()).isEqualTo("newuser");
        assertThat(response.getEmail()).isEqualTo("newuser@example.com");
        assertThat(response.getPhoneNumber()).isEqualTo("+1234567890");
        assertThat(response.getProfilePictureUrl()).isEqualTo("https://example.com/pic.jpg");
    }

    @Test
    void updateUserWithNewUniqueEmailSucceeds() {
        UserUpdateRequest request = new UserUpdateRequest();
        request.setEmail("newemail@example.com"); // New unique email

        UserResponse response = userService.updateUser(existingUser.getId(), request);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("newemail@example.com");
    }
}
