package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.employee.EmployeeNotFoundException;
import com.dental.clinic.management.exception.validation.InvalidRequestException;
import com.dental.clinic.management.exception.time_off.TimeOffTypeNotFoundException;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.working_schedule.domain.EmployeeLeaveBalance;
import com.dental.clinic.management.working_schedule.domain.LeaveBalanceHistory;
import com.dental.clinic.management.working_schedule.domain.TimeOffType;
import com.dental.clinic.management.working_schedule.dto.request.AdjustLeaveBalanceRequest;
import com.dental.clinic.management.working_schedule.dto.request.AnnualResetRequest;
import com.dental.clinic.management.working_schedule.dto.response.AllEmployeesLeaveBalanceResponse;
import com.dental.clinic.management.working_schedule.dto.response.EmployeeLeaveBalanceResponse;
import com.dental.clinic.management.working_schedule.dto.response.LeaveBalanceDetailResponse;
import com.dental.clinic.management.working_schedule.dto.response.TimeOffTypeInfoResponse;
import com.dental.clinic.management.working_schedule.enums.BalanceChangeReason;
import com.dental.clinic.management.working_schedule.repository.EmployeeLeaveBalanceRepository;
import com.dental.clinic.management.working_schedule.repository.LeaveBalanceHistoryRepository;
import com.dental.clinic.management.working_schedule.repository.TimeOffTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for Admin Leave Balance Management (P5.2)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminLeaveBalanceService {

    private final EmployeeLeaveBalanceRepository balanceRepository;
    private final LeaveBalanceHistoryRepository historyRepository;
    private final EmployeeRepository employeeRepository;
    private final TimeOffTypeRepository timeOffTypeRepository;
    private final AccountRepository accountRepository;

    /**
     * Get leave balances for an employee in a specific year
     */
    public EmployeeLeaveBalanceResponse getEmployeeLeaveBalances(Integer employeeId, Integer cycleYear) {
        log.debug("Getting leave balances for employee {} in year {}", employeeId, cycleYear);

        // Validate employee exists
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EmployeeNotFoundException(employeeId));

        // Get all balances for this employee and year
        List<EmployeeLeaveBalance> balances = balanceRepository.findByEmployeeIdAndYear(employeeId, cycleYear);

        // Convert to response DTOs
        List<LeaveBalanceDetailResponse> balanceDetails = balances.stream()
                .map(this::toBalanceDetailResponse)
                .collect(Collectors.toList());

        return EmployeeLeaveBalanceResponse.builder()
                .employeeId(employeeId)
                .cycleYear(cycleYear)
                .balances(balanceDetails)
                .build();
    }

    /**
     * Get leave balances for ALL active employees (Admin Dashboard)
     * Uses optimized JOIN query to avoid N+1 problem
     */
    public AllEmployeesLeaveBalanceResponse getAllEmployeesLeaveBalances(Integer cycleYear, String timeOffTypeId) {
        log.debug("Getting leave balances for all employees in year {} for type {}", cycleYear, timeOffTypeId);

        // 1. Get all active employees
        List<Integer> activeEmployeeIds = employeeRepository.findAllActiveEmployeeIds();

        // 2. Get balances with optional filter
        List<EmployeeLeaveBalance> allBalances;
        if (timeOffTypeId != null) {
            // Filter by specific type
            allBalances = balanceRepository.findByYearAndTimeOffTypeId(cycleYear, timeOffTypeId);
        } else {
            // Get all types
            allBalances = balanceRepository.findByYear(cycleYear);
        }

        // 3. Group balances by employee_id
        Map<Integer, List<EmployeeLeaveBalance>> balancesByEmployee = allBalances.stream()
                .collect(Collectors.groupingBy(EmployeeLeaveBalance::getEmployeeId));

        // 4. Build response for each employee
        List<AllEmployeesLeaveBalanceResponse.EmployeeBalanceSummary> summaries = activeEmployeeIds.stream()
                .map(empId -> {
                    // Get employee info
                    String employeeName = employeeRepository.findById(empId)
                            .map(emp -> emp.getFirstName() + " " + emp.getLastName())
                            .orElse("Unknown");

                    // Get balances for this employee
                    List<EmployeeLeaveBalance> empBalances = balancesByEmployee.getOrDefault(empId, List.of());

                    // Convert to balance info
                    List<AllEmployeesLeaveBalanceResponse.BalanceInfo> balanceInfos = empBalances.stream()
                            .map(balance -> {
                                String typeName = timeOffTypeRepository.findById(balance.getTimeOffTypeId())
                                        .map(TimeOffType::getTypeName)
                                        .orElse("Unknown Type");

                                return AllEmployeesLeaveBalanceResponse.BalanceInfo.builder()
                                        .timeOffTypeName(typeName)
                                        .totalDaysAllowed(balance.getTotalAllotted())
                                        .daysTaken(balance.getUsed())
                                        .daysRemaining(balance.getRemaining())
                                        .build();
                            })
                            .collect(Collectors.toList());

                    return AllEmployeesLeaveBalanceResponse.EmployeeBalanceSummary.builder()
                            .employeeId(empId)
                            .employeeName(employeeName)
                            .balances(balanceInfos)
                            .build();
                })
                .collect(Collectors.toList());

        // 5. Build final response
        AllEmployeesLeaveBalanceResponse.FilterInfo filterInfo = AllEmployeesLeaveBalanceResponse.FilterInfo.builder()
                .cycleYear(cycleYear)
                .timeOffTypeId(timeOffTypeId)
                .build();

        return AllEmployeesLeaveBalanceResponse.builder()
                .filter(filterInfo)
                .data(summaries)
                .build();
    }

    /**
     * Manually adjust leave balance for an employee
     */
    @Transactional
    public void adjustLeaveBalance(AdjustLeaveBalanceRequest request) {
        log.debug("Adjusting leave balance for employee {} type {} year {}: {} days",
                request.getEmployeeId(), request.getTimeOffTypeId(),
                request.getCycleYear(), request.getChangeAmount());

        // 1. Validate employee exists
        employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EmployeeNotFoundException(request.getEmployeeId()));

        // 2. Validate time-off type exists
        timeOffTypeRepository.findById(request.getTimeOffTypeId())
                .orElseThrow(() -> new TimeOffTypeNotFoundException(request.getTimeOffTypeId()));

        // 3. Find or create balance record
        EmployeeLeaveBalance balance = balanceRepository
                .findByEmployeeIdAndTimeOffTypeIdAndYear(
                        request.getEmployeeId(),
                        request.getTimeOffTypeId(),
                        request.getCycleYear())
                .orElseGet(() -> {
                    log.info("Balance not found, creating new balance record for employee {} type {} year {}",
                            request.getEmployeeId(), request.getTimeOffTypeId(), request.getCycleYear());
                    return createNewBalance(request.getEmployeeId(), request.getTimeOffTypeId(), request.getCycleYear());
                });

        // 4. Apply adjustment
        Double oldTotalAllotted = balance.getTotalAllotted();
        Double oldUsed = balance.getUsed();

        if (request.getChangeAmount() > 0) {
            // Positive: Add to total_days_allowed
            balance.setTotalAllotted(balance.getTotalAllotted() + request.getChangeAmount());
            log.info("Adding {} days to total_allotted: {} -> {}",
                    request.getChangeAmount(), oldTotalAllotted, balance.getTotalAllotted());
        } else {
            // Negative: Add to days_taken (subtract from remaining)
            balance.setUsed(balance.getUsed() + Math.abs(request.getChangeAmount()));
            log.info("Adding {} days to used: {} -> {}",
                    Math.abs(request.getChangeAmount()), oldUsed, balance.getUsed());
        }

        // 5. Validate: remaining must not be negative
        Double remaining = balance.getTotalAllotted() - balance.getUsed();
        if (remaining < 0) {
            throw new InvalidRequestException(
                    "INVALID_BALANCE",
                    String.format("Số dư phép không thể âm sau khi điều chỉnh. " +
                            "Total allowed: %.1f, Used: %.1f, Remaining: %.1f",
                            balance.getTotalAllotted(), balance.getUsed(), remaining));
        }

        // 6. Save balance
        balanceRepository.save(balance);

        // 7. Get current user (admin who made the change)
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));

        Integer changedBy = accountRepository.findOneByUsername(username)
                .map(account -> account.getEmployee().getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

        // 8. Create history record
        LeaveBalanceHistory history = LeaveBalanceHistory.builder()
                .balanceId(balance.getBalanceId())
                .changedBy(changedBy)
                .changeAmount(request.getChangeAmount())
                .reason(BalanceChangeReason.MANUAL_ADJUSTMENT)
                .notes(request.getNotes() != null ? request.getNotes() : "Điều chỉnh thủ công")
                .build();

        historyRepository.save(history);

        log.info("Adjustment completed. Balance ID: {}, New total: {}, New used: {}, Remaining: {}",
                balance.getBalanceId(), balance.getTotalAllotted(), balance.getUsed(), remaining);
    }

    /**
     * Annual leave balance reset for all active employees
     */
    @Transactional
    public Map<String, Object> annualReset(AnnualResetRequest request) {
        log.info("Starting annual reset for year {} type {} with {} days",
                request.getCycleYear(), request.getApplyToTypeId(), request.getDefaultAllowance());

        // 1. Validate year is reasonable (allow current year and next 2 years)
        int currentYear = Year.now().getValue();
        if (request.getCycleYear() < currentYear - 1 || request.getCycleYear() > currentYear + 2) {
            throw new InvalidRequestException(
                    "INVALID_YEAR",
                    String.format("Năm reset không hợp lệ: %d. Chỉ cho phép từ %d đến %d",
                            request.getCycleYear(), currentYear - 1, currentYear + 2));
        }

        // 2. Validate time-off type exists
        TimeOffType timeOffType = timeOffTypeRepository.findById(request.getApplyToTypeId())
                .orElseThrow(() -> new TimeOffTypeNotFoundException(request.getApplyToTypeId()));

        // 3. Get all active employees
        List<Integer> activeEmployeeIds = employeeRepository.findAllActiveEmployeeIds();
        log.info("Found {} active employees", activeEmployeeIds.size());

        int createdCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;

        // 4. For each employee, create or reset balance
        for (Integer employeeId : activeEmployeeIds) {
            try {
                Optional<EmployeeLeaveBalance> existingBalanceOpt = balanceRepository
                        .findByEmployeeIdAndTimeOffTypeIdAndYear(
                                employeeId,
                                request.getApplyToTypeId(),
                                request.getCycleYear());

                EmployeeLeaveBalance balance;
                boolean isUpdate = false;

                if (existingBalanceOpt.isPresent()) {
                    // Balance exists - RESET it
                    balance = existingBalanceOpt.get();
                    double oldAllowed = balance.getTotalAllotted();
                    double oldUsed = balance.getUsed();

                    balance.setTotalAllotted(request.getDefaultAllowance());
                    balance.setUsed(0.0);
                    balance.setUpdatedAt(LocalDateTime.now());

                    balance = balanceRepository.save(balance);
                    isUpdate = true;

                    log.debug("Reset balance for employee {}: {} days (was {}/{} used/allowed)",
                            employeeId, request.getDefaultAllowance(), oldUsed, oldAllowed);
                } else {
                    // Balance doesn't exist - CREATE new
                    balance = EmployeeLeaveBalance.builder()
                            .employeeId(employeeId)
                            .timeOffTypeId(request.getApplyToTypeId())
                            .year(request.getCycleYear())
                            .totalAllotted(request.getDefaultAllowance())
                            .used(0.0)
                            .build();

                    balance = balanceRepository.save(balance);

                    log.debug("Created new balance for employee {} with {} days",
                            employeeId, request.getDefaultAllowance());
                }

                // Create history record
                LeaveBalanceHistory history = LeaveBalanceHistory.builder()
                        .balanceId(balance.getBalanceId())
                        .changedBy(1) // System action (admin user ID)
                        .changeAmount(request.getDefaultAllowance())
                        .reason(BalanceChangeReason.ANNUAL_RESET)
                        .notes(String.format("%s %.1f ngày nghỉ phép %s cho năm %d",
                                isUpdate ? "Reset về" : "Cấp",
                                request.getDefaultAllowance(),
                                timeOffType.getTypeName(),
                                request.getCycleYear()))
                        .build();

                historyRepository.save(history);

                if (isUpdate) {
                    updatedCount++;
                } else {
                    createdCount++;
                }

            } catch (Exception e) {
                log.error("Failed to process balance for employee {}: {} - {}",
                        employeeId, e.getClass().getSimpleName(), e.getMessage(), e);
                skippedCount++;
                // Re-throw to see full error in response (for debugging)
                throw new RuntimeException("Failed to process employee " + employeeId, e);
            }
        }

        log.info("Annual reset completed: {} created, {} updated, {} skipped",
                createdCount, updatedCount, skippedCount);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Annual reset hoàn tất");
        result.put("cycle_year", request.getCycleYear());
        result.put("time_off_type_id", request.getApplyToTypeId());
        result.put("default_allowance", request.getDefaultAllowance());
        result.put("total_employees", activeEmployeeIds.size());
        result.put("created_count", createdCount);
        result.put("updated_count", updatedCount);
        result.put("skipped_count", skippedCount);

        return result;
    }

    /**
     * Helper: Create a new empty balance record
     */
    private EmployeeLeaveBalance createNewBalance(Integer employeeId, String timeOffTypeId, Integer year) {
        EmployeeLeaveBalance balance = EmployeeLeaveBalance.builder()
                .employeeId(employeeId)
                .timeOffTypeId(timeOffTypeId)
                .year(year)
                .totalAllotted(0.0)
                .used(0.0)
                .remaining(0.0)
                .build();

        return balanceRepository.save(balance);
    }

    /**
     * Helper: Convert EmployeeLeaveBalance to LeaveBalanceDetailResponse
     */
    private LeaveBalanceDetailResponse toBalanceDetailResponse(EmployeeLeaveBalance balance) {
        // Get time-off type info
        TimeOffType timeOffType = timeOffTypeRepository.findById(balance.getTimeOffTypeId())
                .orElse(null);

        TimeOffTypeInfoResponse typeInfo = null;
        if (timeOffType != null) {
            typeInfo = TimeOffTypeInfoResponse.builder()
                    .typeId(timeOffType.getTypeId())
                    .typeName(timeOffType.getTypeName())
                    .isPaid(timeOffType.getIsPaid())
                    .build();
        }

        return LeaveBalanceDetailResponse.builder()
                .balanceId(balance.getBalanceId())
                .timeOffType(typeInfo)
                .totalDaysAllowed(balance.getTotalAllotted())
                .daysTaken(balance.getUsed())
                .daysRemaining(balance.getRemaining())
                .build();
    }
}
