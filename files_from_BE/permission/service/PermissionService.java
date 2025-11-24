package com.dental.clinic.management.permission.service;

import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.exception.authorization.PermissionNotFoundException;
import com.dental.clinic.management.permission.domain.Permission;
import com.dental.clinic.management.permission.dto.request.CreatePermissionRequest;
import com.dental.clinic.management.permission.dto.request.UpdatePermissionRequest;
import com.dental.clinic.management.permission.dto.response.PermissionInfoResponse;
import com.dental.clinic.management.permission.dto.PermissionHierarchyDTO;
import com.dental.clinic.management.permission.mapper.PermissionMapper;
import com.dental.clinic.management.permission.repository.PermissionRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;

    public PermissionService(
            PermissionRepository permissionRepository,
            PermissionMapper permissionMapper) {
        this.permissionRepository = permissionRepository;
        this.permissionMapper = permissionMapper;
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public Page<PermissionInfoResponse> getAllPermissions(int page, int size, String sortBy, String sortDirection) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Permission> permissionPage = permissionRepository.findAll(pageable);
        return permissionPage.map(permissionMapper::toPermissionInfoResponse);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public List<PermissionInfoResponse> getAllActivePermissions() {
        List<Permission> permissions = permissionRepository.findAllActivePermissions();
        return permissionMapper.toPermissionInfoResponseList(permissions);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public PermissionInfoResponse getPermissionById(String permissionId) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new PermissionNotFoundException("Permission not found with ID: " + permissionId));

        return permissionMapper.toPermissionInfoResponse(permission);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public List<PermissionInfoResponse> getPermissionsByModule(String module) {
        List<Permission> permissions = permissionRepository.findByModuleAndIsActive(module, true);
        return permissionMapper.toPermissionInfoResponseList(permissions);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional
    public PermissionInfoResponse createPermission(CreatePermissionRequest request) {
        // Check if permission name already exists
        if (permissionRepository.existsByPermissionName(request.getPermissionName())) {
            throw new BadRequestAlertException(
                    "Permission with name '" + request.getPermissionName() + "' already exists",
                    "permission",
                    "permissionnameexists");
        }

        // Use permission name as the ID (e.g., CREATE_CONTACT, UPDATE_CONTACT)
        String permissionId = request.getPermissionName();

        // Create new permission
        Permission permission = new Permission(
                permissionId,
                request.getPermissionName(),
                request.getModule(),
                request.getDescription());

        Permission savedPermission = permissionRepository.save(permission);
        return permissionMapper.toPermissionInfoResponse(savedPermission);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional
    public PermissionInfoResponse updatePermission(String permissionId, UpdatePermissionRequest request) {
        Permission existingPermission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new PermissionNotFoundException("Permission not found with ID: " + permissionId));

        // Check if new permission name already exists (if being changed)
        if (request.getPermissionName() != null &&
                !request.getPermissionName().equals(existingPermission.getPermissionName()) &&
                permissionRepository.existsByPermissionName(request.getPermissionName())) {
            throw new BadRequestAlertException(
                    "Permission with name '" + request.getPermissionName() + "' already exists",
                    "permission",
                    "permissionnameexists");
        }

        // Update fields if provided
        if (request.getPermissionName() != null) {
            existingPermission.setPermissionName(request.getPermissionName());
        }
        if (request.getModule() != null) {
            existingPermission.setModule(request.getModule());
        }
        if (request.getDescription() != null) {
            existingPermission.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            existingPermission.setIsActive(request.getIsActive());
        }

        Permission updatedPermission = permissionRepository.save(existingPermission);
        return permissionMapper.toPermissionInfoResponse(updatedPermission);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional
    public void deletePermission(String permissionId) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new PermissionNotFoundException("Permission not found with ID: " + permissionId));

        // Soft delete by setting isActive to false
        permission.setIsActive(false);
        permissionRepository.save(permission);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional
    public void hardDeletePermission(String permissionId) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new PermissionNotFoundException("Permission not found with ID: " + permissionId));

        permissionRepository.delete(permission);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public boolean existsByPermissionName(String permissionName) {
        return permissionRepository.existsByPermissionName(permissionName);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public Map<String, List<PermissionInfoResponse>> getPermissionsGroupedByModule() {
        List<Permission> permissions = permissionRepository.findAllActivePermissions();
        return permissions.stream()
                .map(permissionMapper::toPermissionInfoResponse)
                .collect(Collectors.groupingBy(PermissionInfoResponse::getModule));
    }

    /**
     * Get all active permissions grouped by module with parent-child hierarchy
     * information.
     * This is used by the frontend to display permission checkboxes with three
     * levels:
     * NONE (no permission), OWN (child permission), ALL (parent permission).
     *
     * @return Map of module name to list of permissions with hierarchy info
     */
    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public Map<String, List<PermissionHierarchyDTO>> getGroupedPermissions() {
        List<Permission> permissions = permissionRepository.findAllActivePermissions();

        // Group by module and maintain order using LinkedHashMap
        return permissions.stream()
                .sorted((p1, p2) -> {
                    // Sort by module first, then by displayOrder
                    int moduleCompare = p1.getModule().compareTo(p2.getModule());
                    if (moduleCompare != 0)
                        return moduleCompare;

                    Integer order1 = p1.getDisplayOrder() != null ? p1.getDisplayOrder() : 999;
                    Integer order2 = p2.getDisplayOrder() != null ? p2.getDisplayOrder() : 999;
                    return order1.compareTo(order2);
                })
                .map(permission -> {
                    PermissionHierarchyDTO dto = new PermissionHierarchyDTO();
                    dto.setPermissionId(permission.getPermissionId());
                    dto.setPermissionName(permission.getPermissionName());
                    dto.setDisplayOrder(permission.getDisplayOrder());

                    if (permission.getParentPermission() != null) {
                        dto.setParentPermissionId(permission.getParentPermission().getPermissionId());
                        dto.setSelectionLevel("OWN"); // Child permission
                    } else {
                        dto.setParentPermissionId(null);
                        // Check if this permission has any children
                        boolean hasChildren = permissions.stream()
                                .anyMatch(p -> p.getParentPermission() != null &&
                                        p.getParentPermission().getPermissionId().equals(permission.getPermissionId()));
                        dto.setSelectionLevel(hasChildren ? "ALL" : "NONE");
                    }

                    return dto;
                })
                .collect(Collectors.groupingBy(
                        dto -> {
                            // Find the module from original permission
                            return permissions.stream()
                                    .filter(p -> p.getPermissionId().equals(dto.getPermissionId()))
                                    .findFirst()
                                    .map(Permission::getModule)
                                    .orElse("Unknown");
                        },
                        LinkedHashMap::new, // Maintain insertion order
                        Collectors.toList()));
    }

    /**
     * Get all active permissions grouped by module in simple format (Map<Module,
     * List<PermissionId>>).
     * This is useful for frontend display where you only need permission IDs
     * grouped by module.
     * Example output:
     * {
     * "PATIENT": ["VIEW_PATIENT", "CREATE_PATIENT", "EDIT_PATIENT"],
     * "APPOINTMENT": ["VIEW_APPOINTMENT", "CREATE_APPOINTMENT"],
     * ...
     * }
     *
     * @return Map of module name to list of permission IDs
     */
    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public Map<String, List<String>> getPermissionsGroupedByModuleSimple() {
        List<Permission> permissions = permissionRepository.findAllActivePermissions();

        // Group by module and maintain order
        return permissions.stream()
                .sorted((p1, p2) -> {
                    // Sort by module first, then by displayOrder
                    int moduleCompare = p1.getModule().compareTo(p2.getModule());
                    if (moduleCompare != 0)
                        return moduleCompare;

                    // If both have displayOrder, compare them
                    if (p1.getDisplayOrder() != null && p2.getDisplayOrder() != null) {
                        return p1.getDisplayOrder().compareTo(p2.getDisplayOrder());
                    }
                    // If only one has displayOrder, prioritize it
                    if (p1.getDisplayOrder() != null)
                        return -1;
                    if (p2.getDisplayOrder() != null)
                        return 1;

                    // If neither has displayOrder, sort by permission ID
                    return p1.getPermissionId().compareTo(p2.getPermissionId());
                })
                .collect(Collectors.groupingBy(
                        Permission::getModule,
                        LinkedHashMap::new, // Maintain insertion order
                        Collectors.mapping(Permission::getPermissionId, Collectors.toList())));
    }
}
