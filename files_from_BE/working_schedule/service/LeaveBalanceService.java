package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.account.enums.AccountStatus;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.working_schedule.domain.EmployeeLeaveBalance;
import com.dental.clinic.management.working_schedule.domain.LeaveBalanceHistory;
import com.dental.clinic.management.working_schedule.domain.TimeOffType;
import com.dental.clinic.management.working_schedule.enums.BalanceChangeReason;
import com.dental.clinic.management.working_schedule.repository.EmployeeLeaveBalanceRepository;
import com.dental.clinic.management.working_schedule.repository.LeaveBalanceHistoryRepository;
import com.dental.clinic.management.working_schedule.repository.TimeOffTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing employee leave balances.
 * Handles annual resets, balance adjustments, and balance queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LeaveBalanceService {

    private final EmployeeLeaveBalanceRepository balanceRepository;
    private final LeaveBalanceHistoryRepository historyRepository;
    private final EmployeeRepository employeeRepository;
    private final TimeOffTypeRepository timeOffTypeRepository;

    /**
     * Perform annual leave balance reset for all active employees.
     * This method:
     * 1. Finds all active employees
     * 2. Finds all active time-off types that require balance
     * 3. Creates/updates leave balances for each employee-type combination
     * 4. Records the change in history
     *
     * @param year the year to create balances for
     * @return number of balances created/updated
     */
    @Transactional
    public int annualReset(Integer year) {
        log.info("Starting annual leave balance reset for year {}", year);

        // Find all active employees (those who have accounts)
        List<Employee> activeEmployees = employeeRepository.findAll()
                .stream()
                .filter(emp -> emp.getAccount() != null && emp.getAccount().getStatus() == AccountStatus.ACTIVE)
                .toList();
        log.info("Found {} active employees", activeEmployees.size());

        // Find all active time-off types that require balance tracking
        List<TimeOffType> timeOffTypes = timeOffTypeRepository.findByIsActiveTrueAndRequiresBalanceTrue();
        log.info("Found {} active time-off types requiring balance", timeOffTypes.size());

        if (timeOffTypes.isEmpty()) {
            log.warn("No active time-off types found that require balance. Skipping reset.");
            return 0;
        }

        int createdCount = 0;
        int updatedCount = 0;

        // For each employee, create/update balance for each time-off type
        for (Employee employee : activeEmployees) {
            for (TimeOffType timeOffType : timeOffTypes) {
                try {
                    boolean isNew = createOrUpdateBalance(employee, timeOffType, year);
                    if (isNew) {
                        createdCount++;
                    } else {
                        updatedCount++;
                    }
                } catch (Exception e) {
                    log.error("Failed to create/update balance for employee {} and type {}: {}",
                            employee.getEmployeeId(), timeOffType.getTypeId(), e.getMessage(), e);
                    // Continue with other employees/types
                }
            }
        }

        log.info("Annual reset completed: {} new balances created, {} balances updated",
                createdCount, updatedCount);
        return createdCount + updatedCount;
    }

    /**
     * Create or update leave balance for an employee and time-off type.
     *
     * @param employee    the employee
     * @param timeOffType the time-off type
     * @param year        the year
     * @return true if new balance was created, false if existing balance was
     *         updated
     */
    private boolean createOrUpdateBalance(Employee employee, TimeOffType timeOffType, Integer year) {
        // Check if balance already exists
        var existingBalance = balanceRepository.findByEmployeeIdAndTimeOffTypeIdAndYear(
                employee.getEmployeeId(),
                timeOffType.getTypeId(),
                year);

        boolean isNew = existingBalance.isEmpty();

        EmployeeLeaveBalance balance;
        if (isNew) {
            // Create new balance
            balance = new EmployeeLeaveBalance();
            balance.setEmployeeId(employee.getEmployeeId());
            balance.setTimeOffTypeId(timeOffType.getTypeId());
            balance.setYear(year);
            balance.setUsed(0.0);
        } else {
            // Update existing balance (reset used days)
            balance = existingBalance.get();
            balance.setUsed(0.0); // Reset used days at beginning of year
        }

        // Set total allotted days from time-off type default
        Double defaultDays = timeOffType.getDefaultDaysPerYear();
        if (defaultDays == null || defaultDays <= 0) {
            log.warn("TimeOffType {} has no default days. Setting to 12 days.",
                    timeOffType.getTypeId());
            defaultDays = 12.0; // Default fallback
        }
        balance.setTotalAllotted(defaultDays);

        // Save balance
        balance = balanceRepository.save(balance);

        // Create history record
        LeaveBalanceHistory history = LeaveBalanceHistory.builder()
                .balanceId(balance.getBalanceId())
                .changedBy(null) // System action, no specific user
                .changeAmount(defaultDays)
                .reason(BalanceChangeReason.ANNUAL_RESET)
                .notes(String.format("Cấp %s ngày nghỉ phép %s cho năm %d",
                        defaultDays, timeOffType.getTypeName(), year))
                .build();

        historyRepository.save(history);

        log.debug("{} balance for employee {} type {} year {}: {} days",
                isNew ? "Created" : "Updated",
                employee.getEmployeeId(),
                timeOffType.getTypeId(),
                year,
                defaultDays);

        return isNew;
    }

    /**
     * Manually adjust leave balance for an employee.
     *
     * @param employeeId    the employee ID
     * @param timeOffTypeId the time-off type ID
     * @param year          the year
     * @param adjustment    the adjustment amount (positive to add, negative to
     *                      subtract)
     * @param reason        the reason for adjustment
     * @param changedBy     the admin/manager who made the change
     */
    @Transactional
    public void manualAdjustment(Integer employeeId, String timeOffTypeId, Integer year,
            Double adjustment, String reason, Integer changedBy) {
        log.info("Manual adjustment for employee {} type {} year {}: {} days",
                employeeId, timeOffTypeId, year, adjustment);

        // Find existing balance
        EmployeeLeaveBalance balance = balanceRepository
                .findByEmployeeIdAndTimeOffTypeIdAndYear(employeeId, timeOffTypeId, year)
                .orElseThrow(() -> new IllegalArgumentException(
                        String.format("Không tìm thấy số dư nghỉ phép cho nhân viên %d loại %s năm %d",
                                employeeId, timeOffTypeId, year)));

        // Apply adjustment to total allotted
        balance.setTotalAllotted(balance.getTotalAllotted() + adjustment);
        balanceRepository.save(balance);

        // Record in history
        LeaveBalanceHistory history = LeaveBalanceHistory.builder()
                .balanceId(balance.getBalanceId())
                .changedBy(changedBy)
                .changeAmount(adjustment)
                .reason(BalanceChangeReason.MANUAL_ADJUSTMENT)
                .notes(reason != null ? reason : "Điều chỉnh thủ công")
                .build();

        historyRepository.save(history);

        log.info("Manual adjustment completed. New balance: {} allotted, {} used, {} remaining",
                balance.getTotalAllotted(), balance.getUsed(), balance.getRemaining());
    }

    /**
     * Get leave balance for an employee and time-off type.
     *
     * @param employeeId    the employee ID
     * @param timeOffTypeId the time-off type ID
     * @param year          the year
     * @return the leave balance, or null if not found
     */
    public EmployeeLeaveBalance getBalance(Integer employeeId, String timeOffTypeId, Integer year) {
        return balanceRepository.findByEmployeeIdAndTimeOffTypeIdAndYear(employeeId, timeOffTypeId, year)
                .orElse(null);
    }

    /**
     * Get all leave balances for an employee in a specific year.
     *
     * @param employeeId the employee ID
     * @param year       the year
     * @return list of leave balances
     */
    public List<EmployeeLeaveBalance> getBalancesByEmployee(Integer employeeId, Integer year) {
        return balanceRepository.findByEmployeeIdAndYear(employeeId, year);
    }

    /**
     * Get balance history for a specific balance.
     *
     * @param balanceId the balance ID
     * @return list of history records
     */
    public List<LeaveBalanceHistory> getBalanceHistory(Long balanceId) {
        return historyRepository.findByBalanceIdOrderByCreatedAtDesc(balanceId);
    }
}
