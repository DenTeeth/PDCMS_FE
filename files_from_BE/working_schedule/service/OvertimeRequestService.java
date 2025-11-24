package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.employee_shift.SlotConflictException;
import com.dental.clinic.management.exception.overtime.DuplicateOvertimeRequestException;
import com.dental.clinic.management.exception.overtime.InvalidStateTransitionException;
import com.dental.clinic.management.exception.overtime.OvertimeRequestNotFoundException;
import com.dental.clinic.management.exception.overtime.RelatedResourceNotFoundException;
import com.dental.clinic.management.utils.IdGenerator;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.working_schedule.domain.EmployeeShift;
import com.dental.clinic.management.working_schedule.domain.OvertimeRequest;
import com.dental.clinic.management.working_schedule.domain.WorkShift;
import com.dental.clinic.management.working_schedule.dto.request.CreateOvertimeRequestDTO;
import com.dental.clinic.management.working_schedule.dto.request.UpdateOvertimeStatusDTO;
import com.dental.clinic.management.working_schedule.dto.response.OvertimeRequestDetailResponse;
import com.dental.clinic.management.working_schedule.dto.response.OvertimeRequestListResponse;
import com.dental.clinic.management.working_schedule.enums.RequestStatus;
import com.dental.clinic.management.working_schedule.enums.ShiftSource;
import com.dental.clinic.management.working_schedule.enums.ShiftStatus;
import com.dental.clinic.management.working_schedule.mapper.OvertimeRequestMapper;
import com.dental.clinic.management.working_schedule.repository.EmployeeShiftRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.EmployeeShiftRepository;
import com.dental.clinic.management.working_schedule.repository.FixedShiftRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.OvertimeRequestRepository;
import com.dental.clinic.management.working_schedule.repository.WorkShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Service for managing overtime requests.
 * Implements business logic, validation, and permission-based access control.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OvertimeRequestService {

    private final OvertimeRequestRepository overtimeRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkShiftRepository workShiftRepository;
    private final OvertimeRequestMapper overtimeRequestMapper;
    private final EmployeeShiftRepository employeeShiftRepository;
    private final FixedShiftRegistrationRepository fixedShiftRegistrationRepository;
    private final EmployeeShiftRegistrationRepository employeeShiftRegistrationRepository;
    private final IdGenerator idGenerator;

    /**
     * Get all overtime requests with pagination and optional filtering.
     * Access control:
     * - VIEW_OT_ALL: Can see all requests
     * - VIEW_OT_OWN: Can only see own requests
     *
     * @param status   optional status filter
     * @param pageable pagination information
     * @return page of overtime requests
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyAuthority('VIEW_OT_ALL', 'VIEW_OT_OWN')")
    public Page<OvertimeRequestListResponse> getAllOvertimeRequests(RequestStatus status, Pageable pageable) {
        log.info("Fetching overtime requests with status: {}", status);

        boolean hasViewAll = SecurityUtil.hasCurrentUserPermission("VIEW_OT_ALL");

        if (hasViewAll) {
            // User can see all requests
            log.debug("User has VIEW_OT_ALL permission");
            Page<OvertimeRequest> requests = overtimeRequestRepository.findAllWithOptionalStatus(status, pageable);
            return requests.map(overtimeRequestMapper::toListResponse);
        } else {
            // User can only see their own requests
            log.debug("User has VIEW_OT_OWN permission");
            Employee currentEmployee = getCurrentEmployee();
            Page<OvertimeRequest> requests = overtimeRequestRepository.findByEmployeeIdAndStatus(
                    currentEmployee.getEmployeeId(), status, pageable);
            return requests.map(overtimeRequestMapper::toListResponse);
        }
    }

    /**
     * Get detailed information about a specific overtime request.
     * Access control:
     * - VIEW_OT_ALL: Can see any request
     * - VIEW_OT_OWN: Can only see own requests
     *
     * @param requestId the overtime request ID
     * @return overtime request details
     * @throws OvertimeRequestNotFoundException if request not found
     * @throws AccessDeniedException            if user doesn't have permission
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyAuthority('VIEW_OT_ALL', 'VIEW_OT_OWN')")
    public OvertimeRequestDetailResponse getOvertimeRequestById(String requestId) {
        log.info("Fetching overtime request: {}", requestId);

        OvertimeRequest request = overtimeRequestRepository.findById(requestId)
                .orElseThrow(() -> new OvertimeRequestNotFoundException(requestId));

        // Permission check for VIEW_OT_OWN users
        if (!SecurityUtil.hasCurrentUserPermission("VIEW_OT_ALL")) {
            Employee currentEmployee = getCurrentEmployee();
            if (!request.isOwnedBy(currentEmployee.getEmployeeId()) &&
                    !request.isRequestedBy(currentEmployee.getEmployeeId())) {
                log.warn("User {} attempted to access overtime request {} without permission",
                        currentEmployee.getEmployeeId(), requestId);
                // Return 404 instead of 403 for security (don't reveal existence)
                throw new OvertimeRequestNotFoundException(requestId);
            }
        }

        return overtimeRequestMapper.toDetailResponse(request);
    }

    /**
     * Create a new overtime request.
     * Two modes:
     * 1. Employee creates for themselves: employeeId in DTO is null, auto-filled from JWT
     * 2. Admin creates for any employee: employeeId must be provided in DTO
     * 
     * Validates:
     * - Employee and WorkShift exist
     * - Work date is not in the past
     * - No conflicting requests (same employee, date, shift with PENDING or
     * APPROVED status)
     *
     * @param dto create overtime request DTO
     * @return created overtime request details
     * @throws RelatedResourceNotFoundException  if employee or shift not found
     * @throws DuplicateOvertimeRequestException if conflicting request exists
     * @throws IllegalArgumentException          if work date is in the past
     */
    @Transactional
    @PreAuthorize("hasAuthority('CREATE_OT')")
    public OvertimeRequestDetailResponse createOvertimeRequest(CreateOvertimeRequestDTO dto) {
        // Determine target employee: use provided employeeId or current user's employeeId
        Integer targetEmployeeId;
        if (dto.getEmployeeId() != null) {
            // Admin mode: creating for specified employee
            targetEmployeeId = dto.getEmployeeId();
            log.info("Creating overtime request for employee {} (admin mode)", targetEmployeeId);
        } else {
            // Employee mode: creating for themselves
            Employee currentEmployee = getCurrentEmployee();
            targetEmployeeId = currentEmployee.getEmployeeId();
            log.info("Creating overtime request for employee {} (self-request mode)", targetEmployeeId);
        }

        log.info("Creating overtime request for employee {} on {} shift {}",
                targetEmployeeId, dto.getWorkDate(), dto.getWorkShiftId());

        // Validation 1: Verify employee exists
        Employee employee = employeeRepository.findById(targetEmployeeId)
                .orElseThrow(() -> new RelatedResourceNotFoundException("Nhân viên", targetEmployeeId));

        // Validation 2: Verify work shift exists
        WorkShift workShift = workShiftRepository.findById(dto.getWorkShiftId())
                .orElseThrow(() -> new RelatedResourceNotFoundException("Ca làm việc", dto.getWorkShiftId()));

        // Validation 2.1: Anti-spam check - Only 1 overtime request per employee per date
        // Employee can only submit ONE overtime request for each date (any shift)
        // Check for PENDING or APPROVED requests on the same date
        List<RequestStatus> activeStatuses = List.of(RequestStatus.PENDING, RequestStatus.APPROVED);
        boolean alreadyHasRequestOnDate = overtimeRequestRepository.existsOvertimeRequestOnDate(
                targetEmployeeId, dto.getWorkDate(), activeStatuses);
        
        if (alreadyHasRequestOnDate) {
            log.warn("❌ Anti-spam: Employee {} already has overtime request on date {}", 
                    targetEmployeeId, dto.getWorkDate());
            throw new DuplicateOvertimeRequestException(
                    String.format("Bạn đã có đơn overtime cho ngày %s rồi! Chỉ được gửi 1 đơn overtime cho mỗi ngày.", 
                            dto.getWorkDate()));
        }

        // Validation 2.2: Check for hybrid schedule conflicts
        // Employee must NOT have a regular work schedule on this date/shift
        validateNoScheduleConflict(targetEmployeeId, dto.getWorkDate(), dto.getWorkShiftId());

        // Validation 3: Work date and shift time must not be in the past
        LocalDate today = LocalDate.now();
        if (dto.getWorkDate().isBefore(today)) {
            log.warn("Cannot create overtime request for past date: {}", dto.getWorkDate());
            throw new IllegalArgumentException("Ngày làm việc không được là ngày trong quá khứ.");
        }
        
        // Validation 3.1: If workDate is today, check if shift has already ended
        if (dto.getWorkDate().isEqual(today)) {
            LocalTime now = java.time.LocalTime.now();
            if (workShift.getEndTime().isBefore(now) || workShift.getEndTime().equals(now)) {
                log.warn("Cannot create overtime request for shift that has already ended today. Shift ends at {}, current time: {}", 
                         workShift.getEndTime(), now);
                throw new IllegalArgumentException(
                    String.format("Ca làm việc đã kết thúc (kết thúc lúc %s). Không thể tạo yêu cầu OT.", 
                                  workShift.getEndTime())
                );
            }
        }

        // Validation 4: Admin cannot use admin privilege to create OT for themselves (Lỗi 2)
        // Security reason: Admin creating OT for themselves can self-approve → abuse of power
        // Admin mode is when employeeId is explicitly provided in request
        Employee requestedBy = getCurrentEmployee();
        if (dto.getEmployeeId() != null && targetEmployeeId.equals(requestedBy.getEmployeeId())) {
            log.warn("Admin {} attempted to use admin privilege to create overtime for themselves (security violation)", requestedBy.getEmployeeId());
            throw new IllegalArgumentException("Không thể tự phân công OT cho bản thân.");
        }

        // Validation 5: Check for time-overlapping shifts on the same date (Lỗi 3)
        // A person cannot work 2 shifts that overlap in time on the same day
        List<OvertimeRequest> existingRequests = overtimeRequestRepository.findByEmployeeIdAndWorkDate(
                targetEmployeeId, dto.getWorkDate());
        
        for (OvertimeRequest existingRequest : existingRequests) {
            WorkShift existingShift = existingRequest.getWorkShift();
            
            // Check 1: Prevent spam after REJECTION (Lỗi 4)
            // If employee was REJECTED for this exact shift, don't allow re-request
            if (existingRequest.getStatus() == RequestStatus.REJECTED &&
                existingShift.getWorkShiftId().equals(dto.getWorkShiftId())) {
                log.warn("Employee {} attempted to re-request overtime for REJECTED shift {} on {}",
                        targetEmployeeId, dto.getWorkShiftId(), dto.getWorkDate());
                throw new IllegalArgumentException(
                    String.format("Yêu cầu OT cho ca này đã bị từ chối trước đó (lý do: %s). Vui lòng liên hệ quản lý nếu cần thay đổi.",
                        existingRequest.getRejectedReason() != null ? existingRequest.getRejectedReason() : "Không rõ")
                );
            }
            
            // Check 2: Prevent spam after CANCELLATION
            // If employee CANCELLED this exact shift, don't allow immediate re-request
            if (existingRequest.getStatus() == RequestStatus.CANCELLED &&
                existingShift.getWorkShiftId().equals(dto.getWorkShiftId())) {
                log.warn("Employee {} attempted to re-request overtime for CANCELLED shift {} on {}",
                        targetEmployeeId, dto.getWorkShiftId(), dto.getWorkDate());
                throw new IllegalArgumentException(
                    String.format("Yêu cầu OT cho ca này đã bị hủy trước đó (lý do: %s). Vui lòng liên hệ quản lý nếu cần tạo lại.",
                        existingRequest.getCancellationReason() != null ? existingRequest.getCancellationReason() : "Không rõ")
                );
            }
            
            // Check 3: Time-overlapping with PENDING or APPROVED requests
            if (!activeStatuses.contains(existingRequest.getStatus())) {
                continue; // Skip REJECTED/CANCELLED for time overlap check
            }
            
            // Check if shifts overlap in time
            boolean timeOverlap = !(workShift.getEndTime().isBefore(existingShift.getStartTime()) || 
                                   workShift.getStartTime().isAfter(existingShift.getEndTime()));
            
            if (timeOverlap) {
                log.warn("Time-overlapping overtime request exists for employee {} on {}. Existing shift: {} ({}-{}), New shift: {} ({}-{})",
                        targetEmployeeId, dto.getWorkDate(),
                        existingShift.getWorkShiftId(), existingShift.getStartTime(), existingShift.getEndTime(),
                        workShift.getWorkShiftId(), workShift.getStartTime(), workShift.getEndTime());
                throw new IllegalArgumentException(
                    String.format("Nhân viên đã có ca OT trùng giờ trong ngày %s (ca %s: %s-%s). Không thể tạo ca OT mới (ca %s: %s-%s).",
                        dto.getWorkDate(),
                        existingShift.getShiftName(), existingShift.getStartTime(), existingShift.getEndTime(),
                        workShift.getShiftName(), workShift.getStartTime(), workShift.getEndTime())
                );
            }
        }

        // Create overtime request (ID will be auto-generated via @PrePersist)
        OvertimeRequest overtimeRequest = new OvertimeRequest();
        overtimeRequest.setEmployee(employee);
        overtimeRequest.setRequestedBy(requestedBy);
        overtimeRequest.setWorkDate(dto.getWorkDate());
        overtimeRequest.setWorkShift(workShift);
        overtimeRequest.setReason(dto.getReason());
        overtimeRequest.setStatus(RequestStatus.PENDING);

        OvertimeRequest savedRequest = overtimeRequestRepository.save(overtimeRequest);
        log.info("Successfully created overtime request: {}", savedRequest.getRequestId());

        return overtimeRequestMapper.toDetailResponse(savedRequest);
    }

    /**
     * Update overtime request status (Approve, Reject, or Cancel).
     * Business rules:
     * - Can only update PENDING requests
     * - APPROVED: Requires APPROVE_OT permission
     * - REJECTED: Requires REJECT_OT permission, reason is required
     * - CANCELLED: Requires CANCEL_OT_OWN (for own requests) or CANCEL_OT_PENDING
     * (for managing), reason is required
     * - Auto-creates EmployeeShift when APPROVED ✅ IMPLEMENTED
     *
     * @param requestId the overtime request ID
     * @param dto       update status DTO
     * @return updated overtime request details
     * @throws OvertimeRequestNotFoundException if request not found
     * @throws InvalidStateTransitionException  if request is not PENDING
     * @throws AccessDeniedException            if user doesn't have required
     *                                          permission
     * @throws IllegalArgumentException         if validation fails
     */
    @Transactional
    public OvertimeRequestDetailResponse updateOvertimeStatus(String requestId, UpdateOvertimeStatusDTO dto) {
        log.info("Updating overtime request {} to status {}", requestId, dto.getStatus());

        // Find the request
        OvertimeRequest request = overtimeRequestRepository.findById(requestId)
                .orElseThrow(() -> new OvertimeRequestNotFoundException(requestId));

        // Validation 1: Request must be PENDING
        if (!request.isPending()) {
            log.warn("Cannot update overtime request {} - current status is {}", requestId, request.getStatus());
            throw new InvalidStateTransitionException(requestId, request.getStatus(), dto.getStatus());
        }

        // Get current user
        Employee currentEmployee = getCurrentEmployee();

        // Process based on target status
        switch (dto.getStatus()) {
            case APPROVED -> handleApproval(request, currentEmployee);
            case REJECTED -> handleRejection(request, dto, currentEmployee);
            case CANCELLED -> handleCancellation(request, dto, currentEmployee);
            default -> throw new IllegalArgumentException("Trạng thái không hợp lệ: " + dto.getStatus());
        }

        OvertimeRequest updatedRequest = overtimeRequestRepository.save(request);
        log.info("Successfully updated overtime request {} to status {}", requestId, dto.getStatus());

        return overtimeRequestMapper.toDetailResponse(updatedRequest);
    }

    /**
     * Handle overtime request approval.
     */
    private void handleApproval(OvertimeRequest request, Employee approvedBy) {
        // Check permission
        if (!SecurityUtil.hasCurrentUserPermission("APPROVE_OT")) {
            log.warn("User {} does not have APPROVE_OT permission", approvedBy.getEmployeeId());
            throw new AccessDeniedException("Bạn không có quyền duyệt yêu cầu OT.");
        }

        request.setStatus(RequestStatus.APPROVED);
        request.setApprovedBy(approvedBy);
        request.setApprovedAt(LocalDateTime.now());

        log.info("Overtime request {} approved by employee {}", request.getRequestId(), approvedBy.getEmployeeId());

        // Auto-create EmployeeShift record for overtime
        createEmployeeShiftFromOvertimeApproval(request);
    }

    /**
     * Handle overtime request rejection.
     */
    private void handleRejection(OvertimeRequest request, UpdateOvertimeStatusDTO dto, Employee rejectedBy) {
        // Check permission
        if (!SecurityUtil.hasCurrentUserPermission("REJECT_OT")) {
            log.warn("User {} does not have REJECT_OT permission", rejectedBy.getEmployeeId());
            throw new AccessDeniedException("Bạn không có quyền từ chối yêu cầu OT.");
        }

        // Validate reason is provided
        if (dto.getReason() == null || dto.getReason().isBlank()) {
            throw new IllegalArgumentException("Lý do từ chối là bắt buộc.");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setRejectedReason(dto.getReason());
        request.setApprovedBy(rejectedBy); // Track who rejected it
        request.setApprovedAt(LocalDateTime.now());

        log.info("Overtime request {} rejected by employee {}", request.getRequestId(), rejectedBy.getEmployeeId());
    }

    /**
     * Handle overtime request cancellation.
     */
    private void handleCancellation(OvertimeRequest request, UpdateOvertimeStatusDTO dto, Employee cancelledBy) {
        // Validate reason is provided
        if (dto.getReason() == null || dto.getReason().isBlank()) {
            throw new IllegalArgumentException("Lý do hủy là bắt buộc.");
        }

        // Permission check: 
        // - CANCEL_OT_OWN: Can cancel if they are the employee (assigned to the OT) OR the creator (requestedBy)
        // - CANCEL_OT_PENDING: Can cancel any PENDING request (admin/manager)
        boolean isOwnerOrCreator = request.isOwnedBy(cancelledBy.getEmployeeId()) || 
                                   request.isRequestedBy(cancelledBy.getEmployeeId());
        boolean canCancelOwn = SecurityUtil.hasCurrentUserPermission("CANCEL_OT_OWN") && isOwnerOrCreator;
        boolean canCancelAny = SecurityUtil.hasCurrentUserPermission("CANCEL_OT_PENDING");

        if (!canCancelOwn && !canCancelAny) {
            log.warn("User {} does not have permission to cancel overtime request {}",
                    cancelledBy.getEmployeeId(), request.getRequestId());
            throw new AccessDeniedException("Bạn không có quyền hủy yêu cầu OT này.");
        }

        request.setStatus(RequestStatus.CANCELLED);
        request.setCancellationReason(dto.getReason());

        log.info("Overtime request {} cancelled by employee {}", request.getRequestId(), cancelledBy.getEmployeeId());
    }

    /**
     * Get the current logged-in employee.
     *
     * @return current employee
     * @throws IllegalStateException if user not found or not an employee
     */
    private Employee getCurrentEmployee() {
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy người dùng đang đăng nhập."));

        return employeeRepository.findByAccount_Username(username)
                .orElseThrow(() -> new IllegalStateException(
                        "Người dùng hiện tại không phải là nhân viên."));
    }

    /**
     * Auto-create EmployeeShift record when overtime is approved.
     * This creates the actual scheduled shift for the overtime work.
     *
     * @param request the approved overtime request
     */
    private void createEmployeeShiftFromOvertimeApproval(OvertimeRequest request) {
        try {
            // Check if shift already exists to avoid duplicates
            boolean exists = employeeShiftRepository.existsByEmployeeAndDateAndShift(
                    request.getEmployee().getEmployeeId(),
                    request.getWorkDate(),
                    request.getWorkShift().getWorkShiftId());

            if (exists) {
                log.warn("EmployeeShift already exists for employee {} on {} shift {}. Skipping creation.",
                        request.getEmployee().getEmployeeId(), request.getWorkDate(),
                        request.getWorkShift().getWorkShiftId());
                return;
            }

            // Generate unique ID with format EMSyyMMddSEQ (e.g., EMS251029001)
            String employeeShiftId = idGenerator.generateId("EMS");

            // Create new employee shift
            EmployeeShift employeeShift = new EmployeeShift();
            employeeShift.setEmployeeShiftId(employeeShiftId); // Set generated ID
            employeeShift.setEmployee(request.getEmployee());
            employeeShift.setWorkDate(request.getWorkDate());
            employeeShift.setWorkShift(request.getWorkShift());
            employeeShift.setSource(ShiftSource.OT_APPROVAL); // Mark as overtime source
            employeeShift.setStatus(ShiftStatus.SCHEDULED);
            employeeShift.setIsOvertime(true); // Mark as overtime shift
            employeeShift.setCreatedBy(request.getApprovedBy().getEmployeeId()); // Track who approved (created shift)
            employeeShift.setSourceOtRequestId(request.getRequestId()); // Link to OT request
            employeeShift.setNotes(String.format("Tạo từ yêu cầu OT %s - %s",
                    request.getRequestId(), request.getReason()));

            employeeShiftRepository.save(employeeShift);

            log.info("Created EmployeeShift {} for overtime request {} - Employee {} on {} shift {}",
                    employeeShiftId,
                    request.getRequestId(),
                    request.getEmployee().getEmployeeId(),
                    request.getWorkDate(),
                    request.getWorkShift().getWorkShiftId());

        } catch (Exception e) {
            log.error("Failed to create EmployeeShift for overtime request {}: {}",
                    request.getRequestId(), e.getMessage(), e);
            // Don't fail the entire transaction, just log the error
        }
    }

    /**
     * Validate that employee does NOT have a regular work schedule on the specified date and shift.
     * Checks both Fixed and Part-Time schedules (Hybrid approach).
     * 
     * Luồng 1 (Fixed): Checks fixed_shift_registrations + fixed_registration_days
     *   - For FULL_TIME and PART_TIME_FIXED employees
     * 
     * Luồng 2 (Flex): Checks part_time_registrations + part_time_slots
     *   - For PART_TIME_FLEX employees
     * 
     * @param employeeId employee ID
     * @param workDate the date to check
     * @param workShiftId work shift ID
     * @throws SlotConflictException if employee has a regular schedule on this date/shift
     */
    private void validateNoScheduleConflict(Integer employeeId, LocalDate workDate, String workShiftId) {
        log.debug("Checking hybrid schedule conflicts for employee {} on {} shift {}", 
                employeeId, workDate, workShiftId);

        // Check Luồng 1: Fixed Schedule (FULL_TIME & PART_TIME_FIXED)
        boolean hasFixedSchedule = fixedShiftRegistrationRepository.hasFixedScheduleOnDate(
                employeeId, workDate, workShiftId);
        
        if (hasFixedSchedule) {
            log.warn("Employee {} has fixed schedule on {} shift {} - cannot create OT request",
                    employeeId, workDate, workShiftId);
            throw new SlotConflictException("Nhân viên đã có lịch làm việc bình thường vào ca này.");
        }

        // Check Luồng 2: Part-Time Flexible Schedule (PART_TIME_FLEX)
        boolean hasPartTimeSchedule = employeeShiftRegistrationRepository.hasPartTimeScheduleOnDate(
                employeeId, workDate, workShiftId);
        
        if (hasPartTimeSchedule) {
            log.warn("Employee {} has part-time schedule on {} shift {} - cannot create OT request",
                    employeeId, workDate, workShiftId);
            throw new SlotConflictException("Nhân viên đã có lịch làm việc bình thường vào ca này.");
        }

        log.debug("No schedule conflicts found for employee {} on {} shift {}", 
                employeeId, workDate, workShiftId);
    }
}
