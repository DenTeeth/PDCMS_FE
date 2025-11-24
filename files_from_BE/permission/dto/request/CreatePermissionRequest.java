package com.dental.clinic.management.permission.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating a new permission
 */
public class CreatePermissionRequest {

    @NotBlank(message = "Permission name is required")
    @Size(max = 100, message = "Permission name must not exceed 100 characters")
    private String permissionName;

    @NotBlank(message = "Module is required")
    @Size(max = 20, message = "Module must not exceed 20 characters")
    private String module;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    // Constructors
    public CreatePermissionRequest() {
    }

    public CreatePermissionRequest(String permissionName, String module, String description) {
        this.permissionName = permissionName;
        this.module = module;
        this.description = description;
    }

    // Getters and Setters
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

    @Override
    public String toString() {
        return "CreatePermissionRequest{" +
                "permissionName='" + permissionName + '\'' +
                ", module='" + module + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}