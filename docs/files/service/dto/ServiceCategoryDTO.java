package com.dental.clinic.management.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Service Category response
 * Used in API responses for category information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategoryDTO {

    private Long categoryId;
    private String categoryCode;
    private String categoryName;
    private Integer displayOrder;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Simplified version for public APIs (no technical fields)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Brief {
        private Long categoryId;
        private String categoryCode;
        private String categoryName;
        private Integer displayOrder;
    }
}
