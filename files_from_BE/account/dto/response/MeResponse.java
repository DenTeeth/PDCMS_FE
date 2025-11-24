package com.dental.clinic.management.account.dto.response;

import com.dental.clinic.management.employee.enums.EmploymentType;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for /me endpoint.
 * Contains complete user context for FE application.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MeResponse {

    private Integer accountId;
    private String username;
    private String email;
    private String accountStatus;

    // Role information
    private String role; // Single role name (e.g., ROLE_DOCTOR)
    private String baseRole; // Base role for FE layout (admin/employee/patient)

    // Permissions
    private List<String> permissions; // All permission IDs
    private Map<String, List<String>> groupedPermissions; // Permissions grouped by module

    // Employee-specific fields
    private String fullName;
    private String phoneNumber;
    private String employeeCode;
    private EmploymentType employmentType; // FULL_TIME or PART_TIME
    private String specializationName;

    // Constructors
    public MeResponse() {
    }

    // Getters and Setters
    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

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

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }

    public Map<String, List<String>> getGroupedPermissions() {
        return groupedPermissions;
    }

    public void setGroupedPermissions(Map<String, List<String>> groupedPermissions) {
        this.groupedPermissions = groupedPermissions;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public EmploymentType getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(EmploymentType employmentType) {
        this.employmentType = employmentType;
    }

    public String getSpecializationName() {
        return specializationName;
    }

    public void setSpecializationName(String specializationName) {
        this.specializationName = specializationName;
    }

    public String getBaseRole() {
        return baseRole;
    }

    public void setBaseRole(String baseRole) {
        this.baseRole = baseRole;
    }
}
