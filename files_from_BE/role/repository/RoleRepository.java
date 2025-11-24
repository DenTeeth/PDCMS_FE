package com.dental.clinic.management.role.repository;


import com.dental.clinic.management.role.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

/**
 * Spring Data JPA repository for the {@link Role} entity.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, String> {

    Optional<Role> findOneByRoleName(String roleName);

    Boolean existsByRoleName(String roleName);

    @Query("SELECT r FROM Role r WHERE r.isActive = true")
    java.util.List<Role> findAllActiveRoles();

    /**
     * Find roles (active) by a set of names including permissions eagerly.
     */
    @Query("SELECT r FROM Role r JOIN FETCH r.permissions WHERE r.roleName IN :roleNames AND r.isActive = true")
    Set<Role> findOneByRoleNamesWithPermissions(Set<String> roleNames);
}
