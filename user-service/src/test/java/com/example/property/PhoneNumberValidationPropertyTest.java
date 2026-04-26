package com.example.property;

import com.example.dto.UserUpdateRequest;
import com.example.entity.Role;
import com.example.entity.User;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 7.3**
 * Property 11: Phone number validation accepts valid patterns and rejects invalid ones
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PhoneNumberValidationPropertyTest {

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

    @Property(tries = 50)
    void validPhoneNumbersAreAccepted(@ForAll("validPhoneNumbers") String phoneNumber) throws Exception {
        User user = createUser("validuser" + System.nanoTime());
        String accessToken = generateToken(user);

        UserUpdateRequest updateRequest = new UserUpdateRequest();
        updateRequest.setPhoneNumber(phoneNumber);

        mockMvc.perform(put("/api/users/" + user.getId())
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        userRepository.delete(user);
    }

    @Property(tries = 50)
    void invalidPhoneNumbersAreRejected(@ForAll("invalidPhoneNumbers") String phoneNumber) throws Exception {
        User user = createUser("invaliduser" + System.nanoTime());
        String accessToken = generateToken(user);

        UserUpdateRequest updateRequest = new UserUpdateRequest();
        updateRequest.setPhoneNumber(phoneNumber);

        mockMvc.perform(put("/api/users/" + user.getId())
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());

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

    private String generateToken(User user) {
        return jwtTokenProvider.generateToken(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }

    @Provide
    Arbitrary<String> validPhoneNumbers() {
        return Arbitraries.oneOf(
                // Plain numbers 7-20 digits
                Arbitraries.strings().numeric().ofMinLength(7).ofMaxLength(20),
                // With + prefix
                Arbitraries.strings().numeric().ofMinLength(7).ofMaxLength(19).map(s -> "+" + s),
                // With spaces
                Arbitraries.strings().numeric().ofLength(10).map(s -> s.substring(0, 3) + " " + s.substring(3, 6) + " " + s.substring(6)),
                // With dashes
                Arbitraries.strings().numeric().ofLength(10).map(s -> s.substring(0, 3) + "-" + s.substring(3, 6) + "-" + s.substring(6)),
                // With parentheses
                Arbitraries.strings().numeric().ofLength(10).map(s -> "(" + s.substring(0, 3) + ") " + s.substring(3, 6) + "-" + s.substring(6))
        );
    }

    @Provide
    Arbitrary<String> invalidPhoneNumbers() {
        return Arbitraries.oneOf(
                // Too short (less than 7 chars)
                Arbitraries.strings().numeric().ofMaxLength(6),
                // Too long (more than 20 chars)
                Arbitraries.strings().numeric().ofMinLength(21).ofMaxLength(30),
                // Contains letters
                Arbitraries.strings().alpha().ofMinLength(7).ofMaxLength(20),
                // Contains special chars not allowed
                Arbitraries.just("123-456-7890#"),
                Arbitraries.just("123.456.7890"),
                Arbitraries.just("123*456*7890")
        );
    }
}
