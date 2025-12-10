package com.dental.clinic.management.treatment_plans.domain;

import com.dental.clinic.management.employee.domain.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Plan Audit Log (V20) - Lịch sử duyệt Lộ trình điều trị.
 * Tracks all approval/rejection actions on treatment plans for compliance and
 * audit trail.
 */
@Entity
@Table(name = "plan_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    /**
     * Treatment plan being audited
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PatientTreatmentPlan treatmentPlan;

    /**
     * Action type: APPROVED, REJECTED, SUBMITTED_FOR_REVIEW
     */
    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    /**
     * Employee who performed the action (Manager/Doctor)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by", nullable = false)
    private Employee performedBy;

    /**
     * Notes/reason for the action (mandatory for rejection)
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * Previous approval status before this action
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "old_approval_status", length = 20)
    private ApprovalStatus oldApprovalStatus;

    /**
     * New approval status after this action
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "new_approval_status", length = 20)
    private ApprovalStatus newApprovalStatus;

    /**
     * Timestamp when action was performed
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Static factory method for creating audit log for approval action
     */
    public static PlanAuditLog createApprovalLog(
            PatientTreatmentPlan plan,
            Employee manager,
            ApprovalStatus oldStatus,
            ApprovalStatus newStatus,
            String notes) {

        String actionType = determineActionType(newStatus);

        return PlanAuditLog.builder()
                .treatmentPlan(plan)
                .performedBy(manager)
                .actionType(actionType)
                .oldApprovalStatus(oldStatus)
                .newApprovalStatus(newStatus)
                .notes(notes)
                .build();
    }

    /**
     * Determine action type based on new approval status
     */
    private static String determineActionType(ApprovalStatus newStatus) {
        return switch (newStatus) {
            case APPROVED -> "APPROVED";
            case REJECTED -> "REJECTED";
            case PENDING_REVIEW -> "SUBMITTED_FOR_REVIEW";
            case DRAFT -> "RETURNED_TO_DRAFT";
        };
    }
}
