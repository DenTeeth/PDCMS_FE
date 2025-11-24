package com.dental.clinic.management.working_schedule.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.dental.clinic.management.working_schedule.domain.TimeOffType;

import java.util.List;
import java.util.Optional;

/**
 * Repository for TimeOffType entity
 */
@Repository
public interface TimeOffTypeRepository extends JpaRepository<TimeOffType, String> {

    /**
     * Find time-off type by type_id
     */
    Optional<TimeOffType> findByTypeId(String typeId);

    /**
     * Find time-off type by type code (ANNUAL_LEAVE, SICK_LEAVE, etc.)
     */
    Optional<TimeOffType> findByTypeCode(String typeCode);

    /**
     * Check if type code exists (for unique validation)
     */
    boolean existsByTypeCode(String typeCode);

    /**
     * Check if type code exists excluding specific type_id (for update validation)
     */
    boolean existsByTypeCodeAndTypeIdNot(String typeCode, String typeId);

    /**
     * Find time-off type by type_id and is_active
     */
    Optional<TimeOffType> findByTypeIdAndIsActive(String typeId, Boolean isActive);

    /**
     * Find all active time-off types
     */
    List<TimeOffType> findByIsActiveTrue();

    /**
     * Find all active time-off types that require balance tracking
     */
    List<TimeOffType> findByIsActiveTrueAndRequiresBalanceTrue();

    /**
     * Find all time-off types filtered by active status
     */
    List<TimeOffType> findByIsActive(Boolean isActive);

    /**
     * Find all time-off types filtered by paid status
     */
    List<TimeOffType> findByIsPaid(Boolean isPaid);

    /**
     * Find all time-off types filtered by both active and paid status
     */
    List<TimeOffType> findByIsActiveAndIsPaid(Boolean isActive, Boolean isPaid);
}
