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
public class CreateItemMasterRequest {

    @NotBlank(message = "Item code is required")
    @Pattern(regexp = "^[A-Z0-9-]{3,20}$", message = "Item code must be 3-20 characters, uppercase letters, numbers and hyphens only")
    private String itemCode;

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

    @NotNull(message = "Units list is required")
    @Size(min = 1, message = "At least one unit must be defined")
    @Valid
    private List<UnitRequest> units;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnitRequest {

        @NotBlank(message = "Unit name is required")
        @Size(max = 50, message = "Unit name must not exceed 50 characters")
        private String unitName;

        @NotNull(message = "Conversion rate is required")
        @Min(value = 1, message = "Conversion rate must be >= 1")
        private Integer conversionRate;

        @NotNull(message = "isBaseUnit flag is required")
        private Boolean isBaseUnit;

        @Min(value = 1, message = "Display order must be >= 1")
        private Integer displayOrder;

        private Boolean isDefaultImportUnit;

        private Boolean isDefaultExportUnit;
    }
}
