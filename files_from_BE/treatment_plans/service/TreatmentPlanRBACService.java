package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.account.domain.Account;
import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.security.constants.BaseRoleConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

/**
 * RBAC (Role-Based Access Control) Helper Service for Treatment Plans.
 *
 * Core Responsibilities:
 * 1. Extract account_id from JWT (handle Integer/Long/String types)
 * 2. Verify EMPLOYEE can only modify plans they created (createdBy check)
 * 3. Enforce PATIENT cannot modify plans (read-only)
 * 4. Allow ADMIN/MANAGER to modify all plans
 *
 * Pattern for UPDATE operations (APIs 5.6, 5.7, 5.10, 5.11):
 * - EMPLOYEE with UPDATE_TREATMENT_PLAN → check createdBy == current employee
 * - PATIENT with UPDATE_TREATMENT_PLAN → REJECT (patients cannot modify)
 * - ADMIN with UPDATE_TREATMENT_PLAN → ALLOW (can modify all)
 *
 * Used by:
 * - TreatmentPlanItemService (API 5.6)
 * - TreatmentPlanItemAdditionService (API 5.7)
 * - TreatmentPlanItemUpdateService (API 5.10)
 * - TreatmentPlanItemDeletionService (API 5.11)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanRBACService {

    private final AccountRepository accountRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Extract account_id from JWT token with type safety.
     * Handles multiple runtime types: Integer, Long, Number, String.
     *
     * @param authentication Spring Security Authentication object
     * @return account_id as Integer
     * @throws ResourceNotFoundException if account_id claim is missing
     * @throws NumberFormatException     if string claim cannot be parsed
     */
    public Integer getCurrentAccountId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
            throw new ResourceNotFoundException(
                    "AUTHENTICATION_REQUIRED",
                    "Valid JWT authentication required");
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();
        Object claim = jwt.getClaim("account_id");

        log.debug("🔐 JWT account_id claim type: {}", claim != null ? claim.getClass().getName() : "null");

        if (claim == null) {
            throw new ResourceNotFoundException(
                    "ACCOUNT_ID_CLAIM_MISSING",
                    "JWT token missing account_id claim");
        }

        // Handle Integer (direct)
        if (claim instanceof Integer) {
            return (Integer) claim;
        }

        // Handle Long (from BIGSERIAL)
        if (claim instanceof Number) {
            return ((Number) claim).intValue();
        }

        // Handle String (parse)
        if (claim instanceof String) {
            try {
                return Integer.parseInt((String) claim);
            } catch (NumberFormatException e) {
                throw new NumberFormatException(
                        "Invalid account_id format in JWT: " + claim);
            }
        }

        throw new IllegalStateException(
                "Unsupported account_id claim type: " + claim.getClass().getName());
    }

    /**
     * Verify EMPLOYEE can modify the treatment plan (createdBy check).
     *
     * RBAC Rules:
     * - EMPLOYEE: Can only modify plans where createdBy == current employee
     * - PATIENT: Cannot modify plans (throw AccessDeniedException)
     * - ADMIN: Can modify all plans (skip verification)
     *
     * @param plan           The treatment plan to check
     * @param authentication Current user's authentication
     * @throws AccessDeniedException     if user lacks permission to modify the plan
     * @throws ResourceNotFoundException if account/employee not found
     */
    public void verifyEmployeeCanModifyPlan(
            PatientTreatmentPlan plan,
            Authentication authentication) {

        Integer accountId = getCurrentAccountId(authentication);
        log.info("🔒 RBAC Check: accountId={} trying to modify planId={}", accountId, plan.getPlanId());

        // Fetch account and baseRole
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ACCOUNT_NOT_FOUND",
                        "Account not found with ID: " + accountId));

        Integer baseRoleId = account.getRole().getBaseRole().getBaseRoleId();
        String baseRoleName = account.getRole().getBaseRole().getBaseRoleName();

        log.info("👤 User baseRole: {} (id={})", baseRoleName, baseRoleId);

        // ADMIN: Allow access to all plans
        if (baseRoleId.equals(BaseRoleConstants.ADMIN)) {
            log.info("✅ ADMIN user - Access granted to modify any plan");
            return;
        }

        // PATIENT: Reject modification attempts
        if (baseRoleId.equals(BaseRoleConstants.PATIENT)) {
            log.warn("❌ PATIENT user attempted to modify plan - REJECTED");
            throw new AccessDeniedException(
                    "Patients cannot modify treatment plans. Please contact your dentist.");
        }

        // EMPLOYEE: Verify createdBy
        if (baseRoleId.equals(BaseRoleConstants.EMPLOYEE)) {
            Employee employee = employeeRepository.findOneByAccountAccountId(accountId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "EMPLOYEE_NOT_FOUND",
                            "Employee record not found for accountId: " + accountId));

            String currentEmployeeCode = employee.getEmployeeCode();

            // Get plan creator employee
            Employee planCreator = plan.getCreatedBy();
            if (planCreator == null) {
                log.error("❌ Plan {} has no creator (createdBy is null)", plan.getPlanId());
                throw new AccessDeniedException("Treatment plan has no creator information");
            }

            String planCreatorEmployeeCode = planCreator.getEmployeeCode();

            log.info("🔍 EMPLOYEE createdBy check: current={}, planCreator={}",
                    currentEmployeeCode, planCreatorEmployeeCode);

            if (!currentEmployeeCode.equals(planCreatorEmployeeCode)) {
                log.warn("❌ Access DENIED: Employee {} tried to modify plan created by {}",
                        currentEmployeeCode, planCreatorEmployeeCode);
                throw new AccessDeniedException(
                        String.format("You can only modify treatment plans that you created. " +
                                "This plan was created by %s", planCreatorEmployeeCode));
            }

            log.info("✅ EMPLOYEE createdBy verification passed");
            return;
        }

        // Unknown role
        log.error("❌ Unknown baseRoleId: {}", baseRoleId);
        throw new AccessDeniedException("Unknown user role: " + baseRoleId);
    }

    /**
     * Extract base role ID from current authentication.
     * Utility method for components that need role info without full RBAC check.
     *
     * @param authentication Current user's authentication
     * @return baseRoleId (1=ADMIN, 2=EMPLOYEE, 3=PATIENT)
     */
    public Integer getCurrentUserBaseRoleId(Authentication authentication) {
        Integer accountId = getCurrentAccountId(authentication);
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ACCOUNT_NOT_FOUND",
                        "Account not found with ID: " + accountId));
        return account.getRole().getBaseRole().getBaseRoleId();
    }
}
