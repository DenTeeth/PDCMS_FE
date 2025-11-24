package com.dental.clinic.management.role.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateRoleRequest {

    @NotBlank(message = "Role ID is required")
    @Size(max = 50, message = "Role ID must not exceed 50 characters")
    private String roleId;

    @NotBlank(message = "Role name is required")
    @Size(max = 50, message = "Role name must not exceed 50 characters")
    private String roleName;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Base role ID is required")
    private Integer baseRoleId;

    private Boolean requiresSpecialization = false;

    public CreateRoleRequest() {
    }

    public CreateRoleRequest(String roleId, String roleName, String description) {
        this.roleId = roleId;
        this.roleName = roleName;
        this.description = description;
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

    public Integer getBaseRoleId() {
        return baseRoleId;
    }

    public void setBaseRoleId(Integer baseRoleId) {
        this.baseRoleId = baseRoleId;
    }
}
