package com.example.service;

import com.example.dto.*;
import com.example.entity.RefreshToken;
import com.example.entity.User;
import com.example.exception.InvalidTokenException;
import com.example.repository.RefreshTokenRepository;
import com.example.repository.UserRepository;
import com.example.security.JwtTokenProvider;
import com.example.security.TokenBlacklistService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthServiceImpl implements IAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshTokenExpirationMs;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String accessToken = jwtTokenProvider.generateToken(
                user.getId(), user.getUsername(), user.getEmail(), user.getRole());

        String refreshTokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken(
                refreshTokenValue,
                user,
                LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000)
        );
        refreshTokenRepository.save(refreshToken);

        return new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                "Login successful",
                accessToken,
                refreshTokenValue
        );
    }

    @Override
    @Transactional
    public TokenPairResponse refresh(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            throw new InvalidTokenException("Refresh token has been revoked");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Refresh token has expired");
        }

        // Revoke old token
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        // Generate new tokens
        User user = refreshToken.getUser();
        String newAccessToken = jwtTokenProvider.generateToken(
                user.getId(), user.getUsername(), user.getEmail(), user.getRole());

        String newRefreshTokenValue = UUID.randomUUID().toString();
        RefreshToken newRefreshToken = new RefreshToken(
                newRefreshTokenValue,
                user,
                LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000)
        );
        refreshTokenRepository.save(newRefreshToken);

        return new TokenPairResponse(newAccessToken, newRefreshTokenValue);
    }

    @Override
    @Transactional
    public void logout(String accessToken) {
        // Blacklist the access token
        tokenBlacklistService.blacklist(accessToken);

        // Extract user ID and revoke all refresh tokens
        try {
            Long userId = jwtTokenProvider.extractUserId(accessToken);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                refreshTokenRepository.revokeAllByUser(user);
            }
        } catch (Exception e) {
            // Token might be invalid, but we still blacklisted it
        }
    }

    @Override
    public ValidateResponse validate(String accessToken) {
        if (!jwtTokenProvider.validateToken(accessToken)) {
            throw new InvalidTokenException("Invalid or expired token");
        }

        if (tokenBlacklistService.isBlacklisted(accessToken)) {
            throw new InvalidTokenException("Token has been blacklisted");
        }

        Long userId = jwtTokenProvider.extractUserId(accessToken);
        String username = jwtTokenProvider.getUsernameFromToken(accessToken);
        String email = jwtTokenProvider.extractEmail(accessToken);
        var role = jwtTokenProvider.extractRole(accessToken);

        return new ValidateResponse(userId, username, email, role);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Revoke all refresh tokens to terminate other sessions
        refreshTokenRepository.revokeAllByUser(user);
    }

    @Override
    @Transactional
    public void resetPasswordByEmail(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Revoke all refresh tokens
        refreshTokenRepository.revokeAllByUser(user);
    }
}
