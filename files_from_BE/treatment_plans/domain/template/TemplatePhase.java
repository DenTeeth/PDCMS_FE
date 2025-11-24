package com.dental.clinic.management.treatment_plans.domain.template;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Template Phase (Giai đoạn trong gói mẫu).
 * Represents a phase/stage in a treatment plan template.
 * Example: "Giai đoạn 1: Khám & Chuẩn bị", "Giai đoạn 2: Gắn mắc cài"
 */
@Entity
@Table(name = "template_phases", uniqueConstraints = {
    @UniqueConstraint(name = "uk_template_phase_number", columnNames = {"template_id", "phase_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplatePhase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "phase_id")
    private Long phaseId;

    /**
     * Parent template
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private TreatmentPlanTemplate template;

    /**
     * Phase number/step order (1, 2, 3, ...)
     * This determines the sequence of phases
     */
    @Column(name = "phase_number", nullable = false)
    private Integer phaseNumber;

    /**
     * Name of this phase
     * Example: "Giai đoạn 1: Khám & Chuẩn bị"
     */
    @Column(name = "phase_name", nullable = false)
    private String phaseName;

    /**
     * Estimated duration for this phase in days
     * Example: Phase 1 might be 14 days, Phase 2 might be 1 day, Phase 3 might be 700 days
     */
    @Column(name = "estimated_duration_days")
    private Integer estimatedDurationDays;

    /**
     * Services included in this phase
     * Example: Phase 1 might include "Consultation", "X-Ray", "Scaling"
     */
    @OneToMany(mappedBy = "templatePhase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sequenceNumber ASC") // V19: Order by sequence_number for correct item creation order
    @Builder.Default
    private List<TemplatePhaseService> phaseServices = new ArrayList<>();

    // Audit fields
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Helper methods
    public void addPhaseService(TemplatePhaseService service) {
        phaseServices.add(service);
        service.setTemplatePhase(this);
    }

    public void removePhaseService(TemplatePhaseService service) {
        phaseServices.remove(service);
        service.setTemplatePhase(null);
    }
}
