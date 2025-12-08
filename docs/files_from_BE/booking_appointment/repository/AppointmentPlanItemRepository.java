package com.dental.clinic.management.booking_appointment.repository;

import com.dental.clinic.management.booking_appointment.domain.AppointmentPlanItemBridge;
import com.dental.clinic.management.booking_appointment.domain.AppointmentPlanItemBridge.AppointmentPlanItemBridgeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for AppointmentPlanItemBridge table (Treatment Plan Integration)
 *
 * Purpose: Manage N-N relationship between appointments and patient plan items
 *
 * Usage in AppointmentCreationService:
 * - insertAppointmentPlanItems(): Create bridge records after appointment
 * created
 *
 * Example:
 * Request: patientPlanItemIds = [307, 308]
 * Result: Insert 2 rows:
 * - (appointmentId=123, itemId=307)
 * - (appointmentId=123, itemId=308)
 */
@Repository
public interface AppointmentPlanItemRepository
        extends JpaRepository<AppointmentPlanItemBridge, AppointmentPlanItemBridgeId> {

    /**
     * V21: Count total appointments linked to a treatment plan.
     * Used to detect first appointment (auto-activation trigger).
     *
     * Query Logic:
     * 1. Join appointment_plan_items → patient_plan_items
     * 2. Join patient_plan_items → patient_plan_phases
     * 3. Join patient_plan_phases → patient_treatment_plans
     * 4. Filter by plan_id
     * 5. Count DISTINCT appointments
     *
     * @param planId The treatment plan ID
     * @return Number of appointments linked to this plan
     */
    @Query("""
            SELECT COUNT(DISTINCT apib.id.appointmentId)
            FROM AppointmentPlanItemBridge apib
            JOIN PatientPlanItem item ON item.itemId = apib.id.itemId
            JOIN PatientPlanPhase phase ON phase.patientPhaseId = item.phase.patientPhaseId
            WHERE phase.treatmentPlan.planId = :planId
            """)
    long countAppointmentsForPlan(@Param("planId") Long planId);

    /**
     * Find all plan items linked to an appointment.
     * Used to determine which treatment plan is linked to appointment.
     *
     * @param appointmentId The appointment ID
     * @return List of bridge records for this appointment
     */
    java.util.List<AppointmentPlanItemBridge> findById_AppointmentId(Integer appointmentId);
}
