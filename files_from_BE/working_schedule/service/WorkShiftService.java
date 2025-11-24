package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.exception.shift.InvalidShiftDurationException;
import com.dental.clinic.management.exception.work_shift.WorkShiftNotFoundException;
import com.dental.clinic.management.exception.validation.CategoryChangeForbiddenException;
import com.dental.clinic.management.exception.validation.DuplicateTimeRangeException;
import com.dental.clinic.management.exception.validation.InvalidCategoryException;
import com.dental.clinic.management.exception.validation.InvalidTimeRangeException;
import com.dental.clinic.management.exception.validation.InvalidWorkingHoursException;
import com.dental.clinic.management.exception.shift.ShiftInUseException;
import com.dental.clinic.management.exception.shift.DuplicateShiftNameException;
import com.dental.clinic.management.working_schedule.domain.WorkShift;
import com.dental.clinic.management.working_schedule.dto.request.CreateWorkShiftRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdateWorkShiftRequest;
import com.dental.clinic.management.working_schedule.dto.response.WorkShiftResponse;
import com.dental.clinic.management.working_schedule.enums.WorkShiftCategory;
import com.dental.clinic.management.working_schedule.exception.TimeOfDayMismatchException;
import com.dental.clinic.management.working_schedule.mapper.WorkShiftMapper;
import com.dental.clinic.management.working_schedule.repository.EmployeeShiftRepository;
import com.dental.clinic.management.working_schedule.repository.PartTimeSlotRepository;
import com.dental.clinic.management.working_schedule.repository.WorkShiftRepository;
import com.dental.clinic.management.working_schedule.utils.WorkShiftIdGenerator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing work shifts.
 * Implements all business logic and validation rules.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkShiftService {

    private final WorkShiftRepository workShiftRepository;
    private final EmployeeShiftRepository employeeShiftRepository;
    private final PartTimeSlotRepository partTimeSlotRepository;
    private final WorkShiftMapper workShiftMapper;

    // Clinic working hours: 8:00 AM to 9:00 PM
    private static final LocalTime CLINIC_OPEN = LocalTime.of(8, 0);
    private static final LocalTime CLINIC_CLOSE = LocalTime.of(21, 0);
    private static final LocalTime NIGHT_SHIFT_START = LocalTime.of(18, 0);
    
    // Lunch break: 12:00 PM to 1:00 PM (not counted as work hours)
    private static final LocalTime LUNCH_BREAK_START = LocalTime.of(12, 0);
    private static final LocalTime LUNCH_BREAK_END = LocalTime.of(13, 0);
    private static final double LUNCH_BREAK_HOURS = 1.0;
    
    private static final double MIN_DURATION_HOURS = 3.0;
    private static final double MAX_DURATION_HOURS = 8.0;

    /**
     * Create a new work shift.
     * Category is auto-generated based on time range.
     * @param request CreateWorkShiftRequest
     * @return WorkShiftResponse
     */
    @Transactional
    @PreAuthorize("hasAuthority('CREATE_WORK_SHIFTS')")
    public WorkShiftResponse createWorkShift(CreateWorkShiftRequest request) {
        log.info("Creating work shift...");

        // Validation 1: Validate time range
        validateTimeRange(request.getStartTime(), request.getEndTime());

        // Validation 2: Check for duplicate shift name (Lỗi 2)
        validateUniqueShiftName(request.getShiftName(), null);

        // Validation 3: Check for exact time match (Lỗi 1)
        validateUniqueTimeRange(request.getStartTime(), request.getEndTime(), null);

        // Validation 4: Validate duration (3-8 hours)
        double duration = calculateDuration(request.getStartTime(), request.getEndTime());
        validateDuration(duration);

        // Validation 5: Validate working hours (8:00 - 21:00)
        validateWorkingHours(request.getStartTime(), request.getEndTime());

        // Validation 6: Validate morning/afternoon shifts don't start after 11:00
        validateMorningAfternoonStartTime(request.getStartTime());

        // Validation 7: Prevent shifts spanning across 18:00 boundary
        validateShiftDoesNotSpanBoundary(request.getStartTime(), request.getEndTime());

        // Auto-generate category based on time range
        WorkShiftCategory autoCategory = determineCategoryByTime(request.getStartTime(), request.getEndTime());
        log.info("Auto-generated category: {} for shift {}-{}", autoCategory, request.getStartTime(), request.getEndTime());

        // Generate work shift ID
        String generatedId = generateWorkShiftId(request.getStartTime(), request.getEndTime());
        log.info("Generated work shift ID: {}", generatedId);

        // Create and save entity
        WorkShift workShift = workShiftMapper.toEntity(request);
        workShift.setWorkShiftId(generatedId);
        workShift.setCategory(autoCategory); // Set auto-generated category
        
        WorkShift savedWorkShift = workShiftRepository.save(workShift);

        log.info("Successfully created work shift: {} with category: {}", savedWorkShift.getWorkShiftId(), savedWorkShift.getCategory());
        return workShiftMapper.toResponse(savedWorkShift);
    }

    /**
     * Update an existing work shift.
     * Category is auto-updated based on time changes.
     * @param workShiftId Work shift ID
     * @param request UpdateWorkShiftRequest
     * @return WorkShiftResponse
     */
    @Transactional
    @PreAuthorize("hasAuthority('UPDATE_WORK_SHIFTS')")
    public WorkShiftResponse updateWorkShift(String workShiftId, UpdateWorkShiftRequest request) {
        log.info("Updating work shift: {}", workShiftId);

        // Find existing work shift
        WorkShift workShift = workShiftRepository.findById(workShiftId)
                .orElseThrow(() -> new WorkShiftNotFoundException(workShiftId));

        // Check if time is being changed
        boolean isTimeChanging = request.getStartTime() != null || request.getEndTime() != null;
        
        // Prevent time changes if work shift is in use by employee schedules OR registrations
        if (isTimeChanging && isWorkShiftInUse(workShiftId)) {
            String usageDetails = getWorkShiftUsageDetails(workShiftId);
            throw new ShiftInUseException(workShiftId, usageDetails);
        }

        // Determine final values (use new values if provided, otherwise keep existing)
        LocalTime finalStartTime = request.getStartTime() != null ? request.getStartTime() : workShift.getStartTime();
        LocalTime finalEndTime = request.getEndTime() != null ? request.getEndTime() : workShift.getEndTime();
        String finalShiftName = request.getShiftName() != null ? request.getShiftName() : workShift.getShiftName();

        // Apply all validations with final values
        validateTimeRange(finalStartTime, finalEndTime);
        
        // Check for duplicate shift name if name is being changed (Lỗi 2)
        if (request.getShiftName() != null && !request.getShiftName().equals(workShift.getShiftName())) {
            validateUniqueShiftName(finalShiftName, workShiftId);
        }
        
        // Check for exact time match if time is being changed (Lỗi 1)
        if (isTimeChanging) {
            validateUniqueTimeRange(finalStartTime, finalEndTime, workShiftId);
        }
        
        double duration = calculateDuration(finalStartTime, finalEndTime);
        validateDuration(duration);
        
        validateWorkingHours(finalStartTime, finalEndTime);
        validateMorningAfternoonStartTime(finalStartTime);
        validateShiftDoesNotSpanBoundary(finalStartTime, finalEndTime);

        // Auto-update category if time changed
        if (isTimeChanging) {
            WorkShiftCategory newCategory = determineCategoryByTime(finalStartTime, finalEndTime);
            
            // Prevent category changes that would conflict with shift ID semantic meaning
            if (workShift.getCategory() != newCategory) {
                throw new CategoryChangeForbiddenException(
                    workShiftId, 
                    workShift.getCategory().toString(), 
                    newCategory.toString()
                );
            }
            
            // Prevent time-of-day changes that conflict with shift ID prefix
            // Example: WKS_MORNING_03 cannot be updated to afternoon hours (14:00-18:00)
            String expectedTimeOfDay = WorkShiftIdGenerator.extractTimeOfDay(workShiftId);
            String actualTimeOfDay = determineTimeOfDayFromStartTime(finalStartTime);
            
            if (expectedTimeOfDay != null && !expectedTimeOfDay.equals(actualTimeOfDay)) {
                throw new TimeOfDayMismatchException(workShiftId, expectedTimeOfDay, actualTimeOfDay);
            }
            
            log.info("Category remains {} after time update", workShift.getCategory());
        }

        // Update entity
        workShiftMapper.updateEntity(workShift, request);
        
        WorkShift updatedWorkShift = workShiftRepository.save(workShift);

        log.info("Successfully updated work shift: {} with category: {}", workShiftId, updatedWorkShift.getCategory());
        return workShiftMapper.toResponse(updatedWorkShift);
    }

    /**
     * Delete (soft delete) a work shift.
     * Prevents deletion if work shift is in use by employee schedules.
     * @param workShiftId Work shift ID
     */
    @Transactional
    @PreAuthorize("hasAuthority('DELETE_WORK_SHIFTS')")
    public void deleteWorkShift(String workShiftId) {
        log.info("Deleting work shift: {}", workShiftId);

        // Find existing work shift
        WorkShift workShift = workShiftRepository.findById(workShiftId)
                .orElseThrow(() -> new WorkShiftNotFoundException(workShiftId));

        // Check if work shift is in use by employee schedules OR registrations
        if (isWorkShiftInUse(workShiftId)) {
            String usageDetails = getWorkShiftUsageDetails(workShiftId);
            throw new ShiftInUseException(workShiftId, usageDetails);
        }

        // Soft delete
        workShift.setIsActive(false);
        workShiftRepository.save(workShift);

        log.info("Successfully deleted work shift: {}", workShiftId);
    }

    /**
     * Reactivate a soft-deleted work shift (Issue 7).
     * @param workShiftId Work shift ID
     * @return WorkShiftResponse
     */
    @Transactional
    @PreAuthorize("hasAuthority('UPDATE_WORK_SHIFTS')")
    public WorkShiftResponse reactivateWorkShift(String workShiftId) {
        log.info("Reactivating work shift: {}", workShiftId);

        // Find existing work shift (including inactive ones)
        WorkShift workShift = workShiftRepository.findById(workShiftId)
                .orElseThrow(() -> new WorkShiftNotFoundException(workShiftId));

        // Check if already active
        if (Boolean.TRUE.equals(workShift.getIsActive())) {
            throw new IllegalStateException(
                String.format("Ca làm việc %s đã được kích hoạt rồi", workShiftId)
            );
        }

        // Validate không trùng tên với ca đang hoạt động (Lỗi 4)
        validateUniqueShiftName(workShift.getShiftName(), workShiftId);
        
        // Validate không trùng thời gian chính xác với ca đang hoạt động (Lỗi 1)
        validateUniqueTimeRange(workShift.getStartTime(), workShift.getEndTime(), workShiftId);

        // Reactivate
        workShift.setIsActive(true);
        WorkShift reactivatedWorkShift = workShiftRepository.save(workShift);

        log.info("Successfully reactivated work shift: {}", workShiftId);
        return workShiftMapper.toResponse(reactivatedWorkShift);
    }

    /**
     * Get all work shifts with advanced filtering, searching, and sorting.
     * @param isActive Optional filter by active status
     * @param category Optional filter by category (NORMAL/NIGHT)
     * @param search Optional search keyword for shift name
     * @param sortBy Optional sort field (startTime, category, shiftName)
     * @param sortDirection Optional sort direction (ASC/DESC), defaults to ASC
     * @return List of WorkShiftResponse
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('VIEW_WORK_SHIFTS')")
    public List<WorkShiftResponse> getAllWorkShifts(
            Boolean isActive, 
            WorkShiftCategory category,
            String search,
            String sortBy,
            String sortDirection) {
        
        log.info("Fetching work shifts - isActive: {}, category: {}, search: {}, sortBy: {}, sortDirection: {}", 
                 isActive, category, search, sortBy, sortDirection);

        // Build dynamic query using Specification (Issue 11, 12)
        Specification<WorkShift> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by isActive
            if (isActive != null) {
                predicates.add(criteriaBuilder.equal(root.get("isActive"), isActive));
            }
            
            // Filter by category
            if (category != null) {
                predicates.add(criteriaBuilder.equal(root.get("category"), category));
            }
            
            // Search by shift name (case-insensitive)
            if (search != null && !search.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("shiftName")), 
                    "%" + search.toLowerCase() + "%"
                ));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // Execute query
        List<WorkShift> workShifts = workShiftRepository.findAll(spec);
        
        // Convert to response DTOs
        List<WorkShiftResponse> responses = workShifts.stream()
                .map(workShiftMapper::toResponse)
                .collect(Collectors.toList());
        
        // Apply sorting (Issue 10, 12)
        responses = applySorting(responses, sortBy, sortDirection);
        
        log.info("Retrieved {} work shifts", responses.size());
        return responses;
    }

    /**
     * Apply sorting to work shift responses.
     * Default: Sort by startTime ASC, then category (NORMAL before NIGHT).
     * 
     * @param responses List of work shift responses
     * @param sortBy Sort field (startTime, category, shiftName, or null for default)
     * @param sortDirection Sort direction (ASC/DESC, or null for ASC)
     * @return Sorted list
     */
    private List<WorkShiftResponse> applySorting(
            List<WorkShiftResponse> responses, 
            String sortBy, 
            String sortDirection) {
        
        boolean isAscending = sortDirection == null || sortDirection.equalsIgnoreCase("ASC");
        
        if (sortBy == null || sortBy.equalsIgnoreCase("startTime")) {
            // Default: Sort by startTime, then category
            Comparator<WorkShiftResponse> comparator = Comparator
                    .comparing(WorkShiftResponse::getStartTime)
                    .thenComparing(WorkShiftResponse::getCategory);
            
            return isAscending 
                    ? responses.stream().sorted(comparator).collect(Collectors.toList())
                    : responses.stream().sorted(comparator.reversed()).collect(Collectors.toList());
            
        } else if (sortBy.equalsIgnoreCase("category")) {
            // Sort by category, then startTime
            Comparator<WorkShiftResponse> comparator = Comparator
                    .comparing(WorkShiftResponse::getCategory)
                    .thenComparing(WorkShiftResponse::getStartTime);
            
            return isAscending 
                    ? responses.stream().sorted(comparator).collect(Collectors.toList())
                    : responses.stream().sorted(comparator.reversed()).collect(Collectors.toList());
            
        } else if (sortBy.equalsIgnoreCase("shiftName")) {
            // Sort by shift name
            Comparator<WorkShiftResponse> comparator = Comparator
                    .comparing(WorkShiftResponse::getShiftName);
            
            return isAscending 
                    ? responses.stream().sorted(comparator).collect(Collectors.toList())
                    : responses.stream().sorted(comparator.reversed()).collect(Collectors.toList());
        }
        
        // Fallback: return as-is
        return responses;
    }

    /**
     * Get work shift by ID.
     * @param workShiftId Work shift ID
     * @return WorkShiftResponse
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('VIEW_WORK_SHIFTS')")
    public WorkShiftResponse getWorkShiftById(String workShiftId) {
        log.info("Fetching work shift: {}", workShiftId);

        WorkShift workShift = workShiftRepository.findById(workShiftId)
                .orElseThrow(() -> new WorkShiftNotFoundException(workShiftId));

        return workShiftMapper.toResponse(workShift);
    }

    // ============================================
    // VALIDATION METHODS
    // ============================================

    /**
     * Validate that end time is after start time.
     * Lỗi 6: Message tiếng Việt
     */
    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (!endTime.isAfter(startTime)) {
            throw new InvalidTimeRangeException("Giờ kết thúc phải sau giờ bắt đầu");
        }
    }
    
    /**
     * Validate unique shift name among active shifts.
     * Lỗi 2: Prevent duplicate shift names
     * @param shiftName the shift name to check
     * @param excludeWorkShiftId the work shift ID to exclude from check (for updates)
     */
    private void validateUniqueShiftName(String shiftName, String excludeWorkShiftId) {
        List<WorkShift> existingShifts = workShiftRepository.findByShiftNameAndIsActive(shiftName, true);
        
        // Filter out the current shift if updating
        if (excludeWorkShiftId != null) {
            existingShifts = existingShifts.stream()
                    .filter(shift -> !shift.getWorkShiftId().equals(excludeWorkShiftId))
                    .collect(Collectors.toList());
        }
        
        if (!existingShifts.isEmpty()) {
            throw new DuplicateShiftNameException(shiftName);
        }
    }
    
    /**
     * Validate exact time match (same start AND end time).
     * ALLOWS overlapping shifts (for part-time and full-time flexibility).
     * PREVENTS exact duplicates only.
     * 
     * Example:
     * ✅ ALLOWED: Ca A (08:00-17:00) and Ca B (08:00-12:00) - overlapping is OK
     * ❌ BLOCKED: Ca A (08:00-17:00) and Ca B (08:00-17:00) - exact match not allowed
     * 
     * @param startTime the start time to check
     * @param endTime the end time to check
     * @param excludeWorkShiftId the work shift ID to exclude from check (for updates)
     */
    private void validateUniqueTimeRange(LocalTime startTime, LocalTime endTime, String excludeWorkShiftId) {
        List<WorkShift> activeShifts = workShiftRepository.findByIsActive(true);
        
        // Filter out the current shift if updating
        if (excludeWorkShiftId != null) {
            activeShifts = activeShifts.stream()
                    .filter(shift -> !shift.getWorkShiftId().equals(excludeWorkShiftId))
                    .collect(Collectors.toList());
        }
        
        // Check for exact match ONLY (same start time AND end time)
        for (WorkShift shift : activeShifts) {
            if (shift.getStartTime().equals(startTime) && shift.getEndTime().equals(endTime)) {
                throw new DuplicateTimeRangeException(
                    String.format("Đã tồn tại ca làm việc từ %s đến %s (Ca: %s). " +
                                 "Không thể tạo hai ca giống hệt nhau về thời gian.", 
                        startTime, endTime, shift.getShiftName())
                );
            }
        }
    }

    /**
     * Validate shift duration is between 3-8 hours.
     * Lỗi 5: Message rõ ràng về giờ nghỉ trưa
     */
    private void validateDuration(double durationHours) {
        if (durationHours < MIN_DURATION_HOURS || durationHours > MAX_DURATION_HOURS) {
            String message = String.format(
                "Thời lượng ca làm việc phải từ %.0f đến %.0f giờ. Thực tế: %.1f giờ",
                MIN_DURATION_HOURS, MAX_DURATION_HOURS, durationHours
            );
            
            // Lỗi 5: Thêm thông báo về giờ nghỉ trưa nếu ca bao gồm 12h-13h
            if (durationHours < MIN_DURATION_HOURS) {
                message += ". Lưu ý: Giờ nghỉ trưa (12:00-13:00) không được tính vào thời gian làm việc.";
            }
            
            throw new InvalidShiftDurationException(message);
        }
    }

    /**
     * Validate that shift is within clinic working hours (8:00 - 21:00).
     * Lỗi 3: Message rõ ràng hơn khi tạo ca ngoài giờ
     */
    private void validateWorkingHours(LocalTime startTime, LocalTime endTime) {
        if (startTime.isBefore(CLINIC_OPEN) || endTime.isAfter(CLINIC_CLOSE)) {
            String message = String.format(
                "Ca làm việc phải nằm trong giờ hoạt động của phòng khám (%s - %s). " +
                "Ca của bạn: %s - %s",
                CLINIC_OPEN, CLINIC_CLOSE, startTime, endTime
            );
            
            // Lỗi 3: Thêm gợi ý cụ thể
            if (startTime.isBefore(CLINIC_OPEN)) {
                message += String.format(". Giờ bắt đầu %s quá sớm, vui lòng chọn từ %s trở đi.", 
                    startTime, CLINIC_OPEN);
            }
            if (endTime.isAfter(CLINIC_CLOSE)) {
                message += String.format(". Giờ kết thúc %s quá muộn, vui lòng chọn trước %s.", 
                    endTime, CLINIC_CLOSE);
            }
            
            throw new InvalidWorkingHoursException(message);
        }
    }

    /**
     * Validate that shifts do not start in invalid time ranges.
     * 
     * Invalid start times:
     * 1. Between 11:01 and 12:59 (too close to or during lunch break)
     * 2. After 18:00 (would require ending after 21:00 to meet 3-hour minimum)
     * 
     * Valid start times:
     * - 08:00 to 11:00 (morning shifts)
     * - 13:00 to 18:00 (afternoon/night shifts)
     * 
     * @param startTime Shift start time
     * @throws InvalidWorkingHoursException if shift starts in invalid range
     */
    private void validateMorningAfternoonStartTime(LocalTime startTime) {
        LocalTime maxMorningStart = LocalTime.of(11, 0);
        LocalTime minAfternoonStart = LocalTime.of(13, 0);
        LocalTime maxStartTimeForMinDuration = LocalTime.of(18, 0);
        
        // Rule 1: Check if start time is too close to lunch break (after 11:00 but before 13:00)
        if (startTime.isAfter(maxMorningStart) && startTime.isBefore(minAfternoonStart)) {
            throw new InvalidWorkingHoursException(
                String.format("Ca làm việc không thể bắt đầu từ 11:01 đến 12:59. " +
                             "Giờ bắt đầu của bạn: %s. " +
                             "Khoảng thời gian này quá gần hoặc trùng với giờ nghỉ trưa (12:00-13:00). " +
                             "Vui lòng chọn giờ bắt đầu từ 08:00 đến 11:00 (ca sáng), " +
                             "hoặc từ 13:00 đến 18:00 (ca chiều/đêm).",
                    startTime)
            );
        }
        
        // Rule 2: Check if start time is after 18:00 (would violate 3-hour minimum before 21:00 close)
        if (startTime.isAfter(maxStartTimeForMinDuration)) {
            throw new InvalidWorkingHoursException(
                String.format("Ca làm việc không thể bắt đầu sau 18:00. " +
                             "Giờ bắt đầu của bạn: %s. " +
                             "Phòng khám đóng cửa lúc 21:00 và mỗi ca phải có tối thiểu 3 giờ làm việc. " +
                             "Ca muộn nhất có thể bắt đầu là 18:00 (kết thúc 21:00 = 3 giờ).",
                    startTime)
            );
        }
    }

    /**
     * Validate that shifts do not span across the 18:00 boundary.
     * A shift is either fully NORMAL (ends <= 18:00) or fully NIGHT (starts >= 18:00).
     * Shifts spanning across 18:00 are ambiguous and not allowed.
     * 
     * @param startTime Shift start time
     * @param endTime Shift end time
     * @throws InvalidCategoryException if shift spans the 18:00 boundary
     */
    private void validateShiftDoesNotSpanBoundary(LocalTime startTime, LocalTime endTime) {
        boolean startsBeforeBoundary = startTime.isBefore(NIGHT_SHIFT_START);
        boolean endsAfterBoundary = endTime.isAfter(NIGHT_SHIFT_START);
        
        if (startsBeforeBoundary && endsAfterBoundary) {
            throw new InvalidCategoryException(
                String.format("Ca làm việc không được vượt qua ranh giới 18:00. " +
                              "Ca của bạn: %s - %s. " +
                              "Vui lòng tạo ca THƯỜNG (kết thúc trước hoặc đúng 18:00) " +
                              "hoặc ca ĐÊM (bắt đầu từ 18:00 trở đi).", 
                              startTime, endTime)
            );
        }
    }

    /**
     * Determine time-of-day category from start time for shift ID validation.
     * Uses the same logic as WorkShiftIdGenerator.
     * - MORNING: starts between 08:00-11:59
     * - AFTERNOON: starts between 12:00-17:59
     * - EVENING: starts between 18:00-20:59
     * 
     * @param startTime Shift start time
     * @return Time of day category (MORNING, AFTERNOON, EVENING)
     */
    private String determineTimeOfDayFromStartTime(LocalTime startTime) {
        LocalTime afternoonStart = LocalTime.of(12, 0);
        LocalTime eveningStart = LocalTime.of(18, 0);
        
        if (startTime.compareTo(eveningStart) >= 0) {
            return "EVENING";
        } else if (startTime.compareTo(afternoonStart) >= 0) {
            return "AFTERNOON";
        } else {
            return "MORNING";
        }
    }

    /**
     * Determine the appropriate category based on time range.
     * NIGHT if starts >= 18:00, otherwise NORMAL.
     * This should only be called after validateShiftDoesNotSpanBoundary.
     * 
     * @param startTime Shift start time
     * @param endTime Shift end time
     * @return Auto-determined WorkShiftCategory
     */
    private WorkShiftCategory determineCategoryByTime(LocalTime startTime, LocalTime endTime) {
        return startTime.compareTo(NIGHT_SHIFT_START) >= 0 
                ? WorkShiftCategory.NIGHT 
                : WorkShiftCategory.NORMAL;
    }

    /**
     * Check if a work shift template is currently in use by employee schedules or part-time slots.
     * V2: Checks BOTH employee_shifts (full-time schedules) AND part_time_slots (which link to registrations).
     * 
     * @param workShiftId Work shift ID
     * @return true if work shift is in use by any schedule or slot
     */
    private boolean isWorkShiftInUse(String workShiftId) {
        boolean usedBySchedules = employeeShiftRepository.existsByWorkShiftId(workShiftId);
        boolean usedBySlots = partTimeSlotRepository.existsByWorkShiftId(workShiftId);
        return usedBySchedules || usedBySlots;
    }

    /**
     * Get detailed usage count for a work shift (schedules + slots).
     * V2: Shows full-time schedules and part-time slots count.
     * 
     * @param workShiftId Work shift ID
     * @return Usage count message showing schedules and slots
     */
    private String getWorkShiftUsageDetails(String workShiftId) {
        long scheduleCount = employeeShiftRepository.countByWorkShiftId(workShiftId);
        long slotCount = partTimeSlotRepository.countByWorkShiftId(workShiftId);
        
        if (scheduleCount > 0 && slotCount > 0) {
            return scheduleCount + " lịch làm việc và " + slotCount + " slot bán thời gian";
        } else if (scheduleCount > 0) {
            return scheduleCount + " lịch làm việc";
        } else {
            return slotCount + " slot bán thời gian";
        }
    }

    /**
     * Calculate duration in hours between start and end time.
     * Excludes lunch break (11:00-12:00) if the shift spans across it.
     */
    private double calculateDuration(LocalTime startTime, LocalTime endTime) {
        long startSeconds = startTime.toSecondOfDay();
        long endSeconds = endTime.toSecondOfDay();
        
        // Handle case where shift crosses midnight
        if (endSeconds <= startSeconds) {
            endSeconds += 24 * 3600;
        }
        
        long durationSeconds = endSeconds - startSeconds;
        double durationHours = durationSeconds / 3600.0;
        
        // Subtract lunch break if shift spans across it
        // Lunch break: 11:00 - 12:00 (1 hour)
        if (isShiftSpanningLunchBreak(startTime, endTime)) {
            durationHours -= LUNCH_BREAK_HOURS;
        }
        
        return durationHours;
    }

    /**
     * Check if shift spans across the lunch break period (11:00-12:00).
     */
    private boolean isShiftSpanningLunchBreak(LocalTime startTime, LocalTime endTime) {
        // Shift spans lunch break if:
        // - Start time is before or at lunch break start (11:00)
        // - End time is after or at lunch break end (12:00)
        return !startTime.isAfter(LUNCH_BREAK_START) && !endTime.isBefore(LUNCH_BREAK_END);
    }

    /**
     * Generate unique work shift ID based on time and sequence.
     * Format: WKS_{TIME_OF_DAY}_{SEQ}
     * Example: WKS_MORNING_01, WKS_AFTERNOON_02
     */
    private String generateWorkShiftId(LocalTime startTime, LocalTime endTime) {
        // Determine the time of day category from the generator
        String timeOfDay = WorkShiftIdGenerator.extractTimeOfDay(
            WorkShiftIdGenerator.generateShiftId(startTime, endTime, 1)
        );
        
        if (timeOfDay == null) {
            timeOfDay = "SHIFT"; // Fallback
        }
        
        // Find all existing shifts with this time of day prefix
        String prefix = "WKS_" + timeOfDay + "_";
        List<WorkShift> existingShifts = workShiftRepository.findByWorkShiftIdStartingWith(prefix);
        
        // Determine next sequence number
        int maxSequence = 0;
        for (WorkShift shift : existingShifts) {
            String id = shift.getWorkShiftId();
            String sequencePart = id.substring(prefix.length());
            try {
                int sequence = Integer.parseInt(sequencePart);
                maxSequence = Math.max(maxSequence, sequence);
            } catch (NumberFormatException e) {
                // Skip if not a valid number
            }
        }
        
        int nextSequence = maxSequence + 1;
        return WorkShiftIdGenerator.generateShiftId(startTime, endTime, nextSequence);
    }
}
