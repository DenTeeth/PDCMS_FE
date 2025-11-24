package com.dental.clinic.management.account.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * User profile response containing personal information and roles.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Integer id;
    private String username;
    private String email;
    private String accountStatus;
    private List<String> roles; // Có roles nhưng không có permissions

    // Personal info
    private String fullName;
    private String phoneNumber;
    private String address;
    private String dateOfBirth;
    private String specializationName;

    // Meta info
    private LocalDateTime createdAt;
}
