package com.dental.clinic.management.treatment_plans.repository;

import com.dental.clinic.management.treatment_plans.domain.template.TreatmentPlanTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for TreatmentPlanTemplate entity.
 * Provides methods to fetch templates with their phases and services.
 */
@Repository
public interface TreatmentPlanTemplateRepository extends JpaRepository<TreatmentPlanTemplate, Long> {

    /**
     * Find template by code (simple, without eager loading)
     */
    Optional<TreatmentPlanTemplate> findByTemplateCode(String templateCode);

    /**
     * Find template by code WITH phases (NOT services).
     *
     * Used by API 5.3 to create patient plan from template.
     * Fetches template + phases in one query, services loaded lazily.
     * This avoids MultipleBagFetchException (cannot fetch 2 collections
     * simultaneously).
     *
     * @param templateCode The template code (e.g., "TPL_ORTHO_METAL")
     * @return Optional with template+phases loaded, or empty if not found
     */
    @Query("SELECT DISTINCT t FROM TreatmentPlanTemplate t LEFT JOIN FETCH t.templatePhases WHERE t.templateCode = :templateCode")
    Optional<TreatmentPlanTemplate> findByTemplateCodeWithPhasesAndServices(@Param("templateCode") String templateCode);

    /**
     * Check if template exists and is active
     */
    boolean existsByTemplateCodeAndIsActiveTrue(String templateCode);

    /**
     * Find template by code WITH phases AND services (for API 5.8).
     *
     * This query loads the FULL nested structure in 2 queries:
     * Query 1: template + phases (LEFT JOIN FETCH)
     * Query 2: services for all phases (automatic due to @OneToMany LAZY +
     * iteration)
     *
     * Use Case: API 5.8 - Get Template Detail for Hybrid workflow
     * (FE needs to see full structure to customize before creating plan)
     *
     * @param templateCode The template code (e.g., "TPL_ORTHO_METAL")
     * @return Optional with template+phases loaded, services loaded on access
     */
    @Query("SELECT DISTINCT t FROM TreatmentPlanTemplate t " +
            "LEFT JOIN FETCH t.templatePhases " +
            "WHERE t.templateCode = :templateCode")
    Optional<TreatmentPlanTemplate> findByTemplateCodeWithFullStructure(@Param("templateCode") String templateCode);

    // ===== API 6.6 - List Templates with Filters =====

    /**
     * Find all templates with optional filters (API 6.6).
     *
     * Supports filtering by:
     * - isActive (Boolean, optional)
     * - specializationId (Integer, optional)
     *
     * If both filters are null, returns all templates.
     * Includes specialization data via LEFT JOIN FETCH.
     *
     * @param isActive         Filter by active status (null = no filter)
     * @param specializationId Filter by specialization (null = no filter)
     * @param pageable         Pagination parameters
     * @return Page of templates with specialization loaded
     */
    @Query("SELECT DISTINCT t FROM TreatmentPlanTemplate t " +
            "LEFT JOIN FETCH t.specialization " +
            "WHERE (:isActive IS NULL OR t.isActive = :isActive) " +
            "AND (:specializationId IS NULL OR t.specialization.specializationId = :specializationId)")
    Page<TreatmentPlanTemplate> findAllWithFilters(
            @Param("isActive") Boolean isActive,
            @Param("specializationId") Integer specializationId,
            Pageable pageable);
}
