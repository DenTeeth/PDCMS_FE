package com.dental.clinic.management.service.repository;

import com.dental.clinic.management.service.domain.DentalService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for DentalService entity
 * V17: Added queries with JOIN FETCH to avoid N+1 problem
 */
@Repository
public interface DentalServiceRepository extends JpaRepository<DentalService, Long> {

    /**
     * Find service by code
     */
    Optional<DentalService> findByServiceCode(String serviceCode);

    /**
     * Check if service code exists
     */
    boolean existsByServiceCode(String serviceCode);

    /**
     * Check if service code exists (excluding specific ID - for updates)
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM DentalService s " +
           "WHERE s.serviceCode = :serviceCode AND s.serviceId <> :serviceId")
    boolean existsByServiceCodeAndIdNot(@Param("serviceCode") String serviceCode, 
                                        @Param("serviceId") Long serviceId);

    /**
     * Get all active services grouped by category (with JOIN FETCH to avoid N+1)
     * Used for PUBLIC and INTERNAL grouped APIs
     */
    @Query("SELECT s FROM DentalService s " +
           "LEFT JOIN FETCH s.category c " +
           "WHERE s.isActive = true AND (c IS NULL OR c.isActive = true) " +
           "ORDER BY c.displayOrder, s.displayOrder")
    List<DentalService> findAllActiveServicesWithCategory();

    /**
     * Get all services (admin) with category info
     * Supports filtering by category, search term, and active status
     */
    @Query("SELECT s FROM DentalService s " +
           "LEFT JOIN FETCH s.category c " +
           "WHERE (:categoryId IS NULL OR c.categoryId = :categoryId) " +
           "AND (:isActive IS NULL OR s.isActive = :isActive) " +
           "AND (:searchTerm IS NULL OR " +
           "     LOWER(s.serviceName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "     LOWER(s.serviceCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<DentalService> findAllServicesWithFilters(@Param("categoryId") Long categoryId,
                                                    @Param("isActive") Boolean isActive,
                                                    @Param("searchTerm") String searchTerm,
                                                    Pageable pageable);

    /**
     * Count active services in a category
     * Used to prevent deleting category with active services
     */
    @Query("SELECT COUNT(s) FROM DentalService s " +
           "WHERE s.category.categoryId = :categoryId AND s.isActive = true")
    long countActiveServicesByCategory(@Param("categoryId") Long categoryId);
}
