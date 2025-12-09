package com.dental.clinic.management.booking_appointment.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Patient Plan Phase Entity (Treatment Plan Integration - Minimal Version)
 *
 * Purpose: Giai đoạn trong lộ trình điều trị của bệnh nhân
 * Example: "Giai đoạn 3: Điều chỉnh định kỳ (24 tháng)"
 *
 * NOTE: This is a minimal entity for PatientPlanItem ownership validation only.
 * Full Treatment Plan module with GET APIs will be implemented separately.
 */
@Entity(name = "AppointmentPlanPhase")
@Table(name = "patient_plan_phases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientPlanPhase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "patient_phase_id")
    private Long patientPhaseId;

    /**
     * Reference to patient_treatment_plans table
     * Used for ownership check: item.phase.plan.patientId
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PatientTreatmentPlan plan;

    @Column(name = "phase_number", nullable = false)
    private Integer phaseNumber;

    @Column(name = "phase_name", nullable = false)
    private String phaseName;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private PhaseStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Status enum for patient plan phases
     */
    public enum PhaseStatus {
        PENDING,      // Chưa bắt đầu
        IN_PROGRESS,  // Đang thực hiện
        COMPLETED     // Hoàn thành
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = PhaseStatus.PENDING;
        }
    }
}
