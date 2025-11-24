package com.dental.clinic.management.role.dto.response;

import java.time.LocalDateTime;

public class RoleInfoResponse {
    private String roleId;
    private String roleName;
    private String description;
    private Integer baseRoleId;
    private String baseRoleName;
    private Boolean requiresSpecialization;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public RoleInfoResponse() {
    }

    public RoleInfoResponse(String roleId, String roleName, String description, Boolean isActive,
            LocalDateTime createdAt) {
        this.roleId = roleId;
        this.roleName = roleName;
        this.description = description;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String roleId) {
        this.roleId = roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getRequiresSpecialization() {
        return requiresSpecialization;
    }

    public void setRequiresSpecialization(Boolean requiresSpecialization) {
        this.requiresSpecialization = requiresSpecialization;
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

    public Integer getBaseRoleId() {
        return baseRoleId;
    }

    public void setBaseRoleId(Integer baseRoleId) {
        this.baseRoleId = baseRoleId;
    }

    public String getBaseRoleName() {
        return baseRoleName;
    }

    public void setBaseRoleName(String baseRoleName) {
        this.baseRoleName = baseRoleName;
    }
}
