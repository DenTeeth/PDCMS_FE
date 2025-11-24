package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.EmployeeLeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeLeaveBalanceRepository extends JpaRepository<EmployeeLeaveBalance, Long> {

    @Query("SELECT b FROM EmployeeLeaveBalance b WHERE b.employeeId = :employeeId AND b.timeOffTypeId = :timeOffTypeId AND b.year = :year")
    Optional<EmployeeLeaveBalance> findByEmployeeIdAndTimeOffTypeIdAndYear(
            @Param("employeeId") Integer employeeId, 
            @Param("timeOffTypeId") String timeOffTypeId, 
            @Param("year") Integer year);

    List<EmployeeLeaveBalance> findByEmployeeIdAndYear(Integer employeeId, Integer year);

    // For admin dashboard - get all balances in a year
    List<EmployeeLeaveBalance> findByYear(Integer year);

    // For admin dashboard - get all balances in a year for a specific type
    List<EmployeeLeaveBalance> findByYearAndTimeOffTypeId(Integer year, String timeOffTypeId);

    @Query("SELECT b FROM EmployeeLeaveBalance b WHERE b.year = :year")
    List<EmployeeLeaveBalance> findAllByYear(@Param("year") Integer year);

    boolean existsByEmployeeIdAndTimeOffTypeIdAndYear(
            Integer employeeId, String timeOffTypeId, Integer year);
}
