package com.dental.clinic.management.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Internal Service API (authentication required)
 * Includes technical fields needed for booking operations
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
