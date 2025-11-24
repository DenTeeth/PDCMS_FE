package com.dental.clinic.management.working_schedule.domain;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.utils.IdGenerator;
import com.dental.clinic.management.working_schedule.enums.RequestStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing an overtime request.
 * Employees can request to work overtime on specific dates and shifts.
 *
 * ID Format: OTRYYMMDDSSS (e.g., OTR251022001)
 * - OTR: Overtime Request prefix (3 chars)
 * - YYMMDD: Date (6 digits) - 251022 = Oct 22, 2025
 * - SSS: Daily sequence (001-999)
 */
@Entity
@Table(name = "overtime_requests", uniqueConstraints = {
        @UniqueConstraint(name = "uk_overtime_employee_date_shift", columnNames = { "employee_id", "work_date",
                "work_shift_id" })
}, indexes = {
        @Index(name = "idx_overtime_employee", columnList = "employee_id"),
        @Index(name = "idx_overtime_status", columnList = "status"),
        @Index(name = "idx_overtime_work_date", columnList = "work_date"),
        @Index(name = "idx_overtime_requested_by", columnList = "requested_by")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeRequest {

    private static final String ID_PREFIX = "OTR";
    private static IdGenerator idGenerator;

    /**
     * Set the IdGenerator for this entity (called by EntityIdGeneratorConfig).
     */
    public static void setIdGenerator(IdGenerator generator) {
        idGenerator = generator;
    }

    @Id
    @Column(name = "request_id", length = 12)
    @NotBlank(message = "Request ID is required")
    @Size(max = 12, message = "Request ID must not exceed 12 characters")
    private String requestId; // Format: OTRYYMMDDSSS (e.g., OTR251022001)

    /**
     * The employee who will work the overtime shift.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @NotNull(message = "Employee is required")
    private Employee employee;

    /**
     * The employee who created/requested the overtime.
     * This can be the employee themselves or their manager.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    @NotNull(message = "Requested by is required")
    private Employee requestedBy;

    /**
     * The date when the overtime work will be performed.
     */
    @Column(name = "work_date", nullable = false)
    @NotNull(message = "Work date is required")
    private LocalDate workDate;

    /**
     * The work shift for the overtime.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_shift_id", nullable = false)
    @NotNull(message = "Work shift is required")
    private WorkShift workShift;

    /**
     * Reason for the overtime request.
     */
    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    @NotBlank(message = "Reason is required")
    private String reason;

    /**
     * Current status of the overtime request.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull(message = "Status is required")
    private RequestStatus status = RequestStatus.PENDING;

    /**
     * The employee who approved or rejected the request.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy;

    /**
     * Timestamp when the request was approved or rejected.
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /**
     * Reason for rejection (required when status = REJECTED).
     */
    @Column(name = "rejected_reason", columnDefinition = "TEXT")
    private String rejectedReason;

    /**
     * Reason for cancellation (required when status = CANCELLED).
     */
    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    /**
     * Timestamp when the request was created.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Pre-persist hook to set the creation timestamp and generate ID.
     */
    @PrePersist
    protected void onCreate() {
        if (requestId == null && idGenerator != null) {
            requestId = idGenerator.generateId(ID_PREFIX);
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = RequestStatus.PENDING;
        }
    }

    /**
     * Check if the request is in PENDING status.
     * 
     * @return true if status is PENDING
     */
    @Transient
    public boolean isPending() {
        return status == RequestStatus.PENDING;
    }

    /**
     * Check if the request has been approved.
     * 
     * @return true if status is APPROVED
     */
    @Transient
    public boolean isApproved() {
        return status == RequestStatus.APPROVED;
    }

    /**
     * Check if the request has been rejected.
     * 
     * @return true if status is REJECTED
     */
    @Transient
    public boolean isRejected() {
        return status == RequestStatus.REJECTED;
    }

    /**
     * Check if the request has been cancelled.
     * 
     * @return true if status is CANCELLED
     */
    @Transient
    public boolean isCancelled() {
        return status == RequestStatus.CANCELLED;
    }

    /**
     * Check if the request can be cancelled by the owner.
     * Only PENDING requests can be cancelled.
     * 
     * @return true if the request can be cancelled
     */
    @Transient
    public boolean canBeCancelled() {
        return isPending();
    }

    /**
     * Check if this employee is the owner of the request.
     * 
     * @param employeeId the employee ID to check
     * @return true if the employee is the owner
     */
    @Transient
    public boolean isOwnedBy(Integer employeeId) {
        return employee != null && employee.getEmployeeId().equals(employeeId);
    }

    /**
     * Check if this employee created the request.
     * 
     * @param employeeId the employee ID to check
     * @return true if the employee created the request
     */
    @Transient
    public boolean isRequestedBy(Integer employeeId) {
        return requestedBy != null && requestedBy.getEmployeeId().equals(employeeId);
    }
}
