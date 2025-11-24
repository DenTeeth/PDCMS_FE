package com.dental.clinic.management.working_schedule.domain;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.working_schedule.enums.ShiftSource;
import com.dental.clinic.management.working_schedule.enums.ShiftStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing an actual scheduled shift for an employee.
 * This is the final schedule after registration/approval.
 *
 * Created by:
 * - Batch job (monthly for full-time, weekly for part-time)
 * - Manual scheduling by admin
 * - Approved overtime requests
 */
@Entity
@Table(name = "employee_shifts", indexes = {
        @Index(name = "idx_employee_workdate", columnList = "employee_id, work_date"),
        @Index(name = "idx_workdate_status", columnList = "work_date, status")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_employee_date_shift", columnNames = { "employee_id", "work_date",
                "work_shift_id" })
})
@org.hibernate.annotations.Check(constraints = "source IN ('BATCH_JOB', 'REGISTRATION_JOB', 'OT_APPROVAL', 'MANUAL_ENTRY')")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeShift {

    /**
     * Primary key with custom format: EMSyyMMddSEQ (e.g., EMS251029001)
     * Generated via service layer, not by database.
     */
    @Id
    @Column(name = "employee_shift_id", length = 20, nullable = false)
    private String employeeShiftId;

    /**
     * The employee assigned to this shift.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @NotNull(message = "Employee is required")
    private Employee employee;

    /**
     * The work date for this shift.
     */
    @Column(name = "work_date", nullable = false)
    @NotNull(message = "Work date is required")
    private LocalDate workDate;

    /**
     * The work shift template (e.g., WKS_MORNING_01, WKS_AFTERNOON_01).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_shift_id", nullable = false)
    @NotNull(message = "Work shift is required")
    private WorkShift workShift;

    /**
     * Indicates if this is an overtime shift.
     * Affects salary calculation.
     */
    @Column(name = "is_overtime", nullable = false)
    @NotNull(message = "Overtime flag is required")
    private Boolean isOvertime = false;

    /**
     * Current status of the shift.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull(message = "Status is required")
    private ShiftStatus status = ShiftStatus.SCHEDULED;

    /**
     * Source of this shift (how it was created).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    @NotNull(message = "Source is required")
    private ShiftSource source;

    /**
     * Reference to overtime request if this shift was created from OT approval.
     * Foreign key to overtime_requests.request_id.
     */
    @Column(name = "source_ot_request_id", length = 20)
    private String sourceOtRequestId;

    /**
     * Reference to time-off request if this shift status was changed to ON_LEAVE.
     * Foreign key to time_off_requests.request_id.
     */
    @Column(name = "source_off_request_id", length = 20)
    private String sourceOffRequestId;
    
    /**
     * Reference to registration ID if this shift was created from registration approval.
     * Links to part_time_registrations.registration_id or fixed_shift_registrations.registration_id.
     * Used for tracking and backfill operations.
     */
    @Column(name = "source_registration_id")
    private Long sourceRegistrationId;

    /**
     * ID of the employee (admin/manager) who created this shift manually.
     * Only populated when source = MANUAL_ENTRY.
     */
    @Column(name = "created_by")
    private Integer createdBy;

    /**
     * Notes about this shift.
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * Timestamp when the shift was created.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the shift was last updated.
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ShiftStatus.SCHEDULED;
        }
        if (isOvertime == null) {
            isOvertime = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
