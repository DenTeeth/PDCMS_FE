package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.HolidayDefinition;
import com.dental.clinic.management.working_schedule.enums.HolidayType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for HolidayDefinition entity.
 */
@Repository
public interface HolidayDefinitionRepository extends JpaRepository<HolidayDefinition, String> {

    /**
     * Find holiday definition by name.
     */
    Optional<HolidayDefinition> findByHolidayName(String holidayName);

    /**
     * Find all holiday definitions by type.
     */
    List<HolidayDefinition> findByHolidayType(HolidayType holidayType);

    /**
     * Check if a holiday definition exists by name.
     */
    boolean existsByHolidayName(String holidayName);

    /**
     * Find all definitions with their dates count.
     */
    @Query("SELECT hd FROM HolidayDefinition hd LEFT JOIN FETCH hd.holidayDates ORDER BY hd.holidayName ASC")
    List<HolidayDefinition> findAllWithDates();
}
