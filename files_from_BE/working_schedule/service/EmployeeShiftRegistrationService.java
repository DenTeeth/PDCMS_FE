package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.enums.EmploymentType;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.working_schedule.domain.PartTimeRegistration;
import com.dental.clinic.management.working_schedule.domain.PartTimeSlot;
import com.dental.clinic.management.working_schedule.domain.WorkShift;
import com.dental.clinic.management.working_schedule.dto.request.CreateRegistrationRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdateEffectiveToRequest;
import com.dental.clinic.management.working_schedule.dto.response.AvailableSlotResponse;
import com.dental.clinic.management.working_schedule.dto.response.RegistrationResponse;
import com.dental.clinic.management.working_schedule.dto.response.SlotDetailResponse;
import com.dental.clinic.management.working_schedule.exception.*;
import com.dental.clinic.management.working_schedule.repository.PartTimeRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.PartTimeSlotRepository;
import com.dental.clinic.management.working_schedule.repository.WorkShiftRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeShiftRegistrationService {

    private final PartTimeRegistrationRepository registrationRepository;
    private final PartTimeSlotRepository slotRepository;
    private final WorkShiftRepository workShiftRepository;
    private final AccountRepository accountRepository;
    private final EmployeeRepository employeeRepository;
    private final PartTimeSlotAvailabilityService availabilityService;

    /**
     * Get available slots for employee to claim.
     * 
     * NEW SPECIFICATION (Dynamic Quota):
     * - Only count APPROVED registrations (not PENDING)
     * - Show slots that have ANY date with availability
     * - Don't show slots already registered by this employee (APPROVED status)
     * - Critical: A slot is AVAILABLE if ANY working day has space
     * 
     * Example from spec:
     * - Slot effectiveFrom=9/11, effectiveTo=30/11, quota=2
     * - Doctor A: approved 9/11-16/11 (covers 14/11, 15/11)
     * - Doctor B: approved 9/11-30/11 (covers all 6 days)
     * - Days 14/11, 15/11: 2/2 (FULL)
     * - Days 21/11, 22/11, 28/11, 29/11: 1/2 (HAS SPACE)
     * - Result: Slot is AVAILABLE because days 21/11+ have space
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('VIEW_AVAILABLE_SLOTS')")
    public List<AvailableSlotResponse> getAvailableSlots() {
        Integer employeeId = getCurrentEmployeeId();
        log.info("Fetching available slots for employee {}", employeeId);

        LocalDate today = LocalDate.now();

        // Get all active slots with availability
        // IMPORTANT: Show ALL slots that have space, even if employee already has registrations
        // Reason: Employee may want to register for different date ranges (e.g., Nov vs Dec)
        return slotRepository.findAll().stream()
                .filter(slot -> slot.getIsActive())
                .filter(slot -> slot.getEffectiveTo().isAfter(today)) // Don't show expired slots
                .map(slot -> {
                    // Check if slot has ANY day with availability
                    boolean hasAnyAvailability = hasAnyDayWithAvailability(slot);

                    if (!hasAnyAvailability) {
                        log.debug("Slot {} is completely full - not showing to employee", slot.getSlotId());
                        return null; // All days are full
                    }

                    WorkShift workShift = workShiftRepository.findById(slot.getWorkShiftId()).orElse(null);
                    String shiftName = workShift != null ? workShift.getShiftName() : "Unknown";

                    // Calculate date counts
                    LocalDate startDate = slot.getEffectiveFrom().isBefore(today) ? today : slot.getEffectiveFrom();
                    List<LocalDate> workingDays = availabilityService.getWorkingDays(
                            slot, 
                            startDate, 
                            slot.getEffectiveTo()
                    );
                    
                    int totalDatesAvailable = 0; // registered < quota
                    int totalDatesEmpty = 0;     // registered == 0
                    int totalDatesFull = 0;      // registered == quota
                    
                    for (LocalDate date : workingDays) {
                        long registered = availabilityService.getRegisteredCountForDate(slot.getSlotId(), date);
                        if (registered >= slot.getQuota()) {
                            totalDatesFull++;
                        } else {
                            totalDatesAvailable++; // Has space
                            if (registered == 0) {
                                totalDatesEmpty++;
                            }
                        }
                    }

                    // Generate availability summary
                    String summary = availabilityService.generateAvailabilitySummary(
                            slot.getSlotId(), 
                            slot.getQuota(),
                            startDate, 
                            slot.getEffectiveTo()
                    );

                    return AvailableSlotResponse.builder()
                            .slotId(slot.getSlotId())
                            .shiftName(shiftName)
                            .dayOfWeek(slot.getDayOfWeek())
                            .totalDatesAvailable(totalDatesAvailable)
                            .totalDatesEmpty(totalDatesEmpty)
                            .totalDatesFull(totalDatesFull)
                            .effectiveFrom(slot.getEffectiveFrom())
                            .effectiveTo(slot.getEffectiveTo())
                            .quota(slot.getQuota())
                            .availabilitySummary(summary)
                            .build();
                })
                .filter(response -> response != null)
                .collect(Collectors.toList());
    }

    /**
     * Check if a slot has ANY day with availability in the FUTURE.
     * Used to show slot in available list.
     * 
     * Returns true if at least ONE working day FROM TODAY ONWARDS has registered < quota.
     * 
     * IMPORTANT: Only checks future dates, not past dates (past dates may be full but irrelevant)
     * 
     * @param slot The part-time slot
     * @return true if any future day has space
     */
    private boolean hasAnyDayWithAvailability(PartTimeSlot slot) {
        LocalDate today = LocalDate.now();
        
        // Check from today onwards (not past dates)
        LocalDate startDate = slot.getEffectiveFrom().isBefore(today) ? today : slot.getEffectiveFrom();
        
        List<LocalDate> workingDays = availabilityService.getWorkingDays(
                slot, 
                startDate, 
                slot.getEffectiveTo()
        );

        for (LocalDate workingDay : workingDays) {
            long registered = availabilityService.getRegisteredCountForDate(slot.getSlotId(), workingDay);
            if (registered < slot.getQuota()) {
                return true; // Found at least one day with space
            }
        }

        return false; // All future days are full
    }

    /**
     * Get detailed availability information for a specific slot.
     * Shows month-by-month breakdown to help employees make informed decisions.
     * 
     * Permission: VIEW_AVAILABLE_SLOTS
     * 
     * @param slotId The slot ID to get details for
     * @return Detailed slot information with monthly availability breakdown
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('VIEW_AVAILABLE_SLOTS')")
    public SlotDetailResponse getSlotDetail(Long slotId) {
        log.info("Fetching slot detail for slot {}", slotId);
        
        PartTimeSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found: " + slotId));
        
        if (!slot.getIsActive()) {
            throw new IllegalArgumentException("Slot is not active");
        }
        
        LocalDate today = LocalDate.now();
        LocalDate startDate = slot.getEffectiveFrom().isBefore(today) ? today : slot.getEffectiveFrom();
        
        WorkShift workShift = workShiftRepository.findById(slot.getWorkShiftId()).orElse(null);
        String shiftName = workShift != null ? workShift.getShiftName() : "Unknown";
        
        // Calculate overall remaining
        long minRegistered = availabilityService.getMinimumRegisteredCount(
                slot.getSlotId(), 
                startDate, 
                slot.getEffectiveTo()
        );
        int overallRemaining = Math.max(0, slot.getQuota() - (int) minRegistered);
        
        // Generate monthly breakdown
        List<SlotDetailResponse.MonthlyAvailability> monthlyBreakdown = 
                availabilityService.generateMonthlyAvailability(
                        slot.getSlotId(), 
                        slot,
                        startDate, 
                        slot.getEffectiveTo()
                );
        
        return SlotDetailResponse.builder()
                .slotId(slot.getSlotId())
                .shiftName(shiftName)
                .dayOfWeek(slot.getDayOfWeek())
                .quota(slot.getQuota())
                .effectiveFrom(slot.getEffectiveFrom())
                .effectiveTo(slot.getEffectiveTo())
                .overallRemaining(overallRemaining)
                .availabilityByMonth(monthlyBreakdown)
                .build();
    }

    /**
     * Submit registration request (NEW SPECIFICATION - Approval Workflow).
     * 
     * BREAKING CHANGE:
     * - Status is PENDING (not immediately active)
     * - Manager must approve before employee can work
     * - Employee provides flexible effectiveTo (no longer fixed 3 months)
     * - Quota checks done during approval (not during submission)
     */
    @Transactional
    @PreAuthorize("hasAuthority('CREATE_REGISTRATION')")
    public RegistrationResponse claimSlot(CreateRegistrationRequest request) {
        Integer employeeId = getCurrentEmployeeId();
        log.info("Employee {} submitting registration request for slot {}", employeeId, request.getPartTimeSlotId());

        // Validate employee exists and is PART_TIME_FLEX
    Employee employee = employeeRepository.findById(employeeId)
        .orElseThrow(() -> new com.dental.clinic.management.exception.employee.EmployeeNotFoundException(employeeId));

        // Only PART_TIME_FLEX employees can claim flexible slots
        if (employee.getEmploymentType() != EmploymentType.PART_TIME_FLEX) {
            log.warn("Employee {} with type {} attempted to claim flexible slot",
                    employeeId, employee.getEmploymentType());
            throw new InvalidEmployeeTypeForFlexRegistrationException(
                    employee.getEmploymentType(), 
                    EmploymentType.PART_TIME_FLEX);
        }

        // Validate dates
        if (request.getEffectiveFrom().isBefore(LocalDate.now())) {
            throw new PastDateNotAllowedException(request.getEffectiveFrom());
        }

        if (request.getEffectiveTo() == null) {
            throw new IllegalArgumentException("Effective to date is required");
        }

        if (request.getEffectiveTo().isBefore(request.getEffectiveFrom())) {
            throw new InvalidDateRangeException(request.getEffectiveFrom(), request.getEffectiveTo());
        }

        // Validate slot exists and is active
        PartTimeSlot slot = slotRepository.findById(request.getPartTimeSlotId())
                .orElseThrow(() -> new SlotNotFoundException(request.getPartTimeSlotId()));

    if (!slot.getIsActive()) {
        throw new com.dental.clinic.management.working_schedule.exception.SlotInactiveException(slot.getSlotId());
    }

        // Per new requirement: dayOfWeek MUST be provided by PART_TIME_FLEX employees.
        if (request.getDayOfWeek() == null || request.getDayOfWeek().isEmpty()) {
            throw new IllegalArgumentException("dayOfWeek is required for PART_TIME_FLEX registrations");
        }

        // Calculate all dates within the range that match the requested days of week
        List<java.time.LocalDate> datesToCheck;
        try {
            datesToCheck = availabilityService.getWorkingDaysFromDayNames(
                    request.getDayOfWeek(),
                    request.getEffectiveFrom(),
                    request.getEffectiveTo()
            );
        } catch (IllegalArgumentException e) {
            // Extract invalid day names from the error message if possible
            throw new InvalidDayOfWeekException(request.getDayOfWeek());
        }

        if (datesToCheck.isEmpty()) {
            throw new NoWorkingDaysFoundException(
                    request.getDayOfWeek(),
                    request.getEffectiveFrom(),
                    request.getEffectiveTo());
        }

        // Validate all calculated dates are within slot's effective range
        for (java.time.LocalDate d : datesToCheck) {
            if (d.isBefore(slot.getEffectiveFrom()) || d.isAfter(slot.getEffectiveTo())) {
                throw new DateOutsideSlotRangeException(
                        slot.getEffectiveFrom(),
                        slot.getEffectiveTo(),
                        request.getEffectiveFrom(),
                        request.getEffectiveTo());
            }
        }

        // NEW: Submission-time availability partitioning across the selected dates
        java.util.List<java.time.LocalDate> availableDates = new java.util.ArrayList<>();
        java.util.List<java.time.LocalDate> fullDates = new java.util.ArrayList<>();

        for (java.time.LocalDate d : datesToCheck) {
            long regCount = availabilityService.getRegisteredCountForDate(slot.getSlotId(), d);
            if (regCount < slot.getQuota()) {
                availableDates.add(d);
            } else {
                fullDates.add(d);
            }
        }

        // If none of the requested dates are available, reject the whole submission (existing behavior)
        if (availableDates.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Suất %d đã đầy cho toàn bộ các ngày yêu cầu. Chi tiết ngày:\n", slot.getSlotId()));
            for (java.time.LocalDate d : datesToCheck) {
                long reg = availabilityService.getRegisteredCountForDate(slot.getSlotId(), d);
                sb.append(String.format("%s : %d/%d\n", d.toString(), reg, slot.getQuota()));
            }

            throw new com.dental.clinic.management.working_schedule.exception.QuotaExceededOnSubmissionException(
                    slot.getSlotId(), request.getEffectiveFrom(), request.getEffectiveTo(), sb.toString()
            );
        }

        // If some dates are full but some are available, accept only the available dates (partial acceptance).
        boolean isPartial = !fullDates.isEmpty();

        // NEW: Validate dates are within slot's effective range
        if (request.getEffectiveFrom().isBefore(slot.getEffectiveFrom()) ||
                request.getEffectiveTo().isAfter(slot.getEffectiveTo())) {
            throw new DateOutsideSlotRangeException(
                    slot.getEffectiveFrom(),
                    slot.getEffectiveTo(),
                    request.getEffectiveFrom(),
                    request.getEffectiveTo());
        }

        // Check for conflicting APPROVED registrations
        log.info("🔍 [CONFLICT CHECK] Starting conflict validation for employeeId={}, slotId={}", 
                employeeId, slot.getSlotId());
        List<PartTimeRegistration> approvedRegistrations = registrationRepository
                .findByEmployeeIdAndIsActiveAndStatus(employeeId, true, 
                        com.dental.clinic.management.working_schedule.enums.RegistrationStatus.APPROVED);
        log.info("🔍 [CONFLICT CHECK] Found {} APPROVED registrations for employeeId={}", 
                approvedRegistrations.size(), employeeId);

        for (PartTimeRegistration existingReg : approvedRegistrations) {
            log.info("🔍 [CONFLICT CHECK] Checking existing registration: id={}, slotId={}, period={} to {}", 
                    existingReg.getRegistrationId(), existingReg.getPartTimeSlotId(), 
                    existingReg.getEffectiveFrom(), existingReg.getEffectiveTo());
            // Build set of dates for existing registration (respecting per-day or legacy range)
            java.util.Set<java.time.LocalDate> existingDates;
            if (existingReg.getRequestedDates() != null && !existingReg.getRequestedDates().isEmpty()) {
                existingDates = existingReg.getRequestedDates();
            } else {
                PartTimeSlot existingSlot = slotRepository.findById(existingReg.getPartTimeSlotId()).orElse(null);
                if (existingSlot == null) {
                    existingDates = java.util.Collections.emptySet();
                } else {
                    existingDates = new java.util.HashSet<>(availabilityService.getWorkingDays(
                            existingSlot, existingReg.getEffectiveFrom(), existingReg.getEffectiveTo()));
                }
            }

            // Dates being requested in this submission
            java.util.Set<java.time.LocalDate> requestedSet = new java.util.HashSet<>(datesToCheck);

            // Check 1: Can't have overlapping approved registrations for same slot
            if (existingReg.getPartTimeSlotId().equals(slot.getSlotId())) {
                log.info("🔍 [CONFLICT CHECK] Same slot detected (slotId={}). Checking date overlap...", 
                        slot.getSlotId());
                log.info("🔍 [CONFLICT CHECK] Existing dates: {}", existingDates);
                log.info("🔍 [CONFLICT CHECK] Requested dates: {}", requestedSet);
                java.util.Set<java.time.LocalDate> overlappingDates = new java.util.HashSet<>(existingDates);
                overlappingDates.retainAll(requestedSet);
                if (!overlappingDates.isEmpty()) {
                    log.error("❌ [CONFLICT CHECK] Overlapping dates found: {}", overlappingDates);
                    throw new RegistrationConflictException(employeeId);
                }
                log.info("✅ [CONFLICT CHECK] No overlap for same slot");
            }

            // Check 2: Can't have overlapping time slots (same day + same shift)
            PartTimeSlot existingSlot = slotRepository.findById(existingReg.getPartTimeSlotId()).orElse(null);
            if (existingSlot != null) {
                boolean sameShift = existingSlot.getWorkShiftId().equals(slot.getWorkShiftId());
                if (sameShift) {
                    // If any requested date falls on the same day that existing registration covers -> conflict
                    java.util.Set<java.time.LocalDate> intersection = new java.util.HashSet<>(requestedSet);
                    intersection.retainAll(existingDates);
                    if (!intersection.isEmpty()) {
                        throw new RegistrationConflictException(employeeId);
                    }
                }
            }
        }

    // Create registration with PENDING status for the accepted dates only
    PartTimeRegistration registration = PartTimeRegistration.builder()
        .employeeId(employeeId)
        .partTimeSlotId(slot.getSlotId())
        .effectiveFrom(request.getEffectiveFrom())
        .effectiveTo(request.getEffectiveTo()) // keep original range
        .status(com.dental.clinic.management.working_schedule.enums.RegistrationStatus.PENDING)
        .isActive(true)
        .build();

    // Persist only the accepted (available) dates
    registration.setRequestedDates(new java.util.HashSet<>(availableDates));

    PartTimeRegistration saved = registrationRepository.save(registration);
    log.info("Registration {} submitted by employee {} - status: PENDING (partialAccepted={})",
        saved.getRegistrationId(), employeeId, isPartial);

    // Build response - dates array will contain only the accepted dates
    RegistrationResponse response = buildResponse(saved, slot);

    return response;
    }

    /**
     * Get all registrations (admin sees all, employee sees own).
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyAuthority('UPDATE_REGISTRATIONS_ALL', 'VIEW_REGISTRATION_OWN')")
    public List<RegistrationResponse> getRegistrations(Integer filterEmployeeId) {
        boolean isAdmin = SecurityUtil.hasCurrentUserRole("ADMIN") ||
                SecurityUtil.hasCurrentUserPermission("UPDATE_REGISTRATIONS_ALL");

        log.info("Fetching registrations - admin: {}, filter: {}", isAdmin, filterEmployeeId);

        List<PartTimeRegistration> registrations;

        if (isAdmin && filterEmployeeId != null) {
            // Admin with filter sees ALL registrations (active + cancelled) for that
            // employee
            registrations = registrationRepository.findByEmployeeId(filterEmployeeId);
        } else if (isAdmin) {
            registrations = registrationRepository.findAll();
        } else {
            Integer currentEmployeeId = getCurrentEmployeeId();
            registrations = registrationRepository.findByEmployeeIdAndIsActive(currentEmployeeId, true);
        }

        return registrations.stream()
                .map(reg -> {
                    PartTimeSlot slot = slotRepository.findById(reg.getPartTimeSlotId()).orElse(null);
                    return buildResponse(reg, slot);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get a single registration by id. Throws RegistrationNotFoundException if missing or not visible to caller.
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyAuthority('UPDATE_REGISTRATIONS_ALL', 'VIEW_REGISTRATION_OWN', 'MANAGE_PART_TIME_REGISTRATIONS')")
    public RegistrationResponse getRegistrationById(Integer registrationId) {
        boolean isAdmin = SecurityUtil.hasCurrentUserRole("ADMIN") ||
                SecurityUtil.hasCurrentUserPermission("UPDATE_REGISTRATIONS_ALL");

        PartTimeRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new com.dental.clinic.management.working_schedule.exception.RegistrationNotFoundException(registrationId.toString()));

        if (!isAdmin) {
            Integer currentEmployeeId = getCurrentEmployeeId();
            if (!registration.getEmployeeId().equals(currentEmployeeId)) {
                throw new com.dental.clinic.management.working_schedule.exception.RegistrationNotFoundException(registrationId.toString());
            }
        }

        PartTimeSlot slot = slotRepository.findById(registration.getPartTimeSlotId()).orElse(null);
        return buildResponse(registration, slot);
    }

    /**
     * Cancel registration (soft delete).
     */
    @Transactional
    @PreAuthorize("hasAnyAuthority('UPDATE_REGISTRATIONS_ALL', 'CANCEL_REGISTRATION_OWN')")
    public void cancelRegistration(Integer registrationId) {
        boolean isAdmin = SecurityUtil.hasCurrentUserRole("ADMIN") ||
                SecurityUtil.hasCurrentUserPermission("UPDATE_REGISTRATIONS_ALL");
        Integer currentEmployeeId = getCurrentEmployeeId();

        log.info("Cancelling registration {} by employee {}", registrationId, currentEmployeeId);

        PartTimeRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RegistrationNotFoundException(registrationId.toString()));

        // Check ownership if not admin
        if (!isAdmin && !registration.getEmployeeId().equals(currentEmployeeId)) {
            throw new RegistrationNotFoundException(registrationId.toString()); // Hide existence
        }

        // Check if already cancelled
        if (!registration.getIsActive()) {
            throw new RegistrationNotFoundException(registrationId.toString()); // Already cancelled
        }

        registration.setIsActive(false);
        registration.setEffectiveTo(LocalDate.now());
        registration.setUpdatedAt(LocalDateTime.now());
        registrationRepository.save(registration);

        log.info("Registration {} cancelled in part_time_registrations", registrationId);
    }

    /**
     * Update effectiveTo (admin only).
     */
    @Transactional
    @PreAuthorize("hasAuthority('UPDATE_REGISTRATIONS_ALL')")
    public RegistrationResponse updateEffectiveTo(Integer registrationId, UpdateEffectiveToRequest request) {
        log.info("Updating effectiveTo for registration {}", registrationId);

        PartTimeRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RegistrationNotFoundException(registrationId.toString()));

        registration.setEffectiveTo(request.getEffectiveTo());
        registration.setUpdatedAt(LocalDateTime.now());
        PartTimeRegistration updated = registrationRepository.save(registration);

        PartTimeSlot slot = slotRepository.findById(updated.getPartTimeSlotId()).orElse(null);
        return buildResponse(updated, slot);
    }

    /**
     * Get current employee ID from security context.
     */
    private Integer getCurrentEmployeeId() {
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));

        return accountRepository.findOneByUsername(username)
                .map(account -> account.getEmployee().getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));
    }

    private RegistrationResponse buildResponse(PartTimeRegistration registration, PartTimeSlot slot) {
        String workShiftId = null;
        String shiftName = "Unknown";
        String dayOfWeek = "Unknown";

        if (slot != null) {
            workShiftId = slot.getWorkShiftId();
            WorkShift workShift = workShiftRepository.findById(slot.getWorkShiftId()).orElse(null);
            shiftName = workShift != null ? workShift.getShiftName() : "Unknown";
            dayOfWeek = slot.getDayOfWeek();
        }

        // Get appropriate dates based on status
        java.util.List<LocalDate> dates = registration.getRequestedDates() != null && !registration.getRequestedDates().isEmpty()
                ? new java.util.ArrayList<>(registration.getRequestedDates())
                : (slot != null ? availabilityService.getWorkingDays(slot, registration.getEffectiveFrom(), registration.getEffectiveTo()) : null);

        // Get manager name if processed
        String processedByName = null;
        if (registration.getProcessedBy() != null) {
            Employee manager = employeeRepository.findById(registration.getProcessedBy()).orElse(null);
            processedByName = manager != null ? manager.getFullName() : "Unknown Manager";
        }

        return RegistrationResponse.builder()
                .registrationId(registration.getRegistrationId())
                .employeeId(registration.getEmployeeId())
                .partTimeSlotId(registration.getPartTimeSlotId())
                .workShiftId(workShiftId)
                .shiftName(shiftName)
                .dayOfWeek(dayOfWeek)
                .effectiveFrom(registration.getEffectiveFrom())
                .effectiveTo(registration.getEffectiveTo())
                .status(registration.getStatus() != null ? registration.getStatus().name() : null)
                .dates(dates)
                .reason(registration.getReason())
                .processedBy(processedByName)
                .processedAt(registration.getProcessedAt() != null ? registration.getProcessedAt().toString() : null)
                .createdAt(registration.getCreatedAt() != null ? registration.getCreatedAt().toString() : null)
                .build();
    }

    /**
     * Public helper to build response from registration entity.
     * Used by admin controller to convert entities to responses.
     */
    public RegistrationResponse buildResponseFromEntity(PartTimeRegistration registration) {
        PartTimeSlot slot = slotRepository.findById(registration.getPartTimeSlotId()).orElse(null);
        return buildResponse(registration, slot);
    }
}
