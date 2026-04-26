package com.example.property;

import com.example.dto.UserRequest;
import com.example.entity.Role;
import com.fasterxml.jackson.databind.JsonNode;
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

/**
 * **Validates: Requirements 3.1, 3.3**
 * Property 3: Error responses always conform to the ErrorResponse schema
 */
@SpringBootTest
@AutoConfigureMockMvc
public class ErrorResponseSchemaPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Property(tries = 100)
    void allErrorResponsesContainRequiredFields(@ForAll("invalidRequests") UserRequest request) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        int status = result.getResponse().getStatus();
        
        // Only check 4xx and 5xx responses
        if (status >= 400) {
            String responseBody = result.getResponse().getContentAsString();
            JsonNode jsonNode = objectMapper.readTree(responseBody);

            // Verify all required ErrorResponse fields are present
            assertThat(jsonNode.has("timestamp")).isTrue();
            assertThat(jsonNode.has("status")).isTrue();
            assertThat(jsonNode.has("error")).isTrue();
            assertThat(jsonNode.has("message")).isTrue();
            assertThat(jsonNode.has("path")).isTrue();

            // Verify values are not null
            assertThat(jsonNode.get("timestamp").isNull()).isFalse();
            assertThat(jsonNode.get("status").asInt()).isEqualTo(status);
            assertThat(jsonNode.get("error").isNull()).isFalse();
            assertThat(jsonNode.get("message").isNull()).isFalse();
            assertThat(jsonNode.get("path").asText()).isEqualTo("/api/users");
        }
    }

    @Provide
    Arbitrary<UserRequest> invalidRequests() {
        return Arbitraries.oneOf(
                // Missing username
                Arbitraries.just(new UserRequest(null, "test@example.com", "password123", "Test", "User", Role.CUSTOMER, null, null)),
                // Missing email
                Arbitraries.just(new UserRequest("testuser", null, "password123", "Test", "User", Role.CUSTOMER, null, null)),
                // Short password
                Arbitraries.just(new UserRequest("testuser", "test@example.com", "pass", "Test", "User", Role.CUSTOMER, null, null)),
                // Invalid email
                Arbitraries.just(new UserRequest("testuser", "notanemail", "password123", "Test", "User", Role.CUSTOMER, null, null)),
                // Missing firstName
                Arbitraries.just(new UserRequest("testuser", "test@example.com", "password123", null, "User", Role.CUSTOMER, null, null)),
                // Missing lastName
                Arbitraries.just(new UserRequest("testuser", "test@example.com", "password123", "Test", null, Role.CUSTOMER, null, null))
        );
    }
}
