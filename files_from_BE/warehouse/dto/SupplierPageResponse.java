package com.dental.clinic.management.warehouse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Paginated response DTO for supplier list
 * Wraps supplier data with pagination metadata
 * Used in API 6.13: GET /api/v1/warehouse/suppliers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Paginated supplier list response")
public class SupplierPageResponse {

    @Schema(description = "List of suppliers on current page")
    private List<SupplierListDTO> suppliers;

    @Schema(description = "Current page number (0-indexed)", example = "0")
    private Integer currentPage;

    @Schema(description = "Number of items per page", example = "20")
    private Integer pageSize;

    @Schema(description = "Total number of suppliers matching filter", example = "150")
    private Long totalElements;

    @Schema(description = "Total number of pages", example = "8")
    private Integer totalPages;

    @Schema(description = "Is this the first page?", example = "true")
    private Boolean isFirst;

    @Schema(description = "Is this the last page?", example = "false")
    private Boolean isLast;

    @Schema(description = "Does next page exist?", example = "true")
    private Boolean hasNext;

    @Schema(description = "Does previous page exist?", example = "false")
    private Boolean hasPrevious;

    /**
     * Factory method to create response from Spring Data Page
     * 
     * @param page      Spring Data Page object
     * @param suppliers List of SupplierListDTO
     * @return SupplierPageResponse with metadata
     */
    public static SupplierPageResponse fromPage(Page<?> page, List<SupplierListDTO> suppliers) {
        return SupplierPageResponse.builder()
                .suppliers(suppliers)
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
