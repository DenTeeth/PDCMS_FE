package com.dental.clinic.management.employee.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.dental.clinic.management.employee.domain.Employee;

/**
 * Spring Data JPA repository for the {@link Employee} entity.
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findOneByEmployeeCode(String employeeCode);

    Optional<Employee> findByEmployeeCodeAndIsActiveTrue(String employeeCode);

    boolean existsByEmployeeCode(String employeeCode);

    Optional<Employee> findOneByAccountAccountId(Integer accountId);

    /**
     * Find employee by account username.
     * Used for owner validation and getting current employee info from JWT token.
     *
     * @param username Account username from security context
     * @return Optional employee entity
     */
    Optional<Employee> findByAccount_Username(String username);

    /**
     * Check if employee exists by account username.
     *
     * @param username Account username
     * @return True if exists
     */
    boolean existsByAccount_Username(String username);

    /**
     * Find all active employees.
     * Used for annual leave balance reset.
     *
     * @return List of active employees
     */
    List<Employee> findByIsActiveTrue();

    /**
     * Find all inactive employees.
     * Used by Job P3 (CleanupInactiveEmployeeRegistrationsJob) to cleanup registrations.
     *
     * @return List of inactive employees
     */
    List<Employee> findByIsActiveFalse();

    /**
     * Find employees by employment type and active status.
     * Used by scheduled jobs to create shifts.
     *
     * @param employmentType Employment type (FULL_TIME or PART_TIME)
     * @param isActive       Active status
     * @return List of matching employees
     */
    List<Employee> findByEmploymentTypeAndIsActive(
            com.dental.clinic.management.employee.enums.EmploymentType employmentType,
            Boolean isActive);

    /**
     * Find all active employee IDs.
     * Used for annual leave balance reset.
     *
     * @return List of employee IDs
     */
    @Query("SELECT e.employeeId FROM Employee e WHERE e.isActive = true")
    List<Integer> findAllActiveEmployeeIds();

    /**
     * Find ACTIVE employees who have STANDARD specialization (medical staff only)
     * STANDARD (ID 8) = General healthcare workers baseline
     * This excludes Admin/Receptionist who don't have STANDARD specialization
     * Used for appointment doctor/participant selection
     *
     * @return List of employees with STANDARD specialization
     */
    @Query("SELECT DISTINCT e FROM Employee e " +
            "LEFT JOIN FETCH e.specializations s " +
            "WHERE e.isActive = true " +
            "AND EXISTS (SELECT 1 FROM e.specializations es WHERE es.specializationId = 8) " +
            "ORDER BY e.employeeCode ASC")
    List<Employee> findActiveEmployeesWithSpecializations();

    /**
     * Check if employee has STANDARD specialization (ID 8) - is medical staff
     * Medical staff MUST have STANDARD (ID 8) as baseline qualification
     *
     * @param employeeId Employee ID
     * @return True if employee has STANDARD specialization (ID 8)
     */
    @Query("SELECT CASE WHEN COUNT(es) > 0 THEN true ELSE false END " +
            "FROM Employee e JOIN e.specializations es " +
            "WHERE e.employeeId = :employeeId " +
            "AND es.specializationId = 8")
    boolean hasSpecializations(@org.springframework.data.repository.query.Param("employeeId") Integer employeeId);
}
