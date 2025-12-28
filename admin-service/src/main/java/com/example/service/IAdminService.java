package com.example.service;

import com.example.entity.AdminUser;
import com.example.dto.AdminUserRequest;
import java.util.List;
import java.util.Optional;

public interface IAdminService {
    AdminUser createAdminUser(AdminUserRequest request);
    Optional<AdminUser> getAdminUser(Long id);
    Optional<AdminUser> getAdminUserByUsername(String username);
    List<AdminUser> getAllAdminUsers();
    AdminUser updateAdminUser(Long id, AdminUserRequest request);
    void deleteAdminUser(Long id);
    AdminUser toggleAdminUserStatus(Long id);
    boolean authenticate(String username, String password);
}
