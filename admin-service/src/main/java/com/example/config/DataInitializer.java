package com.example.config;

import com.example.entity.AdminUser;
import com.example.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initAdminUsers() {
        return args -> {
            ensureAdminUser("admin", "admin@example.com", "ADMIN");
            ensureAdminUser("manager", "manager@example.com", "ADMIN");
        };
    }

    private void ensureAdminUser(String username, String email, String role) {
        adminUserRepository.findByUsername(username).ifPresentOrElse(
            existing -> log.info("Admin user '{}' already present", username),
            () -> {
                AdminUser adminUser = new AdminUser();
                adminUser.setUsername(username);
                adminUser.setEmail(email);
                adminUser.setPassword(passwordEncoder.encode("password123"));
                adminUser.setRole(role);
                adminUser.setActive(true);
                adminUserRepository.save(adminUser);
                log.info("Created default admin user '{}' with role {}", username, role);
            }
        );
    }
}
