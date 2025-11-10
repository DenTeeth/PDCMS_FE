package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.working_schedule.domain.PartTimeRegistration;
import com.dental.clinic.management.working_schedule.domain.PartTimeSlot;
import com.dental.clinic.management.working_schedule.domain.WorkShift;
import com.dental.clinic.management.working_schedule.dto.request.CreatePartTimeSlotRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdatePartTimeSlotRequest;
import com.dental.clinic.management.working_schedule.dto.response.PartTimeSlotDetailResponse;
import com.dental.clinic.management.working_schedule.dto.response.PartTimeSlotResponse;
import com.dental.clinic.management.working_schedule.exception.QuotaViolationException;
import com.dental.clinic.management.working_schedule.exception.SlotNotFoundException;
import com.dental.clinic.management.working_schedule.repository.PartTimeRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.PartTimeSlotRepository;
import com.dental.clinic.management.working_schedule.repository.WorkShiftRepository;
import com.dental.clinic.management.exception.work_shift.WorkShiftNotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartTimeSlotService {

    private final PartTimeSlotRepository partTimeSlotRepository;
    private final WorkShiftRepository workShiftRepository;
    private final PartTimeRegistrationRepository registrationRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Create a new part-time slot.
     * 
     * NEW SPECIFICATION:
     * - Requires effectiveFrom and effectiveTo
     * - Supports multiple days (comma-separated)
     * - Validates date range
     */
    @Transactional
    @PreAuthorize("hasAuthority('MANAGE_WORK_SLOTS')")
    public PartTimeSlotResponse createSlot(CreatePartTimeSlotRequest request) {
        log.info("Creating part-time slot: shift={}, days={}, effectiveFrom={}, effectiveTo={}, quota={}", 
                 request.getWorkShiftId(), request.getDayOfWeek(), 
                 request.getEffectiveFrom(), request.getEffectiveTo(), request.getQuota());

        // Validate work shift exists
        WorkShift workShift = workShiftRepository.findById(request.getWorkShiftId())
                .orElseThrow(() -> new WorkShiftNotFoundException(request.getWorkShiftId()));

        // NEW: Validate date range
        if (request.getEffectiveTo().isBefore(request.getEffectiveFrom())) {
            throw new IllegalArgumentException("Effective to date must be after effective from date");
        }

        // NEW: Validate effective from is not in the past
        if (request.getEffectiveFrom().isBefore(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Effective from date cannot be in the past");
        }

        // NEW: Validate day of week format (accept comma-separated values)
        String normalizedDayOfWeek = request.getDayOfWeek().toUpperCase().trim();
        validateDaysOfWeek(normalizedDayOfWeek);

        // Note: We no longer check for unique constraint since slots can have same shift+day
        // but different date ranges. The combination of shift+day+dates should be unique.
        // This validation could be added if needed.

        // Create slot
        PartTimeSlot slot = new PartTimeSlot();
        slot.setWorkShiftId(request.getWorkShiftId());
        slot.setDayOfWeek(normalizedDayOfWeek);
        slot.setEffectiveFrom(request.getEffectiveFrom());
        slot.setEffectiveTo(request.getEffectiveTo());
        slot.setQuota(request.getQuota());
        slot.setIsActive(true);

        PartTimeSlot savedSlot = partTimeSlotRepository.save(slot);
        log.info("Created slot with ID: {} for days {} from {} to {}", 
                 savedSlot.getSlotId(), normalizedDayOfWeek, 
                 request.getEffectiveFrom(), request.getEffectiveTo());

        return buildResponse(savedSlot, workShift.getShiftName());
    }

    /**
     * Validate day of week string.
     * Supports single day (FRIDAY) or multiple days (FRIDAY,SATURDAY).
     * 
     * @param dayOfWeek The day of week string to validate
     * @throws IllegalArgumentException if invalid
     */
    private void validateDaysOfWeek(String dayOfWeek) {
        String[] days = dayOfWeek.split(",");
        for (String day : days) {
            String trimmedDay = day.trim();
            if (trimmedDay.isEmpty()) {
                throw new IllegalArgumentException("Day of week cannot be empty");
            }
            
            try {
                java.time.DayOfWeek.valueOf(trimmedDay);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid day of week: " + trimmedDay + 
                        ". Valid values: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY");
            }

            // Optional: Reject SUNDAY if clinic doesn't work on Sundays
            if ("SUNDAY".equals(trimmedDay)) {
                log.warn("Creating slot for SUNDAY - verify this is intended");
            }
        }
    }

    /**
     * Get all slots with registration counts.
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('MANAGE_WORK_SLOTS')")
    public List<PartTimeSlotResponse> getAllSlots() {
        log.info("Fetching all part-time slots");

        return partTimeSlotRepository.findAll().stream()
                .map(slot -> {
                    WorkShift workShift = workShiftRepository.findById(slot.getWorkShiftId())
                            .orElse(null);
                    String shiftName = workShift != null ? workShift.getShiftName() : "Unknown";
                    return buildResponse(slot, shiftName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Update slot quota and isActive status.
     */
    @Transactional
    @PreAuthorize("hasAuthority('MANAGE_WORK_SLOTS')")
    public PartTimeSlotResponse updateSlot(Long slotId, UpdatePartTimeSlotRequest request) {
        log.info("Updating slot {}: quota={}, isActive={}", slotId, request.getQuota(), request.getIsActive());

        PartTimeSlot slot = partTimeSlotRepository.findById(slotId)
                .orElseThrow(() -> new SlotNotFoundException(slotId));

        // Check quota violation - NEW: Use countApprovedRegistrations
        long currentRegistered = partTimeSlotRepository.countApprovedRegistrations(slotId);
        if (request.getQuota() < currentRegistered) {
            throw new QuotaViolationException(slotId, request.getQuota(), currentRegistered);
        }

        slot.setQuota(request.getQuota());
        slot.setIsActive(request.getIsActive());

        PartTimeSlot updatedSlot = partTimeSlotRepository.save(slot);
        log.info("Updated slot {}", slotId);

        WorkShift workShift = workShiftRepository.findById(slot.getWorkShiftId()).orElse(null);
        String shiftName = workShift != null ? workShift.getShiftName() : "Unknown";

        return buildResponse(updatedSlot, shiftName);
    }

    /**
     * Get slot detail with list of registered employees.
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('MANAGE_WORK_SLOTS')")
    public PartTimeSlotDetailResponse getSlotDetail(Long slotId) {
        log.info("Fetching detail for slot {}", slotId);

        PartTimeSlot slot = partTimeSlotRepository.findById(slotId)
                .orElseThrow(() -> new SlotNotFoundException(slotId));

        WorkShift workShift = workShiftRepository.findById(slot.getWorkShiftId()).orElse(null);
        String shiftName = workShift != null ? workShift.getShiftName() : "Unknown";

        // Get all active registrations for this slot
        List<PartTimeRegistration> registrations = registrationRepository
                .findByPartTimeSlotIdAndIsActive(slotId, true);

        // Build employee info list
        List<PartTimeSlotDetailResponse.RegisteredEmployeeInfo> employeeInfos = registrations.stream()
                .map(reg -> {
                    Employee employee = employeeRepository.findById(reg.getEmployeeId()).orElse(null);
                    return PartTimeSlotDetailResponse.RegisteredEmployeeInfo.builder()
                            .employeeId(reg.getEmployeeId())
                            .employeeCode(employee != null ? employee.getEmployeeCode() : "Unknown")
                            .employeeName(employee != null ? employee.getFullName() : "Unknown")
                            .effectiveFrom(reg.getEffectiveFrom().toString())
                            .effectiveTo(reg.getEffectiveTo().toString())
                            .build();
                })
                .collect(Collectors.toList());

        // NEW: Count only APPROVED registrations
        long registered = partTimeSlotRepository.countApprovedRegistrations(slotId);

        return PartTimeSlotDetailResponse.builder()
                .slotId(slot.getSlotId())
                .workShiftId(slot.getWorkShiftId())
                .workShiftName(shiftName)
                .dayOfWeek(slot.getDayOfWeek())
                .quota(slot.getQuota())
                .registered(registered)
                .isActive(slot.getIsActive())
                .registeredEmployees(employeeInfos)
                .build();
    }

    /**
     * Delete/deactivate a work slot (soft delete).
     * Sets isActive = false so employees can no longer register.
     * Existing registrations remain unchanged.
     */
    @Transactional
    @PreAuthorize("hasAuthority('MANAGE_WORK_SLOTS')")
    public void deleteSlot(Long slotId) {
        log.info("Deleting (deactivating) slot {}", slotId);
        
        PartTimeSlot slot = partTimeSlotRepository.findById(slotId)
                .orElseThrow(() -> new SlotNotFoundException(slotId));
        
        if (!slot.getIsActive()) {
            log.warn("Slot {} is already inactive", slotId);
            throw new IllegalStateException("Slot is already deactivated");
        }
        
        // Soft delete - set isActive to false
        slot.setIsActive(false);
        partTimeSlotRepository.save(slot);
        
        log.info("Slot {} deactivated successfully. Existing registrations remain unchanged.", slotId);
    }

    /**
     * Get statistics for all work slots.
     * Provides dashboard metrics including utilization and capacity.
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('MANAGE_WORK_SLOTS')")
    public com.dental.clinic.management.working_schedule.dto.response.SlotStatisticsResponse getSlotStatistics() {
        log.info("Generating slot statistics");
        
        // Get all slots
        List<PartTimeSlot> allSlots = partTimeSlotRepository.findAll();
        List<PartTimeSlot> activeSlots = allSlots.stream()
                .filter(PartTimeSlot::getIsActive)
                .collect(Collectors.toList());
        List<PartTimeSlot> inactiveSlots = allSlots.stream()
                .filter(slot -> !slot.getIsActive())
                .collect(Collectors.toList());
        
        // Calculate total statistics
        long totalQuotaCapacity = activeSlots.stream()
                .mapToLong(PartTimeSlot::getQuota)
                .sum();
        
        long totalApprovedRegistrations = activeSlots.stream()
                .mapToLong(slot -> partTimeSlotRepository.countApprovedRegistrations(slot.getSlotId()))
                .sum();
        
        long totalPendingRegistrations = registrationRepository.countByStatusAndIsActive(
                com.dental.clinic.management.working_schedule.enums.RegistrationStatus.PENDING, true);
        
        long totalRejectedRegistrations = registrationRepository.countByStatusAndIsActive(
                com.dental.clinic.management.working_schedule.enums.RegistrationStatus.REJECTED, true);
        
        long totalAvailableCapacity = totalQuotaCapacity - totalApprovedRegistrations;
        
        double averageUtilization = totalQuotaCapacity > 0 
                ? (totalApprovedRegistrations * 100.0 / totalQuotaCapacity) 
                : 0.0;
        
        // Calculate per-shift statistics
        java.util.Map<String, java.util.List<PartTimeSlot>> slotsByShift = activeSlots.stream()
                .collect(Collectors.groupingBy(PartTimeSlot::getWorkShiftId));
        
        List<com.dental.clinic.management.working_schedule.dto.response.SlotStatisticsResponse.ShiftStatistics> shiftStats = 
                slotsByShift.entrySet().stream()
                .map(entry -> {
                    String shiftId = entry.getKey();
                    List<PartTimeSlot> slots = entry.getValue();
                    
                    // Get shift name
                    String shiftName = slots.isEmpty() ? "Unknown" : 
                            (slots.get(0).getWorkShift() != null ? slots.get(0).getWorkShift().getShiftName() : "Shift " + shiftId);
                    
                    long quota = slots.stream().mapToLong(PartTimeSlot::getQuota).sum();
                    long approved = slots.stream()
                            .mapToLong(slot -> partTimeSlotRepository.countApprovedRegistrations(slot.getSlotId()))
                            .sum();
                    long available = quota - approved;
                    double staffing = quota > 0 ? (approved * 100.0 / quota) : 0.0;
                    
                    return com.dental.clinic.management.working_schedule.dto.response.SlotStatisticsResponse.ShiftStatistics.builder()
                            .shiftName(shiftName)
                            .totalSlots(slots.size())
                            .totalQuota(quota)
                            .approvedRegistrations(approved)
                            .availableCapacity(available)
                            .staffingPercentage(Math.round(staffing * 100.0) / 100.0)
                            .build();
                })
                .collect(Collectors.toList());
        
        // Calculate per-day statistics
        java.util.Map<String, List<PartTimeSlot>> slotsByDay = activeSlots.stream()
                .collect(Collectors.groupingBy(PartTimeSlot::getDayOfWeek));
        
        List<com.dental.clinic.management.working_schedule.dto.response.SlotStatisticsResponse.DayStatistics> dayStats = 
                slotsByDay.entrySet().stream()
                .map(entry -> {
                    String day = entry.getKey();
                    List<PartTimeSlot> slots = entry.getValue();
                    
                    long quota = slots.stream().mapToLong(PartTimeSlot::getQuota).sum();
                    long approved = slots.stream()
                            .mapToLong(slot -> partTimeSlotRepository.countApprovedRegistrations(slot.getSlotId()))
                            .sum();
                    long available = quota - approved;
                    double staffing = quota > 0 ? (approved * 100.0 / quota) : 0.0;
                    
                    return com.dental.clinic.management.working_schedule.dto.response.SlotStatisticsResponse.DayStatistics.builder()
                            .dayOfWeek(day)
                            .totalSlots(slots.size())
                            .totalQuota(quota)
                            .approvedRegistrations(approved)
                            .availableCapacity(available)
                            .staffingPercentage(Math.round(staffing * 100.0) / 100.0)
                            .build();
                })
                .collect(Collectors.toList());
        
        return com.dental.clinic.management.working_schedule.dto.response.SlotStatisticsResponse.builder()
                .totalActiveSlots(activeSlots.size())
                .totalInactiveSlots(inactiveSlots.size())
                .totalApprovedRegistrations(totalApprovedRegistrations)
                .totalPendingRegistrations(totalPendingRegistrations)
                .totalRejectedRegistrations(totalRejectedRegistrations)
                .totalQuotaCapacity(totalQuotaCapacity)
                .totalAvailableCapacity(totalAvailableCapacity)
                .averageStaffingPercentage(Math.round(averageUtilization * 100.0) / 100.0)
                .shiftStatistics(shiftStats)
                .dayStatistics(dayStats)
                .build();
    }

    private PartTimeSlotResponse buildResponse(PartTimeSlot slot, String shiftName) {
        // NEW: Count only APPROVED registrations
        long registered = partTimeSlotRepository.countApprovedRegistrations(slot.getSlotId());

        return PartTimeSlotResponse.builder()
                .slotId(slot.getSlotId())
                .workShiftId(slot.getWorkShiftId())
                .workShiftName(shiftName)
                .dayOfWeek(slot.getDayOfWeek())
                .quota(slot.getQuota())
                .registered(registered)
                .isActive(slot.getIsActive())
                // NEW: Include effective date range
                .effectiveFrom(slot.getEffectiveFrom())
                .effectiveTo(slot.getEffectiveTo())
                .build();
    }
}
