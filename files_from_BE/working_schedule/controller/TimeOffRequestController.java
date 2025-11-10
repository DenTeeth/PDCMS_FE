package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.working_schedule.dto.request.CreateTimeOffRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdateTimeOffStatusRequest;
import com.dental.clinic.management.working_schedule.dto.response.TimeOffRequestResponse;
import com.dental.clinic.management.working_schedule.enums.TimeOffStatus;
import com.dental.clinic.management.working_schedule.service.TimeOffRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * REST controller for Time-Off Request Management
 */
@RestController
@RequestMapping("/api/v1/time-off-requests")
@RequiredArgsConstructor
@Slf4j
public class TimeOffRequestController {

    private final TimeOffRequestService requestService;

    /**
     * GET /api/v1/time-off-requests
     * Lấy danh sách các yêu cầu nghỉ phép với phân trang và bộ lọc
     *
     * Phân quyền:
     * - Admin hoặc VIEW_TIMEOFF_ALL: xem tất cả
     * - VIEW_TIMEOFF_OWN: chỉ xem của chính mình
     *
     * @param employeeId Filter by employee_id (optional, ignored for
     *                   VIEW_TIMEOFF_OWN)
     * @param status     Filter by status (optional)
     * @param startDate  Filter by start_date >= (optional)
     * @param endDate    Filter by end_date <= (optional)
     * @param pageable   Pagination information
     * @return Page of TimeOffRequestResponse
     */
    @GetMapping
    public ResponseEntity<Page<TimeOffRequestResponse>> getAllRequests(
            @RequestParam(required = false) Integer employeeId,
            @RequestParam(required = false) TimeOffStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Pageable pageable) {

        log.info(
                "REST request to get all time-off requests with filters: employeeId={}, status={}, startDate={}, endDate={}",
                employeeId, status, startDate, endDate);

        Page<TimeOffRequestResponse> page = requestService.getAllRequests(
                employeeId, status, startDate, endDate, pageable);

        return ResponseEntity.ok(page);
    }

    /**
     * GET /api/v1/time-off-requests/{request_id}
     * Xem chi tiết một yêu cầu nghỉ phép
     *
     * Phân quyền:
     * - Admin hoặc VIEW_TIMEOFF_ALL: xem bất kỳ yêu cầu nào
     * - VIEW_TIMEOFF_OWN: chỉ xem của chính mình
     *
     * Response:
     * - 200 OK: Trả về chi tiết yêu cầu
     * - 404 Not Found: Yêu cầu không tồn tại hoặc không có quyền xem
     *
     * @param requestId The ID of the time-off request
     * @return TimeOffRequestResponse with request details
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<TimeOffRequestResponse> getRequestById(@PathVariable String requestId) {
        log.info("REST request to get time-off request: {}", requestId);
        TimeOffRequestResponse response = requestService.getRequestById(requestId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/time-off-requests
     * Tạo yêu cầu nghỉ phép mới
     *
     * Phân quyền:
     * - CREATE_TIMEOFF: quyền tạo yêu cầu nghỉ phép
     *
     * Validation:
     * - employee_id và time_off_type_id phải tồn tại
     * - time_off_type_id phải is_active = true
     * - start_date không được lớn hơn end_date
     * - Nếu slot_id có giá trị (nghỉ nửa ngày), start_date phải bằng end_date
     * - Không được trùng lặp với yêu cầu nghỉ phép khác đang active
     * - reason là bắt buộc
     *
     * Response:
     * - 201 Created: Yêu cầu được tạo thành công
     * - 400 Bad Request: Dữ liệu không hợp lệ (ngày không hợp lệ)
     * - 404 Not Found: Employee hoặc TimeOffType không tồn tại
     * - 409 Conflict: Trùng lặp với yêu cầu nghỉ phép khác
     *
     * @param request CreateTimeOffRequest with request details
     * @return Created TimeOffRequestResponse
     */
    @PostMapping
    public ResponseEntity<TimeOffRequestResponse> createRequest(
            @Valid @RequestBody CreateTimeOffRequest request) {
        log.info("REST request to create time-off request: {}", request);
        TimeOffRequestResponse response = requestService.createRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PATCH /api/v1/time-off-requests/{request_id}
     * Cập nhật trạng thái yêu cầu nghỉ phép (Duyệt/Từ chối/Hủy)
     *
     * Phân quyền:
     * - status=APPROVED: APPROVE_TIMEOFF
     * - status=REJECTED: REJECT_TIMEOFF (reason bắt buộc)
     * - status=CANCELLED: CANCEL_TIMEOFF_OWN (nếu là chủ sở hữu) hoặc
     * CANCEL_TIMEOFF_PENDING (nếu là quản lý)
     * (reason bắt buộc)
     *
     * Business Logic:
     * - Yêu cầu phải đang ở trạng thái PENDING
     * - Nếu APPROVED, tự động cập nhật employee_shifts status thành ON_LEAVE
     *
     * Response:
     * - 200 OK: Cập nhật thành công
     * - 400 Bad Request: Thiếu reason (cho REJECTED/CANCELLED)
     * - 403 Forbidden: Không có quyền thực hiện hành động
     * - 404 Not Found: Yêu cầu không tồn tại
     * - 409 Conflict: Yêu cầu không ở trạng thái PENDING
     *
     * @param requestId The ID of the time-off request
     * @param request   UpdateTimeOffStatusRequest with new status and optional
     *                  reason
     * @return Updated TimeOffRequestResponse
     */
    @PatchMapping("/{requestId}")
    public ResponseEntity<TimeOffRequestResponse> updateRequestStatus(
            @PathVariable String requestId,
            @Valid @RequestBody UpdateTimeOffStatusRequest request) {
        log.info("REST request to update time-off request {} to status: {}", requestId, request.getStatus());
        TimeOffRequestResponse response = requestService.updateRequestStatus(requestId, request);
        return ResponseEntity.ok(response);
    }
}
