package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.working_schedule.domain.PartTimeRegistration;
import com.dental.clinic.management.working_schedule.domain.PartTimeSlot;
import com.dental.clinic.management.working_schedule.enums.RegistrationStatus;
import com.dental.clinic.management.working_schedule.exception.RegistrationNotFoundException;
import com.dental.clinic.management.working_schedule.exception.RegistrationInvalidStateException;
import com.dental.clinic.management.working_schedule.exception.RegistrationConflictException;
import com.dental.clinic.management.working_schedule.exception.QuotaExceededException;
import com.dental.clinic.management.working_schedule.exception.SlotNotFoundException;
import com.dental.clinic.management.working_schedule.exception.WeeklyHoursExceededException;
import com.dental.clinic.management.working_schedule.repository.PartTimeRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.PartTimeSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.OptimisticLockingFailureException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing approval/rejection of part-time registration requests.
 * 
 * NEW SPECIFICATION:
 * - Manager approves/rejects pending registrations
 * - Validates quota before approval
 * - Requires reason for rejection
 * - Only APPROVED registrations count toward quota
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PartTimeRegistrationApprovalService {

    private final PartTimeRegistrationRepository registrationRepository;
    private final PartTimeSlotRepository slotRepository;
    private final PartTimeSlotAvailabilityService availabilityService;
    private final EmployeeRepository employeeRepository;
    private final EmployeeShiftService employeeShiftService;
    
    // Weekly hours limit for PART_TIME_FLEX employees
    private static final double FULL_TIME_HOURS_PER_WEEK = 42.0; // 8h × 6 days
    private static final double PART_TIME_FLEX_LIMIT_PERCENTAGE = 0.5; // 50%
    private static final double WEEKLY_HOURS_LIMIT = FULL_TIME_HOURS_PER_WEEK * PART_TIME_FLEX_LIMIT_PERCENTAGE; // 21h

    /**
     * Approve a pending registration.
     * 
     * Validations:
     * 1. Registration must exist and be PENDING
     * 2. Slot must still be active
     * 3. Quota must not be exceeded for ANY working day
     * 
     * @param registrationId The registration ID
     * @param managerId The manager approving
     * @throws RegistrationNotFoundException if not found or not pending
     * @throws IllegalStateException if quota would be exceeded
     */
    public void approveRegistration(Integer registrationId, Integer managerId) {
        log.info("Manager {} approving registration {}", managerId, registrationId);

        // Retry loop for optimistic locking races. We'll attempt the transactional approve up to 3 times.
        int maxAttempts = 3;
        int attempt = 0;
        while (true) {
            attempt++;
            try {
                attemptApproveTransactional(registrationId, managerId);
                // success
                return;
            } catch (OptimisticLockingFailureException e) {
                log.warn("Optimistic locking failure on approve attempt {}/{} for registration {}: {}", attempt, maxAttempts, registrationId, e.getMessage());
                if (attempt >= maxAttempts) {
                    // rethrow as runtime so caller sees failure
                    throw e;
                }
                // small backoff
                try {
                    Thread.sleep(50L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted while retrying approval", ie);
                }
                // retry
            }
        }
    }

    /**
     * Single transactional attempt to validate and approve a registration.
     * Keeping this method @Transactional ensures each attempt runs in its own transaction
     * so optimistic locking is effective.
     */
    @Transactional
    protected void attemptApproveTransactional(Integer registrationId, Integer managerId) {
        PartTimeRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RegistrationNotFoundException(registrationId.toString()));

        // Validate status
        if (registration.getStatus() != RegistrationStatus.PENDING) {
            throw new RegistrationInvalidStateException(registrationId, registration.getStatus().name());
        }

        // Validate slot exists and is active
        PartTimeSlot slot = slotRepository.findById(registration.getPartTimeSlotId())
                .orElseThrow(() -> new SlotNotFoundException(registration.getPartTimeSlotId()));

        if (!slot.getIsActive()) {
            throw new RegistrationInvalidStateException(registrationId, "SLOT_INACTIVE");
        }

        // FIX BUG #1: Check for overlapping registrations (same employee, same slot)
        validateNoOverlappingRegistrations(registration, slot);

        // Validate quota for all working days
        validateQuotaBeforeApproval(registration, slot);

        // FIX BUG #3: Check for existing employee shifts before approval
        validateNoExistingShifts(registration, slot);

        // NEW: Validate weekly hours limit (must not exceed 21h/week)
        validateWeeklyHoursLimit(registration, slot);

        // Approve
        registration.setStatus(RegistrationStatus.APPROVED);
        registration.setProcessedBy(managerId);
        registration.setProcessedAt(LocalDateTime.now());
        registrationRepository.save(registration);
        registrationRepository.flush(); // FIX ISSUE #2: Ensure approval is visible immediately

        // INTEGRATION POINT: Create employee shifts for all working days
        // Using NEW generic shift generation method (replaces deprecated createShiftsForApprovedRegistration)
        log.info("🔄 Starting shift generation for PART_TIME_FLEX registration {}", registrationId);
        
        try {
            // Extract days of week from slot (e.g., "MONDAY,WEDNESDAY,FRIDAY" → [1,3,5])
            List<Integer> daysOfWeek = extractDaysOfWeekFromSlot(slot);
            
            log.debug("Registration {} details: slot={}, shift={}, days={}, period={} to {}",
                    registrationId, slot.getSlotId(), slot.getWorkShift().getWorkShiftId(),
                    daysOfWeek, registration.getEffectiveFrom(), registration.getEffectiveTo());
            
            // Call new generic method
            List<com.dental.clinic.management.working_schedule.domain.EmployeeShift> createdShifts = 
                employeeShiftService.createShiftsForRegistration(
                    registration.getEmployeeId(),
                    slot.getWorkShift().getWorkShiftId(),
                    registration.getEffectiveFrom(),
                    registration.getEffectiveTo(),
                    daysOfWeek,
                    "PART_TIME_FLEX",  // Source type for tracking
                    registration.getRegistrationId().longValue(),  // Link to registration
                    managerId
                );
            
            log.info("✅ Registration {} approved by manager {} with {} shifts created (source: PART_TIME_FLEX, sourceId: {})", 
                    registrationId, managerId, createdShifts.size(), registration.getRegistrationId());
                    
        } catch (Exception e) {
            log.error("❌ Failed to generate shifts for registration {}: {}. Registration is APPROVED but shifts not created.",
                    registrationId, e.getMessage(), e);
            // Don't rollback approval - shifts can be regenerated via backfill endpoint
            // Just log the error for admin to investigate
        }
    }

    /**
     * Reject a pending registration.
     * 
     * @param registrationId The registration ID
     * @param managerId The manager rejecting
     * @param reason The rejection reason (REQUIRED)
     * @throws RegistrationNotFoundException if not found or not pending
     * @throws IllegalArgumentException if reason is empty
     */
    @Transactional
    public void rejectRegistration(Integer registrationId, Integer managerId, String reason) {
        log.info("Manager {} rejecting registration {} with reason: {}", managerId, registrationId, reason);

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }

        PartTimeRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RegistrationNotFoundException(registrationId.toString()));

        // Validate status
        if (registration.getStatus() != RegistrationStatus.PENDING) {
            throw new RegistrationInvalidStateException(registrationId, registration.getStatus().name());
        }

        // Reject
        registration.setStatus(RegistrationStatus.REJECTED);
        registration.setReason(reason.trim());
        registration.setProcessedBy(managerId);
        registration.setProcessedAt(LocalDateTime.now());
        registrationRepository.save(registration);
        registrationRepository.flush(); // FIX ISSUE #2: Ensure rejection is visible immediately

        log.info("Registration {} rejected by manager {}", registrationId, managerId);
    }

    /**
     * Validate that approving this registration won't exceed quota on any day.
     * 
     * Logic:
     * 1. Get all working days for this registration
     * 2. For each day, count current approved registrations
     * 3. If any day would exceed quota, throw exception
     * 
     * Example:
     * - Slot quota: 2
     * - Registration: 2025-11-17 to 2025-11-30 (FRIDAY, SATURDAY)
     * - Working days: 11/22, 11/23, 11/29, 11/30
     * - Check each day: if any has 2+ approved, reject
     * 
     * @param registration The registration to approve
     * @param slot The slot being registered for
     * @throws IllegalStateException if quota would be exceeded
     */
    private void validateQuotaBeforeApproval(PartTimeRegistration registration, PartTimeSlot slot) {
        List<LocalDate> workingDays;
        if (registration.getRequestedDates() != null && !registration.getRequestedDates().isEmpty()) {
            workingDays = java.util.List.copyOf(registration.getRequestedDates());
        } else {
            workingDays = availabilityService.getWorkingDays(
                    slot,
                    registration.getEffectiveFrom(),
                    registration.getEffectiveTo()
            );
        }

        for (LocalDate workingDay : workingDays) {
            long currentRegistered = availabilityService.getRegisteredCountForDate(
                    slot.getSlotId(),
                    workingDay
            );

            if (currentRegistered >= slot.getQuota()) {
                // throw structured exception so GlobalExceptionHandler returns 409 with details
                throw new QuotaExceededException(slot.getSlotId(), workingDay, currentRegistered, slot.getQuota());
            }
        }

        log.debug("Quota validation passed for registration {}", registration.getRegistrationId());
    }

    /**
     * Validate that approving this registration won't exceed weekly hours limit.
     * 
     * Business Rule: PART_TIME_FLEX employees cannot work more than 21h/week (50% of 42h).
     * 
     * Logic:
     * 1. Calculate current APPROVED hours only (PENDING don't count yet)
     * 2. Calculate hours this registration would add (shift_duration × days_per_week)
     * 3. If (approved + new) > 21h, throw WeeklyHoursExceededException
     * 
     * Examples:
     * - Employee has: 16h APPROVED, validating 4h PENDING → 16h + 4h = 20h ≤ 21h ✅ APPROVE
     * - Employee has: 20h APPROVED, validating 4h PENDING → 20h + 4h = 24h > 21h ❌ REJECT
     * - Employee has: 16h APPROVED + 4h PENDING A + 4h PENDING B:
     *   * Validating A: 16h + 4h = 20h ✅ (B is still PENDING, doesn't count)
     *   * Validating B: 16h + 4h = 20h ✅ (A is still PENDING, doesn't count)
     * 
     * @param registration The registration to approve
     * @param slot The slot being registered for
     * @throws WeeklyHoursExceededException if limit would be exceeded
     */
    private void validateWeeklyHoursLimit(PartTimeRegistration registration, PartTimeSlot slot) {
        Integer employeeId = registration.getEmployeeId();
        
        if (employeeId == null) {
            log.error("Cannot validate weekly hours: employee ID is null for registration {}", 
                     registration.getRegistrationId());
            throw new IllegalArgumentException("Employee ID cannot be null");
        }
        
        if (slot == null || slot.getWorkShift() == null) {
            log.error("Cannot validate weekly hours: slot or work shift is null for registration {}", 
                     registration.getRegistrationId());
            throw new IllegalArgumentException("Slot and work shift information are required");
        }
        
        // Calculate current APPROVED hours only (PENDING registrations don't count yet)
        double currentApprovedHours = calculateWeeklyHours(employeeId);
        
        // Calculate hours for THIS registration being validated
        double thisRegistrationHours = 0.0;
        Double shiftDuration = slot.getWorkShift().getDurationHours();
        if (shiftDuration != null && shiftDuration > 0) {
            String dayOfWeek = slot.getDayOfWeek();
            if (dayOfWeek != null && !dayOfWeek.trim().isEmpty()) {
                String[] daysArray = dayOfWeek.split(",");
                int daysPerWeek = daysArray.length;
                thisRegistrationHours = shiftDuration * daysPerWeek;
                log.debug("Registration {} hours calculated: {}h/week ({}h/day × {} days)",
                         registration.getRegistrationId(), thisRegistrationHours, 
                         shiftDuration, daysPerWeek);
            }
        }
        
        // Validate hours calculation
        if (thisRegistrationHours <= 0) {
            log.warn("Calculated hours per week is zero or negative for registration {}: {}h. Skipping validation.",
                    registration.getRegistrationId(), thisRegistrationHours);
            return;
        }
        
        // Calculate final total: current approved hours + this new registration
        double finalTotalWeeklyHours = currentApprovedHours + thisRegistrationHours;
        
        // Check if total would exceed limit
        if (finalTotalWeeklyHours > WEEKLY_HOURS_LIMIT) {
            log.warn("Weekly hours limit exceeded for employee {}: currentApproved={}h, newReg={}h, total={}h, limit={}h",
                     employeeId, currentApprovedHours, thisRegistrationHours, 
                     finalTotalWeeklyHours, WEEKLY_HOURS_LIMIT);
            throw new WeeklyHoursExceededException(employeeId, finalTotalWeeklyHours, WEEKLY_HOURS_LIMIT,
                                                   currentApprovedHours, thisRegistrationHours);
        }
        
        log.info("Weekly hours validation passed for employee {}: currentApproved={}h, newReg={}h, finalTotal={}h (limit: {}h)", 
                employeeId, currentApprovedHours, thisRegistrationHours, finalTotalWeeklyHours, WEEKLY_HOURS_LIMIT);
    }

    /**
     * Get all pending registrations (for manager approval list).
     * Ordered by creation date (oldest first).
     * 
     * @return List of pending registrations
     */
    @Transactional(readOnly = true)
    public List<PartTimeRegistration> getPendingRegistrations() {
        return registrationRepository.findByStatusOrderByCreatedAtAsc(RegistrationStatus.PENDING);
    }

    /**
     * Get pending registrations for a specific slot.
     * 
     * @param slotId The slot ID
     * @return List of pending registrations for that slot
     */
    @Transactional(readOnly = true)
    public List<PartTimeRegistration> getPendingRegistrationsForSlot(Long slotId) {
        return registrationRepository.findByPartTimeSlotIdAndStatus(slotId, RegistrationStatus.PENDING);
    }
    
    /**
     * Calculate total weekly hours for a PART_TIME_FLEX employee.
     * 
     * Business Rule: Part-time flex employees cannot work more than 50% of full-time hours.
     * Full-time = 42h/week (8h × 6 days) → Limit = 21h/week
     * 
     * Logic:
     * - Count ONLY APPROVED registrations
     * - For each registration, calculate hours per week:
     *   hours_per_week = shift_duration × working_days_per_week
     * - Example: Shift 8h-12h (4h), MONDAY+FRIDAY (2 days) = 4h × 2 = 8h/week
     * 
     * Note: Shift duration already excludes lunch break (calculated in WorkShift.getDurationHours())
     * 
     * @param employeeId Employee ID
     * @return Total weekly hours from all APPROVED registrations only
     */
    private double calculateWeeklyHours(Integer employeeId) {
        if (employeeId == null) {
            log.error("Cannot calculate weekly hours: employee ID is null");
            throw new IllegalArgumentException("Employee ID cannot be null");
        }
        
        log.debug("Calculating weekly hours for employee {}", employeeId);
        
        try {
            // Get ONLY APPROVED registrations (PENDING should not be counted)
            List<PartTimeRegistration> activeRegistrations = registrationRepository
                .findByEmployeeIdAndStatusIn(employeeId, 
                    List.of(RegistrationStatus.APPROVED));
            
            if (activeRegistrations == null || activeRegistrations.isEmpty()) {
                log.debug("No active registrations found for employee {}", employeeId);
                return 0.0;
            }
            
            log.debug("Found {} APPROVED registrations for employee {}", 
                     activeRegistrations.size(), employeeId);
            
            double totalWeeklyHours = 0.0;
            int validRegistrations = 0;
            int skippedRegistrations = 0;
            
            for (PartTimeRegistration registration : activeRegistrations) {
                try {
                    if (registration == null) {
                        log.warn("Null registration found in list for employee {}", employeeId);
                        skippedRegistrations++;
                        continue;
                    }
                    
                    // Get slot details
                    PartTimeSlot slot = slotRepository.findById(registration.getPartTimeSlotId())
                        .orElse(null);
                    
                    if (slot == null) {
                        log.warn("Slot not found for registration {}, slotId: {}", 
                                registration.getRegistrationId(), registration.getPartTimeSlotId());
                        skippedRegistrations++;
                        continue;
                    }
                    
                    if (!slot.getIsActive()) {
                        log.debug("Skipping registration {} - slot {} is inactive", 
                                 registration.getRegistrationId(), slot.getSlotId());
                        skippedRegistrations++;
                        continue;
                    }
                    
                    if (slot.getWorkShift() == null) {
                        log.warn("Work shift not found for registration {}, slot {}", 
                                registration.getRegistrationId(), slot.getSlotId());
                        skippedRegistrations++;
                        continue;
                    }
                    
                    // Get shift duration (already excludes lunch break)
                    Double shiftDuration = slot.getWorkShift().getDurationHours();
                    if (shiftDuration == null || shiftDuration <= 0) {
                        log.warn("Invalid shift duration for registration {}: {}", 
                                registration.getRegistrationId(), shiftDuration);
                        skippedRegistrations++;
                        continue;
                    }
                    
                    // Count working days per week for this slot
                    String dayOfWeek = slot.getDayOfWeek();
                    if (dayOfWeek == null || dayOfWeek.trim().isEmpty()) {
                        log.warn("Invalid day of week for registration {}: '{}'", 
                                registration.getRegistrationId(), dayOfWeek);
                        skippedRegistrations++;
                        continue;
                    }
                    
                    // Example: "MONDAY,WEDNESDAY,FRIDAY" → 3 days
                    String[] daysArray = dayOfWeek.split(",");
                    int daysPerWeek = daysArray.length;
                    
                    if (daysPerWeek <= 0) {
                        log.warn("No valid days found for registration {}", registration.getRegistrationId());
                        skippedRegistrations++;
                        continue;
                    }
                    
                    // Calculate hours per week for this registration
                    double hoursPerWeek = shiftDuration * daysPerWeek;
                    totalWeeklyHours += hoursPerWeek;
                    validRegistrations++;
                    
                    log.debug("Registration {}: slot={}, shift={}h, days={}, hours/week={}h (status: {})",
                             registration.getRegistrationId(), slot.getSlotId(), 
                             shiftDuration, daysPerWeek, hoursPerWeek, registration.getStatus());
                             
                } catch (Exception e) {
                    log.error("Error calculating hours for registration {}: {}", 
                             (registration != null ? registration.getRegistrationId() : "unknown"), 
                             e.getMessage(), e);
                    skippedRegistrations++;
                    // Continue with next registration
                }
            }
            
            log.info("Employee {} total weekly hours: {}h (limit: {}h), valid: {}, skipped: {}", 
                    employeeId, totalWeeklyHours, WEEKLY_HOURS_LIMIT, validRegistrations, skippedRegistrations);
            
            return totalWeeklyHours;
            
        } catch (Exception e) {
            log.error("Error calculating weekly hours for employee {}: {}", employeeId, e.getMessage(), e);
            throw new RuntimeException("Failed to calculate weekly hours for employee " + employeeId, e);
        }
    }

    /**
     * Check if a registration can be approved (quota check).
     * Returns true if approval won't exceed quota.
     * 
     * @param registrationId The registration ID
     * @return true if can be approved
     */
    @Transactional(readOnly = true)
    public boolean canApprove(Integer registrationId) {
        try {
            PartTimeRegistration registration = registrationRepository.findById(registrationId)
                    .orElse(null);
            
            if (registration == null || registration.getStatus() != RegistrationStatus.PENDING) {
                return false;
            }

            PartTimeSlot slot = slotRepository.findById(registration.getPartTimeSlotId())
                    .orElse(null);
            
            if (slot == null || !slot.getIsActive()) {
                return false;
            }

            validateQuotaBeforeApproval(registration, slot);
            return true;
        } catch (Exception e) {
            log.debug("Cannot approve registration {}: {}", registrationId, e.getMessage());
            return false;
        }
    }

    /**
     * Bulk approve multiple registrations.
     * Each registration is validated individually.
     * Returns success/failure details for each registration.
     * 
     * @param registrationIds List of registration IDs to approve
     * @param managerId The manager performing bulk approval
     * @return Bulk approval result with success/failure details
     */
    @Transactional
    public com.dental.clinic.management.working_schedule.dto.response.BulkApproveResponse bulkApprove(
            List<Integer> registrationIds, Integer managerId) {
        log.info("Bulk approving {} registrations by manager {}", registrationIds.size(), managerId);
        
        java.util.List<Integer> successfulIds = new java.util.ArrayList<>();
        java.util.List<com.dental.clinic.management.working_schedule.dto.response.BulkApproveResponse.FailureDetail> failures = new java.util.ArrayList<>();
        
        for (Integer registrationId : registrationIds) {
            try {
                // Attempt to approve each registration
                approveRegistration(registrationId, managerId);
                successfulIds.add(registrationId);
                log.info("Successfully approved registration {}", registrationId);
            } catch (Exception e) {
                // Capture failure with reason
                log.warn("Failed to approve registration {}: {}", registrationId, e.getMessage());
                failures.add(com.dental.clinic.management.working_schedule.dto.response.BulkApproveResponse.FailureDetail.builder()
                        .registrationId(registrationId)
                        .reason(e.getMessage())
                        .build());
            }
        }
        
        return com.dental.clinic.management.working_schedule.dto.response.BulkApproveResponse.builder()
                .totalRequested(registrationIds.size())
                .successCount(successfulIds.size())
                .failureCount(failures.size())
                .successfulIds(successfulIds)
                .failures(failures)
                .build();
    }

    /**
     * Get detailed history/audit information for a registration.
     * Shows lifecycle from creation to approval/rejection/cancellation.
     * 
     * @param registrationId The registration ID
     * @return Registration history with timeline and processor info
     */
    @Transactional(readOnly = true)
    public com.dental.clinic.management.working_schedule.dto.response.RegistrationHistoryResponse getRegistrationHistory(Integer registrationId) {
        log.info("Fetching history for registration {}", registrationId);
        
        PartTimeRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RegistrationNotFoundException(registrationId));
        
        // Get slot info
        PartTimeSlot slot = slotRepository.findById(registration.getPartTimeSlotId())
                .orElseThrow(() -> new SlotNotFoundException(registration.getPartTimeSlotId()));
        
        // Get employee info
        Employee employee = employeeRepository.findById(registration.getEmployeeId())
                .orElseThrow(() -> new IllegalStateException("Employee not found: " + registration.getEmployeeId()));
        
        // Build history response
        com.dental.clinic.management.working_schedule.dto.response.RegistrationHistoryResponse.RegistrationHistoryResponseBuilder historyBuilder = 
            com.dental.clinic.management.working_schedule.dto.response.RegistrationHistoryResponse.builder()
                .registrationId(registration.getRegistrationId())
                .employeeId(employee.getEmployeeId())
                .employeeName(employee.getFullName())
                .employeeCode(employee.getEmployeeCode())
                .slotId(slot.getSlotId())
                .workShiftName(slot.getWorkShift() != null ? slot.getWorkShift().getShiftName() : "N/A")
                .dayOfWeek(slot.getDayOfWeek())
                .effectiveFrom(registration.getEffectiveFrom())
                .effectiveTo(registration.getEffectiveTo())
                .status(registration.getStatus())
                .createdAt(registration.getCreatedAt())
                .isActive(registration.getIsActive());
        
        // Add processor info if processed
        if (registration.getProcessedBy() != null && registration.getProcessedAt() != null) {
            historyBuilder
                    .processedAt(registration.getProcessedAt())
                    .processedById(registration.getProcessedBy());
            
            // Get processor name (optional - could be null if employee deleted)
            try {
                Employee processor = employeeRepository.findById(registration.getProcessedBy()).orElse(null);
                if (processor != null) {
                    historyBuilder
                            .processedByName(processor.getFullName())
                            .processedByCode(processor.getEmployeeCode());
                }
            } catch (Exception e) {
                log.warn("Could not fetch processor info for registration {}", registrationId);
            }
        }
        
        // Add reason if rejected
        if (registration.getStatus() == RegistrationStatus.REJECTED && registration.getReason() != null) {
            historyBuilder.reason(registration.getReason());
        }
        
        // Add cancellation info if inactive
        if (!registration.getIsActive() && registration.getUpdatedAt() != null) {
            historyBuilder.cancelledAt(registration.getUpdatedAt());
        }
        
        return historyBuilder.build();
    }

    /**
     * FIX BUG #1: Validate that approving this registration won't conflict with other 
     * PENDING or APPROVED registrations for the same employee and same slot.
     * 
     * This prevents scenarios like:
     * - Registration A: 9/11-21/12 (APPROVED)
     * - Registration B: 7/11-7/1 (PENDING) ← should be rejected due to overlap
     * 
     * @param registration The registration to approve
     * @param slot The slot being registered for
     * @throws RegistrationConflictException if there are overlapping registrations
     */
    private void validateNoOverlappingRegistrations(PartTimeRegistration registration, PartTimeSlot slot) {
        // Get all PENDING and APPROVED registrations for this employee and slot (excluding current registration)
        List<PartTimeRegistration> existingRegistrations = registrationRepository
                .findByEmployeeIdAndIsActiveAndStatus(registration.getEmployeeId(), true, RegistrationStatus.APPROVED);
        
        // Also check PENDING registrations (to prevent approving 2 overlapping pending requests)
        List<PartTimeRegistration> pendingRegistrations = registrationRepository
                .findByEmployeeIdAndIsActiveAndStatus(registration.getEmployeeId(), true, RegistrationStatus.PENDING);
        
        existingRegistrations.addAll(pendingRegistrations);
        
        // Filter to only registrations for the same slot and exclude current registration
        List<PartTimeRegistration> sameSlotRegistrations = existingRegistrations.stream()
                .filter(r -> r.getPartTimeSlotId().equals(registration.getPartTimeSlotId()))
                .filter(r -> !r.getRegistrationId().equals(registration.getRegistrationId()))
                .collect(java.util.stream.Collectors.toList());

        if (sameSlotRegistrations.isEmpty()) {
            return; // No conflicts
        }

        // Calculate working days for the registration being approved
        List<LocalDate> requestedDates;
        if (registration.getRequestedDates() != null && !registration.getRequestedDates().isEmpty()) {
            requestedDates = new java.util.ArrayList<>(registration.getRequestedDates());
        } else {
            requestedDates = availabilityService.getWorkingDays(
                    slot, 
                    registration.getEffectiveFrom(), 
                    registration.getEffectiveTo()
            );
        }

        // Check for date overlaps with each existing registration
        for (PartTimeRegistration existing : sameSlotRegistrations) {
            List<LocalDate> existingDates;
            if (existing.getRequestedDates() != null && !existing.getRequestedDates().isEmpty()) {
                existingDates = new java.util.ArrayList<>(existing.getRequestedDates());
            } else {
                existingDates = availabilityService.getWorkingDays(
                        slot, 
                        existing.getEffectiveFrom(), 
                        existing.getEffectiveTo()
                );
            }

            // Find overlapping dates
            List<LocalDate> overlappingDates = requestedDates.stream()
                    .filter(existingDates::contains)
                    .sorted()
                    .collect(java.util.stream.Collectors.toList());

            if (!overlappingDates.isEmpty()) {
                // FIX BUG #1 & #2: Throw exception with clear, detailed message
                log.warn("Registration conflict detected: {} overlapping dates between registration {} (PENDING) and {} ({})", 
                        overlappingDates.size(), registration.getRegistrationId(), 
                        existing.getRegistrationId(), existing.getStatus());
                
                throw new RegistrationConflictException(overlappingDates, existing.getRegistrationId());
            }
        }
    }

    /**
     * FIX BUG #3: Validate that the employee doesn't already have existing shifts
     * that conflict with the registration being approved.
     * 
     * This prevents creating duplicate shifts when an employee already has
     * a shift scheduled for the same date and same work shift.
     * 
     * @param registration The registration to approve
     * @param slot The slot being registered for
     * @throws IllegalStateException if there are conflicting existing shifts
     */
    private void validateNoExistingShifts(PartTimeRegistration registration, PartTimeSlot slot) {
        // Calculate working days for the registration
        List<LocalDate> requestedDates;
        if (registration.getRequestedDates() != null && !registration.getRequestedDates().isEmpty()) {
            requestedDates = new java.util.ArrayList<>(registration.getRequestedDates());
        } else {
            requestedDates = availabilityService.getWorkingDays(
                    slot, 
                    registration.getEffectiveFrom(), 
                    registration.getEffectiveTo()
            );
        }

        // Check each working day for existing shifts
        List<LocalDate> conflictingDates = new java.util.ArrayList<>();
        String workShiftId = slot.getWorkShift().getWorkShiftId();

        for (LocalDate workDate : requestedDates) {
            boolean exists = employeeShiftService.existsByEmployeeAndDateAndShift(
                    registration.getEmployeeId(), 
                    workDate, 
                    workShiftId
            );
            
            if (exists) {
                conflictingDates.add(workDate);
            }
        }

        if (!conflictingDates.isEmpty()) {
            String errorMessage = String.format(
                    "Không thể duyệt đăng ký này. Nhân viên ID %d đã có ca làm việc (%s) vào %d ngày: %s. " +
                    "Các ca làm việc này phải được xóa trước khi duyệt đăng ký mới.",
                    registration.getEmployeeId(),
                    slot.getWorkShift().getShiftName(),
                    conflictingDates.size(),
                    formatDateList(conflictingDates)
            );
            
            log.warn("Existing shifts conflict detected for employee {} on {} dates", 
                    registration.getEmployeeId(), conflictingDates.size());
            
            throw new IllegalStateException(errorMessage);
        }
    }

    /**
     * Format a list of dates for user-friendly error messages.
     * Shows first few dates and total count if list is long.
     */
    private String formatDateList(List<LocalDate> dates) {
        if (dates == null || dates.isEmpty()) {
            return "";
        }
        
        if (dates.size() <= 5) {
            return dates.stream()
                    .map(LocalDate::toString)
                    .collect(java.util.stream.Collectors.joining(", "));
        } else {
            String first5 = dates.stream()
                    .limit(5)
                    .map(LocalDate::toString)
                    .collect(java.util.stream.Collectors.joining(", "));
            return first5 + String.format(" (và %d ngày khác)", dates.size() - 5);
        }
    }
    
    /**
     * Extract days of week from slot as List<Integer> for generic shift generation.
     * Converts slot's dayOfWeek string (e.g., "MONDAY,WEDNESDAY,FRIDAY") to integers [1,3,5].
     * 
     * Mapping: MONDAY=1, TUESDAY=2, WEDNESDAY=3, THURSDAY=4, FRIDAY=5, SATURDAY=6, SUNDAY=7
     * 
     * @param slot The part-time slot
     * @return List of day numbers (1-7)
     */
    private List<Integer> extractDaysOfWeekFromSlot(PartTimeSlot slot) {
        if (slot == null || slot.getDayOfWeek() == null || slot.getDayOfWeek().trim().isEmpty()) {
            log.warn("Slot has no day of week specified, returning empty list");
            return java.util.Collections.emptyList();
        }
        
        String dayOfWeek = slot.getDayOfWeek().trim();
        log.debug("Extracting days from slot dayOfWeek: '{}'", dayOfWeek);
        
        List<Integer> dayNumbers = new java.util.ArrayList<>();
        String[] days = dayOfWeek.split(",");
        
        for (String day : days) {
            String trimmedDay = day.trim().toUpperCase();
            Integer dayNumber = convertDayNameToNumber(trimmedDay);
            if (dayNumber != null) {
                dayNumbers.add(dayNumber);
            } else {
                log.warn("Unknown day name: '{}', skipping", trimmedDay);
            }
        }
        
        // Sort for consistency
        java.util.Collections.sort(dayNumbers);
        log.debug("Extracted day numbers: {}", dayNumbers);
        
        return dayNumbers;
    }
    
    /**
     * Convert day name (MONDAY, TUESDAY, etc.) to day number (1-7).
     * 
     * @param dayName Day name in uppercase
     * @return Day number (1=Monday, 7=Sunday) or null if unknown
     */
    private Integer convertDayNameToNumber(String dayName) {
        return switch (dayName) {
            case "MONDAY", "MON" -> 1;
            case "TUESDAY", "TUE" -> 2;
            case "WEDNESDAY", "WED" -> 3;
            case "THURSDAY", "THU" -> 4;
            case "FRIDAY", "FRI" -> 5;
            case "SATURDAY", "SAT" -> 6;
            case "SUNDAY", "SUN" -> 7;
            default -> null;
        };
    }
    
    /**
     * Backfill shifts for all existing APPROVED PART_TIME_FLEX registrations.
     * This is used to generate shifts for registrations created before shift auto-generation was implemented.
     * 
     * Admin-only operation.
     * 
     * Logic:
     * 1. Find all APPROVED part_time_registrations with is_active=true
     * 2. For each registration, regenerate shifts using generic method (in separate transaction)
     * 3. Skip registrations that already have shifts
     * 4. Return summary with counts
     * 
     * @return Summary string with success/skip/error counts
     */
    public String backfillShiftsForExistingRegistrations() {
        log.info("=== Starting backfill process for PART_TIME_FLEX registrations ===");
        
        // Find all APPROVED and active registrations
        List<PartTimeRegistration> approvedRegistrations = registrationRepository
                .findByStatusIn(java.util.Arrays.asList(RegistrationStatus.APPROVED));
        
        log.info("Found {} APPROVED registrations to process", approvedRegistrations.size());
        
        int totalProcessed = 0;
        int successCount = 0;
        int skipCount = 0;
        int errorCount = 0;
        int totalShiftsCreated = 0;
        
        for (PartTimeRegistration registration : approvedRegistrations) {
            totalProcessed++;
            
            try {
                log.debug("Processing registration {}/{}: ID={}, employee={}, slot={}",
                        totalProcessed, approvedRegistrations.size(),
                        registration.getRegistrationId(),
                        registration.getEmployeeId(),
                        registration.getPartTimeSlotId());
                
                // Process in separate transaction to avoid rollback-only marking
                int shiftsCreated = processRegistrationInTransaction(registration);
                
                if (shiftsCreated == -1) {
                    skipCount++;
                } else if (shiftsCreated >= 0) {
                    totalShiftsCreated += shiftsCreated;
                    successCount++;
                    log.info("✅ Registration {}: Generated {} shifts",
                            registration.getRegistrationId(), shiftsCreated);
                }
                
            } catch (Exception e) {
                log.error("❌ Registration {}: Failed to generate shifts: {}",
                        registration.getRegistrationId(), e.getMessage(), e);
                errorCount++;
            }
        }
        
        String summary = String.format(
                "Backfill complete: %d registrations processed, %d succeeded (%d shifts created), %d skipped, %d errors",
                totalProcessed, successCount, totalShiftsCreated, skipCount, errorCount
        );
        
        log.info("=== {} ===", summary);
        return summary;
    }
    
    /**
     * Regenerate shifts for a specific PART_TIME_FLEX registration.
     * Deletes existing shifts and creates new ones from scratch.
     * 
     * Admin-only operation.
     * 
     * Use cases:
     * - Fix shifts for registration with incorrect data
     * - Recover from failed shift generation during approval
     * - Regenerate after registration dates are modified
     * 
     * @param registrationId The registration ID
     * @return Number of shifts created
     * @throws RegistrationNotFoundException if registration not found
     * @throws IllegalStateException if registration is not APPROVED
     */
    @Transactional
    public int regenerateShiftsForRegistration(Integer registrationId) {
        log.info("🔄 Regenerating shifts for registration {}", registrationId);
        
        // Find registration
        PartTimeRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RegistrationNotFoundException(registrationId));
        
        // Only regenerate for APPROVED registrations
        if (registration.getStatus() != RegistrationStatus.APPROVED) {
            log.warn("Cannot regenerate shifts for registration {} with status {}",
                    registrationId, registration.getStatus());
            throw new IllegalStateException(
                    String.format("Cannot regenerate shifts for registration %d: status is %s (must be APPROVED)",
                            registrationId, registration.getStatus())
            );
        }
        
        // Get slot details
        PartTimeSlot slot = slotRepository.findById(registration.getPartTimeSlotId())
                .orElseThrow(() -> new SlotNotFoundException(registration.getPartTimeSlotId()));
        
        if (slot.getWorkShift() == null) {
            throw new IllegalStateException(
                    String.format("Slot %d has no work shift assigned", slot.getSlotId())
            );
        }
        
        // Delete existing shifts for this registration
        try {
            int deletedCount = employeeShiftService.deleteShiftsForSource(
                    "PART_TIME_FLEX",
                    registration.getRegistrationId().longValue()
            );
            log.info("Deleted {} existing shifts for registration {}", deletedCount, registrationId);
        } catch (Exception e) {
            log.warn("Failed to delete existing shifts for registration {}: {}. Continuing with regeneration.",
                    registrationId, e.getMessage());
        }
        
        // Extract days of week
        List<Integer> daysOfWeek = extractDaysOfWeekFromSlot(slot);
        if (daysOfWeek.isEmpty()) {
            throw new IllegalStateException(
                    String.format("Slot %d has no valid days of week specified", slot.getSlotId())
            );
        }
        
        // Generate new shifts
        List<com.dental.clinic.management.working_schedule.domain.EmployeeShift> createdShifts =
            employeeShiftService.createShiftsForRegistration(
                registration.getEmployeeId(),
                slot.getWorkShift().getWorkShiftId(),
                registration.getEffectiveFrom(),
                registration.getEffectiveTo(),
                daysOfWeek,
                "PART_TIME_FLEX",
                registration.getRegistrationId().longValue(),
                null  // createdBy = null for regeneration (system generated)
            );
        
        log.info("✅ Regenerated {} shifts for registration {}", createdShifts.size(), registrationId);
        return createdShifts.size();
    }
    
    /**
     * Process a single registration in its own transaction to avoid rollback-only issues.
     * Returns: number of shifts created, -1 if skipped, throws exception if error.
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    protected int processRegistrationInTransaction(PartTimeRegistration registration) {
        // Get slot details
        PartTimeSlot slot = slotRepository.findById(registration.getPartTimeSlotId())
                .orElse(null);
        
        if (slot == null) {
            log.warn("⚠️ Registration {}: Slot {} not found, skipping",
                    registration.getRegistrationId(), registration.getPartTimeSlotId());
            return -1;
        }
        
        if (slot.getWorkShift() == null) {
            log.warn("⚠️ Registration {}: Slot {} has no work shift, skipping",
                    registration.getRegistrationId(), slot.getSlotId());
            return -1;
        }
        
        // Check if shifts already exist for this registration
        boolean hasShifts = employeeShiftService.existsShiftsForSource(
                "PART_TIME_FLEX",
                registration.getRegistrationId().longValue()
        );
        
        if (hasShifts) {
            log.debug("⏭️ Registration {}: Shifts already exist, skipping",
                    registration.getRegistrationId());
            return -1;
        }
        
        // Extract days of week
        List<Integer> daysOfWeek = extractDaysOfWeekFromSlot(slot);
        if (daysOfWeek.isEmpty()) {
            log.warn("⚠️ Registration {}: No valid days of week found, skipping",
                    registration.getRegistrationId());
            return -1;
        }
        
        // Generate shifts
        List<com.dental.clinic.management.working_schedule.domain.EmployeeShift> createdShifts =
            employeeShiftService.createShiftsForRegistration(
                registration.getEmployeeId(),
                slot.getWorkShift().getWorkShiftId(),
                registration.getEffectiveFrom(),
                registration.getEffectiveTo(),
                daysOfWeek,
                "PART_TIME_FLEX",
                registration.getRegistrationId().longValue(),
                null  // createdBy = null for backfill (system generated)
            );
        
        return createdShifts.size();
    }
}
