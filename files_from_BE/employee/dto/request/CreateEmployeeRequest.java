
package com.dental.clinic.management.employee.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

import com.dental.clinic.management.employee.enums.EmploymentType;

/**
 * DTO for creating a new employee
 *
 * FLOW: Tạo Employee → Tự động tạo Account
 * - Admin cung cấp: username, email, password + thông tin employee
 * - System tự động tạo account và employee
 */
public class CreateEmployeeRequest {

    // Account information (REQUIRED - sẽ tạo account mới)
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    // Employee information (REQUIRED)
    @NotBlank(message = "Role ID is required")
    @Size(max = 50, message = "Role ID must not exceed 50 characters")
    private String roleId;

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastName;

    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must be 10-15 digits")
    private String phone;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    @NotNull(message = "Employment type is required")
    private EmploymentType employmentType;

    private Set<Integer> specializationIds;

    // Constructors
    public CreateEmployeeRequest() {
    }

    public CreateEmployeeRequest(String username, String roleId, String firstName, String lastName) {
        this.username = username;
        this.roleId = roleId;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String roleId) {
        this.roleId = roleId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Set<Integer> getSpecializationIds() {
        return specializationIds;
    }

    public void setSpecializationIds(Set<Integer> specializationIds) {
        this.specializationIds = specializationIds;
    }

    public EmploymentType getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(EmploymentType employmentType) {
        this.employmentType = employmentType;
    }

    @Override
    public String toString() {
        return "CreateEmployeeRequest{" +
                "username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", roleId=" + roleId +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", phone='" + phone + '\'' +
                ", dateOfBirth=" + dateOfBirth +
                ", employmentType=" + employmentType +
                ", specializationIds=" + specializationIds +
                '}';
    }
}
