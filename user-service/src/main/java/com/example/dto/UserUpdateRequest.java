package com.example.dto;

import com.example.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    
    private String username;
    
    @Email(message = "Email must be valid")
    private String email;
    
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
    
    private String firstName;
    
    private String lastName;
    
    private Role role;
    
    @Pattern(regexp = "^\\+?[0-9\\s\\-\\(\\)]{7,20}$", message = "Phone number must be valid")
    private String phoneNumber;
    
    @Pattern(regexp = "^https?://.*$", message = "Profile picture URL must be a valid HTTP or HTTPS URL")
    private String profilePictureUrl;
}
