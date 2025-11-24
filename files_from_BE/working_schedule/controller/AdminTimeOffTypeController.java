package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.utils.security.AuthoritiesConstants;
import com.dental.clinic.management.working_schedule.dto.request.CreateTimeOffTypeRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdateTimeOffTypeRequest;
import com.dental.clinic.management.working_schedule.dto.response.TimeOffTypeResponse;
import com.dental.clinic.management.working_schedule.service.TimeOffTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Admin Time-Off Type Management (P6.1)
 * Handles CRUD operations for time-off types
 */
@RestController
@RequestMapping("/api/v1/admin/time-off-types")
@RequiredArgsConstructor
@Slf4j
public class AdminTimeOffTypeController {

    private final TimeOffTypeService typeService;

    /**
     * GET /api/v1/admin/time-off-types
     * Lấy danh sách Loại nghỉ phép (Admin View)
     *
     * Authorization: VIEW_TIMEOFF_TYPE_ALL
     *
     * Query Params:
     * - is_active (boolean, optional): Lọc theo trạng thái
     * - is_paid (boolean, optional): Lọc theo loại có lương/không lương
     *
     * Response:
     * - 200 OK: Trả về danh sách tất cả loại nghỉ phép (kể cả inactive)
     *
     * @param isActive filter by active status (optional)
     * @param isPaid filter by paid status (optional)
     * @return List of TimeOffTypeResponse
     */
    @GetMapping
    @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
            "hasAuthority('" + AuthoritiesConstants.VIEW_TIMEOFF_TYPE_ALL + "')")
    public ResponseEntity<List<TimeOffTypeResponse>> getAllTimeOffTypes(
            @RequestParam(required = false, name = "is_active") Boolean isActive,
            @RequestParam(required = false, name = "is_paid") Boolean isPaid) {
        log.info("Admin REST request to get all time-off types, is_active={}, is_paid={}", isActive, isPaid);
        List<TimeOffTypeResponse> types = typeService.getAllTimeOffTypes(isActive, isPaid);
        return ResponseEntity.ok(types);
    }

    /**
     * GET /api/v1/admin/time-off-types/{type_id}
     * Lấy chi tiết một loại nghỉ phép
     *
     * Authorization: VIEW_TIMEOFF_TYPE_ALL
     *
     * Response:
     * - 200 OK: Trả về chi tiết loại nghỉ phép
     * - 404 NOT_FOUND: Không tìm thấy loại nghỉ phép
     *
     * @param typeId the time-off type ID
     * @return TimeOffTypeResponse
     */
    @GetMapping("/{type_id}")
    @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
            "hasAuthority('" + AuthoritiesConstants.VIEW_TIMEOFF_TYPE_ALL + "')")
    public ResponseEntity<TimeOffTypeResponse> getTimeOffTypeById(@PathVariable("type_id") String typeId) {
        log.info("Admin REST request to get time-off type: {}", typeId);
        TimeOffTypeResponse response = typeService.getTimeOffTypeById(typeId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/admin/time-off-types
     * Tạo Loại nghỉ phép mới
     *
     * Authorization: CREATE_TIMEOFF_TYPE
     *
     * Request Body:
     * {
     *   "type_code": "UNPAID_LEAVE",
     *   "type_name": "Nghỉ không lương",
     *   "is_paid": false
     * }
     *
     * Business Logic:
     * - type_code phải unique
     * - type_name là bắt buộc
     * - is_paid là bắt buộc
     * - Tự động gán is_active = true
     *
     * Response:
     * - 201 CREATED: Tạo thành công
     * - 409 CONFLICT: DUPLICATE_TYPE_CODE
     *
     * @param request the creation request
     * @return TimeOffTypeResponse
     */
    @PostMapping
    @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
            "hasAuthority('" + AuthoritiesConstants.CREATE_TIMEOFF_TYPE + "')")
    public ResponseEntity<TimeOffTypeResponse> createTimeOffType(@Valid @RequestBody CreateTimeOffTypeRequest request) {
        log.info("Admin REST request to create time-off type: {}", request.getTypeCode());
        TimeOffTypeResponse response = typeService.createTimeOffType(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PATCH /api/v1/admin/time-off-types/{type_id}
     * Cập nhật Loại nghỉ phép
     *
     * Authorization: UPDATE_TIMEOFF_TYPE
     *
     * Request Body (chỉ gửi các trường cần cập nhật):
     * {
     *   "type_name": "Nghỉ không lương (Việc riêng)"
     * }
     *
     * Business Logic:
     * - Nếu type_code thay đổi, phải kiểm tra unique
     *
     * Response:
     * - 200 OK: Cập nhật thành công
     * - 404 NOT_FOUND: TIMEOFF_TYPE_NOT_FOUND
     * - 409 CONFLICT: DUPLICATE_TYPE_CODE
     *
     * @param typeId the time-off type ID
     * @param request the update request
     * @return TimeOffTypeResponse
     */
    @PatchMapping("/{type_id}")
    @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
            "hasAuthority('" + AuthoritiesConstants.UPDATE_TIMEOFF_TYPE + "')")
    public ResponseEntity<TimeOffTypeResponse> updateTimeOffType(
            @PathVariable("type_id") String typeId,
            @Valid @RequestBody UpdateTimeOffTypeRequest request) {
        log.info("Admin REST request to update time-off type: {}", typeId);
        TimeOffTypeResponse response = typeService.updateTimeOffType(typeId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/admin/time-off-types/{type_id}
     * Vô hiệu hóa / Kích hoạt lại Loại nghỉ phép (Toggle is_active)
     *
     * Authorization: DELETE_TIMEOFF_TYPE
     *
     * Business Logic:
     * - Soft delete: Đảo ngược is_active (true <-> false)
     * - Nếu đang vô hiệu hóa (true -> false), kiểm tra xem có request PENDING nào
     *   đang dùng type_id này không
     * - Nếu có, trả về lỗi 409 CONFLICT
     *
     * Response:
     * - 200 OK: Toggle thành công
     * - 404 NOT_FOUND: TIMEOFF_TYPE_NOT_FOUND
     * - 409 CONFLICT: TIMEOFF_TYPE_IN_USE
     *
     * @param typeId the time-off type ID
     * @return TimeOffTypeResponse with updated is_active status
     */
    @DeleteMapping("/{type_id}")
    @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
            "hasAuthority('" + AuthoritiesConstants.DELETE_TIMEOFF_TYPE + "')")
    public ResponseEntity<TimeOffTypeResponse> toggleTimeOffTypeActive(@PathVariable("type_id") String typeId) {
        log.info("Admin REST request to toggle time-off type active status: {}", typeId);
        TimeOffTypeResponse response = typeService.toggleTimeOffTypeActive(typeId);
        return ResponseEntity.ok(response);
    }
}
