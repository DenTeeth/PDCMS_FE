package com.dental.clinic.management.warehouse.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumableItemRequest {

    @NotNull(message = "Item Master ID is required")
    private Long itemMasterId;

    @NotNull(message = "Quantity per service is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
    private BigDecimal quantityPerService;

    @NotNull(message = "Unit ID is required")
    private Long unitId;

    private String notes;
}
