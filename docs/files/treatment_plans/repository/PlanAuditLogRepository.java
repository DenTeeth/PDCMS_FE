package com.dental.clinic.management.treatment_plans.repository;

import com.dental.clinic.management.treatment_plans.domain.PlanAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for PlanAuditLog entity.
 * Provides data access for treatment plan audit logs.
 */
@Repository
public interface PlanAuditLogRepository extends JpaRepository<PlanAuditLog, Long> {

    /**
     * Find all audit logs for a specific treatment plan, ordered by created_at DESC
     */
    @Query("SELECT l FROM PlanAuditLog l " +
            "WHERE l.treatmentPlan.planId = :planId " +
            "ORDER BY l.createdAt DESC")
    List<PlanAuditLog> findByPlanIdOrderByCreatedAtDesc(@Param("planId") Long planId);

    /**
     * Find audit logs by action type
     */
    List<PlanAuditLog> findByActionType(String actionType);

    /**
     * Find audit logs by performer (employee)
     */
    @Query("SELECT l FROM PlanAuditLog l " +
            "WHERE l.performedBy.employeeId = :employeeId " +
            "ORDER BY l.createdAt DESC")
    List<PlanAuditLog> findByPerformedByEmployeeId(@Param("employeeId") Long employeeId);
}
