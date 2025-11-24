package com.dental.clinic.management.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Public Service API (no authentication required)
 * Only includes essential fields for displaying price list
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicServiceDTO {

    private String serviceName;
    private BigDecimal price;

    /**
     * Nested Brief version of ServiceCategory for public API
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryBrief {
        private String categoryName;
    }
}
