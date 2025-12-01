package com.dental.clinic.management.warehouse.dto.request;

import com.dental.clinic.management.warehouse.enums.WarehouseType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateItemMasterRequest {

    @NotBlank(message = "Item name is required")
    @Size(max = 255, message = "Item name must not exceed 255 characters")
    private String itemName;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotNull(message = "Warehouse type is required")
    private WarehouseType warehouseType;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private Boolean isPrescriptionRequired;

    @Min(value = 1, message = "Default shelf life must be at least 1 day")
    @Max(value = 3650, message = "Default shelf life must not exceed 3650 days (10 years)")
    private Integer defaultShelfLifeDays;

    @NotNull(message = "Min stock level is required")
    @Min(value = 0, message = "Min stock level must be >= 0")
    private Integer minStockLevel;

    @NotNull(message = "Max stock level is required")
    @Min(value = 1, message = "Max stock level must be >= 1")
    private Integer maxStockLevel;

    @DecimalMin(value = "0.0", inclusive = false, message = "Current market price must be > 0")
    private BigDecimal currentMarketPrice;

    // Optional: If not provided, existing value will be retained
    private Boolean isActive;

    // Optional: If not provided or empty, existing units will be retained
    // If provided, will perform Safety Lock validation
    @Valid
    private List<UnitRequest> units;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnitRequest {

        private Long unitId;

        @NotBlank(message = "Unit name is required")
        @Size(max = 50, message = "Unit name must not exceed 50 characters")
        private String unitName;

        @NotNull(message = "Conversion rate is required")
        @Min(value = 1, message = "Conversion rate must be >= 1")
        private Integer conversionRate;

        @NotNull(message = "isBaseUnit flag is required")
        private Boolean isBaseUnit;

        @NotNull(message = "isActive flag is required")
        private Boolean isActive;

        @Min(value = 0, message = "Display order must be >= 0")
        private Integer displayOrder;

        private Boolean isDefaultImportUnit;

        private Boolean isDefaultExportUnit;
    }
}
