package com.example.property;

import com.example.dto.UserResponse;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 7.1, 7.2, 7.5**
 * Property 10: Phone number and profile picture URL round-trip
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ProfileFieldsRoundTripPropertyTest {

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
    void phoneNumberAndProfileUrlArePersisted(
            @ForAll("usernames") String username,
            @ForAll("validPhoneNumbers") String phoneNumber,
            @ForAll("validUrls") String profileUrl) throws Exception {

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

        // Generate access token
        String accessToken = jwtTokenProvider.generateToken(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getRole()
        );

        // Update user with phone and profile URL
        UserUpdateRequest updateRequest = new UserUpdateRequest();
        updateRequest.setPhoneNumber(phoneNumber);
        updateRequest.setProfilePictureUrl(profileUrl);

        mockMvc.perform(put("/api/users/" + savedUser.getId())
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        // Retrieve user and verify fields
        MvcResult result = mockMvc.perform(get("/api/users/" + savedUser.getId())
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        UserResponse response = objectMapper.readValue(responseBody, UserResponse.class);

        assertThat(response.getPhoneNumber()).isEqualTo(phoneNumber);
        assertThat(response.getProfilePictureUrl()).isEqualTo(profileUrl);

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
    Arbitrary<String> validPhoneNumbers() {
        return Arbitraries.oneOf(
                Arbitraries.strings().numeric().ofLength(10),
                Arbitraries.strings().numeric().ofLength(10).map(s -> "+1" + s),
                Arbitraries.strings().numeric().ofLength(10).map(s -> "(" + s.substring(0, 3) + ") " + s.substring(3, 6) + "-" + s.substring(6))
        );
    }

    @Provide
    Arbitrary<String> validUrls() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .ofMinLength(5)
                .ofMaxLength(20)
                .map(s -> "https://example.com/" + s + ".jpg");
    }
}
