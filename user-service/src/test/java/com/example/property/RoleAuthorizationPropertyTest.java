package com.example.property;

import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.UserRepository;
import com.example.security.JwtTokenProvider;
import net.jqwik.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 10.5**
 * Property 14: Non-ADMIN roles are forbidden from admin-only endpoints
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class RoleAuthorizationPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Property(tries = 50)
    void nonAdminRolesAreForbiddenFromGetAllUsers(@ForAll("nonAdminRoles") Role role) throws Exception {
        User user = createUser("user" + System.nanoTime(), role);
        String accessToken = generateToken(user);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());

        userRepository.delete(user);
    }

    @Property(tries = 50)
    void nonAdminRolesAreForbiddenFromDeleteUser(@ForAll("nonAdminRoles") Role role) throws Exception {
        User user = createUser("user" + System.nanoTime(), role);
        String accessToken = generateToken(user);

        // Create a target user to delete
        User targetUser = createUser("target" + System.nanoTime(), Role.CUSTOMER);

        mockMvc.perform(delete("/api/users/" + targetUser.getId())
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());

        userRepository.delete(user);
        userRepository.delete(targetUser);
    }

    @Property(tries = 20)
    void adminRoleCanAccessAdminEndpoints() throws Exception {
        User admin = createUser("admin" + System.nanoTime(), Role.ADMIN);
        String accessToken = generateToken(admin);

        // Should be able to access GET /api/users
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        // Should be able to delete users
        User targetUser = createUser("target" + System.nanoTime(), Role.CUSTOMER);
        mockMvc.perform(delete("/api/users/" + targetUser.getId())
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        userRepository.delete(admin);
    }

    private User createUser(String username, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
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
    Arbitrary<Role> nonAdminRoles() {
        return Arbitraries.of(Role.CUSTOMER, Role.MANAGER, Role.GUEST);
    }
}
