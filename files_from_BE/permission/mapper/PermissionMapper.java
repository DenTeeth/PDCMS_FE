package com.dental.clinic.management.permission.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.dental.clinic.management.permission.domain.Permission;
import com.dental.clinic.management.permission.dto.response.PermissionInfoResponse;
import com.dental.clinic.management.role.domain.Role;

@Component
public class PermissionMapper {

    /**
     * Convert Permission entity to PermissionInfoResponse DTO.
     */
    public PermissionInfoResponse toPermissionInfoResponse(Permission permission) {
        if (permission == null) {
            return null;
        }

        PermissionInfoResponse response = new PermissionInfoResponse();

        response.setPermissionId(permission.getPermissionId());
        response.setPermissionName(permission.getPermissionName());
        response.setModule(permission.getModule());
        response.setDescription(permission.getDescription());
        response.setIsActive(permission.getIsActive());
        response.setCreatedAt(permission.getCreatedAt());

        // Convert roles to role names
        if (permission.getRoles() != null && !permission.getRoles().isEmpty()) {
            List<String> roleNames = permission.getRoles().stream()
                    .map(Role::getRoleName)
                    .collect(Collectors.toList());
            response.setRoleNames(roleNames);
        }

        return response;
    }

    /**
     * Convert a list of Permission entities to a list of PermissionInfoResponse
     * DTOs.
     */
    public List<PermissionInfoResponse> toPermissionInfoResponseList(List<Permission> permissions) {
        if (permissions == null) {
            return null;
        }

        return permissions.stream()
                .map(this::toPermissionInfoResponse)
                .collect(Collectors.toList());
    }
}