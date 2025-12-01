package com.dental.clinic.management.warehouse.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for single item unit conversion
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConversionItemRequest {

    @NotNull(message = "Item master ID is required")
    @Positive(message = "Item master ID must be positive")
    private Long itemMasterId;

    @NotNull(message = "From unit ID is required")
    @Positive(message = "From unit ID must be positive")
    private Long fromUnitId;

    @NotNull(message = "To unit ID is required")
    @Positive(message = "To unit ID must be positive")
    private Long toUnitId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Double quantity;
}
