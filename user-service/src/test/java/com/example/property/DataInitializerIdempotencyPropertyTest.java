package com.example.property;

import com.example.config.DataInitializer;
import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.UserRepository;
import net.jqwik.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * **Validates: Requirements 11.4**
 * Property 15: DataInitializer is idempotent
 */
@SpringBootTest
@Transactional
public class DataInitializerIdempotencyPropertyTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DataInitializer dataInitializer;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Property(tries = 30)
    void dataInitializerDoesNotModifyExistingRows(@ForAll("userCounts") int userCount) throws Exception {
        // Create pre-existing users
        List<User> existingUsers = new ArrayList<>();
        for (int i = 0; i < userCount; i++) {
            User user = new User();
            user.setUsername("existinguser" + i + System.nanoTime());
            user.setEmail("existing" + i + System.nanoTime() + "@example.com");
            user.setPassword(passwordEncoder.encode("password123"));
            user.setFirstName("Existing");
            user.setLastName("User" + i);
            user.setRole(Role.CUSTOMER);
            user.setPhoneNumber("+1234567890");
            user.setProfilePictureUrl("https://example.com/pic.jpg");
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            existingUsers.add(userRepository.save(user));
        }

        long countBefore = userRepository.count();
        
        // Run DataInitializer
        dataInitializer.run();

        long countAfter = userRepository.count();

        // Verify row count unchanged
        assertThat(countAfter).isEqualTo(countBefore);

        // Verify all existing users are intact
        for (User existingUser : existingUsers) {
            User foundUser = userRepository.findById(existingUser.getId()).orElse(null);
            assertThat(foundUser).isNotNull();
            assertThat(foundUser.getUsername()).isEqualTo(existingUser.getUsername());
            assertThat(foundUser.getEmail()).isEqualTo(existingUser.getEmail());
            assertThat(foundUser.getFirstName()).isEqualTo(existingUser.getFirstName());
            assertThat(foundUser.getLastName()).isEqualTo(existingUser.getLastName());
            assertThat(foundUser.getRole()).isEqualTo(existingUser.getRole());
            assertThat(foundUser.getPhoneNumber()).isEqualTo(existingUser.getPhoneNumber());
            assertThat(foundUser.getProfilePictureUrl()).isEqualTo(existingUser.getProfilePictureUrl());
        }

        // Cleanup
        existingUsers.forEach(userRepository::delete);
    }

    @Provide
    Arbitrary<Integer> userCounts() {
        return Arbitraries.integers().between(1, 20);
    }
}
