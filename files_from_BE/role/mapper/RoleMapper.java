package com.dental.clinic.management.role.mapper;

import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.role.domain.BaseRole;
import com.dental.clinic.management.role.domain.Role;
import com.dental.clinic.management.role.dto.request.CreateRoleRequest;
import com.dental.clinic.management.role.dto.response.RoleInfoResponse;
import com.dental.clinic.management.role.repository.BaseRoleRepository;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

@Component
public class RoleMapper {

    private final BaseRoleRepository baseRoleRepository;

    public RoleMapper(BaseRoleRepository baseRoleRepository) {
        this.baseRoleRepository = baseRoleRepository;
    }

    public RoleInfoResponse toRoleInfoResponse(Role role) {
        if (role == null)
            return null;
        RoleInfoResponse r = new RoleInfoResponse();
        r.setRoleId(role.getRoleId());
        r.setRoleName(role.getRoleName());
        r.setDescription(role.getDescription());
        r.setRequiresSpecialization(role.getRequiresSpecialization());
        r.setIsActive(role.getIsActive());
        r.setCreatedAt(role.getCreatedAt());
        
        // Map base role information
        if (role.getBaseRole() != null) {
            r.setBaseRoleId(role.getBaseRole().getBaseRoleId());
            r.setBaseRoleName(role.getBaseRole().getBaseRoleName());
        }
        
        return r;
    }

    public List<RoleInfoResponse> toRoleInfoResponseList(List<Role> roles) {
        return roles.stream().map(this::toRoleInfoResponse).collect(Collectors.toList());
    }

    public Role toRole(CreateRoleRequest request) {
        if (request == null)
            return null;
        
        // Fetch and validate base role
        BaseRole baseRole = baseRoleRepository.findById(request.getBaseRoleId())
                .orElseThrow(() -> new BadRequestAlertException(
                        "Base role not found with ID: " + request.getBaseRoleId(),
                        "baseRole",
                        "baserolenotfound"));
        
        Role role = new Role();
        role.setRoleId(request.getRoleId());
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        role.setBaseRole(baseRole);
        role.setRequiresSpecialization(request.getRequiresSpecialization() != null
                ? request.getRequiresSpecialization()
                : false);
        role.setIsActive(true);
        return role;
    }
}
