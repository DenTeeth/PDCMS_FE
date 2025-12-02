package com.dental.clinic.management.warehouse.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Request DTO for batch unit conversion
 * Supports multiple conversions in a single API call for better performance
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConversionRequest {

    @NotEmpty(message = "Conversions list cannot be empty")
    @Valid
    private List<ConversionItemRequest> conversions;

    /**
     * Rounding mode for conversion results
     * FLOOR: Round down (default for medications - cannot split pills)
     * CEILING: Round up (default for materials - buy extra instead of shortage)
     * HALF_UP: Standard rounding (default)
     */
    private String roundingMode = "HALF_UP"; // Default value
}
