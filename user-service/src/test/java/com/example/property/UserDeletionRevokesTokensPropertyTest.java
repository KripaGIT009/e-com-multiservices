package com.example.property;

import com.example.entity.RefreshToken;
import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.RefreshTokenRepository;
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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * **Validates: Requirements 5.3**
 * Property 8: User deletion revokes all associated refresh tokens
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class UserDeletionRevokesTokensPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Property(tries = 30)
    void userDeletionRevokesAllRefreshTokens(
            @ForAll("usernames") String username,
            @ForAll("tokenCounts") int tokenCount) throws Exception {

        // Create user
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.ADMIN); // Need ADMIN to delete
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        // Create multiple refresh tokens
        for (int i = 0; i < tokenCount; i++) {
            String tokenValue = UUID.randomUUID().toString();
            RefreshToken refreshToken = new RefreshToken(
                    tokenValue,
                    savedUser,
                    LocalDateTime.now().plusDays(7)
            );
            refreshTokenRepository.save(refreshToken);
        }

        // Generate access token for deletion
        String accessToken = jwtTokenProvider.generateToken(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getRole()
        );

        // Delete user
        mockMvc.perform(delete("/api/users/" + savedUser.getId())
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        // Verify all refresh tokens are revoked
        List<RefreshToken> tokens = refreshTokenRepository.findAllByUser(savedUser);
        assertThat(tokens).hasSize(tokenCount);
        assertThat(tokens).allMatch(RefreshToken::isRevoked);
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
    Arbitrary<Integer> tokenCounts() {
        return Arbitraries.integers().between(1, 10);
    }
}
