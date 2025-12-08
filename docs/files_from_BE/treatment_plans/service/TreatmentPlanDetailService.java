package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.patient.domain.Patient;
import com.dental.clinic.management.patient.repository.PatientRepository;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.dto.*;
import com.dental.clinic.management.treatment_plans.dto.response.ApprovalMetadataDTO;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import com.dental.clinic.management.utils.security.AuthoritiesConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for retrieving detailed treatment plan information.
 * Implements API 5.2 - GET Treatment Plan Detail (REVISED V18).
 *
 * Key Features:
 * - Single-query fetch with DTO projection (performance)
 * - O(n) grouping logic to build nested structure
 * - RBAC: VIEW_TREATMENT_PLAN_ALL vs VIEW_TREATMENT_PLAN_OWN
 * - Progress summary calculation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanDetailService {

        private final PatientTreatmentPlanRepository treatmentPlanRepository;
        private final PatientRepository patientRepository;
        private final com.dental.clinic.management.account.repository.AccountRepository accountRepository;
        private final com.dental.clinic.management.employee.repository.EmployeeRepository employeeRepository;
        private final com.dental.clinic.management.treatment_plans.repository.PlanAuditLogRepository auditLogRepository;
        private final com.dental.clinic.management.booking_appointment.repository.AppointmentRepository appointmentRepository;

        /**
         * Get complete treatment plan details with nested structure.
         *
         * API Spec: GET /api/v1/patients/{patientCode}/treatment-plans/{planCode}
         *
         * Response Structure:
         * - Plan metadata (code, name, status, dates, financial)
         * - Doctor info (code, name)
         * - Patient info (code, name)
         * - Progress summary (counts)
         * - Phases array
         * - Phase metadata (number, name, status, dates)
         * - Items array
         * - Item metadata (sequence, name, service, price, time, status, completedAt)
         * - Linked appointments array (code, date, status)
         *
         * RBAC Logic:
         * - VIEW_TREATMENT_PLAN_ALL: Staff can view all patients' plans
         * - VIEW_TREATMENT_PLAN_OWN: Patient can only view their own plans (account_id
         * verification)
         *
         * @param patientCode Business key for patient (e.g., "BN-1001")
         * @param planCode    Business key for plan (e.g., "PLAN-20251001-001")
         * @return Nested treatment plan detail response
         * @throws IllegalArgumentException if patient or plan not found
         * @throws AccessDeniedException    if user doesn't have permission
         */
        @Transactional(readOnly = true)
        public TreatmentPlanDetailResponse getTreatmentPlanDetail(String patientCode, String planCode) {
                log.info("Getting treatment plan detail - Patient: {}, Plan: {}", patientCode, planCode);

                // STEP 1: RBAC - Verify patient exists and check permissions
                @SuppressWarnings("unused")
                Patient patient = verifyPatientAccessPermission(patientCode);

                // STEP 2: Execute single query to fetch all data (flat DTOs)
                List<TreatmentPlanDetailDTO> flatDTOs = treatmentPlanRepository.findDetailByPatientCodeAndPlanCode(
                                patientCode,
                                planCode);

                if (flatDTOs.isEmpty()) {
                        log.error("Treatment plan not found - Patient: {}, Plan: {}", patientCode, planCode);
                        throw new IllegalArgumentException(
                                        String.format("Treatment plan '%s' not found for patient '%s'", planCode,
                                                        patientCode));
                }

                log.info("Retrieved {} flat DTO rows from database", flatDTOs.size());

                // STEP 2.5: RBAC - Verify createdBy for EMPLOYEE with VIEW_OWN
                verifyEmployeeCreatedByPermission(flatDTOs.get(0));

                // STEP 3: Transform flat DTOs to nested response structure
                TreatmentPlanDetailResponse response = buildNestedResponse(flatDTOs);

                // STEP 4: Add approval metadata if plan has been approved/rejected
                addApprovalMetadataIfPresent(response, patientCode, planCode);

                // STEP 5: Hide prices if user is a doctor (Task #3 - FE Issue)
                if (isCurrentUserDoctor()) {
                        hidePricesFromDetailResponse(response);
                        log.info("Prices hidden from treatment plan detail (user is doctor)");
                }

                log.info("Successfully built nested response with {} phases", response.getPhases().size());
                return response;
        }

        /**
         * Verify patient exists and user has permission to access their treatment
         * plans.
         *
         * @param patientCode Patient business key
         * @return Patient entity (for potential further use)
         * @throws IllegalArgumentException if patient not found
         * @throws AccessDeniedException    if permission denied
         */
        private Patient verifyPatientAccessPermission(String patientCode) {
                // Find patient by code WITH account (for RBAC check)
                Patient patient = patientRepository.findOneByPatientCodeWithAccount(patientCode)
                                .orElseThrow(() -> {
                                        log.error("Patient not found with code: {}", patientCode);
                                        return new IllegalArgumentException(
                                                        "Patient not found with code: " + patientCode);
                                });

                // Get authentication
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !authentication.isAuthenticated()) {
                        throw new AccessDeniedException("User not authenticated");
                }

                boolean hasViewAllPermission = authentication.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .anyMatch(auth -> auth.equals("VIEW_TREATMENT_PLAN_ALL"));

                boolean hasViewOwnPermission = authentication.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .anyMatch(auth -> auth.equals("VIEW_TREATMENT_PLAN_OWN"));

                log.debug("Permissions - VIEW_ALL: {}, VIEW_OWN: {}", hasViewAllPermission, hasViewOwnPermission);

                // Staff with VIEW_ALL can access any patient's plans
                if (hasViewAllPermission) {
                        log.info("User has VIEW_TREATMENT_PLAN_ALL permission, access granted");
                        return patient;
                }

                // VIEW_OWN permission: Check base role to determine filtering logic
                if (hasViewOwnPermission) {
                        Integer currentAccountId = getCurrentAccountId(authentication);

                        // Get account to check base role
                        com.dental.clinic.management.account.domain.Account account = accountRepository
                                        .findById(currentAccountId)
                                        .orElseThrow(() -> new AccessDeniedException(
                                                        "Account not found: " + currentAccountId));

                        Integer baseRoleId = account.getRole().getBaseRole().getBaseRoleId();
                        log.debug("User accountId={}, baseRoleId={}", currentAccountId, baseRoleId);

                        // PATIENT: Can only view their own plans (account_id verification)
                        if (baseRoleId.equals(
                                        com.dental.clinic.management.security.constants.BaseRoleConstants.PATIENT)) {
                                Integer patientAccountId = patient.getAccount() != null
                                                ? patient.getAccount().getAccountId()
                                                : null;

                                log.info("PATIENT mode: Current accountId: {}, Patient accountId: {}, Patient code: {}",
                                                currentAccountId, patientAccountId, patientCode);

                                if (patientAccountId == null) {
                                        log.error("Patient {} has null account! This is a data integrity issue.",
                                                        patientCode);
                                        throw new AccessDeniedException("Patient account information not found");
                                }

                                if (!patientAccountId.equals(currentAccountId)) {
                                        log.warn("Access denied: User accountId={} attempting to access patient {} with accountId={}",
                                                        currentAccountId, patientCode, patientAccountId);
                                        throw new AccessDeniedException("You can only view your own treatment plans");
                                }

                                log.info("Patient verified as owner of patient record, access granted");
                                return patient;
                        }

                        // EMPLOYEE: Can view plans they created (will verify createdBy in
                        // getTreatmentPlanDetail)
                        else if (baseRoleId.equals(
                                        com.dental.clinic.management.security.constants.BaseRoleConstants.EMPLOYEE)) {
                                com.dental.clinic.management.employee.domain.Employee employee = employeeRepository
                                                .findOneByAccountAccountId(currentAccountId)
                                                .orElseThrow(() -> new AccessDeniedException(
                                                                "Employee not found for account: " + currentAccountId));

                                log.info("EMPLOYEE mode: Will verify plan was created by employeeId={}",
                                                employee.getEmployeeId());
                                // Return patient, but will verify createdBy after fetching plan
                                return patient;
                        }

                        // ADMIN with VIEW_OWN (should not happen, but allow)
                        else if (baseRoleId.equals(
                                        com.dental.clinic.management.security.constants.BaseRoleConstants.ADMIN)) {
                                log.info("ADMIN with VIEW_OWN permission, access granted");
                                return patient;
                        }
                }

                // No valid permission
                log.warn("Access denied: User does not have required permissions");
                throw new AccessDeniedException("You do not have permission to view treatment plans");
        }

        /**
         * Verify that EMPLOYEE with VIEW_OWN can only view plans they created.
         *
         * @param firstRow First row from query (contains createdBy info)
         * @throws AccessDeniedException if employee trying to view plan created by
         *                               another employee
         */
        private void verifyEmployeeCreatedByPermission(TreatmentPlanDetailDTO firstRow) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !authentication.isAuthenticated()) {
                        return; // Already checked in verifyPatientAccessPermission
                }

                boolean hasViewAllPermission = authentication.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .anyMatch(auth -> auth.equals("VIEW_TREATMENT_PLAN_ALL"));

                // If user has VIEW_ALL, skip createdBy check
                if (hasViewAllPermission) {
                        return;
                }

                boolean hasViewOwnPermission = authentication.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .anyMatch(auth -> auth.equals("VIEW_TREATMENT_PLAN_OWN"));

                if (!hasViewOwnPermission) {
                        return; // Already checked in verifyPatientAccessPermission
                }

                Integer currentAccountId = getCurrentAccountId(authentication);

                // Get account to check base role
                com.dental.clinic.management.account.domain.Account account = accountRepository
                                .findById(currentAccountId)
                                .orElseThrow(() -> new AccessDeniedException("Account not found: " + currentAccountId));

                Integer baseRoleId = account.getRole().getBaseRole().getBaseRoleId();

                // Only check createdBy for EMPLOYEE
                if (!baseRoleId.equals(com.dental.clinic.management.security.constants.BaseRoleConstants.EMPLOYEE)) {
                        return;
                }

                // Get current employee
                com.dental.clinic.management.employee.domain.Employee employee = employeeRepository
                                .findOneByAccountAccountId(currentAccountId)
                                .orElseThrow(() -> new AccessDeniedException(
                                                "Employee not found for account: " + currentAccountId));

                // Get plan's creator from DTO
                String planCreatorEmployeeCode = firstRow.getDoctorEmployeeCode();

                if (planCreatorEmployeeCode == null) {
                        log.error("Plan has no creator (createdBy is null). PlanId={}", firstRow.getPlanId());
                        throw new AccessDeniedException("Cannot verify plan creator");
                }

                // Compare employee codes
                if (!employee.getEmployeeCode().equals(planCreatorEmployeeCode)) {
                        // Check if user is primary doctor of appointment linked to this plan
                        boolean isPrimaryDoctor = isPrimaryDoctorOfLinkedAppointment(
                                        employee.getEmployeeId(), firstRow.getPlanId());

                        if (isPrimaryDoctor) {
                                log.info("Access granted: Employee {} is primary doctor of appointment linked to plan {}",
                                                employee.getEmployeeCode(), firstRow.getPlanCode());
                                return; // Allow access
                        }

                        log.warn("Access denied: Employee {} (code={}) attempting to view plan created by employee {} (not primary doctor of linked appointment)",
                                        employee.getEmployeeId(), employee.getEmployeeCode(), planCreatorEmployeeCode);
                        throw new AccessDeniedException(
                                        "You can only view treatment plans that you created or that are linked to your appointments");
                }

                log.info("EMPLOYEE createdBy verification passed: Employee {} viewing plan created by {}",
                                employee.getEmployeeCode(), planCreatorEmployeeCode);
        }

        /**
         * Check if employee is primary doctor of any appointment linked to treatment
         * plan.
         *
         * Query logic:
         * 1. Find appointments where employeeId = given employeeId
         * 2. Check if any of those appointments are linked to plan items from this
         * treatment plan
         * 3. Via: appointments → appointment_plan_items → patient_plan_items → phases →
         * treatment_plan
         *
         * @param employeeId Employee ID to check
         * @param planId     Treatment plan ID
         * @return true if employee is primary doctor of at least one linked appointment
         */
        private boolean isPrimaryDoctorOfLinkedAppointment(Integer employeeId, Long planId) {
                try {
                        // Query: Find appointments by employeeId that are linked to this plan
                        // Using repository method that checks:
                        // 1. appointment.employeeId = employeeId (primary doctor)
                        // 2. appointment_plan_items exists linking to items from this plan
                        long count = appointmentRepository.countByEmployeeIdAndLinkedToPlan(employeeId, planId);

                        log.debug("Found {} appointments where employee {} is primary doctor linked to plan {}",
                                        count, employeeId, planId);

                        return count > 0;
                } catch (Exception e) {
                        log.error("Error checking if employee {} is primary doctor of appointments linked to plan {}: {}",
                                        employeeId, planId, e.getMessage());
                        return false; // Fail-safe: deny access on error
                }
        }

        /**
         * Extract account ID from JWT token.
         *
         * @param authentication Spring Security authentication object
         * @return Account ID from token
         */
        private Integer getCurrentAccountId(Authentication authentication) {
                if (authentication == null || authentication.getPrincipal() == null) {
                        throw new IllegalStateException(
                                        "Unable to extract account_id from token: no authentication principal");
                }

                if (authentication.getPrincipal() instanceof Jwt jwt) {
                        Object claim = jwt.getClaim("account_id");
                        if (claim == null) {
                                throw new IllegalStateException(
                                                "Unable to extract account_id from token: claim is null");
                        }

                        if (claim instanceof Integer) {
                                return (Integer) claim;
                        }
                        if (claim instanceof Number) {
                                return ((Number) claim).intValue();
                        }
                        if (claim instanceof String) {
                                String s = (String) claim;
                                try {
                                        return Integer.valueOf(s);
                                } catch (NumberFormatException ignored) {
                                        try {
                                                long l = Long.parseLong(s);
                                                return (int) l;
                                        } catch (NumberFormatException ex) {
                                                throw new IllegalStateException(
                                                                "Unable to parse account_id from token string: " + s);
                                        }
                                }
                        }

                        throw new IllegalStateException(
                                        "Unsupported account_id claim type: " + claim.getClass().getName());
                }
                throw new IllegalStateException("Unable to extract account_id from token: principal is not Jwt");
        }

        /**
         * Transform flat DTOs into nested response structure.
         *
         * Algorithm: O(n) single-pass grouping
         * 1. Extract plan-level metadata from first row
         * 2. Group rows by phaseId -> Map<Long, List<TreatmentPlanDetailDTO>>
         * 3. For each phase group:
         * - Extract phase metadata
         * - Group items by itemId -> Map<Long, List<TreatmentPlanDetailDTO>>
         * - For each item group:
         * - Extract item metadata
         * - Collect appointment details (filter nulls)
         * - Build ItemDetailDTO
         * - Build PhaseDetailDTO
         * 4. Calculate progress summary from all phases/items
         * 5. Build final TreatmentPlanDetailResponse
         *
         * @param flatDTOs List of flat DTOs from JPQL query
         * @return Nested response with proper hierarchy
         */
        private TreatmentPlanDetailResponse buildNestedResponse(List<TreatmentPlanDetailDTO> flatDTOs) {
                // All rows have same plan-level data, use first row
                TreatmentPlanDetailDTO firstRow = flatDTOs.get(0);

                // Extract plan-level metadata
                Long planId = firstRow.getPlanId();
                String planCode = firstRow.getPlanCode();
                String planName = firstRow.getPlanName();
                com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus planStatus = firstRow
                                .getPlanStatus();

                // Doctor info
                TreatmentPlanDetailResponse.DoctorInfoDTO doctorInfo = TreatmentPlanDetailResponse.DoctorInfoDTO
                                .builder()
                                .employeeCode(firstRow.getDoctorEmployeeCode())
                                .fullName(firstRow.getDoctorFullName())
                                .build();

                // Patient info
                TreatmentPlanDetailResponse.PatientInfoDTO patientInfo = TreatmentPlanDetailResponse.PatientInfoDTO
                                .builder()
                                .patientCode(firstRow.getPatientCode())
                                .fullName(firstRow.getPatientFullName())
                                .build();

                // Group by phaseId (handle nulls - plan might have no phases yet)
                Map<Long, List<TreatmentPlanDetailDTO>> rowsByPhase = flatDTOs.stream()
                                .filter(dto -> dto.getPhaseId() != null) // Filter out rows with null phase
                                .collect(Collectors.groupingBy(TreatmentPlanDetailDTO::getPhaseId));

                // Build phase DTOs
                List<PhaseDetailDTO> phases = new ArrayList<>();

                for (Map.Entry<Long, List<TreatmentPlanDetailDTO>> phaseEntry : rowsByPhase.entrySet()) {
                        List<TreatmentPlanDetailDTO> phaseRows = phaseEntry.getValue();
                        TreatmentPlanDetailDTO firstPhaseRow = phaseRows.get(0);

                        // Extract phase metadata (same for all rows in this group)
                        Long phaseId = firstPhaseRow.getPhaseId();
                        Integer phaseNumber = firstPhaseRow.getPhaseNumber();
                        String phaseName = firstPhaseRow.getPhaseName();
                        com.dental.clinic.management.treatment_plans.enums.PhaseStatus phaseStatus = firstPhaseRow
                                        .getPhaseStatus();
                        var phaseStartDate = firstPhaseRow.getPhaseStartDate();
                        var phaseCompletionDate = firstPhaseRow.getPhaseCompletionDate();
                        Integer estimatedDurationDays = firstPhaseRow.getEstimatedDurationDays();

                        // Group by itemId within this phase (handle nulls)
                        Map<Long, List<TreatmentPlanDetailDTO>> rowsByItem = phaseRows.stream()
                                        .filter(dto -> dto.getItemId() != null)
                                        .collect(Collectors.groupingBy(TreatmentPlanDetailDTO::getItemId));

                        // Build item DTOs
                        List<ItemDetailDTO> items = new ArrayList<>();

                        for (Map.Entry<Long, List<TreatmentPlanDetailDTO>> itemEntry : rowsByItem.entrySet()) {
                                List<TreatmentPlanDetailDTO> itemRows = itemEntry.getValue();
                                TreatmentPlanDetailDTO firstItemRow = itemRows.get(0);

                                // Extract item metadata
                                Long itemId = firstItemRow.getItemId();
                                Integer sequenceNumber = firstItemRow.getSequenceNumber();
                                String itemName = firstItemRow.getItemName();
                                Integer serviceId = firstItemRow.getItemServiceId();
                                java.math.BigDecimal price = firstItemRow.getItemPrice();
                                Integer estimatedTimeMinutes = firstItemRow.getEstimatedTimeMinutes();
                                PlanItemStatus itemStatus = firstItemRow.getItemStatus();
                                var completedAt = firstItemRow.getItemCompletedAt();

                                // Collect linked appointments (filter out nulls - item might have no
                                // appointments)
                                List<LinkedAppointmentDTO> linkedAppointments = itemRows.stream()
                                                .filter(dto -> dto.getAppointmentCode() != null)
                                                .map(dto -> LinkedAppointmentDTO.builder()
                                                                .code(dto.getAppointmentCode())
                                                                .scheduledDate(dto.getAppointmentScheduledDate())
                                                                .status(dto.getAppointmentStatus() != null
                                                                                ? dto.getAppointmentStatus().name()
                                                                                : null)
                                                                .notes(dto.getAppointmentNotes()) // Include notes from
                                                                                                  // dentist/assistant
                                                                .build())
                                                .distinct() // In case of duplicate appointments
                                                .collect(Collectors.toList());

                                // Build item DTO
                                ItemDetailDTO item = ItemDetailDTO.builder()
                                                .itemId(itemId)
                                                .sequenceNumber(sequenceNumber)
                                                .itemName(itemName)
                                                .serviceId(serviceId)
                                                .serviceCode(firstItemRow.getItemServiceCode()) // Phase 5
                                                .price(price)
                                                .estimatedTimeMinutes(estimatedTimeMinutes)
                                                .status(itemStatus != null ? itemStatus.name() : null)
                                                .completedAt(completedAt)
                                                .linkedAppointments(linkedAppointments)
                                                .build();

                                items.add(item);
                        }

                        // Sort items by sequence number
                        items.sort(Comparator.comparing(ItemDetailDTO::getSequenceNumber));

                        // Build phase DTO
                        PhaseDetailDTO phase = PhaseDetailDTO.builder()
                                        .phaseId(phaseId)
                                        .phaseNumber(phaseNumber)
                                        .phaseName(phaseName)
                                        .status(phaseStatus != null ? phaseStatus.name() : null)
                                        .startDate(phaseStartDate)
                                        .completionDate(phaseCompletionDate)
                                        .estimatedDurationDays(estimatedDurationDays)
                                        .items(items)
                                        .build();

                        phases.add(phase);
                }

                // Sort phases by phase number
                phases.sort(Comparator.comparing(PhaseDetailDTO::getPhaseNumber));

                // Calculate progress summary
                ProgressSummaryDTO progressSummary = calculateProgressSummary(phases);

                // Retrieve submit notes from audit log (if plan was submitted for review)
                String submitNotes = getSubmitNotesFromAuditLog(planId);

                // Build final response
                return TreatmentPlanDetailResponse.builder()
                                .planId(planId)
                                .planCode(planCode)
                                .planName(planName)
                                .status(planStatus != null ? planStatus.name() : null)
                                .approvalStatus(firstRow.getApprovalStatus() != null
                                                ? firstRow.getApprovalStatus().name()
                                                : null) //  V21: Added for approval workflow
                                .doctor(doctorInfo)
                                .patient(patientInfo)
                                .startDate(firstRow.getStartDate())
                                .expectedEndDate(firstRow.getExpectedEndDate())
                                .totalPrice(firstRow.getTotalPrice())
                                .discountAmount(firstRow.getDiscountAmount())
                                .finalCost(firstRow.getFinalCost())
                                .paymentType(firstRow.getPaymentType() != null ? firstRow.getPaymentType().name()
                                                : null)
                                .createdAt(firstRow.getPlanCreatedAt())
                                .submitNotes(submitNotes)
                                .progressSummary(progressSummary)
                                .phases(phases)
                                .build();
        }

        /**
         * Retrieve submit notes from audit log.
         * Looks for the most recent SUBMITTED_FOR_REVIEW action and returns its notes.
         *
         * @param planId Treatment plan ID
         * @return Submit notes, or null if not found
         */
        private String getSubmitNotesFromAuditLog(Long planId) {
                java.util.List<com.dental.clinic.management.treatment_plans.domain.PlanAuditLog> logs = auditLogRepository
                                .findByPlanIdOrderByCreatedAtDesc(planId);

                return logs.stream()
                                .filter(log -> "SUBMITTED_FOR_REVIEW".equals(log.getActionType()))
                                .findFirst()
                                .map(com.dental.clinic.management.treatment_plans.domain.PlanAuditLog::getNotes)
                                .orElse(null);
        }

        /**
         * Calculate progress summary from phases and items.
         *
         * Counts:
         * - totalPhases: All phases
         * - completedPhases: Phases with status COMPLETED
         * - totalItems: All items across all phases
         * - completedItems: Items with status COMPLETED
         * - readyForBookingItems: Items with status READY_FOR_BOOKING
         *
         * @param phases List of phase DTOs
         * @return Progress summary DTO
         */
        private ProgressSummaryDTO calculateProgressSummary(List<PhaseDetailDTO> phases) {
                int totalPhases = phases.size();

                long completedPhases = phases.stream()
                                .filter(phase -> "COMPLETED".equals(phase.getStatus()))
                                .count();

                // Flatten all items from all phases
                List<ItemDetailDTO> allItems = phases.stream()
                                .flatMap(phase -> phase.getItems().stream())
                                .collect(Collectors.toList());

                int totalItems = allItems.size();

                long completedItems = allItems.stream()
                                .filter(item -> "COMPLETED".equals(item.getStatus()))
                                .count();

                long readyForBookingItems = allItems.stream()
                                .filter(item -> "READY_FOR_BOOKING".equals(item.getStatus()))
                                .count();

                return ProgressSummaryDTO.builder()
                                .totalPhases(totalPhases)
                                .completedPhases((int) completedPhases)
                                .totalItems(totalItems)
                                .completedItems((int) completedItems)
                                .readyForBookingItems((int) readyForBookingItems)
                                .build();
        }

        /**
         * Add approval metadata to response if plan has been approved or rejected.
         * Fetches plan entity to get approvedBy, approvedAt, and rejectionReason
         * (notes).
         *
         * FE Issue #2 Fix: Ensures notes are always included in approvalMetadata
         * response.
         *
         * @param response    Response to add metadata to
         * @param patientCode Patient code (unused, kept for consistency)
         * @param planCode    Plan code
         */
        private void addApprovalMetadataIfPresent(TreatmentPlanDetailResponse response, String patientCode,
                        String planCode) {
                // Fetch plan entity to get approval fields
                PatientTreatmentPlan plan = treatmentPlanRepository.findByPlanCode(planCode)
                                .orElse(null);

                if (plan == null || plan.getApprovedBy() == null || plan.getApprovedAt() == null) {
                        return; // No approval metadata to add
                }

                // Build approval metadata
                ApprovalMetadataDTO metadata = ApprovalMetadataDTO.builder()
                                .approvedBy(ApprovalMetadataDTO.EmployeeBasicDTO.builder()
                                                .employeeCode(plan.getApprovedBy().getEmployeeCode())
                                                .fullName(plan.getApprovedBy().getFirstName() + " "
                                                                + plan.getApprovedBy().getLastName())
                                                .build())
                                .approvedAt(plan.getApprovedAt())
                                .notes(plan.getRejectionReason()) // Always include notes (FE Issue #2 fix)
                                .build();

                response.setApprovalMetadata(metadata);
                log.debug("Added approval metadata to response - approvedBy: {}, notes: {}",
                                plan.getApprovedBy().getEmployeeCode(),
                                plan.getRejectionReason() != null ? "present" : "null");
        }

        /**
         * Check if the current authenticated user is a doctor.
         * Task #3: Doctors should not see prices in treatment plans.
         *
         * @return true if user has ROLE_DOCTOR authority
         */
        private boolean isCurrentUserDoctor() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !authentication.isAuthenticated()) {
                        return false;
                }

                return authentication.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .anyMatch(auth -> auth.equals("ROLE_DENTIST")
                                                || auth.equals(AuthoritiesConstants.DOCTOR));
        }

        /**
         * Hide all price-related fields from treatment plan detail response for
         * doctors.
         * Task #3: Vietnamese FE feedback - "bác sĩ ko xem giá trong treatment plan"
         *
         * Hides:
         * - Plan-level: totalPrice, discountAmount, finalCost
         * - Item-level: price for each item in each phase
         *
         * @param response Treatment plan detail response to modify
         */
        private void hidePricesFromDetailResponse(TreatmentPlanDetailResponse response) {
                // Hide plan-level prices
                response.setTotalPrice(null);
                response.setDiscountAmount(null);
                response.setFinalCost(null);

                // Hide item-level prices in all phases
                if (response.getPhases() != null) {
                        response.getPhases().forEach(phase -> {
                                if (phase.getItems() != null) {
                                        phase.getItems().forEach(item -> item.setPrice(null));
                                }
                        });
                }

                log.debug("Hid prices from {} phases in treatment plan detail response",
                                response.getPhases() != null ? response.getPhases().size() : 0);
        }
}
