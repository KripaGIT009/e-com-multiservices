package com.example.property;

import com.example.dto.LoginRequest;
import com.example.dto.LoginResponse;
import com.example.dto.UserRequest;
import com.example.entity.Role;
import com.example.entity.User;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 4.1**
 * Property 4: Login round-trip returns correct user claims
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class LoginRoundTripPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Property(tries = 50)
    void loginReturnsCorrectUserClaims(
            @ForAll("validUsernames") String username,
            @ForAll("validEmails") String email,
            @ForAll("validPasswords") String password,
            @ForAll("roles") Role role) throws Exception {

        // Create user in database
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        // Perform login
        LoginRequest loginRequest = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        LoginResponse response = objectMapper.readValue(responseBody, LoginResponse.class);

        // Verify claims match stored user
        assertThat(response.getUserId()).isEqualTo(savedUser.getId());
        assertThat(response.getUsername()).isEqualTo(savedUser.getUsername());
        assertThat(response.getEmail()).isEqualTo(savedUser.getEmail());
        assertThat(response.getRole()).isEqualTo(savedUser.getRole());
        assertThat(response.getToken()).isNotNull();
        assertThat(response.getRefreshToken()).isNotNull();

        // Cleanup
        userRepository.delete(savedUser);
    }

    @Provide
    Arbitrary<String> validUsernames() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .ofMinLength(5)
                .ofMaxLength(20);
    }

    @Provide
    Arbitrary<String> validEmails() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(10)
                .map(s -> s + "@example.com");
    }

    @Provide
    Arbitrary<String> validPasswords() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .ofMinLength(8)
                .ofMaxLength(20);
    }

    @Provide
    Arbitrary<Role> roles() {
        return Arbitraries.of(Role.ADMIN, Role.CUSTOMER, Role.MANAGER, Role.GUEST);
    }
}
