package com.dental.clinic.management.treatment_plans.repository;

import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PatientTreatmentPlan entity.
 * Handles database operations for treatment plans.
 */
@Repository
public interface PatientTreatmentPlanRepository extends JpaRepository<PatientTreatmentPlan, Long>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<PatientTreatmentPlan> {

    /**
     * Find all treatment plans for a specific patient.
     * Uses JOIN FETCH to avoid N+1 problem when loading doctor info.
     *
     * @param patientId ID of the patient
     * @return List of treatment plans with doctor info eagerly loaded
     */
    @Query("SELECT DISTINCT p FROM PatientTreatmentPlan p " +
            "LEFT JOIN FETCH p.createdBy " +
            "WHERE p.patient.patientId = :patientId " +
            "ORDER BY p.createdAt DESC")
    List<PatientTreatmentPlan> findByPatientIdWithDoctor(@Param("patientId") Integer patientId);

    /**
     * Find all treatment plans for a specific patient WITH PAGINATION (FE Issue 2.3
     * fix).
     * Uses JOIN FETCH to avoid N+1 problem when loading doctor info.
     *
     * Note: Uses COUNT query + data query approach to support pagination with JOIN
     * FETCH.
     * Spring Data JPA handles this automatically.
     *
     * @param patientId ID of the patient
     * @param pageable  Pagination parameters (page, size, sort)
     * @return Page of treatment plans with doctor info eagerly loaded
     */
    @Query("SELECT DISTINCT p FROM PatientTreatmentPlan p " +
            "LEFT JOIN FETCH p.createdBy " +
            "WHERE p.patient.patientId = :patientId " +
            "ORDER BY p.createdAt DESC")
    org.springframework.data.domain.Page<PatientTreatmentPlan> findByPatientIdWithDoctorPageable(
            @Param("patientId") Integer patientId,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Find treatment plan by plan code.
     *
     * @param planCode Unique plan code
     * @return Optional containing the treatment plan if found
     */
    Optional<PatientTreatmentPlan> findByPlanCode(String planCode);

    /**
     * Check if plan code already exists.
     *
     * @param planCode Plan code to check
     * @return true if exists, false otherwise
     */
    boolean existsByPlanCode(String planCode);

    /**
     * Count plans with a specific code prefix (for code generation).
     * Used by PlanCodeGenerator to get next sequence number.
     *
     * Example: countByPlanCodeStartingWith("PLAN-20251111-") returns 5
     * -> Next code will be PLAN-20251111-006
     *
     * @param prefix Plan code prefix (e.g., "PLAN-20251111-")
     * @return Number of plans with this prefix
     */
    long countByPlanCodeStartingWith(String prefix);

    /**
     * Find complete treatment plan details with all phases, items, and linked
     * appointments.
     * Uses JPQL Constructor Expression for single-query performance optimization.
     *
     * Query joins 5 tables:
     * - patient_treatment_plans (p)
     * - employees (emp) - creator/doctor
     * - patients (pat)
     * - patient_plan_phases (phase)
     * - patient_plan_items (item)
     * - appointment_plan_items bridge (to get appointments)
     * - appointments (apt)
     *
     * Performance notes:
     * - Single query fetches all data (no N+1 problem)
     * - Returns flat DTOs that will be grouped in service layer
     * - Each row represents one item-appointment relationship
     * - Items without appointments will have null appointment fields
     * - Recommend indexes:
     * - patients(patient_code)
     * - patient_treatment_plans(plan_code)
     * - appointment_plan_items(item_id)
     *
     * @param patientCode Business key for patient (e.g., "BN-1001")
     * @param planCode    Business key for plan (e.g., "PLAN-20251001-001")
     * @return List of flat DTOs (one row per item-appointment combo)
     */
    @Query("""
            SELECT new com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailDTO(
                p.planId, p.planCode, p.planName, p.status, p.approvalStatus, p.startDate, p.expectedEndDate,
                p.totalPrice, p.discountAmount, p.finalCost, p.paymentType, p.createdAt,
                emp.employeeCode, CONCAT(emp.firstName, ' ', emp.lastName),
                pat.patientCode, CONCAT(pat.firstName, ' ', pat.lastName),
                phase.patientPhaseId, phase.phaseNumber, phase.phaseName, phase.status,
                phase.startDate, phase.completionDate, phase.estimatedDurationDays,
                item.itemId, item.serviceId, svc.serviceCode, item.sequenceNumber, item.itemName, item.status,
                item.estimatedTimeMinutes, item.price, item.completedAt,
                apt.appointmentCode, apt.appointmentStartTime, apt.status, apt.notes
            )
            FROM PatientTreatmentPlan p
            INNER JOIN p.createdBy emp
            INNER JOIN p.patient pat
            LEFT JOIN p.phases phase
            LEFT JOIN phase.items item
            LEFT JOIN com.dental.clinic.management.service.domain.DentalService svc ON svc.serviceId = item.serviceId
            LEFT JOIN AppointmentPlanItemBridge bridge ON bridge.id.itemId = item.itemId
            LEFT JOIN Appointment apt ON apt.appointmentId = bridge.id.appointmentId
            WHERE pat.patientCode = :patientCode
              AND p.planCode = :planCode
            ORDER BY phase.phaseNumber, item.sequenceNumber
            """)
    List<com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailDTO> findDetailByPatientCodeAndPlanCode(
            @Param("patientCode") String patientCode,
            @Param("planCode") String planCode);

    // ===== Manager View: List All Treatment Plans =====

    /**
     * Find all treatment plans with optional filters (Manager View).
     *
     * Use Case: Manager needs to see all treatment plans across all patients
     * for oversight, approval management, and reporting.
     *
     * Supports filtering by:
     * - approvalStatus (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
     * - status (PENDING, ACTIVE, COMPLETED, CANCELLED)
     * - doctorEmployeeCode (filter by doctor who created plan)
     *
     * Uses LEFT JOIN FETCH to eagerly load:
     * - patient (to get patientCode, fullName)
     * - createdBy (doctor who created plan)
     * - approvedBy (manager who approved, if any)
     *
     * Performance: Single query with JOIN FETCH to avoid N+1 problem.
     *
     * @param approvalStatus     Filter by approval status (null = no filter)
     * @param status             Filter by plan status (null = no filter)
     * @param doctorEmployeeCode Filter by doctor employee code (null = no filter)
     * @param pageable           Pagination parameters
     * @return Page of treatment plans with patient and doctor info loaded
     */
    @Query(value = "SELECT DISTINCT p FROM PatientTreatmentPlan p " +
            "LEFT JOIN FETCH p.patient " +
            "LEFT JOIN FETCH p.createdBy " +
            "LEFT JOIN FETCH p.approvedBy " +
            "LEFT JOIN FETCH p.sourceTemplate t " +
            "LEFT JOIN FETCH t.specialization s " +
            "WHERE (:approvalStatus IS NULL OR p.approvalStatus = :approvalStatus) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:doctorEmployeeCode IS NULL OR p.createdBy.employeeCode = :doctorEmployeeCode) " +
            "AND (:templateId IS NULL OR t.templateId = :templateId) " +
            "AND (:specializationId IS NULL OR s.specializationId = :specializationId)", countQuery = "SELECT COUNT(DISTINCT p) FROM PatientTreatmentPlan p "
                    +
                    "LEFT JOIN p.sourceTemplate t " +
                    "LEFT JOIN t.specialization s " +
                    "WHERE (:approvalStatus IS NULL OR p.approvalStatus = :approvalStatus) " +
                    "AND (:status IS NULL OR p.status = :status) " +
                    "AND (:doctorEmployeeCode IS NULL OR p.createdBy.employeeCode = :doctorEmployeeCode) " +
                    "AND (:templateId IS NULL OR t.templateId = :templateId) " +
                    "AND (:specializationId IS NULL OR s.specializationId = :specializationId)")
    org.springframework.data.domain.Page<PatientTreatmentPlan> findAllWithFilters(
            @Param("approvalStatus") com.dental.clinic.management.treatment_plans.domain.ApprovalStatus approvalStatus,
            @Param("status") com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus status,
            @Param("doctorEmployeeCode") String doctorEmployeeCode,
            @Param("templateId") Long templateId,
            @Param("specializationId") Long specializationId,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Find all treatment plans with NULL status and specific approval status.
     * Used for Issue #47 data consistency checks (query only, update via SQL).
     *
     * @param approvalStatus Approval status filter
     * @return List of treatment plans with NULL status
     */
    List<PatientTreatmentPlan> findByStatusIsNullAndApprovalStatus(
            com.dental.clinic.management.treatment_plans.domain.ApprovalStatus approvalStatus);
}
