package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.EmployeeShift;
import com.dental.clinic.management.working_schedule.enums.ShiftSource;
import com.dental.clinic.management.working_schedule.enums.ShiftStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for EmployeeShift entity.
 */
@Repository
public interface EmployeeShiftRepository extends JpaRepository<EmployeeShift, String> {

        /**
         * Find all shifts for an employee.
         *
         * @param employeeId the employee ID
         * @return list of shifts
         */
        List<EmployeeShift> findByEmployeeEmployeeIdOrderByWorkDateAsc(Integer employeeId);

        /**
         * Find shifts for an employee within a date range.
         *
         * @param employeeId the employee ID
         * @param startDate  start date (inclusive)
         * @param endDate    end date (inclusive)
         * @return list of shifts
         */
        @Query("SELECT es FROM EmployeeShift es " +
                        "WHERE es.employee.employeeId = :employeeId " +
                        "AND es.workDate BETWEEN :startDate AND :endDate " +
                        "ORDER BY es.workDate ASC")
        List<EmployeeShift> findByEmployeeAndDateRange(
                        @Param("employeeId") Integer employeeId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        /**
         * Check if a shift already exists for employee on a specific date and shift.
         *
         * @param employeeId  the employee ID
         * @param workDate    the work date
         * @param workShiftId the work shift ID
         * @return true if exists
         */
        @Query("SELECT COUNT(es) > 0 FROM EmployeeShift es " +
                        "WHERE es.employee.employeeId = :employeeId " +
                        "AND es.workDate = :workDate " +
                        "AND es.workShift.workShiftId = :workShiftId")
        boolean existsByEmployeeAndDateAndShift(
                        @Param("employeeId") Integer employeeId,
                        @Param("workDate") LocalDate workDate,
                        @Param("workShiftId") String workShiftId);

        /**
         * Delete shifts for a specific employee within a date range.
         * Used for regenerating schedules.
         *
         * @param employeeId the employee ID
         * @param startDate  start date
         * @param endDate    end date
         */
        @Query("DELETE FROM EmployeeShift es " +
                        "WHERE es.employee.employeeId = :employeeId " +
                        "AND es.workDate BETWEEN :startDate AND :endDate")
        void deleteByEmployeeAndDateRange(
                        @Param("employeeId") Integer employeeId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        /**
         * Update shift status for an employee within a date range and optional work
         * shift.
         * Used when approving time-off or overtime requests.
         *
         * @param employeeId  the employee ID
         * @param startDate   start date
         * @param endDate     end date
         * @param workShiftId optional work shift ID (null for all shifts)
         * @param status      new status to set
         * @return number of records updated
         */
        @Modifying
        @Query("UPDATE EmployeeShift es SET es.status = :status, es.updatedAt = CURRENT_TIMESTAMP " +
                        "WHERE es.employee.employeeId = :employeeId " +
                        "AND es.workDate BETWEEN :startDate AND :endDate " +
                        "AND (:workShiftId IS NULL OR es.workShift.workShiftId = :workShiftId)")
        int updateShiftStatus(
                        @Param("employeeId") Integer employeeId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("workShiftId") String workShiftId,
                        @Param("status") ShiftStatus status);

        /**
         * Check if a work shift template is in use by any employee schedules.
         * Used to prevent modifying work shift hours when employees are already
         * scheduled.
         *
         * @param workShiftId the work shift ID
         * @return true if the work shift is in use
         */
        @Query("SELECT COUNT(es) > 0 FROM EmployeeShift es WHERE es.workShift.workShiftId = :workShiftId")
        boolean existsByWorkShiftId(@Param("workShiftId") String workShiftId);

        /**
         * Count employee schedules using a specific work shift template.
         *
         * @param workShiftId the work shift ID
         * @return count of employee shifts using this work shift
         */
        @Query("SELECT COUNT(es) FROM EmployeeShift es WHERE es.workShift.workShiftId = :workShiftId")
        long countByWorkShiftId(@Param("workShiftId") String workShiftId);

        // ============================================================
        // NEW METHODS FOR EMPLOYEE SHIFT MANAGEMENT API
        // ============================================================

        /**
         * Find shift by employee_shift_id.
         * Required for: GET /api/v1/shifts/{employee_shift_id}
         *
         * @param employeeShiftId the employee shift ID
         * @return optional shift
         */
        Optional<EmployeeShift> findByEmployeeShiftId(String employeeShiftId);

        /**
         * Find shifts for calendar view with filters and pagination.
         * Required for: GET /api/v1/shifts/calendar
         *
         * @param employeeIds employee IDs to filter (null = all employees)
         * @param startDate   start date (inclusive)
         * @param endDate     end date (inclusive)
         * @param statuses    list of statuses to filter (null = all statuses)
         * @param sources     list of sources to filter (null = all sources)
         * @param pageable    pagination information
         * @return page of shifts
         */
        @Query("SELECT es FROM EmployeeShift es " +
                        "WHERE (:employeeIds IS NULL OR es.employee.employeeId IN :employeeIds) " +
                        "AND es.workDate BETWEEN :startDate AND :endDate " +
                        "AND (:statuses IS NULL OR es.status IN :statuses) " +
                        "AND (:sources IS NULL OR es.source IN :sources) " +
                        "ORDER BY es.workDate ASC, es.employee.employeeId ASC")
        Page<EmployeeShift> findCalendarShifts(
                        @Param("employeeIds") List<Integer> employeeIds,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("statuses") List<ShiftStatus> statuses,
                        @Param("sources") List<ShiftSource> sources,
                        Pageable pageable);

        /**
         * Count total shifts by date for summary view.
         * Required for: GET /api/v1/shifts/summary
         *
         * @param startDate start date
         * @param endDate   end date
         * @param statuses  list of statuses to filter (null = all statuses)
         * @return list of objects with workDate and count
         */
        @Query("SELECT es.workDate as workDate, COUNT(es) as totalShifts " +
                        "FROM EmployeeShift es " +
                        "WHERE es.workDate BETWEEN :startDate AND :endDate " +
                        "AND (:statuses IS NULL OR es.status IN :statuses) " +
                        "GROUP BY es.workDate " +
                        "ORDER BY es.workDate ASC")
        List<Object[]> countShiftsByDateRange(
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("statuses") List<ShiftStatus> statuses);

        /**
         * Count shifts by status for a specific date.
         * Required for: GET /api/v1/shifts/summary (breakdown by status)
         *
         * @param workDate the work date
         * @return list of objects with status and count
         */
        @Query("SELECT es.status as status, COUNT(es) as count " +
                        "FROM EmployeeShift es " +
                        "WHERE es.workDate = :workDate " +
                        "GROUP BY es.status")
        List<Object[]> countShiftsByStatus(@Param("workDate") LocalDate workDate);

        /**
         * Check if employee has any FINALIZED shifts on a specific date.
         * Required for: Validation when creating/updating shifts
         *
         * @param employeeId employee ID
         * @param workDate   work date
         * @return true if has finalized shifts
         */
        @Query("SELECT COUNT(es) > 0 FROM EmployeeShift es " +
                        "WHERE es.employee.employeeId = :employeeId " +
                        "AND es.workDate = :workDate " +
                        "AND es.status = 'FINALIZED'")
        boolean hasFinalizedShifts(
                        @Param("employeeId") Integer employeeId,
                        @Param("workDate") LocalDate workDate);

        /**
         * Find all shifts for a specific employee and date (all shifts on that day).
         * Required for: Slot conflict checking
         *
         * @param employeeId employee ID
         * @param workDate   work date
         * @return list of shifts
         */
        @Query("SELECT es FROM EmployeeShift es " +
                        "WHERE es.employee.employeeId = :employeeId " +
                        "AND es.workDate = :workDate")
        List<EmployeeShift> findByEmployeeAndDate(
                        @Param("employeeId") Integer employeeId,
                        @Param("workDate") LocalDate workDate);

        /**
         * Find shifts by date range and status.
         * Required for: Various filtering scenarios
         *
         * @param startDate start date
         * @param endDate   end date
         * @param statuses  list of statuses
         * @return list of shifts
         */
        @Query("SELECT es FROM EmployeeShift es " +
                        "WHERE es.workDate BETWEEN :startDate AND :endDate " +
                        "AND (:statuses IS NULL OR es.status IN :statuses) " +
                        "ORDER BY es.workDate ASC")
        List<EmployeeShift> findByDateRangeAndStatus(
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("statuses") List<ShiftStatus> statuses);

        /**
         * Find all shifts for an employee on a specific date excluding cancelled
         * shifts.
         * Used for checking time overlap conflicts.
         *
         * @param employeeId employee ID
         * @param workDate   work date
         * @return list of active shifts (not cancelled)
         */
        @Query("SELECT es FROM EmployeeShift es " +
                        "WHERE es.employee.employeeId = :employeeId " +
                        "AND es.workDate = :workDate " +
                        "AND es.status != 'CANCELLED' " +
                        "ORDER BY es.workShift.startTime ASC")
        List<EmployeeShift> findActiveShiftsByEmployeeAndDate(
                        @Param("employeeId") Integer employeeId,
                        @Param("workDate") LocalDate workDate);
}
