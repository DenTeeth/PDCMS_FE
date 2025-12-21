package com.dental.clinic.management.service.repository;

import com.dental.clinic.management.service.domain.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ServiceCategory entity
 * Provides database operations for service categories management
 */
@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    /**
     * Find all active categories ordered by display order (for grouped menu API)
     */
    @Query("SELECT sc FROM ServiceCategory sc WHERE sc.isActive = true ORDER BY sc.displayOrder ASC")
    List<ServiceCategory> findAllActiveOrderByDisplayOrder();

    /**
     * Find all categories (including inactive) ordered by display order (for admin)
     */
    @Query("SELECT sc FROM ServiceCategory sc ORDER BY sc.displayOrder ASC, sc.categoryId ASC")
    List<ServiceCategory> findAllOrderByDisplayOrder();

    /**
     * Check if category code already exists (for validation)
     */
    boolean existsByCategoryCode(String categoryCode);

    /**
     * Find by category code
     */
    Optional<ServiceCategory> findByCategoryCode(String categoryCode);

    /**
     * Check if a category code exists for a different category (for update validation)
     */
    @Query("SELECT CASE WHEN COUNT(sc) > 0 THEN true ELSE false END " +
           "FROM ServiceCategory sc " +
           "WHERE sc.categoryCode = :categoryCode AND sc.categoryId <> :categoryId")
    boolean existsByCategoryCodeAndIdNot(String categoryCode, Long categoryId);
}
