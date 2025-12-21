package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.patient.domain.Patient;
import com.dental.clinic.management.patient.repository.PatientRepository;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.dto.DoctorInfoDTO;
import com.dental.clinic.management.treatment_plans.dto.TreatmentPlanSummaryDTO;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import com.dental.clinic.management.utils.security.AuthoritiesConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing patient treatment plans.
 * Handles business logic and RBAC for treatment plan operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanService {

    private final PatientTreatmentPlanRepository treatmentPlanRepository;
    private final PatientRepository patientRepository;
    private final com.dental.clinic.management.account.repository.AccountRepository accountRepository;
    private final com.dental.clinic.management.employee.repository.EmployeeRepository employeeRepository;

    /**
     * Get all treatment plans for a specific patient.
     * <p>
     * RBAC Logic:
     * - VIEW_TREATMENT_PLAN_ALL: Staff can view all patients' plans
     * - VIEW_TREATMENT_PLAN_OWN: Patient can only view their own plans
     *
     * @param patientCode Unique patient code
     * @return List of treatment plan summaries
     * @throws IllegalArgumentException if patient not found
     * @throws AccessDeniedException    if user doesn't have permission
     */
    @Transactional(readOnly = true)
    public List<TreatmentPlanSummaryDTO> getTreatmentPlansByPatient(String patientCode) {
        log.info("Getting treatment plans for patient: {}", patientCode);

        // STEP 1: Find patient by code
        Patient patient = patientRepository.findOneByPatientCode(patientCode)
                .orElseThrow(() -> {
                    log.error("Patient not found with code: {}", patientCode);
                    return new IllegalArgumentException("Patient not found with code: " + patientCode);
                });

        // STEP 2: RBAC - Check permissions
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

        log.debug("User has VIEW_TREATMENT_PLAN_ALL: {}", hasViewAllPermission);
        log.debug("User has VIEW_TREATMENT_PLAN_OWN: {}", hasViewOwnPermission);

        // If user has VIEW_ALL permission, allow access
        if (hasViewAllPermission) {
            log.info("User has VIEW_TREATMENT_PLAN_ALL permission, allowing access");
        }
        // If user only has VIEW_OWN permission, verify they own the patient record
        else if (hasViewOwnPermission) {
            Integer currentAccountId = getCurrentAccountId(authentication);
            Integer patientAccountId = patient.getAccount() != null ? patient.getAccount().getAccountId() : null;

            log.debug("Current account ID: {}, Patient account ID: {}", currentAccountId, patientAccountId);

            if (patientAccountId == null || !patientAccountId.equals(currentAccountId)) {
                log.warn("Access denied: User {} trying to view treatment plans of patient {} (different account)",
                        currentAccountId, patientCode);
                throw new AccessDeniedException("You can only view your own treatment plans");
            }
            log.info("User verified as owner of patient record, allowing access");
        }
        // No valid permission
        else {
            log.warn("Access denied: User does not have VIEW_TREATMENT_PLAN_ALL or VIEW_TREATMENT_PLAN_OWN permission");
            throw new AccessDeniedException("You do not have permission to view treatment plans");
        }

        // STEP 3: Query treatment plans with JOIN FETCH (avoid N+1)
        List<PatientTreatmentPlan> plans = treatmentPlanRepository.findByPatientIdWithDoctor(patient.getPatientId());
        log.info("Found {} treatment plans for patient {}", plans.size(), patientCode);

        // STEP 4: Convert to DTOs
        List<TreatmentPlanSummaryDTO> dtos = plans.stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());

        // STEP 5: Hide prices if user is a doctor (Task #3 - FE Issue)
        if (isCurrentUserDoctor()) {
                hidePricesFromSummaries(dtos);
                log.info("Prices hidden from {} treatment plan summaries (user is doctor)", dtos.size());
        }

        return dtos;
    }

    /**
     * Get treatment plans for a patient WITH PAGINATION (FE Issue 2.3 fix).
     * <p>
     * RBAC:
     * - VIEW_TREATMENT_PLAN_ALL: Can view any patient's plans
     * - VIEW_TREATMENT_PLAN_OWN: Can only view own plans
     *
     * @param patientCode Unique patient code
     * @param pageable    Pagination parameters
     * @return Page of treatment plan summaries
     */
    public Page<TreatmentPlanSummaryDTO> getTreatmentPlansByPatient(
            String patientCode, Pageable pageable) {

        log.info("Getting treatment plans for patient: {} with pagination (page: {}, size: {})",
                patientCode, pageable.getPageNumber(), pageable.getPageSize());

        // STEP 1: Verify patient exists
        Patient patient = patientRepository.findOneByPatientCode(patientCode)
                .orElseThrow(() -> {
                    log.error("Patient not found with code: {}", patientCode);
                    return new IllegalArgumentException("Patient not found with code: " + patientCode);
                });

        // STEP 2: RBAC check (same as non-paginated version)
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

        if (hasViewAllPermission) {
            log.info("User has VIEW_TREATMENT_PLAN_ALL permission, allowing paginated access");
        } else if (hasViewOwnPermission) {
            Integer currentAccountId = getCurrentAccountId(authentication);
            Integer patientAccountId = patient.getAccount() != null ? patient.getAccount().getAccountId() : null;

            if (patientAccountId == null || !patientAccountId.equals(currentAccountId)) {
                log.warn("Access denied: User {} trying to view treatment plans of patient {} (different account)",
                        currentAccountId, patientCode);
                throw new AccessDeniedException("You can only view your own treatment plans");
            }
            log.info("User verified as owner of patient record, allowing paginated access");
        } else {
            log.warn("Access denied: User does not have VIEW_TREATMENT_PLAN_ALL or VIEW_TREATMENT_PLAN_OWN permission");
            throw new AccessDeniedException("You do not have permission to view treatment plans");
        }

        // STEP 3: Query with pagination
        Page<PatientTreatmentPlan> plansPage = treatmentPlanRepository
                .findByPatientIdWithDoctorPageable(patient.getPatientId(), pageable);

        log.info("Found {} treatment plans for patient {} (total: {}, page: {}/{})",
                plansPage.getNumberOfElements(), patientCode, plansPage.getTotalElements(),
                plansPage.getNumber() + 1, plansPage.getTotalPages());

        // STEP 4: Convert to DTOs
        Page<TreatmentPlanSummaryDTO> dtoPage = plansPage.map(this::convertToSummaryDTO);

        // STEP 5: Hide prices if user is a doctor (Task #3 - FE Issue)
        if (isCurrentUserDoctor()) {
                dtoPage.getContent().forEach(this::hidePricesFromSummary);
                log.info("Prices hidden from {} treatment plan summaries (user is doctor)",
                                dtoPage.getNumberOfElements());
        }

        return dtoPage;
    }

    /**
     * Extract account ID from JWT token.
     *
     * @param authentication Spring Security authentication object
     * @return Account ID from token
     */
    private Integer getCurrentAccountId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("Unable to extract account_id from token: no authentication principal");
        }

        if (authentication.getPrincipal() instanceof Jwt jwt) {
            Object claim = jwt.getClaim("account_id");
            if (claim == null) {
                throw new IllegalStateException("Unable to extract account_id from token: claim is null");
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
                        throw new IllegalStateException("Unable to parse account_id from token string: " + s);
                    }
                }
            }

            throw new IllegalStateException("Unsupported account_id claim type: " + claim.getClass().getName());
        }
        throw new IllegalStateException("Unable to extract account_id from token: principal is not Jwt");
    }

    /**
     * Convert PatientTreatmentPlan entity to TreatmentPlanSummaryDTO.
     *
     * @param plan Treatment plan entity
     * @return Summary DTO
     */
    private TreatmentPlanSummaryDTO convertToSummaryDTO(PatientTreatmentPlan plan) {
        // Build doctor info
        DoctorInfoDTO doctorInfo = null;
        if (plan.getCreatedBy() != null) {
            doctorInfo = DoctorInfoDTO.builder()
                    .employeeCode(plan.getCreatedBy().getEmployeeCode())
                    .fullName(plan.getCreatedBy().getFullName())
                    .build();
        }

        return TreatmentPlanSummaryDTO.builder()
                .patientPlanId(plan.getPlanId())
                .planCode(plan.getPlanCode()) // CRITICAL FIX: Add planCode for FE navigation
                .patientCode(plan.getPatient().getPatientCode())
                // navigation
                .planName(plan.getPlanName())
                .status(plan.getStatus())
                .doctor(doctorInfo)
                .startDate(plan.getStartDate())
                .expectedEndDate(plan.getExpectedEndDate())
                .totalCost(plan.getTotalPrice())
                .discountAmount(plan.getDiscountAmount())
                .finalCost(plan.getFinalCost())
                .paymentType(plan.getPaymentType())
                .build();
    }

    /**
     * API 5.5: Get ALL treatment plans with advanced filtering and RBAC.
     * <p>
     * RBAC Logic (P0 Fix - Uses BaseRoleConstants):
     * - VIEW_TREATMENT_PLAN_ALL (Admin): Can filter by doctorCode/patientCode, see
     * all plans
     * - VIEW_TREATMENT_PLAN_OWN (Doctor): Auto-filtered by createdBy =
     * currentEmployee
     * - VIEW_TREATMENT_PLAN_OWN (Patient): Auto-filtered by patient =
     * currentPatient
     * <p>
     * P1 Enhancements:
     * - Date range filters (startDate, createdAt)
     * - Search term (plan name, patient name)
     * <p>
     * Performance:
     * - Uses JPA Specification for dynamic query
     * - JOIN FETCH patient, createdBy, sourceTemplate (avoids N+1)
     *
     * @param request  Filter parameters
     * @param pageable Pagination parameters
     * @return Page of treatment plan summaries
     * @throws AccessDeniedException if user doesn't have permission
     */
    @Transactional(readOnly = true)
    public Page<TreatmentPlanSummaryDTO> getAllTreatmentPlans(
            com.dental.clinic.management.treatment_plans.dto.request.GetAllTreatmentPlansRequest request,
            Pageable pageable) {

        log.info("Getting all treatment plans with filters: status={}, approvalStatus={}, searchTerm={}",
                request.getStatus(), request.getApprovalStatus(), request.getSearchTerm());

        // ============================================
        // STEP 1: Get Current User Info
        // ============================================
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }

        // Extract authorities
        boolean hasViewAllPermission = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("VIEW_TREATMENT_PLAN_ALL"));

        boolean hasViewOwnPermission = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("VIEW_TREATMENT_PLAN_OWN"));

        log.debug("User has VIEW_ALL: {}, VIEW_OWN: {}", hasViewAllPermission, hasViewOwnPermission);

        // ============================================
        // STEP 2: Build Base Specification from Request
        // ============================================
        org.springframework.data.jpa.domain.Specification<PatientTreatmentPlan> specification = com.dental.clinic.management.treatment_plans.specification.TreatmentPlanSpecification
                .buildFromRequest(request);

        // Apply RBAC filters based on role
        // Note: VIEW_TREATMENT_PLAN_OWN has different meanings depending on role:
        // - EMPLOYEE: filter by createdBy
        // - PATIENT: filter by patient

        // Get account ID from JWT using robust extractor
        Integer accountId = getCurrentAccountId(authentication);

        // Fetch account to get base role
        com.dental.clinic.management.account.domain.Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccessDeniedException("Account not found: " + accountId));

        Integer baseRoleId = account.getRole().getBaseRole().getBaseRoleId();
        log.debug("User accountId={}, baseRoleId={}", accountId, baseRoleId);

        if (baseRoleId.equals(com.dental.clinic.management.security.constants.BaseRoleConstants.EMPLOYEE)) {
            // ============================================
            // EMPLOYEE: Apply filters based on permissions
            
            // FIX: Users with VIEW_ALL permission (ADMIN/MANAGER) should not be restricted
            if (hasViewAllPermission) {
                // User has VIEW_ALL - no filtering needed, can see all plans
                log.info("EMPLOYEE mode: User has VIEW_ALL_TREATMENT_PLANS, no filtering applied");
                // Admin filters (doctorEmployeeCode, patientCode) are allowed
            } else if (hasViewOwnPermission) {
                // User has VIEW_OWN - filter by createdBy (Doctor can only see their own plans)
                com.dental.clinic.management.employee.domain.Employee employee = employeeRepository
                        .findOneByAccountAccountId(accountId)
                        .orElseThrow(() -> new AccessDeniedException("Employee not found for account: " + accountId));

                log.info("EMPLOYEE mode: Filtering by createdBy employeeId={}", employee.getEmployeeId());

                specification = specification.and(
                        com.dental.clinic.management.treatment_plans.specification.TreatmentPlanSpecification
                                .filterByCreatedByEmployee(employee.getEmployeeId()));

                // Ignore admin-only filters for regular employees
                if (request.getDoctorEmployeeCode() != null || request.getPatientCode() != null) {
                    log.warn("Employee (id={}) attempting to use admin-only filters without VIEW_ALL. Ignoring.",
                            employee.getEmployeeId());
                }
            } else {
                // No permission - deny access
                throw new AccessDeniedException(
                        "Employee must have VIEW_TREATMENT_PLAN_ALL or VIEW_TREATMENT_PLAN_OWN permission");
            }

        } else if (baseRoleId.equals(com.dental.clinic.management.security.constants.BaseRoleConstants.PATIENT)) {
            // PATIENT: Filter by patient

            if (!hasViewOwnPermission) {
                throw new AccessDeniedException("Patient must have VIEW_TREATMENT_PLAN_OWN permission");
            }

            com.dental.clinic.management.patient.domain.Patient patient = patientRepository
                    .findOneByAccountAccountId(accountId)
                    .orElseThrow(() -> new AccessDeniedException("Patient not found for account: " + accountId));

            log.info("PATIENT mode: Filtering by patientId={}", patient.getPatientId());

            specification = specification.and(
                    com.dental.clinic.management.treatment_plans.specification.TreatmentPlanSpecification
                            .filterByPatient(patient.getPatientId()));

            // Ignore admin-only filters
            if (request.getDoctorEmployeeCode() != null || request.getPatientCode() != null) {
                log.warn("Patient (id={}) attempting to use admin-only filters. Ignoring.",
                        patient.getPatientId());
            }

        } else if (baseRoleId.equals(com.dental.clinic.management.security.constants.BaseRoleConstants.ADMIN)) {
            // ADMIN: Can view all plans with optional filters

            if (!hasViewAllPermission) {
                throw new AccessDeniedException("Admin must have VIEW_TREATMENT_PLAN_ALL permission");
            }

            log.info("ADMIN mode: Can view all plans. Applying optional filters (doctorCode={}, patientCode={})",
                    request.getDoctorEmployeeCode(), request.getPatientCode());

            // No additional RBAC filter needed (admin can see everything)

        } else {
            // Unknown role
            throw new AccessDeniedException(
                    "User role cannot view treatment plans. BaseRoleId: " + baseRoleId);
        }

        // ============================================
        // STEP 4: Execute Query with Specification
        // ============================================
        Page<PatientTreatmentPlan> plans = treatmentPlanRepository.findAll(specification, pageable);

        log.info("Found {} treatment plans (page {}/{})",
                plans.getNumberOfElements(), plans.getNumber() + 1, plans.getTotalPages());

        // ============================================
        // STEP 5: Map to DTO
        // ============================================
        Page<TreatmentPlanSummaryDTO> dtoPage = plans.map(this::convertToSummaryDTO);

        // ============================================
        // STEP 6: Hide prices if user is a doctor (Task #3 - FE Issue)
        // ============================================
        if (isCurrentUserDoctor()) {
            dtoPage.getContent().forEach(this::hidePricesFromSummary);
            log.info("Prices hidden from {} treatment plan summaries (user is doctor)",
                    dtoPage.getNumberOfElements());
        }

        return dtoPage;
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
                .anyMatch(auth -> auth.equals("ROLE_DENTIST") || auth.equals(AuthoritiesConstants.DOCTOR));
    }

    /**
     * Hide all price-related fields from a single treatment plan summary DTO.
     * Task #3: Vietnamese FE feedback - "bác sĩ ko xem giá trong treatment plan"
     *
     * @param dto Treatment plan summary DTO to modify
     */
    private void hidePricesFromSummary(TreatmentPlanSummaryDTO dto) {
        dto.setTotalCost(null);
        dto.setDiscountAmount(null);
        dto.setFinalCost(null);
    }

    /**
     * Hide all price-related fields from a list of treatment plan summary DTOs.
     * Task #3: Vietnamese FE feedback - "bác sĩ ko xem giá trong treatment plan"
     *
     * @param dtos List of treatment plan summary DTOs to modify
     */
    private void hidePricesFromSummaries(List<TreatmentPlanSummaryDTO> dtos) {
        dtos.forEach(this::hidePricesFromSummary);
    }
}
