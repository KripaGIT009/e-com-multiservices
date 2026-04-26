package com.example.config;

import com.example.entity.Role;
import com.example.entity.User;
import com.example.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Create test users with hashed passwords
            User admin = new User("admin", "admin@example.com", 
                                  passwordEncoder.encode("password123"), 
                                  "Admin", "User", Role.ADMIN);
            admin.setPhoneNumber(null);
            admin.setProfilePictureUrl(null);
            userRepository.save(admin);

            User customer1 = new User("customer1", "customer1@example.com", 
                                      passwordEncoder.encode("password123"), 
                                      "John", "Doe", Role.CUSTOMER);
            customer1.setPhoneNumber(null);
            customer1.setProfilePictureUrl(null);
            userRepository.save(customer1);

            User customer2 = new User("customer2", "customer2@example.com", 
                                      passwordEncoder.encode("password123"), 
                                      "Jane", "Smith", Role.CUSTOMER);
            customer2.setPhoneNumber(null);
            customer2.setProfilePictureUrl(null);
            userRepository.save(customer2);

            User manager = new User("manager", "manager@example.com", 
                                    passwordEncoder.encode("password123"), 
                                    "Manager", "User", Role.MANAGER);
            manager.setPhoneNumber(null);
            manager.setProfilePictureUrl(null);
            userRepository.save(manager);

            User guest = new User("guest", "guest@example.com", 
                                  passwordEncoder.encode("password123"), 
                                  "Guest", "User", Role.GUEST);
            guest.setPhoneNumber(null);
            guest.setProfilePictureUrl(null);
            userRepository.save(guest);

            System.out.println("✓ Test users initialized in user_service database");
        }
    }
}
