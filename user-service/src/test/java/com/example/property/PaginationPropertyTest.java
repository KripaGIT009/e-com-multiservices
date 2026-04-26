package com.example.property;

import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.UserRepository;
import com.example.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.jqwik.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 8.1, 8.2, 8.5**
 * Property 12: Paginated user list always returns correct structure and bounded size
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PaginationPropertyTest {

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

    @Property(tries = 30)
    void paginatedResponseHasCorrectStructureAndSizeCap(
            @ForAll("pageNumbers") int page,
            @ForAll("pageSizes") int size) throws Exception {

        // Create admin user for authorization
        User admin = createAdminUser();
        String accessToken = generateToken(admin);

        // Create some test users
        List<User> testUsers = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            testUsers.add(createUser("testuser" + System.nanoTime() + i));
        }

        // Request paginated list
        MvcResult result = mockMvc.perform(get("/api/users")
                        .param("page", String.valueOf(page))
                        .param("size", String.valueOf(size))
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);

        // Verify required pagination fields are present
        assertThat(jsonNode.has("content")).isTrue();
        assertThat(jsonNode.has("totalElements")).isTrue();
        assertThat(jsonNode.has("totalPages")).isTrue();
        assertThat(jsonNode.has("number")).isTrue(); // page number
        assertThat(jsonNode.has("size")).isTrue();

        // Verify content array length never exceeds min(size, 100)
        int expectedMaxSize = Math.min(size, 100);
        int actualContentSize = jsonNode.get("content").size();
        assertThat(actualContentSize).isLessThanOrEqualTo(expectedMaxSize);

        // Cleanup
        testUsers.forEach(userRepository::delete);
        userRepository.delete(admin);
    }

    private User createAdminUser() {
        User user = new User();
        user.setUsername("admin" + System.nanoTime());
        user.setEmail("admin" + System.nanoTime() + "@example.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setFirstName("Admin");
        user.setLastName("User");
        user.setRole(Role.ADMIN);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
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
    Arbitrary<Integer> pageNumbers() {
        return Arbitraries.integers().between(0, 10);
    }

    @Provide
    Arbitrary<Integer> pageSizes() {
        return Arbitraries.integers().between(1, 500);
    }
}
