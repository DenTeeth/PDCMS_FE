package com.dental.clinic.management.treatment_plans.repository;

import com.dental.clinic.management.treatment_plans.domain.PatientPlanPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for PatientPlanPhase entity
 *
 * Purpose: Manage treatment plan phases
 */
@Repository
public interface PatientPlanPhaseRepository extends JpaRepository<PatientPlanPhase, Long> {

    /**
     * Find phase by ID with plan and items eagerly loaded
     * Used in API 5.7 to:
     * - Validate phase exists
     * - Check phase status
     * - Get parent plan for validation
     * - Calculate next sequence number from existing items
     *
     * @param phaseId Phase ID
     * @return Optional phase with plan and items loaded
     */
    @Query("SELECT p FROM PatientPlanPhase p " +
            "LEFT JOIN FETCH p.treatmentPlan plan " +
            "LEFT JOIN FETCH p.items " +
            "WHERE p.patientPhaseId = :phaseId")
    Optional<PatientPlanPhase> findByIdWithPlanAndItems(@Param("phaseId") Long phaseId);
}
