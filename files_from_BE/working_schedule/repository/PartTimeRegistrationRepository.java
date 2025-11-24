package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.PartTimeRegistration;
import com.dental.clinic.management.working_schedule.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository for part_time_registrations table.
 * Used for Part-Time FLEX employees who submit registration requests.
 * 
 * NEW SPECIFICATION: Supports approval workflow with status filtering.
 */
@Repository
public interface PartTimeRegistrationRepository extends JpaRepository<PartTimeRegistration, Integer> {

    /**
     * Find all registrations by employee ID (both active and inactive).
     */
    List<PartTimeRegistration> findByEmployeeId(Integer employeeId);
    
    /**
     * Find all registrations by employee ID with pagination.
     */
    org.springframework.data.domain.Page<PartTimeRegistration> findByEmployeeId(
            Integer employeeId, 
            org.springframework.data.domain.Pageable pageable);

    /**
     * Find all active/inactive registrations by employee ID.
     */
    List<PartTimeRegistration> findByEmployeeIdAndIsActive(Integer employeeId, Boolean isActive);
    
    /**
     * Find all active/inactive registrations by employee ID with pagination.
     */
    org.springframework.data.domain.Page<PartTimeRegistration> findByEmployeeIdAndIsActive(
            Integer employeeId, 
            Boolean isActive, 
            org.springframework.data.domain.Pageable pageable);
    
    /**
     * NEW: Find registrations by employee and status.
     * Used to check if employee has pending/approved registrations.
     */
    List<PartTimeRegistration> findByEmployeeIdAndStatus(Integer employeeId, RegistrationStatus status);
    
    /**
     * Find all registrations by employee and multiple statuses.
     * Used for calculating weekly hours (PENDING + APPROVED).
     * 
     * @param employeeId Employee ID
     * @param statuses List of statuses to filter by
     * @return List of registrations matching any of the statuses
     */
    List<PartTimeRegistration> findByEmployeeIdAndStatusIn(Integer employeeId, List<RegistrationStatus> statuses);
    
    /**
     * NEW: Find active registrations by employee and status.
     * Used to check for overlapping approved registrations.
     */
    List<PartTimeRegistration> findByEmployeeIdAndIsActiveAndStatus(
            Integer employeeId, 
            Boolean isActive, 
            RegistrationStatus status);

    /**
     * Find all registrations by slot ID and active status.
     * Used to get list of employees registered for a specific slot.
     */
    List<PartTimeRegistration> findByPartTimeSlotIdAndIsActive(Long slotId, Boolean isActive);
    
    /**
     * NEW: Find registrations by slot ID and status.
     * Used to get approved registrations for a slot.
     */
    List<PartTimeRegistration> findByPartTimeSlotIdAndStatus(Long slotId, RegistrationStatus status);
    
    /**
     * NEW: Find active approved registrations by slot ID.
     * Used to count who is actually working (not cancelled).
     */
    List<PartTimeRegistration> findByPartTimeSlotIdAndIsActiveAndStatus(
            Long slotId, 
            Boolean isActive, 
            RegistrationStatus status);

    /**
     * NEW: Count approved registrations that cover a specific date.
     * This is the KEY method for dynamic quota calculation.
     * 
     * Logic: Count APPROVED registrations where:
     * - effectiveFrom <= targetDate
     * - effectiveTo >= targetDate
     * - isActive = true
     * 
     * Example: If targetDate = 2025-11-21 (Friday), count how many
     * approved employees are registered to work on that date.
     * 
     * @param slotId The part-time slot ID
     * @param targetDate The date to check coverage for
     * @param status Should be APPROVED
     * @param isActive Should be true
     * @return Count of approved employees covering that date
     */
    @Query("SELECT COUNT(r) FROM PartTimeRegistration r " +
           "WHERE r.partTimeSlotId = :slotId " +
           "AND r.status = :status " +
           "AND r.isActive = :isActive " +
           "AND r.effectiveFrom <= :targetDate " +
           "AND r.effectiveTo >= :targetDate")
    long countBySlotAndDateCoverage(
            @Param("slotId") Long slotId,
            @Param("targetDate") LocalDate targetDate,
            @Param("status") RegistrationStatus status,
            @Param("isActive") Boolean isActive);

    /**
     * Count approved registrations that cover a specific date.
     * This query supports both new per-day requestedDates and legacy range-based
     * registrations. A registration counts for the target date when:
     *  - it has an explicit requested date equal to targetDate, OR
     *  - it has no requestedDates (legacy) and its effectiveFrom..effectiveTo covers targetDate.
     *
     * We use LEFT JOIN and COUNT(DISTINCT r) to avoid double-counting registrations
     * that contain multiple requested dates.
     */
    @Query("SELECT COUNT(DISTINCT r) FROM PartTimeRegistration r LEFT JOIN r.requestedDates d " +
            "WHERE r.partTimeSlotId = :slotId " +
            "AND r.status = :status " +
            "AND r.isActive = :isActive " +
            "AND (d = :targetDate OR (d IS NULL AND r.effectiveFrom <= :targetDate AND r.effectiveTo >= :targetDate))")
    long countBySlotAndDate(
             @Param("slotId") Long slotId,
             @Param("targetDate") LocalDate targetDate,
             @Param("status") RegistrationStatus status,
             @Param("isActive") Boolean isActive);

    /**
     * NEW: Find pending registrations (for manager approval list).
     * Used in admin endpoint to show all pending requests.
     */
    List<PartTimeRegistration> findByStatus(RegistrationStatus status);
    
    /**
     * NEW: Find pending registrations ordered by creation date.
     * Used to show oldest requests first in approval queue.
     */
    List<PartTimeRegistration> findByStatusOrderByCreatedAtAsc(RegistrationStatus status);
    
    /**
     * Find registrations by status list.
     * Used for backfill operations to find all APPROVED registrations.
     */
    List<PartTimeRegistration> findByStatusIn(List<RegistrationStatus> statuses);

    /**
     * Find all active registrations that have expired (effective_to < today).
     * Used by CleanupExpiredFlexRegistrationsJob to deactivate ghost occupants.
     *
     * SQL Equivalent:
     * SELECT * FROM part_time_registrations
     * WHERE is_active = true AND effective_to < CURRENT_DATE
     *
     * @param isActive    filter by active status (should be true to find expired
     *                    but still active)
     * @param effectiveTo date to compare against (should be today)
     * @return list of expired registrations still marked as active
     */
    List<PartTimeRegistration> findByIsActiveAndEffectiveToLessThan(
            Boolean isActive,
            LocalDate effectiveTo);

    /**
     * Count registrations by status and active flag.
     * Used for statistics/dashboard.
     */
    long countByStatusAndIsActive(RegistrationStatus status, Boolean isActive);

    /**
     * Deactivate all active Flex registrations for a specific employee.
     * Used by Job P3 (CleanupInactiveEmployeeRegistrationsJob) when employee is deactivated.
     * Sets is_active = false AND effective_to = NOW() to mark the end date.
     *
     * @param employeeId employee ID
     * @return number of registrations deactivated
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE PartTimeRegistration ptr " +
           "SET ptr.isActive = false, ptr.effectiveTo = CURRENT_DATE " +
           "WHERE ptr.employeeId = :employeeId " +
           "AND ptr.isActive = true")
    int deactivateByEmployeeId(@Param("employeeId") Integer employeeId);
}
