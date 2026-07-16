package com.example.service;

import com.example.dto.*;

public interface IAuthService {
    LoginResponse login(LoginRequest request);
    TokenPairResponse refresh(String refreshToken);
    void logout(String accessToken);
    ValidateResponse validate(String accessToken);
    void changePassword(ChangePasswordRequest request, Long userId);
    void resetPasswordByEmail(String email, String newPassword);
}
