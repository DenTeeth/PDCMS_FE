package com.dental.clinic.management.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for Internal Service API (authentication required)
 * Includes technical fields needed for booking operations
 * V21: Added bundlesWith field for clinical rule suggestions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalServiceDTO {

    private Long serviceId;
    private String serviceCode;
    private String serviceName;
    private BigDecimal price;
    private Integer durationMinutes;

    /**
     * V21: List of service codes that bundle well with this service
     * Based on BUNDLES_WITH clinical rules (soft suggestions)
     */
    private List<String> bundlesWith;

    /**
     * Nested category info for internal API
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryInfo {
        private Long categoryId;
        private String categoryCode;
        private String categoryName;
    }
}
