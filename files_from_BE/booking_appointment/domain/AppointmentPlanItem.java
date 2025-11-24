package com.dental.clinic.management.booking_appointment.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Patient Plan Item Entity (Treatment Plan Integration - Minimal Version)
 *
 * Purpose: Hạng mục công việc trong lộ trình điều trị của bệnh nhân
 * Example: "Lần 3/24: Siết niềng"
 *
 * NOTE: This is a minimal entity for AppointmentCreationService validation only.
 * Full Treatment Plan module with GET APIs will be implemented separately.
 *
 * RENAMED to AppointmentPlanItem to avoid conflict with treatment_plans.domain.PatientPlanItem
 */
@Entity(name = "AppointmentPlanItem")
@Table(name = "patient_plan_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long itemId;

    /**
     * Reference to patient_plan_phases table
     * Used to check ownership: item.phase.plan.patientId
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phase_id", nullable = false)
    private PatientPlanPhase phase;

    /**
     * Reference to services table
     * Used to extract serviceId for appointment_services table
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private DentalService service;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    /**
     * Status flow: READY_FOR_BOOKING → SCHEDULED → IN_PROGRESS → COMPLETED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private PlanItemStatus status;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "estimated_time_minutes")
    private Integer estimatedTimeMinutes;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Status enum for patient plan items
     */
    public enum PlanItemStatus {
        READY_FOR_BOOKING, // Sẵn sàng đặt lịch
        SCHEDULED,         // Đã đặt lịch hẹn
        IN_PROGRESS,       // Đang thực hiện
        COMPLETED          // Hoàn thành
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = PlanItemStatus.READY_FOR_BOOKING;
        }
    }
}
