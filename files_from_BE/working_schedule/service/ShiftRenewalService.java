package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.employee.EmployeeNotFoundException;
import com.dental.clinic.management.utils.security.AuthoritiesConstants;
import com.dental.clinic.management.working_schedule.domain.FixedRegistrationDay;
import com.dental.clinic.management.working_schedule.domain.FixedShiftRegistration;
import com.dental.clinic.management.working_schedule.domain.ShiftRenewalRequest;
import com.dental.clinic.management.working_schedule.dto.request.FinalizeRenewalRequest;
import com.dental.clinic.management.working_schedule.dto.request.RenewalResponseRequest;
import com.dental.clinic.management.working_schedule.dto.response.ShiftRenewalResponse;
import com.dental.clinic.management.working_schedule.enums.RenewalStatus;
import com.dental.clinic.management.working_schedule.exception.*;
import com.dental.clinic.management.working_schedule.mapper.ShiftRenewalMapper;
import com.dental.clinic.management.working_schedule.repository.FixedRegistrationDayRepository;
import com.dental.clinic.management.working_schedule.repository.FixedShiftRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.ShiftRenewalRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling shift renewal requests for employees with FIXED shift
 * registrations (Luồng 1).
 * <p>
 * - Luồng 1 (Fixed): Employees with full-time or fixed part-time schedules
 * (fixed_shift_registrations)
 * - Luồng 2 (Flex): Employees with flexible shift selections
 * (part_time_registrations)
 * <p>
 * P7 (Shift Renewal Management) ONLY applies to Luồng 1 employees.
 * <p>
 * BUSINESS LOGIC:
 * - When CONFIRMED: Deactivate old registration (is_active=FALSE) and CREATE
 * new one with extended dates (audit trail)
 * - When DECLINED: Require decline_reason TEXT
 * - Use PESSIMISTIC_WRITE lock to prevent race conditions during concurrent
 * responses
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShiftRenewalService {

    private final ShiftRenewalRequestRepository renewalRepository;
    private final FixedShiftRegistrationRepository fixedRegistrationRepository;
    private final FixedRegistrationDayRepository fixedRegistrationDayRepository;
    private final EmployeeRepository employeeRepository;
    private final AccountRepository accountRepository;
    private final ShiftRenewalMapper mapper;

    /**
     * Get all pending renewal requests for the current employee.
     * Only returns non-expired requests in PENDING_ACTION status.
     * Only employees with fixed_shift_registrations can have renewal requests.
     *
     * @param username the username from JWT token (sub field)
     * @return list of pending renewals
     */
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.VIEW_RENEWAL_OWN + "')")
    public List<ShiftRenewalResponse> getPendingRenewals(String username) {
        log.info("Getting pending renewals for username: {}", username);

        // Convert username to employee ID
        Integer employeeId = getEmployeeIdFromUsername(username);

        List<ShiftRenewalRequest> renewals = renewalRepository.findPendingByEmployeeId(
                employeeId,
                LocalDateTime.now());

        log.info("Found {} pending renewals for employee ID: {}", renewals.size(), employeeId);

        return renewals.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Respond to a renewal request (CONFIRMED or DECLINED).
     * INSERT new registration with extended dates, mark old as is_active=FALSE
     * (audit trail).
     * WORKFLOW:
     * 1. Find renewal with PESSIMISTIC_WRITE lock (prevent concurrent updates)
     * 2. Verify ownership (employee_id match)
     * 3. Validate status = PENDING_ACTION
     * 4. Validate not expired (expires_at > NOW)
     * 5. If DECLINED: Require decline_reason (throw DeclineReasonRequiredException)
     * 6. If CONFIRMED:
     * - Lock fixed_shift_registration (FOR UPDATE via findByIdWithLock)
     * - Check is_active = TRUE (throw RegistrationInactiveException)
     * - Deactivate old: UPDATE is_active = FALSE
     * - Create new: INSERT with effective_from = old_to + 1, effective_to = old_to
     * + 1 year
     * - Copy all registration_days from old to new
     * 7. Update renewal: set status, confirmed_at, decline_reason (if DECLINED)
     * 8. Commit transaction
     *
     * @param renewalId  the renewal ID (VARCHAR(20) format: SRR_YYYYMMDD_XXXXX)
     * @param username   the username from JWT token (sub field)
     * @param request    the response (action: CONFIRMED|DECLINED, declineReason:
     *                   TEXT if DECLINED)
     * @return updated renewal response
     * @throws RenewalNotFoundException       if renewal not found
     * @throws NotRenewalOwnerException       if not owned by employee
     * @throws InvalidRenewalStateException   if status != PENDING_ACTION
     * @throws RenewalExpiredException        if expires_at <= NOW
     * @throws DeclineReasonRequiredException if action=DECLINED and
     *                                        declineReason=NULL
     * @throws RegistrationInactiveException  if fixed registration is_active=FALSE
     */
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.RESPOND_RENEWAL_OWN + "')")
    @Transactional
    public ShiftRenewalResponse respondToRenewal(
            String renewalId,
            String username,
            RenewalResponseRequest request) {
        log.info("Username {} responding to renewal {}: action={}, hasDeclineReason={}",
                username, renewalId, request.getAction(), request.getDeclineReason() != null);

        // Convert username to employee ID
        Integer employeeId = getEmployeeIdFromUsername(username);

        // 1. Find renewal WITH PESSIMISTIC_WRITE lock (SELECT FOR UPDATE)
        ShiftRenewalRequest renewal = renewalRepository.findByIdWithLock(renewalId)
                .orElseThrow(() -> new RenewalNotFoundException(renewalId));

        // 2. Verify ownership
        if (!renewal.getEmployee().getEmployeeId().equals(employeeId)) {
            throw new NotRenewalOwnerException(renewalId, employeeId);
        }

        // 3. Validate state: Must be PENDING_ACTION
        if (!renewal.isPending()) {
            throw new InvalidRenewalStateException(renewalId, renewal.getStatus().name());
        }

        // 4. Validate not expired
        if (renewal.isExpired()) {
            throw new RenewalExpiredException(renewalId, renewal.getExpiresAt());
        }

        // 5. Determine new status
        RenewalStatus newStatus = "CONFIRMED".equals(request.getAction())
                ? RenewalStatus.CONFIRMED
                : RenewalStatus.DECLINED;

        // 6. If DECLINED, validate decline_reason is provided
        if (newStatus == RenewalStatus.DECLINED) {
            if (request.getDeclineReason() == null || request.getDeclineReason().trim().isEmpty()) {
                throw new DeclineReasonRequiredException();
            }
            renewal.setDeclineReason(request.getDeclineReason().trim());
            log.info("Renewal {} DECLINED with reason: {}", renewalId, request.getDeclineReason());
        }

        // 7. Update renewal status and confirmed timestamp
        renewal.setStatus(newStatus);
        renewal.setConfirmedAt(LocalDateTime.now());

        // Do NOT auto-extend registration when CONFIRMED
        // Old registration remains unchanged, awaiting Admin to finalize with custom
        // effective_to
        if (newStatus == RenewalStatus.CONFIRMED) {
            log.info("Renewal {} CONFIRMED by employee. Awaiting Admin finalization.", renewalId);
        }

        ShiftRenewalRequest saved = renewalRepository.save(renewal);
        log.info("Renewal {} status updated to {}", renewalId, newStatus);

        return mapper.toResponse(saved);
    }

    /**
     * ADMIN API: Finalize renewal with custom effective_to date.
     * <p>
     * WORKFLOW:
     * 1. Find renewal by ID (must be CONFIRMED status)
     * 2. Validate newEffectiveTo > old effective_to
     * 3. Lock old registration with PESSIMISTIC_WRITE
     * 4. Deactivate old: SET is_active = FALSE
     * 5. Create new registration with admin-specified effective_to
     * 6. Copy all registration_days
     * 7. Update renewal status to FINALIZED
     * <p>
     * PERMISSION: MANAGE_FIXED_REGISTRATIONS (Admin only)
     *
     * @param request FinalizeRenewalRequest with renewalRequestId and
     *                newEffectiveTo
     * @return ShiftRenewalResponse with FINALIZED status
     * @throws RenewalNotFoundException        if renewal not found
     * @throws NotConfirmedByEmployeeException if status != CONFIRMED
     * @throws InvalidEffectiveToException     if newEffectiveTo <= old effective_to
     * @throws RegistrationInactiveException   if old registration is_active=FALSE
     */
    @Transactional
    public ShiftRenewalResponse finalizeRenewal(FinalizeRenewalRequest request) {
        log.info("Admin finalizing renewal {}: newEffectiveTo={}",
                request.getRenewalRequestId(), request.getNewEffectiveTo());

        // 1. Find renewal (no need for lock here, employee already responded)
        ShiftRenewalRequest renewal = renewalRepository.findById(request.getRenewalRequestId())
                .orElseThrow(() -> new RenewalNotFoundException(request.getRenewalRequestId()));

        // 2. Validate renewal status = CONFIRMED (employee must agree first)
        if (renewal.getStatus() != RenewalStatus.CONFIRMED) {
            throw new NotConfirmedByEmployeeException(
                    request.getRenewalRequestId(),
                    renewal.getStatus().name());
        }

        FixedShiftRegistration oldRegistration = renewal.getExpiringRegistration();
        Integer oldRegId = oldRegistration.getRegistrationId();

        // 3. Validate newEffectiveTo > old effective_to
        LocalDate oldEffectiveTo = oldRegistration.getEffectiveTo();
        if (request.getNewEffectiveTo().isBefore(oldEffectiveTo) ||
                request.getNewEffectiveTo().isEqual(oldEffectiveTo)) {
            throw new InvalidEffectiveToException(oldEffectiveTo, request.getNewEffectiveTo());
        }

        // 4. Lock old registration (SELECT FOR UPDATE)
        FixedShiftRegistration lockedOldReg = fixedRegistrationRepository.findByIdWithLock(oldRegId)
                .orElseThrow(() -> new RegistrationNotFoundException(oldRegId));

        // 5. Validate old registration is still active
        if (!lockedOldReg.getIsActive()) {
            throw new RegistrationInactiveException(oldRegId);
        }

        // 6. Deactivate old registration (soft delete for audit trail)
        lockedOldReg.setIsActive(false);
        fixedRegistrationRepository.save(lockedOldReg);
        log.info("Deactivated old registration {}", oldRegId);

        // 7. Calculate new date range: old_to + 1 day → admin-specified date
        LocalDate newEffectiveFrom = lockedOldReg.getEffectiveTo().plusDays(1);
        LocalDate newEffectiveTo = request.getNewEffectiveTo();

        // 8. Create new registration (INSERT) with admin-specified effective_to
        FixedShiftRegistration newRegistration = new FixedShiftRegistration();
        newRegistration.setWorkShift(lockedOldReg.getWorkShift());
        newRegistration.setEmployee(lockedOldReg.getEmployee());
        newRegistration.setEffectiveFrom(newEffectiveFrom);
        newRegistration.setEffectiveTo(newEffectiveTo);
        newRegistration.setIsActive(true);
        newRegistration.setCreatedAt(LocalDateTime.now());
        newRegistration.setUpdatedAt(LocalDateTime.now());

        FixedShiftRegistration savedNewReg = fixedRegistrationRepository.save(newRegistration);
        log.info("Created new registration {} (from {} to {})",
                savedNewReg.getRegistrationId(), newEffectiveFrom, newEffectiveTo);

        // 9. Copy all registration_days from old to new
        copyRegistrationDays(lockedOldReg.getRegistrationId(), savedNewReg.getRegistrationId());

        // 10. Update renewal status to FINALIZED
        renewal.setStatus(RenewalStatus.FINALIZED);
        ShiftRenewalRequest finalizedRenewal = renewalRepository.save(renewal);
        log.info("Renewal {} finalized successfully", request.getRenewalRequestId());

        return mapper.toResponse(finalizedRenewal);
    }

    /**
     * @deprecated Use finalizeRenewal() for Admin API instead.
     *             NOTE: This method is kept for reference but no longer used.
     *             Extension logic moved to Admin-controlled finalize API.
     */
    @SuppressWarnings("unused")
    @Deprecated
    private void createExtendedRegistration(FixedShiftRegistration oldRegistration) {
        Integer oldRegId = oldRegistration.getRegistrationId();
        log.info("Creating extended registration for old registration ID: {}", oldRegId);

        // 1. Lock old registration (SELECT FOR UPDATE via refresh + lock)
        FixedShiftRegistration lockedOldReg = fixedRegistrationRepository.findByIdWithLock(oldRegId)
                .orElseThrow(() -> new RegistrationNotFoundException(oldRegId));

        // 2. Validate old registration is still active
        if (!lockedOldReg.getIsActive()) {
            throw new RegistrationInactiveException(oldRegId);
        }

        // 3. Deactivate old registration (soft delete for audit trail)
        lockedOldReg.setIsActive(false);
        fixedRegistrationRepository.save(lockedOldReg);
        log.info("Deactivated old registration {}", oldRegId);

        // 4. Calculate new date range: old_to + 1 day → old_to + 1 year
        LocalDate newEffectiveFrom = lockedOldReg.getEffectiveTo().plusDays(1);
        LocalDate newEffectiveTo = lockedOldReg.getEffectiveTo().plusYears(1);

        // 5. Create new registration (INSERT)
        FixedShiftRegistration newRegistration = new FixedShiftRegistration();
        newRegistration.setWorkShift(lockedOldReg.getWorkShift());
        newRegistration.setEmployee(lockedOldReg.getEmployee());
        newRegistration.setEffectiveFrom(newEffectiveFrom);
        newRegistration.setEffectiveTo(newEffectiveTo);
        newRegistration.setIsActive(true); // New registration is active
        newRegistration.setCreatedAt(LocalDateTime.now());
        newRegistration.setUpdatedAt(LocalDateTime.now());

        FixedShiftRegistration savedNewReg = fixedRegistrationRepository.save(newRegistration);
        log.info("Created new registration {} (from {} to {})",
                savedNewReg.getRegistrationId(), newEffectiveFrom, newEffectiveTo);

        // 6. Copy all registration_days from old to new
        copyRegistrationDays(lockedOldReg.getRegistrationId(), savedNewReg.getRegistrationId());
    }

    /**
     * Copy all fixed_registration_days from old fixed_shift_registration to new
     * one.
     * <p>
     * SCHEMA: fixed_registration_days (
     * registration_id INTEGER REFERENCES
     * fixed_shift_registrations(registration_id),
     * day_of_week VARCHAR(10) CHECK (day_of_week IN ('MONDAY', 'TUESDAY', ...)),
     * PRIMARY KEY (registration_id, day_of_week)
     * )
     *
     * @param oldRegId the old registration ID
     * @param newRegId the new registration ID
     */
    private void copyRegistrationDays(Integer oldRegId, Integer newRegId) {
        // Find new FixedShiftRegistration to use in relationship
        FixedShiftRegistration newReg = fixedRegistrationRepository.findById(newRegId)
                .orElseThrow(() -> new RegistrationNotFoundException(newRegId));

        // Find all days from old registration via repository
        List<FixedRegistrationDay> oldDays = fixedRegistrationDayRepository.findAll().stream()
                .filter(day -> day.getFixedShiftRegistration().getRegistrationId().equals(oldRegId))
                .collect(Collectors.toList());

        if (oldDays.isEmpty()) {
            log.warn("No fixed_registration_days found for old registration {}, skipping copy", oldRegId);
            return;
        }

        List<FixedRegistrationDay> newDays = oldDays.stream()
                .map(oldDay -> {
                    FixedRegistrationDay newDay = new FixedRegistrationDay();
                    newDay.setFixedShiftRegistration(newReg);
                    newDay.setDayOfWeek(oldDay.getDayOfWeek());
                    return newDay;
                })
                .collect(Collectors.toList());

        fixedRegistrationDayRepository.saveAll(newDays);
        log.info("Copied {} fixed_registration_days from {} to {}", newDays.size(), oldRegId, newRegId);
    }

    /**
     * Create a renewal request for an expiring fixed shift registration.
     * This method is called by the scheduled job (P9) to auto-create renewals 14
     * days before expiration.
     * <p>
     * Works with fixed_shift_registrations (INTEGER ID), not
     * part_time_registrations (STRING ID).
     *
     * @param registrationId the expiring fixed_shift_registration ID (INTEGER)
     * @return created renewal response
     * @throws RegistrationNotFoundException if registration not found
     * @throws InvalidRenewalStateException  if renewal already exists
     */
    @Transactional
    public ShiftRenewalResponse createRenewalRequest(Integer registrationId) {
        log.info("Creating renewal request for fixed_shift_registration ID: {}", registrationId);

        // 1. Find fixed shift registration
        FixedShiftRegistration registration = fixedRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new RegistrationNotFoundException(registrationId));

        // 2. Verify employee exists
        Employee employee = employeeRepository.findById(registration.getEmployee().getEmployeeId())
                .orElseThrow(() -> new EmployeeNotFoundException(registration.getEmployee().getEmployeeId()));

        // 3. Check if renewal already exists for this registration
        boolean exists = renewalRepository.existsByRegistrationIdAndStatus(
                registrationId,
                RenewalStatus.PENDING_ACTION);

        if (exists) {
            log.warn("Renewal request already exists for registration {}", registrationId);
            throw new InvalidRenewalStateException(
                    "RENEWAL_EXISTS",
                    String.format("Renewal request already exists for registration %d", registrationId));
        }

        // 4. Create renewal request
        ShiftRenewalRequest renewal = new ShiftRenewalRequest();
        renewal.setExpiringRegistration(registration);
        renewal.setEmployee(employee);
        renewal.setStatus(RenewalStatus.PENDING_ACTION);
        // Expires at the end of registration's effective_to date
        renewal.setExpiresAt(registration.getEffectiveTo().atTime(23, 59, 59));
        // No static message field - will be generated dynamically in mapper

        ShiftRenewalRequest saved = renewalRepository.save(renewal);
        log.info("Created renewal request {} for registration {}", saved.getRenewalId(), registrationId);

        return mapper.toResponse(saved);
    }

    /**
     * Mark expired renewals as EXPIRED.
     * This method is called by a scheduled job.
     *
     * @return number of renewals marked as expired
     */
    @Transactional
    public int markExpiredRenewals() {
        List<ShiftRenewalRequest> expiredRenewals = renewalRepository
                .findExpiredPendingRenewals(LocalDateTime.now());

        expiredRenewals.forEach(renewal -> {
            renewal.setStatus(RenewalStatus.EXPIRED);
            log.info("Marked renewal {} as EXPIRED", renewal.getRenewalId());
        });

        renewalRepository.saveAll(expiredRenewals);

        log.info("Marked {} renewals as EXPIRED", expiredRenewals.size());
        return expiredRenewals.size();
    }

    /**
     * Helper method to convert username from JWT token to employee ID.
     * <p>
     * WORKFLOW:
     * 1. Find account by username
     * 2. Get associated employee
     * 3. Return employee ID
     *
     * @param username the username from JWT token (sub field)
     * @return employee ID
     * @throws RuntimeException if user not authenticated or employee not found
     */
    private Integer getEmployeeIdFromUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new RuntimeException("Username cannot be null or empty");
        }

        return accountRepository.findOneByUsername(username)
                .map(account -> {
                    if (account.getEmployee() == null) {
                        throw new RuntimeException("No employee associated with user: " + username);
                    }
                    return account.getEmployee().getEmployeeId();
                })
                .orElseThrow(() -> new RuntimeException("Account not found for username: " + username));
    }
}
