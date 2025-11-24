package com.dental.clinic.management.authentication.service;

import com.dental.clinic.management.authentication.dto.SidebarItemDTO;
import com.dental.clinic.management.permission.domain.Permission;
import com.dental.clinic.management.permission.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for generating sidebar navigation based on user permissions.
 * Implements parent-child filtering logic and module grouping.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SidebarService {

    private final PermissionRepository permissionRepository;

    /**
     * Generate sidebar structure for a given role.
     *
     * Process:
     * 1. Get all permission IDs for the role (for parent-child checking)
     * 2. Get sidebar permissions (path != null)
     * 3. Filter out child permissions if user has parent permission
     * 4. Group by module
     * 5. Convert to DTO
     *
     * Results are cached by roleId.
     *
     * @param roleId the role ID
     * @return Map of module name -> list of sidebar items
     */
    @Cacheable(value = "sidebar", key = "#roleId")
    @Transactional(readOnly = true)
    public Map<String, List<SidebarItemDTO>> generateSidebar(String roleId) {
        log.debug("Generating sidebar for role: {}", roleId);

        // === 1. GET ALL PERMISSION IDS (for checking parent-child) ===
        Set<String> allUserPermissionIds = permissionRepository.findAllPermissionIdsByRoleId(roleId);
        log.debug("User has {} total permissions", allUserPermissionIds.size());

        // === 2. GET SIDEBAR CANDIDATES (path != null) ===
        List<Permission> sidebarCandidates = permissionRepository.findSidebarPermissionsByRoleId(roleId);
        log.debug("Found {} sidebar candidate permissions", sidebarCandidates.size());

        // === 3. FILTER PARENT-CHILD ===
        // If user has parent permission, remove child permission from sidebar
        List<Permission> filteredList = new ArrayList<>();
        for (Permission candidate : sidebarCandidates) {
            Permission parent = candidate.getParentPermission();

            // If this permission has a parent AND user also has that parent permission
            if (parent != null && allUserPermissionIds.contains(parent.getPermissionId())) {
                // Skip this child permission (only show parent)
                log.debug("Filtering out child permission: {} (parent: {})",
                        candidate.getPermissionId(), parent.getPermissionId());
                continue;
            }

            // Otherwise, keep this permission
            filteredList.add(candidate);
        }

        log.debug("After parent-child filtering: {} permissions", filteredList.size());

        // === 4. GROUP BY MODULE ===
        Map<String, List<Permission>> groupedByModule = filteredList.stream()
                .collect(Collectors.groupingBy(
                        Permission::getModule,
                        LinkedHashMap::new, // Preserve order
                        Collectors.toList()));

        // === 5. CONVERT TO DTO ===
        Map<String, List<SidebarItemDTO>> finalSidebar = new LinkedHashMap<>();

        for (Map.Entry<String, List<Permission>> entry : groupedByModule.entrySet()) {
            String moduleName = entry.getKey();

            // Path field removed - FE handles routing independently
            List<SidebarItemDTO> items = entry.getValue().stream()
                    .map(p -> new SidebarItemDTO(p.getPermissionName(), null))
                    .collect(Collectors.toList());

            finalSidebar.put(moduleName, items);
        }

        log.debug("Generated sidebar with {} modules - Note: path field deprecated, FE handles routing",
                finalSidebar.size());
        return finalSidebar;
    }
}
