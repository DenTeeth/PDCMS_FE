package com.dental.clinic.management.treatment_plans.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for API 5.8 - Get Treatment Plan Template Detail.
 *
 * Returns full template structure including phases and services,
 * for the "Hybrid" workflow (load template → customize → create custom plan).
 *
 * Enhanced with P2 fixes:
 * - Specialization object (not just ID)
 * - Summary metadata (totalPhases, totalItemsInTemplate)
 * - Description field
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetTemplateDetailResponse {

    private Long templateId;
    private String templateCode;
    private String templateName;
    private String description;

    /**
     * Specialization this template belongs to.
     * Example: { id: 1, name: "Chỉnh nha" }
     *
     * Why it's a direct field (NOT inferred from services):
     * 1. Business: Template IS a specialization-level concept
     * 2. Performance: Filtering by specialization (indexed column)
     * 3. Logic: Template may contain services from multiple specializations
     */
    private SpecializationDTO specialization;

    private BigDecimal estimatedTotalCost;
    private Integer estimatedDurationDays;
    private LocalDateTime createdAt;
    private Boolean isActive;

    /**
     * Summary statistics (P2 Enhancement)
     */
    private SummaryDTO summary;

    /**
     * Phases in this template (ordered by phaseNumber/stepOrder)
     */
    private List<PhaseDTO> phases;

    // ===== Inner DTOs =====

    /**
     * Specialization information (P2 Enhancement).
     * Returns { id, name } instead of just id.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SpecializationDTO {
        private Integer id;
        private String name;
    }

    /**
     * Summary metadata (P2 Enhancement).
     * Helps FE display quick stats before rendering full list.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryDTO {
        /**
         * Total number of phases in template
         * Example: 4 (for orthodontic treatment with 4 stages)
         */
        private Integer totalPhases;

        /**
         * Total number of service items (NOT counting quantity expansion)
         * Example: 8 (means 8 different service types)
         *
         * Note: If a service has quantity=24 (like monthly adjustments),
         * it counts as 1 item here. The actual expansion happens during plan creation.
         */
        private Integer totalItemsInTemplate;
    }

    /**
     * Phase information
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PhaseDTO {
        private Long phaseTemplateId;
        private String phaseName;

        /**
         * Step order (user spec calls this "stepOrder")
         * DB column: phase_number
         * This determines the sequence of phases (1, 2, 3, 4, ...)
         */
        private Integer stepOrder;

        /**
         * Services in this phase (ordered by sequenceNumber)
         */
        private List<PhaseServiceDTO> itemsInPhase;
    }

    /**
     * Service item in a phase
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PhaseServiceDTO {
        /**
         * Service code (from master services table)
         * Example: "ORTHO_CONSULT", "FILLING_COMP"
         */
        private String serviceCode;

        /**
         * Service name (from master services table)
         * Example: "Khám & Tư vấn Chỉnh nha"
         */
        private String serviceName;

        /**
         * Price from master services table (NOT snapshot).
         * This is the "giá gốc" that FE can customize.
         *
         * User spec: "Giá gốc từ bảng 'services'"
         */
        private BigDecimal price;

        /**
         * Quantity of this service.
         * Example: 1 for most services, 24 for monthly adjustments.
         *
         * Important: FE will receive this raw quantity.
         * During plan creation (API 5.4), BE will expand into separate items.
         * Example: quantity=24 → create 24 items "Điều chỉnh (Lần 1)", "Điều chỉnh (Lần
         * 2)", ...
         */
        private Integer quantity;

        /**
         * Sequence number for ordering within a phase
         * Example: 1 = Consultation first, 2 = X-Ray second, 3 = Scaling third
         */
        private Integer sequenceNumber;
    }
}
