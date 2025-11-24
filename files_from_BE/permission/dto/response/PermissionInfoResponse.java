package com.dental.clinic.management.permission.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for permission information response
 */
public class PermissionInfoResponse {

    private String permissionId;
    private String permissionName;
    private String module;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private List<String> roleNames;

    // Constructors
    public PermissionInfoResponse() {
    }

    public PermissionInfoResponse(String permissionId, String permissionName, String module, 
                                String description, Boolean isActive, LocalDateTime createdAt) {
        this.permissionId = permissionId;
        this.permissionName = permissionName;
        this.module = module;
        this.description = description;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public String getPermissionId() {
        return permissionId;
    }

    public void setPermissionId(String permissionId) {
        this.permissionId = permissionId;
    }

    public String getPermissionName() {
        return permissionName;
    }

    public void setPermissionName(String permissionName) {
        this.permissionName = permissionName;
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<String> getRoleNames() {
        return roleNames;
    }

    public void setRoleNames(List<String> roleNames) {
        this.roleNames = roleNames;
    }

    @Override
    public String toString() {
        return "PermissionInfoResponse{" +
                "permissionId='" + permissionId + '\'' +
                ", permissionName='" + permissionName + '\'' +
                ", module='" + module + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}