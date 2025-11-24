package com.dental.clinic.management.permission.repository;

import com.dental.clinic.management.permission.domain.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.Set;

/**
 * Spring Data JPA repository for the {@link Permission} entity.
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {

    Optional<Permission> findOneByPermissionName(String permissionName);

    Boolean existsByPermissionName(String permissionName);

    List<Permission> findByModule(String module);

    /**
     * Return all active permissions.
     */
    @Query("SELECT p FROM Permission p WHERE p.isActive = true")
    List<Permission> findAllActivePermissions();

    List<Permission> findByModuleAndIsActive(String module, Boolean isActive);

    /**
     * Get all permission IDs for a given role (for checking parent-child logic).
     *
     * @param roleId the role ID
     * @return set of permission IDs
     */
    @Query("SELECT p.permissionId FROM Permission p JOIN p.roles r WHERE r.roleId = :roleId")
    Set<String> findAllPermissionIdsByRoleId(@Param("roleId") String roleId);

    /**
     * Get sidebar permissions for a given role.
     * Results are ordered by module and display_order.
     * Note: path field has been removed - FE handles routing independently.
     *
     * @param roleId the role ID
     * @return list of permissions for sidebar
     */
    @Query("SELECT p FROM Permission p JOIN p.roles r " +
            "WHERE r.roleId = :roleId AND p.isActive = true " +
            "ORDER BY p.module, p.displayOrder")
    List<Permission> findSidebarPermissionsByRoleId(@Param("roleId") String roleId);
}
