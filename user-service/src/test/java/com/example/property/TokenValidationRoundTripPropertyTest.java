package com.example.property;

import com.example.dto.ValidateResponse;
import com.example.entity.Role;
import com.example.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.jqwik.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 4.6**
 * Property 5: Token validation round-trip preserves claims
 */
@SpringBootTest
@AutoConfigureMockMvc
public class TokenValidationRoundTripPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Property(tries = 100)
    void validateEndpointReturnsMatchingClaims(
            @ForAll("userIds") Long userId,
            @ForAll("usernames") String username,
            @ForAll("emails") String email,
            @ForAll("roles") Role role) throws Exception {

        // Generate token with specific claims
        String token = jwtTokenProvider.generateToken(userId, username, email, role);

        // Validate token via endpoint
        MvcResult result = mockMvc.perform(get("/api/auth/validate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        ValidateResponse response = objectMapper.readValue(responseBody, ValidateResponse.class);

        // Verify claims match what was embedded in token
        assertThat(response.getUserId()).isEqualTo(userId);
        assertThat(response.getUsername()).isEqualTo(username);
        assertThat(response.getEmail()).isEqualTo(email);
        assertThat(response.getRole()).isEqualTo(role);
    }

    @Provide
    Arbitrary<Long> userIds() {
        return Arbitraries.longs().between(1L, 100000L);
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
    Arbitrary<String> emails() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(10)
                .map(s -> s + "@example.com");
    }

    @Provide
    Arbitrary<Role> roles() {
        return Arbitraries.of(Role.ADMIN, Role.CUSTOMER, Role.MANAGER, Role.GUEST);
    }
}
