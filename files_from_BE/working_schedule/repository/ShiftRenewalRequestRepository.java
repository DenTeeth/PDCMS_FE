package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.ShiftRenewalRequest;
import com.dental.clinic.management.working_schedule.enums.RenewalStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for ShiftRenewalRequest entity.
 * Handles renewal requests for FIXED shift registrations (FULL_TIME &
 * PART_TIME_FIXED).
 */
@Repository
public interface ShiftRenewalRequestRepository extends JpaRepository<ShiftRenewalRequest, String> {

        /**
         * Find all pending renewal requests for a specific employee.
         * Only returns non-expired requests.
         *
         * @param employeeId the employee ID
         * @param now        current timestamp
         * @return list of pending renewals
         */
        @Query("SELECT srr FROM ShiftRenewalRequest srr " +
                        "WHERE srr.employee.employeeId = :employeeId " +
                        "AND srr.status = 'PENDING_ACTION' " +
                        "AND srr.expiresAt > :now " +
                        "ORDER BY srr.expiresAt ASC")
        List<ShiftRenewalRequest> findPendingByEmployeeId(
                        @Param("employeeId") Integer employeeId,
                        @Param("now") LocalDateTime now);

        /**
         * Find a renewal request by ID and employee ID.
         * Used to verify ownership before allowing response.
         *
         * @param renewalId  the renewal ID
         * @param employeeId the employee ID
         * @return optional renewal request
         */
        @Query("SELECT srr FROM ShiftRenewalRequest srr " +
                        "WHERE srr.renewalId = :renewalId " +
                        "AND srr.employee.employeeId = :employeeId")
        Optional<ShiftRenewalRequest> findByIdAndEmployeeId(
                        @Param("renewalId") String renewalId,
                        @Param("employeeId") Integer employeeId);

        /**
         * Find and LOCK a renewal request for update (PESSIMISTIC_WRITE).
         * Used when employee responds (CONFIRMED/DECLINED) to prevent race conditions.
         * Must be called within @Transactional context.
         *
         * @param renewalId the renewal ID
         * @return optional renewal request with write lock
         */
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT srr FROM ShiftRenewalRequest srr " +
                        "WHERE srr.renewalId = :renewalId")
        Optional<ShiftRenewalRequest> findByIdWithLock(@Param("renewalId") String renewalId);

        /**
         * Check if a renewal request already exists for a specific FIXED registration.
         * Prevents duplicate renewals.
         * Note: registrationId is now INTEGER (FK to
         * fixed_shift_registrations.registration_id)
         *
         * @param registrationId the expiring fixed registration ID (Integer)
         * @param status         the status to check
         * @return true if exists
         */
        @Query("SELECT COUNT(srr) > 0 FROM ShiftRenewalRequest srr " +
                        "WHERE srr.expiringRegistration.registrationId = :registrationId " +
                        "AND srr.status = :status")
        boolean existsByRegistrationIdAndStatus(
                        @Param("registrationId") Integer registrationId,
                        @Param("status") RenewalStatus status);

        /**
         * Find all expired renewal requests that need status update.
         * Used by cron job to mark expired renewals.
         *
         * @param now current timestamp
         * @return list of expired renewals still marked as PENDING_ACTION
         */
        @Query("SELECT srr FROM ShiftRenewalRequest srr " +
                        "WHERE srr.status = 'PENDING_ACTION' " +
                        "AND srr.expiresAt <= :now")
        List<ShiftRenewalRequest> findExpiredPendingRenewals(@Param("now") LocalDateTime now);

        /**
         * Find all renewal requests for a specific employee.
         *
         * @param employeeId the employee ID
         * @return list of all renewals
         */
        List<ShiftRenewalRequest> findByEmployeeEmployeeIdOrderByCreatedAtDesc(Integer employeeId);

        /**
         * Find renewal request by expiring FIXED registration ID.
         * Note: changed from EmployeeShiftRegistration to FixedShiftRegistration
         *
         * @param registrationId the fixed registration ID (Integer)
         * @return list of renewals for this registration
         */
        List<ShiftRenewalRequest> findByExpiringRegistrationRegistrationId(Integer registrationId);

        /**
         * Check if a renewal request exists for a specific registration ID and status.
         * Alternative method name for DailyRenewalDetectionJob compatibility.
         *
         * @param registrationId the expiring fixed registration ID (Integer)
         * @param status         the renewal status to check
         * @return true if exists
         */
        @Query("SELECT COUNT(srr) > 0 FROM ShiftRenewalRequest srr " +
                        "WHERE srr.expiringRegistration.registrationId = :registrationId " +
                        "AND srr.status = :status")
        boolean existsByExpiringRegistrationRegistrationIdAndStatus(
                        @Param("registrationId") Integer registrationId,
                        @Param("status") RenewalStatus status);
}
