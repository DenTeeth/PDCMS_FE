package com.dental.clinic.management.booking_appointment.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Patient Treatment Plan Entity (Treatment Plan Integration - Minimal Version)
 *
 * Purpose: Hợp đồng điều trị thực tế của bệnh nhân
 * Example: "PLAN-20251107-001: Niềng răng mắc cài kim loại trọn gói 2 năm"
 *
 * NOTE: This is a minimal entity for PatientPlanItem ownership validation only.
 * Full Treatment Plan module with GET APIs will be implemented separately.
 */
@Entity(name = "AppointmentTreatmentPlan")
@Table(name = "patient_treatment_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientTreatmentPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long planId;

    /**
     * Patient ID for ownership validation
     * CRITICAL: Used to check if items belong to patient in appointment request
     */
    @Column(name = "patient_id", nullable = false)
    private Integer patientId;

    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "plan_code", unique = true, nullable = false, length = 50)
    private String planCode;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "expected_end_date")
    private LocalDate expectedEndDate;

    @Column(name = "total_price", precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private PlanStatus status;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Status enum for patient treatment plans
     */
    public enum PlanStatus {
        IN_PROGRESS, // Đang điều trị
        COMPLETED,   // Hoàn thành
        CANCELLED    // Hủy bỏ
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = PlanStatus.IN_PROGRESS;
        }
    }
}
