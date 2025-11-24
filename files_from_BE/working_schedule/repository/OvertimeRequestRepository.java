package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.OvertimeRequest;
import com.dental.clinic.management.working_schedule.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for OvertimeRequest entity.
 * Provides data access methods for overtime request operations.
 */
@Repository
public interface OvertimeRequestRepository extends JpaRepository<OvertimeRequest, String> {

    /**
     * Find all overtime requests for a specific employee.
     * @param employeeId the employee ID
     * @param pageable pagination information
     * @return page of overtime requests
     */
    @Query("SELECT ot FROM OvertimeRequest ot " +
           "WHERE ot.employee.employeeId = :employeeId " +
           "ORDER BY ot.workDate DESC, ot.createdAt DESC")
    Page<OvertimeRequest> findByEmployeeId(@Param("employeeId") Integer employeeId, Pageable pageable);

    /**
     * Find all overtime requests for a specific employee on a specific date.
     * Used for checking time-overlapping shifts.
     * @param employeeId the employee ID
     * @param workDate the work date
     * @return list of overtime requests
     */
    @Query("SELECT ot FROM OvertimeRequest ot " +
           "WHERE ot.employee.employeeId = :employeeId " +
           "AND ot.workDate = :workDate")
    List<OvertimeRequest> findByEmployeeIdAndWorkDate(
        @Param("employeeId") Integer employeeId,
        @Param("workDate") LocalDate workDate
    );

    /**
     * Find all overtime requests with optional filtering by status.
     * @param status optional status filter
     * @param pageable pagination information
     * @return page of overtime requests
     */
    @Query("SELECT ot FROM OvertimeRequest ot " +
           "WHERE :status IS NULL OR ot.status = :status " +
           "ORDER BY ot.workDate DESC, ot.createdAt DESC")
    Page<OvertimeRequest> findAllWithOptionalStatus(@Param("status") RequestStatus status, Pageable pageable);

    /**
     * Find overtime requests by employee with optional status filter.
     * @param employeeId the employee ID
     * @param status optional status filter
     * @param pageable pagination information
     * @return page of overtime requests
     */
    @Query("SELECT ot FROM OvertimeRequest ot " +
           "WHERE ot.employee.employeeId = :employeeId " +
           "AND (:status IS NULL OR ot.status = :status) " +
           "ORDER BY ot.workDate DESC, ot.createdAt DESC")
    Page<OvertimeRequest> findByEmployeeIdAndStatus(
        @Param("employeeId") Integer employeeId,
        @Param("status") RequestStatus status,
        Pageable pageable
    );

    /**
     * Check if a conflicting overtime request exists.
     * A conflict occurs when there's already a PENDING or APPROVED request
     * for the same employee, work date, and shift.
     * @param employeeId the employee ID
     * @param workDate the work date
     * @param workShiftId the work shift ID
     * @param statuses list of statuses to check (typically PENDING and APPROVED)
     * @return true if a conflicting request exists
     */
    @Query("SELECT CASE WHEN COUNT(ot) > 0 THEN true ELSE false END " +
           "FROM OvertimeRequest ot " +
           "WHERE ot.employee.employeeId = :employeeId " +
           "AND ot.workDate = :workDate " +
           "AND ot.workShift.workShiftId = :workShiftId " +
           "AND ot.status IN :statuses")
    boolean existsConflictingRequest(
        @Param("employeeId") Integer employeeId,
        @Param("workDate") LocalDate workDate,
        @Param("workShiftId") String workShiftId,
        @Param("statuses") List<RequestStatus> statuses
    );

    /**
     * Check if employee has ANY overtime request on the same date (any shift).
     * Used to prevent spam - only 1 overtime request per employee per date.
     * @param employeeId the employee ID
     * @param workDate the work date
     * @param statuses list of statuses to check (typically PENDING and APPROVED)
     * @return true if any overtime request exists for this date
     */
    @Query("SELECT CASE WHEN COUNT(ot) > 0 THEN true ELSE false END " +
           "FROM OvertimeRequest ot " +
           "WHERE ot.employee.employeeId = :employeeId " +
           "AND ot.workDate = :workDate " +
           "AND ot.status IN :statuses")
    boolean existsOvertimeRequestOnDate(
        @Param("employeeId") Integer employeeId,
        @Param("workDate") LocalDate workDate,
        @Param("statuses") List<RequestStatus> statuses
    );

    /**
     * Check if a conflicting overtime request exists, excluding a specific request.
     * Used when updating an existing request.
     * @param requestId the request ID to exclude
     * @param employeeId the employee ID
     * @param workDate the work date
     * @param workShiftId the work shift ID
     * @param statuses list of statuses to check
     * @return true if a conflicting request exists
     */
    @Query("SELECT CASE WHEN COUNT(ot) > 0 THEN true ELSE false END " +
           "FROM OvertimeRequest ot " +
           "WHERE ot.requestId != :requestId " +
           "AND ot.employee.employeeId = :employeeId " +
           "AND ot.workDate = :workDate " +
           "AND ot.workShift.workShiftId = :workShiftId " +
           "AND ot.status IN :statuses")
    boolean existsConflictingRequestExcludingId(
        @Param("requestId") String requestId,
        @Param("employeeId") Integer employeeId,
        @Param("workDate") LocalDate workDate,
        @Param("workShiftId") String workShiftId,
        @Param("statuses") List<RequestStatus> statuses
    );

    /**
     * Find overtime requests by work date range.
     * @param startDate start date (inclusive)
     * @param endDate end date (inclusive)
     * @param pageable pagination information
     * @return page of overtime requests
     */
    @Query("SELECT ot FROM OvertimeRequest ot " +
           "WHERE ot.workDate BETWEEN :startDate AND :endDate " +
           "ORDER BY ot.workDate DESC, ot.createdAt DESC")
    Page<OvertimeRequest> findByWorkDateBetween(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );

    /**
     * Find overtime requests by status.
     * @param status the status to filter by
     * @param pageable pagination information
     * @return page of overtime requests
     */
    Page<OvertimeRequest> findByStatus(RequestStatus status, Pageable pageable);

    /**
     * Count overtime requests by status for an employee.
     * @param employeeId the employee ID
     * @param status the status to count
     * @return count of requests
     */
    @Query("SELECT COUNT(ot) FROM OvertimeRequest ot " +
           "WHERE ot.employee.employeeId = :employeeId " +
           "AND ot.status = :status")
    long countByEmployeeIdAndStatus(
        @Param("employeeId") Integer employeeId,
        @Param("status") RequestStatus status
    );

    /**
     * Find the latest overtime request for generating sequential IDs.
     * ID format: OTRyymmddSSS (e.g., OTR251021005)
     * @param datePrefix the date prefix (e.g., "OTR251021")
     * @return the latest overtime request
     */
    @Query("SELECT ot FROM OvertimeRequest ot " +
           "WHERE ot.requestId LIKE :datePrefix% " +
           "ORDER BY ot.requestId DESC")
    Optional<OvertimeRequest> findLatestByDatePrefix(@Param("datePrefix") String datePrefix);
}
