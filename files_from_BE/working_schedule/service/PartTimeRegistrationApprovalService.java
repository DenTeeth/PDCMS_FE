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

        // Approve
        registration.setStatus(RegistrationStatus.APPROVED);
        registration.setProcessedBy(managerId);
        registration.setProcessedAt(LocalDateTime.now());
        registrationRepository.save(registration);

        // INTEGRATION POINT: Create employee shifts for all working days
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

        // Create shifts automatically
        employeeShiftService.createShiftsForApprovedRegistration(
                registration.getEmployeeId(),
                slot.getWorkShift().getWorkShiftId(),
                workingDays,
                managerId
        );

        log.info("Registration {} approved by manager {} with {} shifts created", 
                registrationId, managerId, workingDays.size());
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
}
