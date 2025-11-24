
package com.dental.clinic.management.role.service;

import com.dental.clinic.management.permission.domain.Permission;
import com.dental.clinic.management.permission.dto.response.PermissionInfoResponse;
import com.dental.clinic.management.permission.mapper.PermissionMapper;
import com.dental.clinic.management.permission.repository.PermissionRepository;
import com.dental.clinic.management.role.domain.Role;
import com.dental.clinic.management.role.dto.request.CreateRoleRequest;
import com.dental.clinic.management.role.dto.response.RoleInfoResponse;
import com.dental.clinic.management.role.dto.request.UpdateRoleRequest;
import com.dental.clinic.management.role.mapper.RoleMapper;
import com.dental.clinic.management.role.repository.RoleRepository;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;

    // --- New dependencies for CRUD ---
    private final RoleMapper roleMapper;

    public RoleService(
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            PermissionMapper permissionMapper,
            RoleMapper roleMapper) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.permissionMapper = permissionMapper;
        this.roleMapper = roleMapper;
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional
    public void assignPermissionsToRole(String roleId, List<String> permissionIds) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Role not found with ID: " + roleId,
                        "role",
                        "rolenotfound"));

        Set<Permission> permissions = new HashSet<>();
        for (String permissionId : permissionIds) {
            Permission permission = permissionRepository.findById(permissionId)
                    .orElseThrow(() -> new BadRequestAlertException(
                            "Permission not found with ID: " + permissionId,
                            "permission",
                            "permissionnotfound"));
            permissions.add(permission);
        }

        role.setPermissions(permissions);
        roleRepository.save(role);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public List<PermissionInfoResponse> getRolePermissions(String roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Role not found with ID: " + roleId,
                        "role",
                        "rolenotfound"));

        List<Permission> permissions = role.getPermissions().stream().toList();
        return permissionMapper.toPermissionInfoResponseList(permissions);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional
    public RoleInfoResponse createRole(
            CreateRoleRequest request) {
        if (roleRepository.existsById(request.getRoleId()) || roleRepository.existsByRoleName(request.getRoleName())) {
            throw new BadRequestAlertException("Role already exists", "role", "roleexists");
        }
        Role role = roleMapper.toRole(request);
        roleRepository.save(role);
        return roleMapper.toRoleInfoResponse(role);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public List<RoleInfoResponse> getAllRoles() {
        List<Role> roles = roleRepository.findAllActiveRoles();
        return roleMapper.toRoleInfoResponseList(roles);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public List<RoleInfoResponse> getEmployeeAssignableRoles() {
        List<Role> roles = roleRepository.findAllActiveRoles();
        // Filter out ROLE_PATIENT - patients cannot be employees
        List<Role> employeeRoles = roles.stream()
                .filter(role -> !"ROLE_PATIENT".equals(role.getRoleName()))
                .toList();
        return roleMapper.toRoleInfoResponseList(employeeRoles);
    }    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public RoleInfoResponse getRoleById(String roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BadRequestAlertException("Role not found with ID: " + roleId, "role",
                        "rolenotfound"));
        return roleMapper.toRoleInfoResponse(role);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional
    public RoleInfoResponse updateRole(String roleId,
            UpdateRoleRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BadRequestAlertException("Role not found with ID: " + roleId, "role",
                        "rolenotfound"));
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        if (request.getRequiresSpecialization() != null) {
            role.setRequiresSpecialization(request.getRequiresSpecialization());
        }
        roleRepository.save(role);
        return roleMapper.toRoleInfoResponse(role);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional
    public RoleInfoResponse deleteRole(String roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BadRequestAlertException("Role not found with ID: " + roleId, "role",
                        "rolenotfound"));
        // If already soft-deleted, treat as not found
        if (role.getIsActive() != null && !role.getIsActive()) {
            throw new BadRequestAlertException("Role not found with ID: " + roleId, "role", "rolenotfound");
        }

        // Soft delete: set isActive = false
        role.setIsActive(false);
        roleRepository.save(role);
        return roleMapper.toRoleInfoResponse(role);
    }
}
