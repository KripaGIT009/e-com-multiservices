package com.example.controller;

import com.example.dto.UserRequest;
import com.example.dto.UserResponse;
import com.example.dto.UserUpdateRequest;
import com.example.security.JwtTokenProvider;
import com.example.service.IUserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired
    private IUserService userService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRequest request) {
        UserResponse created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get the currently authenticated user's profile.
     * Accessible by any authenticated user (CUSTOMER, ADMIN, MANAGER, GUEST).
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtTokenProvider.extractUserId(token);
        UserResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    /**
     * Update the currently authenticated user's own profile.
     * Accessible by any authenticated user.
     */
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMyProfile(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UserUpdateRequest request) {
        String token = authHeader.substring(7);
        Long userId = jwtTokenProvider.extractUserId(token);
        // Prevent customers from changing their own role
        request.setRole(null);
        UserResponse updated = userService.updateUser(userId, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable String username) {
        UserResponse user = userService.getUserByUsername(username);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        UserResponse user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }

    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        UserResponse updated = userService.updateUser(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        boolean deleted = userService.deleteUser(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
