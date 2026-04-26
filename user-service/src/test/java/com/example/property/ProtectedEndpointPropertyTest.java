package com.example.property;

import net.jqwik.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 10.2, 10.3, 10.4**
 * Property 13: Protected endpoints reject requests without a valid token
 */
@SpringBootTest
@AutoConfigureMockMvc
public class ProtectedEndpointPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Property(tries = 50)
    void protectedEndpointsRejectMissingToken(@ForAll("protectedEndpoints") EndpointInfo endpoint) throws Exception {
        switch (endpoint.method) {
            case "GET":
                mockMvc.perform(get(endpoint.path))
                        .andExpect(status().isUnauthorized());
                break;
            case "PUT":
                mockMvc.perform(put(endpoint.path))
                        .andExpect(status().isUnauthorized());
                break;
            case "DELETE":
                mockMvc.perform(delete(endpoint.path))
                        .andExpect(status().isUnauthorized());
                break;
            case "POST":
                mockMvc.perform(post(endpoint.path))
                        .andExpect(status().isUnauthorized());
                break;
        }
    }

    @Property(tries = 50)
    void protectedEndpointsRejectInvalidToken(@ForAll("protectedEndpoints") EndpointInfo endpoint,
                                               @ForAll("invalidTokens") String token) throws Exception {
        switch (endpoint.method) {
            case "GET":
                mockMvc.perform(get(endpoint.path)
                                .header("Authorization", "Bearer " + token))
                        .andExpect(status().isUnauthorized());
                break;
            case "PUT":
                mockMvc.perform(put(endpoint.path)
                                .header("Authorization", "Bearer " + token))
                        .andExpect(status().isUnauthorized());
                break;
            case "DELETE":
                mockMvc.perform(delete(endpoint.path)
                                .header("Authorization", "Bearer " + token))
                        .andExpect(status().isUnauthorized());
                break;
            case "POST":
                mockMvc.perform(post(endpoint.path)
                                .header("Authorization", "Bearer " + token))
                        .andExpect(status().isUnauthorized());
                break;
        }
    }

    @Provide
    Arbitrary<EndpointInfo> protectedEndpoints() {
        return Arbitraries.of(
                new EndpointInfo("GET", "/api/users/1"),
                new EndpointInfo("GET", "/api/users/username/testuser"),
                new EndpointInfo("GET", "/api/users/email/test@example.com"),
                new EndpointInfo("PUT", "/api/users/1"),
                new EndpointInfo("DELETE", "/api/users/1"),
                new EndpointInfo("POST", "/api/auth/logout"),
                new EndpointInfo("POST", "/api/auth/change-password")
        );
    }

    @Provide
    Arbitrary<String> invalidTokens() {
        return Arbitraries.oneOf(
                Arbitraries.just("invalid.token.here"),
                Arbitraries.just(""),
                Arbitraries.strings().alpha().ofMinLength(10).ofMaxLength(50),
                Arbitraries.just("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature")
        );
    }

    static class EndpointInfo {
        String method;
        String path;

        EndpointInfo(String method, String path) {
            this.method = method;
            this.path = path;
        }
    }
}
