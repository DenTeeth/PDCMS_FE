package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.HolidayDate;
import com.dental.clinic.management.working_schedule.domain.HolidayDateId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository for HolidayDate entity.
 * Uses composite key (HolidayDateId) instead of Long.
 */
@Repository
public interface HolidayDateRepository extends JpaRepository<HolidayDate, HolidayDateId> {

    /**
     * Find all holidays for a specific definition.
     *
     * @param definitionId the holiday definition ID
     * @return list of holiday dates
     */
    List<HolidayDate> findByDefinitionId(String definitionId);

    /**
     * Find all holidays within a date range.
     *
     * @param startDate start date (inclusive)
     * @param endDate   end date (inclusive)
     * @return list of holidays
     */
    @Query("SELECT hd FROM HolidayDate hd " +
            "WHERE hd.holidayDate BETWEEN :startDate AND :endDate " +
            "ORDER BY hd.holidayDate ASC")
    List<HolidayDate> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Check if a specific date is a holiday.
     *
     * @param date the date to check
     * @return true if the date is a holiday
     */
    @Query("SELECT COUNT(hd) > 0 FROM HolidayDate hd WHERE hd.holidayDate = :date")
    boolean isHoliday(@Param("date") LocalDate date);

    /**
     * Get all holiday dates within a range (for efficient checking).
     *
     * @param startDate start date
     * @param endDate   end date
     * @return list of holiday dates
     */
    @Query("SELECT hd.holidayDate FROM HolidayDate hd " +
            "WHERE hd.holidayDate BETWEEN :startDate AND :endDate")
    List<LocalDate> findHolidayDatesByRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
