package com.dental.clinic.management.working_schedule.domain;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.utils.IdGenerator;
import com.dental.clinic.management.working_schedule.enums.RenewalStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity representing a shift renewal request for employees with FIXED shift
 * registrations.
 * Applies to: FULL_TIME and PART_TIME_FIXED employees.
 *
 * When a fixed_shift_registration is about to expire (effective_to sắp đến),
 * Job P8 automatically creates a renewal request inviting the employee to
 * extend.
 *
 * Employee can respond via API P7:
 * - CONFIRMED: System deactivates old registration and creates new one (audit
 * trail)
 * - DECLINED: Must provide decline_reason
 *
 * ID Format: SRR_YYYYMMDD_XXXXX (e.g., SRR_20251022_00001)
 * - SRR: Shift Renewal Request prefix
 * - YYYYMMDD: Creation date (8 digits)
 * - XXXXX: Daily sequence (00001-99999)
 */
@Entity
@Table(name = "shift_renewal_requests", indexes = {
        @Index(name = "idx_renewal_employee_status", columnList = "employee_id, status"),
        @Index(name = "idx_renewal_expires_at", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShiftRenewalRequest {

    private static final String ID_PREFIX = "SRR";
    private static IdGenerator idGenerator;

    /**
     * Set the IdGenerator for this entity (called by EntityIdGeneratorConfig).
     */
    public static void setIdGenerator(IdGenerator generator) {
        idGenerator = generator;
    }

    @Id
    @Column(name = "renewal_id", length = 20)
    @NotBlank(message = "Renewal ID is required")
    @Size(max = 20, message = "Renewal ID must not exceed 20 characters")
    private String renewalId; // Format: SRR_YYYYMMDD_XXXXX (e.g., SRR_20251022_00001)

    /**
     * Changed from EmployeeShiftRegistration to FixedShiftRegistration.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expiring_registration_id", nullable = false)
    @NotNull(message = "Expiring registration is required")
    private FixedShiftRegistration expiringRegistration;

    /**
     * The employee who needs to respond to this renewal.
     * Must be FULL_TIME or PART_TIME_FIXED (NOT PART_TIME_FLEX).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @NotNull(message = "Employee is required")
    private Employee employee;

    /**
     * Current status of the renewal request.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull(message = "Status is required")
    private RenewalStatus status = RenewalStatus.PENDING_ACTION;

    /**
     * Timestamp when this renewal invitation expires (deadline to respond).
     * After this time, employee can no longer respond.
     * Usually set to 14 days before effective_to.
     */
    @Column(name = "expires_at", nullable = false)
    @NotNull(message = "Expiry time is required")
    private LocalDateTime expiresAt;

    /**
     * Required when status = DECLINED.
     * NULL when status = PENDING_ACTION or CONFIRMED.
     */
    @Column(name = "decline_reason", columnDefinition = "TEXT")
    private String declineReason;

    /**
     * Timestamp when employee confirmed or declined the renewal.
     */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    /**
     * Timestamp when the renewal request was created.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the renewal request was last updated.
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Pre-persist hook to set timestamps and generate ID.
     */
    @PrePersist
    protected void onCreate() {
        if (renewalId == null && idGenerator != null) {
            renewalId = idGenerator.generateId(ID_PREFIX);
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = RenewalStatus.PENDING_ACTION;
        }
    }

    /**
     * Pre-update hook to set the update timestamp.
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Check if the renewal is still pending.
     *
     * @return true if status is PENDING_ACTION
     */
    @Transient
    public boolean isPending() {
        return status == RenewalStatus.PENDING_ACTION;
    }

    /**
     * Check if the renewal was confirmed.
     *
     * @return true if status is CONFIRMED
     */
    @Transient
    public boolean isConfirmed() {
        return status == RenewalStatus.CONFIRMED;
    }

    /**
     * Check if the renewal was declined.
     *
     * @return true if status is DECLINED
     */
    @Transient
    public boolean isDeclined() {
        return status == RenewalStatus.DECLINED;
    }

    /**
     * Check if the renewal has expired.
     *
     * @return true if expires_at is in the past
     */
    @Transient
    public boolean isExpired() {
        return status == RenewalStatus.EXPIRED ||
                (expiresAt != null && LocalDateTime.now().isAfter(expiresAt));
    }

    /**
     * Check if employee can still respond to this renewal.
     *
     * @return true if status is PENDING_ACTION and not expired
     */
    @Transient
    public boolean canRespond() {
        return isPending() && !isExpired();
    }

    /**
     * Check if this renewal belongs to a specific employee.
     *
     * @param employeeId the employee ID to check
     * @return true if the employee is the owner
     */
    @Transient
    public boolean isOwnedBy(Integer employeeId) {
        return employee != null && employee.getEmployeeId().equals(employeeId);
    }
}
