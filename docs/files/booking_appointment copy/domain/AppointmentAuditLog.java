package com.dental.clinic.management.booking_appointment.domain;

import com.dental.clinic.management.booking_appointment.enums.AppointmentActionType;
import com.dental.clinic.management.booking_appointment.enums.AppointmentReasonCode;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AppointmentAuditLog Entity
 * Tracks all important changes to appointments
 *
 * Use cases:
 * - CREATE: When appointment is first created
 * - DELAY: Same-day time change
 * - RESCHEDULE_SOURCE: Original appointment being rescheduled
 * - RESCHEDULE_TARGET: New appointment from reschedule
 * - CANCEL: Appointment cancelled
 * - STATUS_CHANGE: Status transitions (CHECKED_IN, IN_PROGRESS, COMPLETED,
 * etc.)
 */
@Entity
@Table(name = "appointment_audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    /**
     * FK to appointments table
     * Mapped through JPA relationship below
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, foreignKey = @ForeignKey(name = "fk_audit_appointment"))
    private Appointment appointment;

    /**
     * FK to employees table - who performed this action
     * NULL if system-generated
     * Mapped through JPA relationship below
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_employee_id", foreignKey = @ForeignKey(name = "fk_audit_employee"))
    private com.dental.clinic.management.employee.domain.Employee performedByEmployee;

    /**
     * Type of action performed
     */
    @Column(name = "action_type", nullable = false, columnDefinition = "appointment_action_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private AppointmentActionType actionType;

    /**
     * Business reason for action (for DELAY, CANCEL, RESCHEDULE)
     * Optional
     */
    @Column(name = "reason_code", columnDefinition = "appointment_reason_code")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private AppointmentReasonCode reasonCode;

    /**
     * Generic old value (for flexible tracking)
     */
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    /**
     * Generic new value
     */
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    /**
     * Old start time (for DELAY, RESCHEDULE tracking)
     */
    @Column(name = "old_start_time")
    private LocalDateTime oldStartTime;

    /**
     * New start time
     */
    @Column(name = "new_start_time")
    private LocalDateTime newStartTime;

    /**
     * Old status (for STATUS_CHANGE tracking)
     */
    @Column(name = "old_status", columnDefinition = "appointment_status_enum")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private AppointmentStatus oldStatus;

    /**
     * New status
     */
    @Column(name = "new_status", columnDefinition = "appointment_status_enum")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private AppointmentStatus newStatus;

    /**
     * Optional notes from person performing action
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * Timestamp of action
     */
    @Column(name = "action_timestamp")
    private LocalDateTime actionTimestamp;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (actionTimestamp == null) {
            actionTimestamp = LocalDateTime.now();
        }
    }
}
