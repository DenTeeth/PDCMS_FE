package com.dental.clinic.management.booking_appointment.repository;

import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for PatientPlanItem entity (Treatment Plan Integration)
 *
 * Purpose: Validate and update patient plan items when creating appointments
 *
 * Key Methods:
 * - findAllById(): Validate items exist (Check 1 in validatePlanItems)
 * - findByIdInWithPlanAndPhase(): Fetch with ownership data (Check 2: belong to
 * patient)
 * - saveAll(): Update status READY_FOR_BOOKING → SCHEDULED
 */
@Repository
public interface PatientPlanItemRepository extends JpaRepository<PatientPlanItem, Long> {

    /**
     * Find items by IDs with phase and plan data (for ownership validation)
     *
     * JOIN FETCH optimization to avoid N+1 queries
     * Used in validatePlanItems() to check:
     * - Items exist
     * - Items belong to patient: item.phase.plan.patient.patientId ==
     * request.patientId
     * - Items have correct status: item.status == READY_FOR_BOOKING
     *
     * @param itemIds List of item IDs from request
     * @return List of items with phase and plan data loaded
     */
    @Query("SELECT i FROM PatientPlanItem i " +
            "JOIN FETCH i.phase p " +
            "JOIN FETCH p.treatmentPlan pl " +
            "JOIN FETCH pl.patient " +
            "WHERE i.itemId IN :itemIds")
    List<PatientPlanItem> findByIdInWithPlanAndPhase(@Param("itemIds") List<Long> itemIds);

    /**
     * Find all items in a phase
     * Used in checkAndCompletePhase() to avoid lazy loading issues
     *
     * FIX Issue #40: Query items directly from database instead of relying on lazy
     * collection
     * This ensures we get fresh data from DB, not stale cached data
     *
     * @param phaseId Phase ID
     * @return List of all items in the phase
     */
    @Query("SELECT i FROM PatientPlanItem i WHERE i.phase.patientPhaseId = :phaseId")
    List<PatientPlanItem> findByPhase_PatientPhaseId(@Param("phaseId") Long phaseId);
    
    /**
     * AUTO_SCHEDULE_HOLIDAYS_AND_SPACING: Find items by plan ID and status
     * Used for auto-scheduling to get all READY_FOR_BOOKING items
     * 
     * @param planId Treatment plan ID
     * @param status Item status to filter
     * @return List of items matching criteria
     */
    @Query("SELECT i FROM PatientPlanItem i " +
           "JOIN i.phase p " +
           "JOIN p.treatmentPlan pl " +
           "WHERE pl.planId = :planId " +
           "AND i.status = :status " +
           "ORDER BY p.phaseNumber, i.sequenceNumber")
    List<PatientPlanItem> findByPlanIdAndStatus(
            @Param("planId") Long planId,
            @Param("status") com.dental.clinic.management.treatment_plans.enums.PlanItemStatus status);
}
