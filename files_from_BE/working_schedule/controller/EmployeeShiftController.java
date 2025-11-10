package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.working_schedule.dto.request.CreateShiftRequestDto;
import com.dental.clinic.management.working_schedule.dto.request.UpdateShiftRequestDto;
import com.dental.clinic.management.working_schedule.dto.response.EmployeeShiftResponseDto;
import com.dental.clinic.management.working_schedule.dto.response.ShiftSummaryResponseDto;
import com.dental.clinic.management.working_schedule.enums.ShiftStatus;
import com.dental.clinic.management.working_schedule.service.EmployeeShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for employee shift management.
 * Provides endpoints for viewing, creating, updating, and cancelling shifts.
 */
@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
public class EmployeeShiftController {

        private final EmployeeShiftService employeeShiftService;
        private final EmployeeRepository employeeRepository;

        /**
         * Get shift calendar with filters and pagination.
         *
         * GET /api/v1/shifts?employee_id=123&start_date=2025-01-01&end_date=2025-01-31
         *
         * @param employeeId     employee ID to view shifts for (optional, auto-filtered
         *                       by permissions)
         * @param startDate      start date filter
         * @param endDate        end date filter
         * @param status         optional status filter
         * @param page           page number (0-indexed)
         * @param size           page size
         * @param sort           sort parameter (e.g., "workDate,asc")
         * @param authentication authenticated user
         * @return paginated list of shifts
         */
        @GetMapping
        public ResponseEntity<Page<EmployeeShiftResponseDto>> getShiftCalendar(
                        @RequestParam(name = "employee_id", required = false) Integer employeeId,
                        @RequestParam(name = "start_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(name = "end_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                        @RequestParam(name = "status", required = false) ShiftStatus status,
                        @RequestParam(name = "page", defaultValue = "0") int page,
                        @RequestParam(name = "size", defaultValue = "20") int size,
                        @RequestParam(name = "sort", defaultValue = "workDate,asc") String sort,
                        Authentication authentication) {

                // Parse sort parameter
                String[] sortParams = sort.split(",");
                Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                                ? Sort.Direction.DESC
                                : Sort.Direction.ASC;
                Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

                // Get current user info
                String username = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new RuntimeException("User not authenticated"));
                Integer currentEmployeeId = employeeRepository.findByAccount_Username(username)
                                .map(employee -> employee.getEmployeeId())
                                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));
                boolean hasViewAllPermission = authentication.getAuthorities()
                                .contains(new SimpleGrantedAuthority("VIEW_SHIFTS_ALL"));

                // Check permission for employee_id parameter
                Integer effectiveEmployeeId = employeeId;
                if (!hasViewAllPermission) {
                        // If user only has VIEW_SHIFTS_OWN and tries to view another employee's shifts,
                        // return 403
                        if (employeeId != null && !employeeId.equals(currentEmployeeId)) {
                                throw new org.springframework.security.access.AccessDeniedException(
                                                "Không tìm thấy tài nguyên hoặc bạn không có quyền truy cập.");
                        }
                        // Auto-set to current employee for VIEW_SHIFTS_OWN users
                        effectiveEmployeeId = currentEmployeeId;
                }

                // Get shifts
                Page<EmployeeShiftResponseDto> shifts = employeeShiftService.getShiftCalendar(
                                effectiveEmployeeId, startDate, endDate, status, currentEmployeeId,
                                hasViewAllPermission, pageable);

                return ResponseEntity.ok(shifts);
        }

        /**
         * Get shift summary grouped by date.
         *
         * GET
         * /api/v1/shifts/summary?employee_id=123&start_date=2025-01-01&end_date=2025-01-31
         * GET /api/v1/shifts/summary?start_date=2025-01-01&end_date=2025-01-31 (all
         * employees)
         *
         * @param employeeId employee ID (optional, null = all employees if has
         *                   permission)
         * @param startDate  start date
         * @param endDate    end date
         * @return list of daily shift summaries
         */
        @GetMapping("/summary")
        public ResponseEntity<List<ShiftSummaryResponseDto>> getShiftSummary(
                        @RequestParam(name = "employee_id", required = false) Integer employeeId,
                        @RequestParam(name = "start_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(name = "end_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                List<ShiftSummaryResponseDto> summary = employeeShiftService.getShiftSummary(
                                employeeId, startDate, endDate);

                return ResponseEntity.ok(summary);
        }

        /**
         * Get detailed information about a specific shift.
         *
         * GET /api/v1/shifts/{id}
         *
         * @param employeeShiftId shift ID
         * @param authentication  authenticated user
         * @return shift details
         */
        @GetMapping("/{id}")
        public ResponseEntity<EmployeeShiftResponseDto> getShiftDetail(
                        @PathVariable("id") String employeeShiftId,
                        Authentication authentication) {

                // Get current user info
                String username = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new RuntimeException("User not authenticated"));
                Integer currentEmployeeId = employeeRepository.findByAccount_Username(username)
                                .map(employee -> employee.getEmployeeId())
                                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));
                boolean hasViewAllPermission = authentication.getAuthorities()
                                .contains(new SimpleGrantedAuthority("VIEW_SHIFTS_ALL"));

                // Get shift details
                EmployeeShiftResponseDto shift = employeeShiftService.getShiftDetail(
                                employeeShiftId, currentEmployeeId, hasViewAllPermission);

                return ResponseEntity.ok(shift);
        }

        /**
         * Create a manual shift entry.
         *
         * POST /api/v1/shifts
         *
         * @param request        shift creation request
         * @param authentication authenticated user
         * @return created shift details
         */
        @PostMapping
        public ResponseEntity<EmployeeShiftResponseDto> createManualShift(
                        @Valid @RequestBody CreateShiftRequestDto request,
                        Authentication authentication) {

                // Get current user ID
                String username = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new RuntimeException("User not authenticated"));
                Integer currentEmployeeId = employeeRepository.findByAccount_Username(username)
                                .map(employee -> employee.getEmployeeId())
                                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

                // Create shift
                EmployeeShiftResponseDto createdShift = employeeShiftService.createManualShift(request,
                                currentEmployeeId);

                return ResponseEntity.status(HttpStatus.CREATED).body(createdShift);
        }

        /**
         * Update an existing shift.
         *
         * PATCH /api/v1/shifts/{id}
         *
         * @param employeeShiftId shift ID to update
         * @param request         update request
         * @return updated shift details
         */
        @PatchMapping("/{id}")
        public ResponseEntity<EmployeeShiftResponseDto> updateShift(
                        @PathVariable("id") String employeeShiftId,
                        @Valid @RequestBody UpdateShiftRequestDto request) {

                EmployeeShiftResponseDto updatedShift = employeeShiftService.updateShift(employeeShiftId, request);

                return ResponseEntity.ok(updatedShift);
        }

        /**
         * Cancel a shift.
         *
         * DELETE /api/v1/shifts/{id}
         *
         * @param employeeShiftId shift ID to cancel
         * @return no content
         */
        @DeleteMapping("/{id}")
        public ResponseEntity<Void> cancelShift(@PathVariable("id") String employeeShiftId) {

                employeeShiftService.cancelShift(employeeShiftId);

                return ResponseEntity.noContent().build();
        }
}
