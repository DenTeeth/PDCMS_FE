package com.dental.clinic.management.treatment_plans.domain;

import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Item in a treatment plan phase (Hạng mục công việc/Checklist).
 * Represents a specific task or service to be performed.
 * Each item can be linked to an appointment when scheduled.
 */
@Entity
@Table(name = "patient_plan_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long itemId;

    /**
     * Parent phase
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phase_id", nullable = false)
    private PatientPlanPhase phase;

    /**
     * Service ID from services table
     */
    @Column(name = "service_id", nullable = false)
    private Integer serviceId;

    /**
     * Sequence number within the phase (1, 2, 3, ...)
     */
    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    /**
     * Name of the item/task
     */
    @Column(name = "item_name", nullable = false)
    private String itemName;

    /**
     * Status of this item
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private PlanItemStatus status;

    /**
     * Estimated time in minutes
     */
    @Column(name = "estimated_time_minutes")
    private Integer estimatedTimeMinutes;

    /**
     * Price for this item
     */
    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * V21.4: Who updated the price (Finance/Accounting)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "price_updated_by")
    private com.dental.clinic.management.employee.domain.Employee priceUpdatedBy;

    /**
     * V21.4: When the price was updated
     */
    @Column(name = "price_updated_at")
    private LocalDateTime priceUpdatedAt;

    /**
     * V21.4: Reason for price update
     */
    @Column(name = "price_update_reason", length = 500)
    private String priceUpdateReason;

    /**
     * V32: Doctor assigned to perform this specific item
     * Allows different doctors for different items within same plan/phase
     * Can be updated when scheduling appointments or reorganizing phases
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_doctor_id")
    private com.dental.clinic.management.employee.domain.Employee assignedDoctor;

    /**
     * When this item was completed
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = PlanItemStatus.READY_FOR_BOOKING;
        }
    }
}
