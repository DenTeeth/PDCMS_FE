package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for ItemCategory response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemCategoryResponse {
    private Long categoryId;
    private String categoryCode;
    private String categoryName;
    private String description;
    private Boolean isActive;
}
