package com.example.service;

import com.example.entity.AdminUser;
import com.example.dto.AdminUserRequest;
import com.example.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdminServiceImpl implements IAdminService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AdminUser createAdminUser(AdminUserRequest request) {
        if (adminUserRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (adminUserRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        AdminUser adminUser = new AdminUser();
        adminUser.setUsername(request.getUsername());
        adminUser.setEmail(request.getEmail());
        adminUser.setPassword(passwordEncoder.encode(request.getPassword()));
        adminUser.setRole(request.getRole() != null ? request.getRole() : "ADMIN");
        adminUser.setActive(true);
        
        return adminUserRepository.save(adminUser);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AdminUser> getAdminUser(Long id) {
        return adminUserRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AdminUser> getAdminUserByUsername(String username) {
        return adminUserRepository.findByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUser> getAllAdminUsers() {
        return adminUserRepository.findAll();
    }

    @Override
    public AdminUser updateAdminUser(Long id, AdminUserRequest request) {
        AdminUser adminUser = adminUserRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Admin user not found"));

        if (request.getEmail() != null && !request.getEmail().equals(adminUser.getEmail())) {
            if (adminUserRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            adminUser.setEmail(request.getEmail());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            adminUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRole() != null) {
            adminUser.setRole(request.getRole());
        }

        return adminUserRepository.save(adminUser);
    }

    @Override
    public void deleteAdminUser(Long id) {
        adminUserRepository.deleteById(id);
    }

    @Override
    public AdminUser toggleAdminUserStatus(Long id) {
        AdminUser adminUser = adminUserRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Admin user not found"));
        adminUser.setActive(!adminUser.getActive());
        return adminUserRepository.save(adminUser);
    }

    @Override
    public boolean authenticate(String username, String password) {
        Optional<AdminUser> adminUser = adminUserRepository.findByUsername(username);
        log.info("Attempting authentication for username: {}", username);
        
        if (adminUser.isPresent()) {
            AdminUser user = adminUser.get();
            log.info("User found. Active: {}, Password stored: {}", user.getActive(), user.getPassword().substring(0, 10) + "...");
            
            if (user.getActive()) {
                boolean matches = passwordEncoder.matches(password, user.getPassword());
                log.info("Password match result: {}", matches);
                
                if (matches) {
                    user.setLastLoginAt(LocalDateTime.now());
                    adminUserRepository.save(user);
                    log.info("Authentication successful for user: {}", username);
                }
                return matches;
            } else {
                log.warn("User {} is inactive", username);
            }
        } else {
            log.warn("User not found: {}", username);
        }
        return false;
    }
}
