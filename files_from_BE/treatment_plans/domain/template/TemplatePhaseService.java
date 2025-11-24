package com.dental.clinic.management.treatment_plans.domain.template;

import com.dental.clinic.management.service.domain.DentalService;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Template Phase Service (Dịch vụ trong giai đoạn của gói mẫu).
 * Represents a service that is part of a template phase.
 *
 * V19 Changes:
 * - Added sequenceNumber field to maintain correct order when creating patient
 * plan items
 * Example: In Phase 1, sequenceNumber ensures "Scaling" (3) happens after
 * "X-Ray" (2) and "Consultation" (1)
 */
@Entity
@Table(name = "template_phase_services", uniqueConstraints = {
        @UniqueConstraint(name = "uk_phase_service", columnNames = { "phase_id", "service_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplatePhaseService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "phase_service_id")
    private Long phaseServiceId;

    /**
     * Parent template phase
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phase_id", nullable = false)
    private TemplatePhase templatePhase;

    /**
     * Service to be performed
     * This is a reference to the master services table
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private DentalService service;

    /**
     * Sequence number for ordering items within a phase
     * Example: In "Phase 1: Khám & Chuẩn bị":
     * - sequenceNumber 1: "Khám tư vấn" (Consultation)
     * - sequenceNumber 2: "Chụp X-quang" (X-Ray)
     * - sequenceNumber 3: "Lấy cao răng" (Scaling)
     *
     * V19: Added for API 5.3 - Create Treatment Plan from Template
     * Purpose: Ensures patient plan items are created in correct clinical order
     * (e.g., must do scaling before installing braces)
     */
    @Column(name = "sequence_number", nullable = false)
    @Builder.Default
    private Integer sequenceNumber = 1;

    /**
     * Quantity of this service (for repeated services like monthly adjustments)
     * Example: "Điều chỉnh định kỳ" might have quantity=8 (for 8 monthly visits)
     *
     * When creating patient plan:
     * - If quantity=1: Create 1 item "Lắp mắc cài"
     * - If quantity=8: Create 8 items "Điều chỉnh lần 1", "Điều chỉnh lần 2", ...,
     * "Điều chỉnh lần 8"
     */
    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    /**
     * Estimated time for ONE instance of this service (in minutes)
     * Example: "Điều chỉnh" might take 30 minutes per visit
     * If quantity=8, total estimated time = 30 * 8 = 240 minutes
     */
    @Column(name = "estimated_time_minutes")
    private Integer estimatedTimeMinutes;

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
}
