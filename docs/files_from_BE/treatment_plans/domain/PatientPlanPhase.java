package com.dental.clinic.management.treatment_plans.domain;

import com.dental.clinic.management.treatment_plans.enums.PhaseStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Phase of a treatment plan (Giai đoạn).
 * Each plan is divided into multiple phases.
 * Example: Phase 1 - Preparation, Phase 2 - Installation, Phase 3 - Adjustment
 */
@Entity
@Table(name = "patient_plan_phases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientPlanPhase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "patient_phase_id")
    private Long patientPhaseId;

    /**
     * Parent treatment plan
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PatientTreatmentPlan treatmentPlan;

    /**
     * Phase number (1, 2, 3, ...)
     */
    @Column(name = "phase_number", nullable = false)
    private Integer phaseNumber;

    /**
     * Name of this phase
     */
    @Column(name = "phase_name", nullable = false)
    private String phaseName;

    /**
     * Status of this phase
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private PhaseStatus status;

    /**
     * Start date of this phase
     */
    @Column(name = "start_date")
    private LocalDate startDate;

    /**
     * Completion date
     */
    @Column(name = "completion_date")
    private LocalDate completionDate;

    /**
     * Estimated duration in days (V19).
     * Used for timeline calculation.
     */
    @Column(name = "estimated_duration_days")
    private Integer estimatedDurationDays;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Items (tasks/checklist) in this phase
     */
    @OneToMany(mappedBy = "phase", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PatientPlanItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = PhaseStatus.PENDING;
        }
    }
}
