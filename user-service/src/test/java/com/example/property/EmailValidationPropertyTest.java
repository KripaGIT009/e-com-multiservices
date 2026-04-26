package com.example.property;

import com.example.dto.UserRequest;
import com.example.entity.Role;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.jqwik.api.*;
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
 * **Validates: Requirements 2.2, 2.5**
 * Property 2: Validation rejects all malformed email addresses
 */
@SpringBootTest
@AutoConfigureMockMvc
public class EmailValidationPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Property(tries = 100)
    void malformedEmailsAreRejectedWithFieldError(@ForAll("malformedEmails") String email) throws Exception {
        UserRequest request = new UserRequest(
                "testuser",
                email,
                "password123",
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
        assertThat(responseBody).contains("email");
        assertThat(responseBody).containsAnyOf("Email must be valid", "must be a well-formed email");
    }

    @Provide
    Arbitrary<String> malformedEmails() {
        return Arbitraries.oneOf(
                // No @ symbol
                Arbitraries.strings().alpha().ofMinLength(5).ofMaxLength(20),
                // Double @ symbol
                Arbitraries.strings().alpha().ofMinLength(3).map(s -> s + "@@" + s + ".com"),
                // No domain
                Arbitraries.strings().alpha().ofMinLength(3).map(s -> s + "@"),
                // Missing local part
                Arbitraries.strings().alpha().ofMinLength(3).map(s -> "@" + s + ".com"),
                // Spaces in email
                Arbitraries.strings().alpha().ofMinLength(3).map(s -> s + " " + s + "@test.com"),
                // No TLD
                Arbitraries.strings().alpha().ofMinLength(3).map(s -> s + "@domain")
        );
    }
}
