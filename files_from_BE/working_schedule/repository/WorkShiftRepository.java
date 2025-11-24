package com.dental.clinic.management.working_schedule.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.dental.clinic.management.working_schedule.domain.WorkShift;
import com.dental.clinic.management.working_schedule.enums.WorkShiftCategory;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for WorkShift entity.
 * Extended with JpaSpecificationExecutor for dynamic queries.
 */
@Repository
public interface WorkShiftRepository extends JpaRepository<WorkShift, String>, JpaSpecificationExecutor<WorkShift> {

    /**
     * Find all work shifts by active status.
     * @param isActive true to find active shifts, false for inactive
     * @return List of work shifts matching the status
     */
    List<WorkShift> findByIsActive(Boolean isActive);

    /**
     * Find all work shifts by category.
     * @param category NORMAL or NIGHT category
     * @return List of work shifts matching the category
     */
    List<WorkShift> findByCategory(WorkShiftCategory category);

    /**
     * Find work shifts by shift name containing keyword (case-insensitive).
     * @param keyword Search keyword
     * @return List of matching work shifts
     */
    List<WorkShift> findByShiftNameContainingIgnoreCase(String keyword);

    /**
     * Check if a work shift ID already exists.
     * @param workShiftId the work shift ID to check
     * @return true if exists, false otherwise
     */
    boolean existsByWorkShiftId(String workShiftId);

    /**
     * Find active work shift by ID.
     * @param workShiftId the work shift ID
     * @return Optional containing the work shift if found and active
     */
    Optional<WorkShift> findByWorkShiftIdAndIsActive(String workShiftId, Boolean isActive);

    /**
     * Find all work shifts with IDs starting with a specific prefix.
     * Used to determine the next sequence number.
     * @param prefix ID prefix (e.g., "WKS_MORNING_")
     * @return List of work shifts with matching prefix
     */
    List<WorkShift> findByWorkShiftIdStartingWith(String prefix);

    /**
     * Find work shifts by shift name and active status.
     * Used for duplicate name validation.
     * @param shiftName the shift name to check
     * @param isActive the active status
     * @return List of work shifts matching the criteria
     */
    List<WorkShift> findByShiftNameAndIsActive(String shiftName, Boolean isActive);
}
