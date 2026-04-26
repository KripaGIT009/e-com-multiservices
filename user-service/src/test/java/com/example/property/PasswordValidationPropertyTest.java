package com.example.property;

import com.example.dto.UserRequest;
import com.example.entity.Role;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.jqwik.api.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 2.3, 2.6, 2.8**
 * Property 1: Validation rejects all short passwords
 */
@SpringBootTest
@AutoConfigureMockMvc
public class PasswordValidationPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Property(tries = 100)
    void shortPasswordsAreRejectedWithFieldError(@ForAll("shortPasswords") String password) throws Exception {
        UserRequest request = new UserRequest(
                "testuser",
                "test@example.com",
                password,
                "Test",
                "User",
                Role.CUSTOMER,
                null,
                null
        );

        MvcResult result = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("password");
        assertThat(responseBody).containsAnyOf("Password must be at least 8 characters", "size must be between 8");
    }

    @Provide
    Arbitrary<String> shortPasswords() {
        return Arbitraries.strings()
                .ofMaxLength(7)
                .alpha()
                .numeric();
    }
}
