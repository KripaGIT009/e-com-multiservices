package com.example.controller;

import com.example.dto.*;
import com.example.security.JwtTokenProvider;
import com.example.service.IAuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private IAuthService authService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenPairResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        TokenPairResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        authService.logout(token);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/validate")
    public ResponseEntity<ValidateResponse> validate(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        ValidateResponse response = authService.validate(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        Long userId = jwtTokenProvider.extractUserId(token);
        authService.changePassword(request, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");
        if (email == null || newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().build();
        }
        authService.resetPasswordByEmail(email, newPassword);
        return ResponseEntity.ok().build();
    }
}
