package com.dental.clinic.management.working_schedule.domain;

import com.dental.clinic.management.working_schedule.enums.RegistrationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Column;
import jakarta.persistence.Version;

/**
 * Entity for part_time_registrations table.
 * Represents a PART_TIME_FLEX employee's registration request for a flexible slot.
 * 
 * NEW SPECIFICATION (Approval Workflow):
 * - status: PENDING (waiting approval), APPROVED (can work), REJECTED (denied)
 * - Employee submits request with flexible effectiveFrom/effectiveTo
 * - Manager approves/rejects based on quota availability
 * - Only APPROVED registrations count toward quota
 */
@Entity
@Table(name = "part_time_registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartTimeRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registration_id")
    private Integer registrationId;

    @Column(name = "employee_id", nullable = false)
    private Integer employeeId;

    @Column(name = "part_time_slot_id", nullable = false)
    private Long partTimeSlotId;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to", nullable = false)
    private LocalDate effectiveTo;

    /**
     * Registration status: PENDING, APPROVED, REJECTED
     * Only APPROVED registrations count toward quota.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.PENDING;

    /**
     * Reason for rejection (required if status = REJECTED).
     * Example: "Không đủ nhân sự trong thời gian này"
     */
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    /**
     * Manager who processed (approved/rejected) this registration.
     */
    @Column(name = "processed_by")
    private Integer processedBy;

    /**
     * When the registration was processed (approved/rejected).
     */
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    /**
     * Soft delete flag (for cancellations).
     * Note: Cancelled registrations still keep their status (APPROVED/PENDING).
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Optimistic locking version to protect concurrent approval flows from overbooking.
     * This is a simple optimistic lock; the approval flow will retry on optimistic locking failures.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    /**
     * Optional: explicit per-day selections for this registration.
     * If present, these are the exact dates the employee wants to work and
     * will be stored in `part_time_registration_dates` table. If empty/null,
     * the legacy range (effectiveFrom..effectiveTo) semantics apply.
     */
    @ElementCollection
    @CollectionTable(name = "part_time_registration_dates", joinColumns = @JoinColumn(name = "registration_id"))
    @Column(name = "registered_date")
    private Set<LocalDate> requestedDates;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
