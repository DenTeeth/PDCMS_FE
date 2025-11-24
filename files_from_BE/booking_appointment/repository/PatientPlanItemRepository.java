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
}
