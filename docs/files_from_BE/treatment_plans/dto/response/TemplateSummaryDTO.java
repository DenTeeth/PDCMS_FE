package com.dental.clinic.management.treatment_plans.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for API 6.6 - List Treatment Plan Templates.
 *
 * Lightweight summary DTO for listing templates (không bao gồm phases/services
 * detail).
 * Dùng cho dropdown chọn template hoặc danh sách template management.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateSummaryDTO {

    /**
     * Template ID (PK)
     */
    private Long templateId;

    /**
     * Template code (unique identifier)
     * Example: "TPL_ORTHO_METAL", "TPL_IMPLANT_OSSTEM"
     */
    private String templateCode;

    /**
     * Template name
     * Example: "Gói Niềng Răng Mắc Cài Kim Loại (Cơ bản)"
     */
    private String templateName;

    /**
     * Description of the treatment package
     * Example: "Gói điều trị chỉnh nha toàn diện với mắc cài kim loại..."
     */
    private String description;

    /**
     * Estimated total cost (sum of all services in all phases)
     */
    private BigDecimal estimatedTotalCost;

    /**
     * Estimated treatment duration in days
     * Example: 730 (2 years), 180 (6 months)
     */
    private Integer estimatedDurationDays;

    /**
     * Whether template is active/available for use
     */
    private Boolean isActive;

    /**
     * Specialization this template belongs to
     * Example: { id: 1, name: "Chỉnh nha" }
     */
    private SpecializationDTO specialization;

    /**
     * When template was created
     */
    private LocalDateTime createdAt;

    // ===== Inner DTO =====

    /**
     * Specialization information (lightweight)
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
}
