package com.dental.clinic.management.warehouse.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetServiceConsumablesRequest {

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    @NotEmpty(message = "Consumables list cannot be empty")
    @Valid
    private List<ConsumableItemRequest> consumables;
}
