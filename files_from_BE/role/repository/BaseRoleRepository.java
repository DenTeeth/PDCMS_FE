package com.dental.clinic.management.role.repository;

import com.dental.clinic.management.role.domain.BaseRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for BaseRole entity.
 */
@Repository
public interface BaseRoleRepository extends JpaRepository<BaseRole, Integer> {

    /**
     * Find base role by name.
     * 
     * @param baseRoleName 'admin', 'employee', or 'patient'
     * @return BaseRole if found
     */
    Optional<BaseRole> findByBaseRoleName(String baseRoleName);

    /**
     * Check if base role name exists.
     */
    boolean existsByBaseRoleName(String baseRoleName);
}
