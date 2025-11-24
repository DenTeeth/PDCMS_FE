package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.working_schedule.dto.request.CreateOvertimeRequestDTO;
import com.dental.clinic.management.working_schedule.dto.request.UpdateOvertimeStatusDTO;
import com.dental.clinic.management.working_schedule.dto.response.OvertimeRequestDetailResponse;
import com.dental.clinic.management.working_schedule.dto.response.OvertimeRequestListResponse;
import com.dental.clinic.management.working_schedule.enums.RequestStatus;
import com.dental.clinic.management.working_schedule.service.OvertimeRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for Overtime Request Management.
 * Provides endpoints for managing employee overtime requests.
 * 
 * Base URL: /api/v1/overtime-requests
 * 
 * Endpoints:
 * - GET    /                    : Get all overtime requests (paginated, filtered)
 * - GET    /{request_id}        : Get specific overtime request details
 * - POST   /                    : Create new overtime request
 * - PATCH  /{request_id}        : Update overtime request status (approve/reject/cancel)
 */
@RestController
@RequestMapping("/api/v1/overtime-requests")
@RequiredArgsConstructor
@Slf4j
public class OvertimeRequestController {

    private final OvertimeRequestService overtimeRequestService;

    /**
     * Get all overtime requests with pagination and optional filtering.
     * Access control is handled by the service layer based on user permissions.
     * 
     * Permissions:
     * - VIEW_OT_ALL: Can see all requests
     * - VIEW_OT_OWN: Can only see own requests
     * 
     * @param status Optional filter by status (PENDING, APPROVED, REJECTED, CANCELLED)
     * @param pageable Pagination parameters (page, size, sort)
     * @return Page of overtime request list items
     * 
     * Example: GET /api/v1/overtime-requests?status=PENDING&page=0&size=10&sort=workDate,desc
     */
    @GetMapping
    public ResponseEntity<Page<OvertimeRequestListResponse>> getAllOvertimeRequests(
            @RequestParam(required = false) RequestStatus status,
            @PageableDefault(size = 20, sort = "workDate", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("REST request to get all overtime requests - status: {}, page: {}, size: {}", 
            status, pageable.getPageNumber(), pageable.getPageSize());
        
        Page<OvertimeRequestListResponse> result = overtimeRequestService.getAllOvertimeRequests(status, pageable);
        
        log.info("Retrieved {} overtime requests out of {} total", 
            result.getNumberOfElements(), result.getTotalElements());
        
        return ResponseEntity.ok(result);
    }

    /**
     * Get detailed information about a specific overtime request.
     * 
     * Permissions:
     * - VIEW_OT_ALL: Can see any request
     * - VIEW_OT_OWN: Can only see own requests (returns 404 if not owner)
     * 
     * @param requestId The overtime request ID (format: OTRyymmddSSS)
     * @return Detailed overtime request information
     * 
     * Example: GET /api/v1/overtime-requests/OTR251021005
     * 
     * Error Responses:
     * - 404 NOT_FOUND: Request not found or user doesn't have permission
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<OvertimeRequestDetailResponse> getOvertimeRequestById(
            @PathVariable String requestId) {
        log.info("REST request to get overtime request: {}", requestId);
        
        OvertimeRequestDetailResponse response = overtimeRequestService.getOvertimeRequestById(requestId);
        
        log.info("Successfully retrieved overtime request: {}", requestId);
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new overtime request.
     * The request will be created with status PENDING.
     * The requesting user is automatically captured from the security context.
     * 
     * Two modes:
     * 1. Employee creates for themselves: omit employeeId in request body (auto-filled from JWT)
     * 2. Admin creates for any employee: include employeeId in request body
     * 
     * Required Permission: CREATE_OT
     * 
     * @param dto Create overtime request DTO
     * @return Created overtime request details with generated ID
     * 
     * Example Request Body (Employee self-request):
     * {
     *   "workDate": "2025-11-15",
     *   "workShiftId": "WKS_NIGHT_01",
     *   "reason": "Hoàn thành sổ sách tối"
     * }
     * 
     * Example Request Body (Admin creates for employee):
     * {
     *   "employeeId": 5,
     *   "workDate": "2025-11-15",
     *   "workShiftId": "WKS_NIGHT_01",
     *   "reason": "Hoàn thành sổ sách tối"
     * }
     * 
     * Validations:
     * - Employee and WorkShift must exist
     * - Work date cannot be in the past
     * - No duplicate request for same employee, date, and shift (with PENDING/APPROVED status)
     * 
     * Error Responses:
     * - 400 BAD_REQUEST: Validation failed (past date, missing fields)
     * - 404 NOT_FOUND: Employee or WorkShift not found
     * - 409 CONFLICT: Duplicate request exists
     */
    @PostMapping
    public ResponseEntity<OvertimeRequestDetailResponse> createOvertimeRequest(
            @Valid @RequestBody CreateOvertimeRequestDTO dto) {
        log.info("REST request to create overtime request - employeeId: {}, workDate: {}, workShiftId: {}", 
            dto.getEmployeeId() != null ? dto.getEmployeeId() : "self", 
            dto.getWorkDate(), 
            dto.getWorkShiftId());
        
        OvertimeRequestDetailResponse response = overtimeRequestService.createOvertimeRequest(dto);
        
        log.info("Successfully created overtime request: {}", response.getRequestId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update overtime request status (Approve, Reject, or Cancel).
     * This is a single endpoint that handles all status transitions.
     * Only PENDING requests can be updated.
     * 
     * Permissions based on action:
     * - APPROVED: Requires APPROVE_OT
     * - REJECTED: Requires REJECT_OT (reason required)
     * - CANCELLED: Requires CANCEL_OT_OWN (own requests) or CANCEL_OT_PENDING (any) (reason required)
     * 
     * @param requestId The overtime request ID to update
     * @param dto Update status DTO with new status and optional reason
     * @return Updated overtime request details
     * 
     * Example Request Bodies:
     * 
     * Approve:
     * {
     *   "status": "APPROVED"
     * }
     * 
     * Reject:
     * {
     *   "status": "REJECTED",
     *   "reason": "Không đủ ngân sách."
     * }
     * 
     * Cancel:
     * {
     *   "status": "CANCELLED",
     *   "reason": "Thay đổi kế hoạch."
     * }
     * 
     * Business Rules:
     * - Request must be in PENDING status
     * - Reason is required for REJECTED and CANCELLED
     * - When APPROVED, system will auto-create EmployeeShift record (future implementation)
     * 
     * Error Responses:
     * - 400 BAD_REQUEST: Validation failed (missing reason, invalid status)
     * - 403 FORBIDDEN: User doesn't have required permission
     * - 404 NOT_FOUND: Request not found
     * - 409 CONFLICT: Request is not in PENDING status
     */
    @PatchMapping("/{requestId}")
    public ResponseEntity<OvertimeRequestDetailResponse> updateOvertimeStatus(
            @PathVariable String requestId,
            @Valid @RequestBody UpdateOvertimeStatusDTO dto) {
        log.info("REST request to update overtime request {} to status {}", requestId, dto.getStatus());
        
        OvertimeRequestDetailResponse response = overtimeRequestService.updateOvertimeStatus(requestId, dto);
        
        log.info("Successfully updated overtime request {} to status {}", requestId, dto.getStatus());
        return ResponseEntity.ok(response);
    }
}
