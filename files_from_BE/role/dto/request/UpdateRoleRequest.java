package com.dental.clinic.management.role.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateRoleRequest {

    @NotBlank(message = "Role name is required")
    @Size(max = 50, message = "Role name must not exceed 50 characters")
    private String roleName;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private Boolean requiresSpecialization;

    public UpdateRoleRequest() {
    }

    public UpdateRoleRequest(String roleName, String description) {
        this.roleName = roleName;
        this.description = description;
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
}
