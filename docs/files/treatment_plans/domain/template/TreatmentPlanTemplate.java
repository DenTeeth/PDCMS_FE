package com.dental.clinic.management.treatment_plans.domain.template;

import com.dental.clinic.management.specialization.domain.Specialization;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Treatment Plan Template (Gói mẫu điều trị).
 * Represents a pre-defined treatment plan package that can be used to create
 * patient plans.
 * Examples: "Niềng răng mắc cài kim loại 2 năm", "Implant Osstem trọn gói"
 *
 * V19 Changes:
 * - Added estimatedDurationDays field for calculating expected_end_date when
 * creating patient plans
 */
@Entity
@Table(name = "treatment_plan_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreatmentPlanTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id")
    private Long templateId;

    /**
     * Unique template code (e.g., TPL_ORTHO_METAL, TPL_IMPLANT_OSSTEM)
     */
    @Column(name = "template_code", nullable = false, unique = true, length = 50)
    private String templateCode;

    /**
     * Name of the template package
     * Example: "Niềng răng mắc cài kim loại trọn gói 2 năm"
     */
    @Column(name = "template_name", nullable = false)
    private String templateName;

    /**
     * Description of the treatment package
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Estimated duration in days (e.g., 730 for 2 years, 180 for 6 months)
     * Used to calculate expected_end_date = start_date + estimated_duration_days
     *
     * V19: Added for API 5.3 - Create Treatment Plan from Template
     */
    @Column(name = "estimated_duration_days")
    private Integer estimatedDurationDays;

    /**
     * Total price of the package
     * This is the sum of all services in all phases (calculated)
     */
    @Column(name = "total_price", precision = 12, scale = 2)
    private BigDecimal totalPrice;

    /**
     * Specialization this template belongs to (V19)
     * Example: "Gói Niềng Răng" → specialization_id = 1 (Chỉnh nha)
     *
     * Why NOT inferred from services:
     * 1. Business clarity: Template IS a specialization-level concept
     * 2. Performance: Filtering templates by specialization (indexed)
     * 3. Avoid logic conflict: Template may contain services from multiple
     * specializations
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialization_id")
    private Specialization specialization;

    /**
     * Whether this template is active/available for use
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Phases in this template (ordered by phase_number)
     * Example: Phase 1 - Preparation, Phase 2 - Installation, Phase 3 - Adjustment
     * (24 months)
     */
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("phaseNumber ASC")
    @Builder.Default
    private List<TemplatePhase> templatePhases = new ArrayList<>();

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
    public void addPhase(TemplatePhase phase) {
        templatePhases.add(phase);
        phase.setTemplate(this);
    }

    public void removePhase(TemplatePhase phase) {
        templatePhases.remove(phase);
        phase.setTemplate(null);
    }
}
