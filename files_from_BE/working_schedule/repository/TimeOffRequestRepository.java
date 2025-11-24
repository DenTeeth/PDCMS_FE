package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.TimeOffRequest;
import com.dental.clinic.management.working_schedule.enums.TimeOffStatus;

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
 * Repository for TimeOffRequest entity
 */
@Repository
public interface TimeOffRequestRepository extends JpaRepository<TimeOffRequest, String> {

        /**
         * Find time-off request by request_id
         */
        @Query("SELECT t FROM TimeOffRequest t " +
                        "LEFT JOIN FETCH t.employee " +
                        "LEFT JOIN FETCH t.requestedByEmployee " +
                        "LEFT JOIN FETCH t.approvedByEmployee " +
                        "WHERE t.requestId = :requestId")
        Optional<TimeOffRequest> findByRequestId(@Param("requestId") String requestId);

        /**
         * Find time-off request by request_id and employee_id (for ownership check)
         */
        @Query("SELECT t FROM TimeOffRequest t " +
                        "LEFT JOIN FETCH t.employee " +
                        "LEFT JOIN FETCH t.requestedByEmployee " +
                        "LEFT JOIN FETCH t.approvedByEmployee " +
                        "WHERE t.requestId = :requestId AND t.employeeId = :employeeId")
        Optional<TimeOffRequest> findByRequestIdAndEmployeeId(
                        @Param("requestId") String requestId,
                        @Param("employeeId") Integer employeeId);

        /**
         * Find all time-off requests for a specific employee
         */
        Page<TimeOffRequest> findByEmployeeId(Integer employeeId, Pageable pageable);

        /**
         * Check if there are conflicting time-off requests
         * Conflict = same employee, overlapping dates, not CANCELLED or REJECTED
         *
         * For full-day off (workShiftId = null):
         * - Conflicts with any request in date range
         *
         * For half-day off (workShiftId != null):
         * - Only conflicts with same work shift on same date
         */
        @Query("SELECT COUNT(t) > 0 FROM TimeOffRequest t " +
                        "WHERE t.employeeId = :employeeId " +
                        "AND t.status NOT IN ('CANCELLED', 'REJECTED') " +
                        "AND (" +
                        "  (t.startDate <= :endDate AND t.endDate >= :startDate) " + // Date range overlap
                        ") " +
                        "AND (" +
                        "  (:workShiftId IS NULL) OR " + // Full day off conflicts with any
                        "  (t.workShiftId IS NULL) OR " + // Any request conflicts with full day
                        "  (t.workShiftId = :workShiftId AND t.startDate = :startDate AND t.endDate = :endDate)" + // Same
                                                                                                                   // work
                                                                                                                   // shift,
                                                                                                                   // same
                                                                                                                   // date
                        ")")
        boolean existsConflictingRequest(
                        @Param("employeeId") Integer employeeId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("workShiftId") String workShiftId);

        /**
         * Find conflicting time-off requests (for detailed error message)
         */
        @Query("SELECT t FROM TimeOffRequest t " +
                        "WHERE t.employeeId = :employeeId " +
                        "AND t.status NOT IN ('CANCELLED', 'REJECTED') " +
                        "AND (t.startDate <= :endDate AND t.endDate >= :startDate) " +
                        "AND (" +
                        "  (:workShiftId IS NULL) OR " +
                        "  (t.workShiftId IS NULL) OR " +
                        "  (t.workShiftId = :workShiftId AND t.startDate = :startDate AND t.endDate = :endDate)" +
                        ")")
        List<TimeOffRequest> findConflictingRequests(
                        @Param("employeeId") Integer employeeId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("workShiftId") String workShiftId);

        /**
         * Advanced search with filters
         */
        @Query("SELECT DISTINCT t FROM TimeOffRequest t " +
                        "LEFT JOIN FETCH t.employee " +
                        "LEFT JOIN FETCH t.requestedByEmployee " +
                        "LEFT JOIN FETCH t.approvedByEmployee " +
                        "WHERE (:employeeId IS NULL OR t.employeeId = :employeeId) " +
                        "AND (:status IS NULL OR t.status = :status) " +
                        "AND (:startDate IS NULL OR t.startDate >= :startDate) " +
                        "AND (:endDate IS NULL OR t.endDate <= :endDate)")
        Page<TimeOffRequest> findWithFilters(
                        @Param("employeeId") Integer employeeId,
                        @Param("status") TimeOffStatus status,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        Pageable pageable);

        /**
         * Check if there are pending requests using a specific time-off type
         */
        boolean existsByTimeOffTypeIdAndStatus(String timeOffTypeId, TimeOffStatus status);
}
