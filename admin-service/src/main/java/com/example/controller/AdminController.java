package com.example.controller;

import com.example.dto.AdminUserRequest;
import com.example.dto.LoginRequest;
import com.example.dto.LoginResponse;
import com.example.entity.AdminUser;
import com.example.security.JwtTokenProvider;
import com.example.service.IAdminService;
import com.example.service.IAuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AdminController {

    private final IAdminService adminService;
    private final IAuditLogService auditLogService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        log.info("Login attempt for username: {}", request.getUsername());
        
        boolean authenticated = adminService.authenticate(request.getUsername(), request.getPassword());
        
        if (authenticated) {
            AdminUser user = adminService.getAdminUserByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole());
            log.info("Login successful for user: {} with role: {}", user.getUsername(), user.getRole());
            
            return ResponseEntity.ok(new LoginResponse(
                token, 
                user.getUsername(), 
                user.getRole(), 
                "Login successful"
            ));
        }
        
        log.warn("Login failed for username: {}", request.getUsername());
        return ResponseEntity.status(401)
            .body(new LoginResponse(null, null, null, "Invalid credentials"));
    }

    @PostMapping
    public ResponseEntity<AdminUser> createAdminUser(
            @RequestBody AdminUserRequest request,
            HttpServletRequest httpRequest) {
        AdminUser created = adminService.createAdminUser(request);
        
        String adminUsername = (String) httpRequest.getAttribute("username");
        auditLogService.logAction(
            adminUsername, 
            "CREATE", 
            "ADMIN_USER", 
            created.getId().toString(), 
            "Created admin user: " + created.getUsername(),
            httpRequest.getRemoteAddr()
        );
        
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
    public ResponseEntity<List<AdminUser>> getAllAdminUsers() {
        return ResponseEntity.ok(adminService.getAllAdminUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUser> getAdminUser(@PathVariable Long id) {
        return adminService.getAdminUser(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminUser> updateAdminUser(
            @PathVariable Long id,
            @RequestBody AdminUserRequest request,
            HttpServletRequest httpRequest) {
        AdminUser updated = adminService.updateAdminUser(id, request);
        
        String adminUsername = (String) httpRequest.getAttribute("username");
        auditLogService.logAction(
            adminUsername,
            "UPDATE",
            "ADMIN_USER",
            id.toString(),
            "Updated admin user",
            httpRequest.getRemoteAddr()
        );
        
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdminUser(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        adminService.deleteAdminUser(id);
        
        String adminUsername = (String) httpRequest.getAttribute("username");
        auditLogService.logAction(
            adminUsername,
            "DELETE",
            "ADMIN_USER",
            id.toString(),
            "Deleted admin user",
            httpRequest.getRemoteAddr()
        );
        
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<AdminUser> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleAdminUserStatus(id));
    }
}
