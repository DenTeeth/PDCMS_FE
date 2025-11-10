package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.utils.security.AuthoritiesConstants;
import com.dental.clinic.management.working_schedule.dto.request.AdjustLeaveBalanceRequest;
import com.dental.clinic.management.working_schedule.dto.request.AnnualResetRequest;
import com.dental.clinic.management.working_schedule.dto.response.AllEmployeesLeaveBalanceResponse;
import com.dental.clinic.management.working_schedule.dto.response.EmployeeLeaveBalanceResponse;
import com.dental.clinic.management.working_schedule.service.AdminLeaveBalanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.Map;

/**
 * REST controller for Admin Leave Balance Management (P5.2)
 * Handles leave balance queries, adjustments, and annual reset
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminLeaveBalanceController {

    private final AdminLeaveBalanceService balanceService;

    /**
     * GET /api/v1/admin/leave-balances
     * Lấy số dư phép của TẤT CẢ nhân viên (Admin Dashboard)
     *
     * Authorization: VIEW_LEAVE_BALANCE_ALL
     *
     * Query Params:
     * - cycle_year (integer, optional): Lọc theo năm. Mặc định là năm hiện tại
     * - time_off_type_id (string, optional): Lọc theo một loại phép cụ thể (ví dụ: ANNUAL_LEAVE)
     *
     * Response:
     * - 200 OK: Trả về danh sách "ví phép" của TẤT CẢ nhân viên
     *
     * Response Body:
     * {
     *   "filter": {
     *     "cycle_year": 2025,
     *     "time_off_type_id": null
     *   },
     *   "data": [
     *     {
     *       "employee_id": 5,
     *       "employee_name": "Hoàng Văn Tuấn",
     *       "balances": [
     *         {
     *           "time_off_type_name": "Nghỉ phép năm",
     *           "total_days_allowed": 12.0,
     *           "days_taken": 3.5,
     *           "days_remaining": 8.5
     *         }
     *       ]
     *     }
     *   ]
     * }
     *
     * @param cycleYear the year to query (optional, defaults to current year)
     * @param timeOffTypeId filter by specific time-off type (optional)
     * @return AllEmployeesLeaveBalanceResponse
     */
    @GetMapping("/leave-balances")
    @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
            "hasAuthority('" + AuthoritiesConstants.VIEW_LEAVE_BALANCE_ALL + "')")
    public ResponseEntity<AllEmployeesLeaveBalanceResponse> getAllEmployeesLeaveBalances(
            @RequestParam(required = false, name = "cycle_year") Integer cycleYear,
            @RequestParam(required = false, name = "time_off_type_id") String timeOffTypeId) {

        // Default to current year if not specified
        if (cycleYear == null) {
            cycleYear = Year.now().getValue();
        }

        log.info("Admin REST request to get leave balances for all employees in year {} for type {}",
                cycleYear, timeOffTypeId);

        AllEmployeesLeaveBalanceResponse response = balanceService.getAllEmployeesLeaveBalances(cycleYear, timeOffTypeId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/employees/{employee_id}/leave-balances
     * Lấy số dư phép của một nhân viên
     *
     * Authorization: VIEW_LEAVE_BALANCE_ALL
     *
     * Query Params:
     * - cycle_year (integer, optional): Năm muốn xem. Nếu để trống, mặc định là năm hiện tại
     *
     * Response:
     * - 200 OK: Trả về danh sách "ví phép" của nhân viên
     * - 404 NOT_FOUND: EMPLOYEE_NOT_FOUND
     *
     * Response Body:
     * {
     *   "employee_id": 5,
     *   "cycle_year": 2025,
     *   "balances": [
     *     {
     *       "balance_id": 101,
     *       "time_off_type": {
     *         "type_id": "ANNUAL_LEAVE",
     *         "type_name": "Nghỉ phép năm",
     *         "is_paid": true
     *       },
     *       "total_days_allowed": 12.0,
     *       "days_taken": 3.5,
     *       "days_remaining": 8.5
     *     }
     *   ]
     * }
     *
     * @param employeeId the employee ID
     * @param cycleYear the year to query (optional, defaults to current year)
     * @return EmployeeLeaveBalanceResponse
     */
    @GetMapping("/employees/{employee_id}/leave-balances")
    @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
            "hasAuthority('" + AuthoritiesConstants.VIEW_LEAVE_BALANCE_ALL + "')")
    public ResponseEntity<EmployeeLeaveBalanceResponse> getEmployeeLeaveBalances(
            @PathVariable("employee_id") Integer employeeId,
            @RequestParam(required = false, name = "cycle_year") Integer cycleYear) {

        // Default to current year if not specified
        if (cycleYear == null) {
            cycleYear = Year.now().getValue();
        }

        log.info("Admin REST request to get leave balances for employee {} in year {}", employeeId, cycleYear);
        EmployeeLeaveBalanceResponse response = balanceService.getEmployeeLeaveBalances(employeeId, cycleYear);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/admin/leave-balances/adjust
     * Điều chỉnh số dư phép (Cộng/Trừ thủ công)
     *
     * Authorization: ADJUST_LEAVE_BALANCE
     *
     * Request Body:
     * {
     *   "employee_id": 5,
     *   "time_off_type_id": "ANNUAL_LEAVE",
     *   "cycle_year": 2025,
     *   "change_amount": 1.5,    // Số dương: cộng, Số âm: trừ
     *   "notes": "Thưởng 1.5 ngày phép do hoàn thành xuất sắc dự án."
     * }
     *
     * Business Logic:
     * - Validate employee_id và time_off_type_id phải tồn tại
     * - Tìm balance_id tương ứng trong employee_leave_balances
     * - Nếu không tìm thấy: Tự động tạo record mới (với total_days_allowed = 0, days_taken = 0)
     * - Nếu change_amount > 0: UPDATE total_days_allowed = total_days_allowed + change_amount
     * - Nếu change_amount < 0: UPDATE days_taken = days_taken + abs(change_amount)
     * - Kiểm tra số dư mới (total_days_allowed - days_taken) >= 0
     * - INSERT vào leave_balance_history
     *
     * Response:
     * - 200 OK: Điều chỉnh thành công
     * - 400 BAD_REQUEST: INVALID_BALANCE (số dư âm sau điều chỉnh)
     * - 404 NOT_FOUND: RELATED_RESOURCE_NOT_FOUND
     *
     * @param request the adjustment request
     * @return success message
     */
    @PostMapping("/leave-balances/adjust")
    @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "') or " +
            "hasAuthority('" + AuthoritiesConstants.ADJUST_LEAVE_BALANCE + "')")
    public ResponseEntity<Map<String, Object>> adjustLeaveBalance(@Valid @RequestBody AdjustLeaveBalanceRequest request) {
        log.info("Admin REST request to adjust leave balance for employee {} type {} year {}: {} days",
                request.getEmployeeId(), request.getTimeOffTypeId(), request.getCycleYear(), request.getChangeAmount());

        balanceService.adjustLeaveBalance(request);

        return ResponseEntity.ok(Map.of(
                "message", "Điều chỉnh số dư phép thành công",
                "employee_id", request.getEmployeeId(),
                "time_off_type_id", request.getTimeOffTypeId(),
                "cycle_year", request.getCycleYear(),
                "change_amount", request.getChangeAmount()
        ));
    }

    /**
     * POST /api/v1/admin/leave-balances/annual-reset
     * CRON JOB - Tự động reset ngày nghỉ khi sang năm mới
     *
     * Authorization: ADMIN only
     *
     * Request Body:
     * {
     *   "cycle_year": 2026,
     *   "apply_to_type_id": "ANNUAL_LEAVE",
     *   "default_allowance": 12.0
     * }
     *
     * Logic của Job (chạy ngầm):
     * - Lấy danh sách tất cả nhân viên đang is_active = true
     * - Lặp qua từng employee_id:
     *   - Kiểm tra xem đã có employee_leave_balances cho apply_to_type_id và cycle_year chưa
     *   - Nếu CHƯA có:
     *     - INSERT record mới (total_days_allowed = default_allowance, days_taken = 0)
     *     - INSERT vào leave_balance_history (reason: 'ANNUAL_RESET')
     *   - Nếu CÓ RỒI:
     *     - Bỏ qua (log "Đã tồn tại") để tránh cộng dồn phép
     *
     * Response:
     * - 200 OK: Reset thành công
     * - 400 BAD_REQUEST: INVALID_YEAR
     * - 409 CONFLICT: JOB_ALREADY_RUN (nếu chạy lại cho cùng năm)
     *
     * @param request the annual reset request
     * @return success message with statistics
     */
    @PostMapping("/leave-balances/annual-reset")
    @PreAuthorize("hasRole('" + AuthoritiesConstants.ADMIN + "')")
    public ResponseEntity<Map<String, Object>> annualReset(@Valid @RequestBody AnnualResetRequest request) {
        log.info("Admin REST request to run annual leave balance reset for year {} type {} with {} days",
                request.getCycleYear(), request.getApplyToTypeId(), request.getDefaultAllowance());

        Map<String, Object> result = balanceService.annualReset(request);
        return ResponseEntity.ok(result);
    }
}
