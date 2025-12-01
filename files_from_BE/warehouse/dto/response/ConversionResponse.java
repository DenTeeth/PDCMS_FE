package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Response DTO for batch conversion operation
 * Contains results for all processed conversions
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConversionResponse {

    private Integer totalProcessed;
    private List<ConversionResult> results;

    /**
     * Constructor for single conversion (backward compatibility)
     */
    public ConversionResponse(ConversionResult singleResult) {
        this.totalProcessed = 1;
        this.results = List.of(singleResult);
    }
}
