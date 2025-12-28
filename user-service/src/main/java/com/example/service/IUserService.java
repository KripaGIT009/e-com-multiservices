package com.example.service;

import com.example.entity.User;
import java.util.List;
import java.util.Optional;

public interface IUserService {
    User createUser(User user);
    Optional<User> getUserById(Long id);
    Optional<User> getUserByEmail(String email);
    List<User> getAllUsers();
    User updateUser(Long id, User user);
    void deleteUser(Long id);
}
