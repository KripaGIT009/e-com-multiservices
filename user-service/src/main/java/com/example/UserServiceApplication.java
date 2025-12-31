package com.example;

import com.example.entity.User;
import com.example.repository.UserRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;

@SpringBootApplication
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initializeUsers(UserRepository userRepository) {
        return args -> {
            // Check if test users already exist
            if (userRepository.findByEmail("customer@example.com").isEmpty()) {
                User customer = new User("customer", "customer@example.com", "password", "Test", "Customer", "CUSTOMER");
                userRepository.save(customer);
                System.out.println("✓ Created test customer user: customer@example.com / password");
            }
            
            if (userRepository.findByEmail("admin@example.com").isEmpty()) {
                User admin = new User("admin", "admin@example.com", "password", "Admin", "User", "ADMIN");
                userRepository.save(admin);
                System.out.println("✓ Created test admin user: admin@example.com / password");
            }
        };
    }
}
