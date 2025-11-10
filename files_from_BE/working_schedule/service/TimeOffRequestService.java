package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.employee.EmployeeNotFoundException;
import com.dental.clinic.management.exception.time_off.DuplicateTimeOffRequestException;
import com.dental.clinic.management.exception.time_off.InsufficientLeaveBalanceException;
import com.dental.clinic.management.exception.time_off.ShiftNotFoundForLeaveException;
import com.dental.clinic.management.exception.time_off.TimeOffRequestNotFoundException;
import com.dental.clinic.management.exception.time_off.TimeOffTypeNotFoundException;
import com.dental.clinic.management.exception.validation.InvalidRequestException;
import com.dental.clinic.management.exception.validation.InvalidStateTransitionException;
import com.dental.clinic.management.exception.validation.InvalidDateRangeException;
import com.dental.clinic.management.utils.IdGenerator;
import com.dental.clinic.management.utils.security.AuthoritiesConstants;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.working_schedule.domain.EmployeeLeaveBalance;
import com.dental.clinic.management.working_schedule.domain.LeaveBalanceHistory;
import com.dental.clinic.management.working_schedule.domain.TimeOffRequest;
import com.dental.clinic.management.working_schedule.domain.TimeOffType;
import com.dental.clinic.management.working_schedule.dto.request.CreateTimeOffRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdateTimeOffStatusRequest;
import com.dental.clinic.management.working_schedule.dto.response.TimeOffRequestResponse;
import com.dental.clinic.management.working_schedule.enums.BalanceChangeReason;
import com.dental.clinic.management.working_schedule.enums.ShiftStatus;
import com.dental.clinic.management.working_schedule.enums.TimeOffStatus;
import com.dental.clinic.management.working_schedule.mapper.TimeOffRequestMapper;
import com.dental.clinic.management.working_schedule.repository.EmployeeLeaveBalanceRepository;
import com.dental.clinic.management.working_schedule.repository.EmployeeShiftRepository;
import com.dental.clinic.management.working_schedule.repository.FixedShiftRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.LeaveBalanceHistoryRepository;
import com.dental.clinic.management.working_schedule.repository.PartTimeSlotRepository;
import com.dental.clinic.management.working_schedule.repository.TimeOffRequestRepository;
import com.dental.clinic.management.working_schedule.repository.TimeOffTypeRepository;
import com.dental.clinic.management.working_schedule.repository.WorkShiftRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service for managing time-off requests
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TimeOffRequestService {

        private final TimeOffRequestRepository requestRepository;
        private final TimeOffTypeRepository typeRepository;
        private final EmployeeRepository employeeRepository;
        private final AccountRepository accountRepository;
        private final TimeOffRequestMapper requestMapper;
        private final IdGenerator idGenerator;
        private final EmployeeLeaveBalanceRepository balanceRepository;
        private final LeaveBalanceHistoryRepository historyRepository;
        private final EmployeeShiftRepository employeeShiftRepository;
        private final FixedShiftRegistrationRepository fixedShiftRegistrationRepository;
        private final PartTimeSlotRepository partTimeSlotRepository;
        private final WorkShiftRepository workShiftRepository;

        @PersistenceContext
        private EntityManager entityManager;

        /**
         * GET /api/v1/time-off-requests
         * Lấy danh sách yêu cầu nghỉ phép với phân trang và bộ lọc
         */
        @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('" + AuthoritiesConstants.VIEW_TIMEOFF_ALL + "') or " +
                        "hasAuthority('" + AuthoritiesConstants.VIEW_TIMEOFF_OWN + "')")
        public Page<TimeOffRequestResponse> getAllRequests(
                        Integer employeeId,
                        TimeOffStatus status,
                        LocalDate startDate,
                        LocalDate endDate,
                        Pageable pageable) {

                log.debug("Request to get all time-off requests with filters");

                // LUỒNG 1: Admin hoặc người dùng có quyền xem tất cả
                if (SecurityUtil.hasCurrentUserRole(AuthoritiesConstants.ADMIN) ||
                                SecurityUtil.hasCurrentUserPermission(AuthoritiesConstants.VIEW_TIMEOFF_ALL)) {

                        log.info("User has VIEW_TIMEOFF_ALL permission, fetching with filters");
                        return requestRepository.findWithFilters(employeeId, status, startDate, endDate, pageable)
                                        .map(requestMapper::toResponse);
                }
                // LUỒNG 2: Nhân viên chỉ có quyền VIEW_TIMEOFF_OWN
                else {
                        String username = SecurityUtil.getCurrentUserLogin()
                                        .orElseThrow(() -> new RuntimeException("User not authenticated"));

                        Integer currentEmployeeId = accountRepository.findOneByUsername(username)
                                        .map(account -> {
                                                if (account.getEmployee() == null) {
                                                        throw new RuntimeException("Account " + username
                                                                        + " không có Employee liên kết.");
                                                }
                                                return account.getEmployee().getEmployeeId();
                                        })
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Employee not found for user: " + username));

                        log.info("User has VIEW_TIMEOFF_OWN permission, fetching for employee_id: {}",
                                        currentEmployeeId);

                        // Force filter by current employee, ignore employeeId parameter
                        return requestRepository
                                        .findWithFilters(currentEmployeeId, status, startDate, endDate, pageable)
                                        .map(requestMapper::toResponse);
                }
        }

        /**
         * GET /api/v1/time-off-requests/{request_id}
         * Xem chi tiết một yêu cầu nghỉ phép
         */
        @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('" + AuthoritiesConstants.VIEW_TIMEOFF_ALL + "') or " +
                        "hasAuthority('" + AuthoritiesConstants.VIEW_TIMEOFF_OWN + "')")
        public TimeOffRequestResponse getRequestById(String requestId) {
                log.debug("Request to get time-off request: {}", requestId);

                // LUỒNG 1: Admin hoặc người dùng có quyền xem tất cả
                if (SecurityUtil.hasCurrentUserRole(AuthoritiesConstants.ADMIN) ||
                                SecurityUtil.hasCurrentUserPermission(AuthoritiesConstants.VIEW_TIMEOFF_ALL)) {

                        log.info("User has VIEW_TIMEOFF_ALL permission, fetching request: {}", requestId);
                        return requestRepository.findByRequestId(requestId)
                                        .map(requestMapper::toResponse)
                                        .orElseThrow(() -> new TimeOffRequestNotFoundException(requestId));
                }
                // LUỒNG 2: Nhân viên chỉ có quyền VIEW_TIMEOFF_OWN (phải là chủ sở hữu)
                else {
                        String username = SecurityUtil.getCurrentUserLogin()
                                        .orElseThrow(() -> new RuntimeException("User not authenticated"));

                        Integer employeeId = accountRepository.findOneByUsername(username)
                                        .map(account -> {
                                                if (account.getEmployee() == null) {
                                                        throw new RuntimeException("Account " + username
                                                                        + " không có Employee liên kết.");
                                                }
                                                return account.getEmployee().getEmployeeId();
                                        })
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Employee not found for user: " + username));

                        log.info("User has VIEW_TIMEOFF_OWN permission, fetching request: {} for employee_id: {}",
                                        requestId, employeeId);

                        return requestRepository.findByRequestIdAndEmployeeId(requestId, employeeId)
                                        .map(requestMapper::toResponse)
                                        .orElseThrow(() -> new TimeOffRequestNotFoundException(requestId,
                                                        "or you don't have permission to view it"));
                }
        }

        /**
         * POST /api/v1/time-off-requests
         * Tạo yêu cầu nghỉ phép mới
         */
        @PreAuthorize("hasAuthority('" + AuthoritiesConstants.CREATE_TIMEOFF + "')")
        @Transactional
        public TimeOffRequestResponse createRequest(CreateTimeOffRequest request) {
                log.debug("Request to create time-off request: {}", request);

                // 1. Validate employee exists
                employeeRepository.findById(request.getEmployeeId())
                                .orElseThrow(() -> new EmployeeNotFoundException(request.getEmployeeId()));

                // 2. Validate time-off type exists and is active
                TimeOffType timeOffType = typeRepository.findByTypeIdAndIsActive(request.getTimeOffTypeId(), true)
                                .orElseThrow(() -> new TimeOffTypeNotFoundException(request.getTimeOffTypeId()));

                // 3. Validate date range
                if (request.getStartDate().isAfter(request.getEndDate())) {
                        throw new InvalidDateRangeException(
                                        "Ngày bắt đầu không được lớn hơn ngày kết thúc. " +
                                                        "Ngày bắt đầu: " + request.getStartDate() + ", Ngày kết thúc: "
                                                        + request.getEndDate());
                }

                // 3.5. Check leave balance CHỈ cho ANNUAL_LEAVE
                // Các loại khác (SICK_LEAVE, UNPAID_PERSONAL) không cần check balance
                if ("ANNUAL_LEAVE".equals(timeOffType.getTypeCode())) {
                        checkLeaveBalance(request.getEmployeeId(), request.getTimeOffTypeId(),
                                        request.getStartDate(), request.getEndDate(), request.getWorkShiftId());
                }

                // 4. Business Rule: If half-day off (work_shift_id provided), start_date must
                // equal
                // end_date
                if (request.getWorkShiftId() != null && !request.getStartDate().equals(request.getEndDate())) {
                        throw new InvalidDateRangeException(
                                        "Khi nghỉ theo ca, ngày bắt đầu và kết thúc phải giống nhau. " +
                                                        "Ngày bắt đầu: " + request.getStartDate() + ", Ngày kết thúc: "
                                                        + request.getEndDate());
                }

                // 4.5. [V14 Hybrid] Kiểm tra nhân viên có lịch làm việc không
                // Query từ fixed_shift_registrations VÀ part_time_registrations
                if (request.getWorkShiftId() != null) {
                        // Nghỉ theo ca (half-day)
                        boolean hasShift = checkEmployeeHasShift(
                                        request.getEmployeeId(),
                                        request.getStartDate(),
                                        request.getWorkShiftId());

                        if (!hasShift) {
                                // Lấy shift name để hiển thị message rõ ràng hơn
                                String shiftName = workShiftRepository.findById(request.getWorkShiftId())
                                                .map(ws -> ws.getShiftName())
                                                .orElse(request.getWorkShiftId());

                                throw new ShiftNotFoundForLeaveException(
                                                request.getEmployeeId(),
                                                request.getStartDate().toString(),
                                                request.getWorkShiftId(),
                                                shiftName);
                        }
                } else {
                        // Nghỉ cả ngày (full-day) - kiểm tra tất cả các ngày
                        LocalDate currentDate = request.getStartDate();
                        boolean hasAnyShift = false;

                        while (!currentDate.isAfter(request.getEndDate())) {
                                if (checkEmployeeHasShift(request.getEmployeeId(), currentDate, null)) {
                                        hasAnyShift = true;
                                        break;
                                }
                                currentDate = currentDate.plusDays(1);
                        }

                        if (!hasAnyShift) {
                                throw new ShiftNotFoundForLeaveException(
                                                String.format("Nhân viên không có lịch làm việc vào bất kỳ ngày nào từ %s đến %s. Vui lòng kiểm tra lịch làm việc trước khi đăng ký nghỉ phép.",
                                                                request.getStartDate(),
                                                                request.getEndDate()));
                        }
                }

                // 5. Check for conflicting requests
                boolean hasConflict = requestRepository.existsConflictingRequest(
                                request.getEmployeeId(),
                                request.getStartDate(),
                                request.getEndDate(),
                                request.getWorkShiftId());

                if (hasConflict) {
                        List<TimeOffRequest> conflicts = requestRepository.findConflictingRequests(
                                        request.getEmployeeId(),
                                        request.getStartDate(),
                                        request.getEndDate(),
                                        request.getWorkShiftId());

                        if (!conflicts.isEmpty()) {
                                TimeOffRequest conflict = conflicts.get(0);
                                throw new DuplicateTimeOffRequestException(
                                                String.format("Đã tồn tại một yêu cầu nghỉ phép trùng với khoảng thời gian này. "
                                                                +
                                                                "Request ID: %s, Từ ngày: %s, Đến ngày: %s, Trạng thái: %s",
                                                                conflict.getRequestId(),
                                                                conflict.getStartDate(),
                                                                conflict.getEndDate(),
                                                                conflict.getStatus()));
                        }
                }

                // 6. Get current user ID from token for requested_by
                String username = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new RuntimeException("User not authenticated"));

                Integer requestedBy = accountRepository.findOneByUsername(username)
                                .map(account -> {
                                        if (account.getEmployee() == null) {
                                                throw new RuntimeException(
                                                                "Account " + username + " không có Employee liên kết.");
                                        }
                                        return account.getEmployee().getEmployeeId();
                                })
                                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

                // 7. Generate request ID
                String requestId = idGenerator.generateId("TOR");
                log.info("Generated time-off request ID: {}", requestId);

                // 8. Create and save time-off request
                TimeOffRequest timeOffRequest = TimeOffRequest.builder()
                                .requestId(requestId)
                                .employeeId(request.getEmployeeId())
                                .timeOffTypeId(request.getTimeOffTypeId())
                                .startDate(request.getStartDate())
                                .endDate(request.getEndDate())
                                .workShiftId(request.getWorkShiftId())
                                .reason(request.getReason())
                                .status(TimeOffStatus.PENDING)
                                .requestedBy(requestedBy)
                                .requestedAt(LocalDateTime.now())
                                .build();

                TimeOffRequest savedRequest = requestRepository.save(timeOffRequest);
                requestRepository.flush(); // Force flush to DB
                entityManager.clear(); // Clear persistence context to force fresh fetch
                log.info("Created time-off request: {}", savedRequest.getRequestId());

                // Reload to fetch relationships (employee, requestedBy, approvedBy)
                TimeOffRequest reloadedRequest = requestRepository.findByRequestId(savedRequest.getRequestId())
                                .orElseThrow(() -> new TimeOffRequestNotFoundException(savedRequest.getRequestId()));

                return requestMapper.toResponse(reloadedRequest);
        }

        /**
         * PATCH /api/v1/time-off-requests/{request_id}
         * Cập nhật trạng thái yêu cầu (Duyệt/Từ chối/Hủy)
         */
        @Transactional
        public TimeOffRequestResponse updateRequestStatus(String requestId, UpdateTimeOffStatusRequest request) {
                log.debug("Request to update time-off request status: {} to {}", requestId, request.getStatus());

                // 1. Find request
                TimeOffRequest timeOffRequest = requestRepository.findByRequestId(requestId)
                                .orElseThrow(() -> new TimeOffRequestNotFoundException(requestId));

                // 2. Check current status is PENDING
                if (timeOffRequest.getStatus() != TimeOffStatus.PENDING) {
                        throw new InvalidStateTransitionException(
                                        "Không thể cập nhật yêu cầu. Yêu cầu phải ở trạng thái PENDING. " +
                                                        "Trạng thái hiện tại: " + timeOffRequest.getStatus());
                }

                // 3. Handle different status updates
                switch (request.getStatus()) {
                        case APPROVED -> handleApproval(timeOffRequest);
                        case REJECTED -> handleRejection(timeOffRequest, request.getReason());
                        case CANCELLED -> handleCancellation(timeOffRequest, request.getReason());
                        default -> throw new IllegalArgumentException("Invalid status: " + request.getStatus());
                }

                // 4. Save and return
                TimeOffRequest updatedRequest = requestRepository.save(timeOffRequest);
                requestRepository.flush(); // Force flush to DB
                entityManager.clear(); // Clear persistence context to force fresh fetch
                log.info("Updated time-off request {} to status: {}", requestId, request.getStatus());

                // Reload to fetch relationships (employee, requestedBy, approvedBy)
                TimeOffRequest reloadedRequest = requestRepository.findByRequestId(updatedRequest.getRequestId())
                                .orElseThrow(() -> new TimeOffRequestNotFoundException(updatedRequest.getRequestId()));

                return requestMapper.toResponse(reloadedRequest);
        }

        /**
         * Handle APPROVED status
         */
        private void handleApproval(TimeOffRequest timeOffRequest) {
                // Check permission
                if (!SecurityUtil.hasCurrentUserRole(AuthoritiesConstants.ADMIN) &&
                                !SecurityUtil.hasCurrentUserPermission(AuthoritiesConstants.APPROVE_TIMEOFF)) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "Bạn không có quyền thực hiện hành động này.");
                }

                // Get approver ID
                String username = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new RuntimeException("User not authenticated"));

                Integer approvedBy = accountRepository.findOneByUsername(username)
                                .map(account -> {
                                        if (account.getEmployee() == null) {
                                                throw new RuntimeException(
                                                                "Account " + username + " không có Employee liên kết.");
                                        }
                                        return account.getEmployee().getEmployeeId();
                                })
                                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

                // Update request
                timeOffRequest.setStatus(TimeOffStatus.APPROVED);
                timeOffRequest.setApprovedBy(approvedBy);
                timeOffRequest.setApprovedAt(LocalDateTime.now());

                // Deduct leave balance if applicable
                deductLeaveBalance(timeOffRequest);

                // Update employee_shifts status to ON_LEAVE
                updateEmployeeShiftsToOnLeave(timeOffRequest);
        }

        /**
         * Handle REJECTED status
         */
        private void handleRejection(TimeOffRequest timeOffRequest, String reason) {
                // Check permission
                if (!SecurityUtil.hasCurrentUserRole(AuthoritiesConstants.ADMIN) &&
                                !SecurityUtil.hasCurrentUserPermission(AuthoritiesConstants.REJECT_TIMEOFF)) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "Bạn không có quyền thực hiện hành động này.");
                }

                // Reason is required
                if (reason == null || reason.isBlank()) {
                        throw new IllegalArgumentException("Lý do từ chối là bắt buộc.");
                }

                // Get approver ID (person who rejected)
                String username = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new RuntimeException("User not authenticated"));

                Integer approvedBy = accountRepository.findOneByUsername(username)
                                .map(account -> {
                                        if (account.getEmployee() == null) {
                                                throw new RuntimeException(
                                                                "Account " + username + " không có Employee liên kết.");
                                        }
                                        return account.getEmployee().getEmployeeId();
                                })
                                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

                // Update request
                timeOffRequest.setStatus(TimeOffStatus.REJECTED);
                timeOffRequest.setApprovedBy(approvedBy);
                timeOffRequest.setApprovedAt(LocalDateTime.now());
                timeOffRequest.setRejectedReason(reason);
        }

        /**
         * Handle CANCELLED status
         */
        private void handleCancellation(TimeOffRequest timeOffRequest, String reason) {
                // Reason is required
                if (reason == null || reason.isBlank()) {
                        throw new IllegalArgumentException("Lý do hủy là bắt buộc.");
                }

                // Get current user
                String username = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new RuntimeException("User not authenticated"));

                Integer currentEmployeeId = accountRepository.findOneByUsername(username)
                                .map(account -> {
                                        if (account.getEmployee() == null) {
                                                throw new RuntimeException(
                                                                "Account " + username + " không có Employee liên kết.");
                                        }
                                        return account.getEmployee().getEmployeeId();
                                })
                                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

                // Check permission
                boolean isOwner = timeOffRequest.getEmployeeId().equals(currentEmployeeId);
                boolean hasOwnPermission = SecurityUtil
                                .hasCurrentUserPermission(AuthoritiesConstants.CANCEL_TIMEOFF_OWN);
                boolean hasPendingPermission = SecurityUtil
                                .hasCurrentUserPermission(AuthoritiesConstants.CANCEL_TIMEOFF_PENDING);
                boolean isAdmin = SecurityUtil.hasCurrentUserRole(AuthoritiesConstants.ADMIN);

                if (!isAdmin && !hasPendingPermission && !(isOwner && hasOwnPermission)) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "Bạn không có quyền thực hiện hành động này.");
                }

                // Update request
                timeOffRequest.setStatus(TimeOffStatus.CANCELLED);
                timeOffRequest.setCancellationReason(reason);
        }

        /**
         * Check if employee has sufficient leave balance
         */
        private void checkLeaveBalance(Integer employeeId, String timeOffTypeId,
                        LocalDate startDate, LocalDate endDate, String workShiftId) {
                int currentYear = Year.now().getValue();

                // Find balance record for current year
                EmployeeLeaveBalance balance = balanceRepository
                                .findByEmployeeIdAndTimeOffTypeIdAndYear(employeeId, timeOffTypeId, currentYear)
                                .orElseThrow(() -> new InvalidRequestException(
                                                "BALANCE_NOT_FOUND",
                                                String.format("Không tìm thấy số dư nghỉ phép cho nhân viên %d và loại nghỉ %s trong năm %d",
                                                                employeeId, timeOffTypeId, currentYear)));

                // Calculate days requested
                BigDecimal daysRequested = calculateDaysRequested(startDate, endDate, workShiftId);

                // Check if sufficient balance
                double daysRemaining = balance.getRemaining();

                if (daysRemaining < daysRequested.doubleValue()) {
                        throw new InsufficientLeaveBalanceException(daysRemaining, daysRequested.doubleValue());
                }

                log.info("Balance check passed for employee {} - Requested: {} days, Remaining: {} days",
                                employeeId, daysRequested, daysRemaining);
        }

        /**
         * Calculate number of days requested
         */
        private BigDecimal calculateDaysRequested(LocalDate startDate, LocalDate endDate, String workShiftId) {
                // If work_shift_id is provided, it's half-day (0.5 days)
                if (workShiftId != null) {
                        return new BigDecimal("0.5");
                }

                // Otherwise, count full days between start and end (inclusive)
                long daysBetween = ChronoUnit.DAYS.between(startDate, endDate) + 1;
                return BigDecimal.valueOf(daysBetween);
        }

        /**
         * Deduct leave balance when request is approved
         */
        private void deductLeaveBalance(TimeOffRequest timeOffRequest) {
                // Get time-off type to check type code
                TimeOffType timeOffType = typeRepository.findById(timeOffRequest.getTimeOffTypeId())
                                .orElseThrow(() -> new TimeOffTypeNotFoundException(timeOffRequest.getTimeOffTypeId()));

                // CHỈ trừ số dư cho ANNUAL_LEAVE
                // Các loại khác (SICK_LEAVE, UNPAID_PERSONAL) không trừ số dư
                if (!"ANNUAL_LEAVE".equals(timeOffType.getTypeCode())) {
                        log.info("Skipping balance deduction for type: {} ({})",
                                        timeOffType.getTypeCode(), timeOffType.getTypeName());
                        return;
                }

                int currentYear = Year.now().getValue();

                // Find balance record
                EmployeeLeaveBalance balance = balanceRepository
                                .findByEmployeeIdAndTimeOffTypeIdAndYear(
                                                timeOffRequest.getEmployeeId(),
                                                timeOffRequest.getTimeOffTypeId(),
                                                currentYear)
                                .orElseThrow(() -> new InvalidRequestException(
                                                "BALANCE_NOT_FOUND",
                                                String.format("Không tìm thấy số dư nghỉ phép cho nhân viên %d và loại nghỉ %s trong năm %d",
                                                                timeOffRequest.getEmployeeId(),
                                                                timeOffRequest.getTimeOffTypeId(), currentYear)));

                // Calculate days to deduct
                BigDecimal daysToDeduct = calculateDaysRequested(
                                timeOffRequest.getStartDate(),
                                timeOffRequest.getEndDate(),
                                timeOffRequest.getWorkShiftId());

                // Update used days
                balance.setUsed(balance.getUsed() + daysToDeduct.doubleValue());
                balanceRepository.save(balance);

                // Create history record
                LeaveBalanceHistory history = LeaveBalanceHistory.builder()
                                .balanceId(balance.getBalanceId())
                                .changedBy(timeOffRequest.getApprovedBy())
                                .changeAmount(daysToDeduct.negate().doubleValue()) // Negative for deduction
                                .reason(BalanceChangeReason.APPROVED_REQUEST)
                                .notes(String.format("Trừ %.1f ngày nghỉ phép do yêu cầu %s được phê duyệt",
                                                daysToDeduct.doubleValue(), timeOffRequest.getRequestId()))
                                .build();

                historyRepository.save(history);

                log.info("Deducted {} days from balance {} for request {}",
                                daysToDeduct, balance.getBalanceId(), timeOffRequest.getRequestId());
        }

        /**
         * Update employee shifts to ON_LEAVE status when time-off is approved.
         *
         * @param timeOffRequest the approved time-off request
         */
        private void updateEmployeeShiftsToOnLeave(TimeOffRequest timeOffRequest) {
                try {
                        // Determine which shift to update based on workShiftId
                        // If workShiftId is null, update all shifts in the date range
                        // If workShiftId is specified, only update that specific shift
                        String shiftId = timeOffRequest.getWorkShiftId();

                        int updatedCount = employeeShiftRepository.updateShiftStatus(
                                        timeOffRequest.getEmployeeId(),
                                        timeOffRequest.getStartDate(),
                                        timeOffRequest.getEndDate(),
                                        shiftId, // null means all shifts
                                        ShiftStatus.ON_LEAVE);

                        log.info("Updated {} employee shifts to ON_LEAVE for employee {} from {} to {} (work_shift: {})",
                                        updatedCount,
                                        timeOffRequest.getEmployeeId(),
                                        timeOffRequest.getStartDate(),
                                        timeOffRequest.getEndDate(),
                                        shiftId != null ? shiftId : "ALL");
                } catch (Exception e) {
                        log.error("Failed to update employee shifts to ON_LEAVE for request {}: {}",
                                        timeOffRequest.getRequestId(), e.getMessage(), e);
                        // Don't fail the entire transaction, just log the error
                }
        }

        /**
         * [V14 Hybrid] Check if employee has a scheduled shift for the given date and
         * work shift.
         * This method queries BOTH fixed_shift_registrations AND
         * part_time_registrations.
         *
         * @param employeeId  the employee ID
         * @param date        the date to check
         * @param workShiftId the work shift ID (can be null to check any shift)
         * @return true if employee has a shift, false otherwise
         */
        private boolean checkEmployeeHasShift(Integer employeeId, LocalDate date, String workShiftId) {
                log.debug("Checking if employee {} has shift on {} for work_shift_id: {}",
                                employeeId, date, workShiftId);

                // Get day of week (MONDAY, TUESDAY, etc.)
                String dayOfWeek = date.getDayOfWeek().name();

                // 1. Check FIXED_SHIFT_REGISTRATIONS (FULL_TIME & PART_TIME_FIXED)
                boolean hasFixedShift = fixedShiftRegistrationRepository.findActiveByEmployeeId(employeeId)
                                .stream()
                                .anyMatch(registration -> {
                                        // Check if date is within effective range
                                        if (date.isBefore(registration.getEffectiveFrom())) {
                                                return false;
                                        }
                                        if (registration.getEffectiveTo() != null
                                                        && date.isAfter(registration.getEffectiveTo())) {
                                                return false;
                                        }

                                        // Check if this day of week is in the registration
                                        boolean hasDayOfWeek = registration.getRegistrationDays()
                                                        .stream()
                                                        .anyMatch(day -> day.getDayOfWeek().equals(dayOfWeek));

                                        if (!hasDayOfWeek) {
                                                return false;
                                        }

                                        // If workShiftId is specified, check if it matches
                                        if (workShiftId != null) {
                                                return registration.getWorkShift().getWorkShiftId().equals(workShiftId);
                                        }

                                        return true;
                                });

                if (hasFixedShift) {
                        log.debug("Employee {} has FIXED shift on {} for work_shift_id: {}",
                                        employeeId, date, workShiftId);
                        return true;
                }

                // 2. Check PART_TIME_REGISTRATIONS (PART_TIME_FLEX)
                // Query part_time_slots to find available slots for this employee
                boolean hasPartTimeShift = partTimeSlotRepository.findByDayOfWeekAndIsActiveTrue(dayOfWeek)
                                .stream()
                                .anyMatch(slot -> {
                                        // Check if workShiftId matches (if specified)
                                        if (workShiftId != null
                                                        && !slot.getWorkShift().getWorkShiftId().equals(workShiftId)) {
                                                return false;
                                        }

                                        // Check if employee has claimed this slot
                                        // This requires checking part_time_registrations table
                                        // We need to check if there's an active registration for this employee and slot
                                        // that covers the given date
                                        return slot.getRegistrations()
                                                        .stream()
                                                        .anyMatch(reg -> {
                                                                if (!reg.getEmployeeId().equals(employeeId)) {
                                                                        return false;
                                                                }
                                                                if (!reg.getIsActive()) {
                                                                        return false;
                                                                }
                                                                if (date.isBefore(reg.getEffectiveFrom())) {
                                                                        return false;
                                                                }
                                                                if (reg.getEffectiveTo() != null
                                                                                && date.isAfter(reg.getEffectiveTo())) {
                                                                        return false;
                                                                }
                                                                return true;
                                                        });
                                });

                if (hasPartTimeShift) {
                        log.debug("Employee {} has PART_TIME_FLEX shift on {} for work_shift_id: {}",
                                        employeeId, date, workShiftId);
                        return true;
                }

                log.debug("Employee {} has NO shift on {} for work_shift_id: {}",
                                employeeId, date, workShiftId);
                return false;
        }
}
