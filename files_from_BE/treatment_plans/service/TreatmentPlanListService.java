package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.dto.response.TreatmentPlanSummaryDTO;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for listing all treatment plans (Manager View).
 *
 * Purpose: Allow managers to view all treatment plans across all patients
 * for oversight, approval management, and reporting.
 *
 * Features:
 * - Pagination support
 * - Filter by approval status
 * - Filter by plan status
 * - Filter by doctor
 * - Lightweight response (no phases/items detail)
 *
 * Permission: VIEW_ALL_TREATMENT_PLANS (assigned to ROLE_MANAGER)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanListService {

    private final PatientTreatmentPlanRepository planRepository;

    /**
     * List all treatment plans with optional filters.
     *
     * Business Logic:
     * 1. Apply filters (approvalStatus, status, doctorCode)
     * 2. Load plans with patient and doctor info (JOIN FETCH)
     * 3. Apply pagination
     * 4. Map to lightweight DTO
     *
     * Use Cases:
     * - Manager dashboard: List all plans
     * - Approval queue: Filter by PENDING_REVIEW
     * - Doctor performance: Filter by doctorEmployeeCode
     * - Reporting: Filter by status and date range
     *
     * @param approvalStatus     Filter by approval status (null = all)
     * @param status             Filter by plan status (null = all)
     * @param doctorEmployeeCode Filter by doctor (null = all)
     * @param templateId         Filter by template ID (null = all)
     * @param specializationId   Filter by specialization ID (null = all)
     * @param pageable           Pagination parameters
     * @return Page of TreatmentPlanSummaryDTO
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('VIEW_ALL_TREATMENT_PLANS')")
    public Page<TreatmentPlanSummaryDTO> listAllPlans(
            ApprovalStatus approvalStatus,
            TreatmentPlanStatus status,
            String doctorEmployeeCode,
            Long templateId,
            Long specializationId,
            Pageable pageable) {

        log.info("🔍 Manager listing all treatment plans - approvalStatus={}, status={}, doctor={}, templateId={}, specializationId={}, page={}, size={}",
                approvalStatus, status, doctorEmployeeCode, templateId, specializationId, pageable.getPageNumber(), pageable.getPageSize());

        // STEP 1: Query with filters and pagination
        Page<PatientTreatmentPlan> plansPage = planRepository.findAllWithFilters(
                approvalStatus,
                status,
                doctorEmployeeCode,
                templateId,
                specializationId,
                pageable);

        log.info("Found {} treatment plans (total={}, page={}/{})",
                plansPage.getNumberOfElements(),
                plansPage.getTotalElements(),
                plansPage.getNumber() + 1,
                plansPage.getTotalPages());

        // STEP 2: Map to lightweight DTO
        return plansPage.map(this::mapToSummaryDTO);
    }

    /**
     * Map PatientTreatmentPlan entity to TreatmentPlanSummaryDTO.
     *
     * Lightweight mapping (no phases/items, just plan-level info).
     */
    private TreatmentPlanSummaryDTO mapToSummaryDTO(PatientTreatmentPlan plan) {
        // Build patient summary
        TreatmentPlanSummaryDTO.PatientSummary patientSummary = null;
        if (plan.getPatient() != null) {
            patientSummary = TreatmentPlanSummaryDTO.PatientSummary.builder()
                    .patientCode(plan.getPatient().getPatientCode())
                    .fullName(plan.getPatient().getFirstName() + " " + plan.getPatient().getLastName())
                    .phone(plan.getPatient().getPhone())
                    .build();
        }

        // Build doctor summary
        TreatmentPlanSummaryDTO.DoctorSummary doctorSummary = null;
        if (plan.getCreatedBy() != null) {
            doctorSummary = TreatmentPlanSummaryDTO.DoctorSummary.builder()
                    .employeeCode(plan.getCreatedBy().getEmployeeCode())
                    .fullName(plan.getCreatedBy().getFirstName() + " " + plan.getCreatedBy().getLastName())
                    .build();
        }

        // Build approved by name
        String approvedByName = null;
        if (plan.getApprovedBy() != null) {
            approvedByName = plan.getApprovedBy().getFirstName() + " " + plan.getApprovedBy().getLastName();
        }

        // Build main DTO
        return TreatmentPlanSummaryDTO.builder()
                .planCode(plan.getPlanCode())
                .planName(plan.getPlanName())
                .patient(patientSummary)
                .doctor(doctorSummary)
                .status(plan.getStatus())
                .approvalStatus(plan.getApprovalStatus())
                .totalPrice(plan.getTotalPrice())
                .finalCost(plan.getFinalCost())
                .startDate(plan.getStartDate())
                .expectedEndDate(plan.getExpectedEndDate())
                .createdAt(plan.getCreatedAt())
                .approvedByName(approvedByName)
                .approvedAt(plan.getApprovedAt())
                .build();
    }
}
