package com.dental.clinic.management.warehouse.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response containing item units for dropdown selection")
public class GetItemUnitsResponse {

    @Schema(description = "Item master information for context", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("itemMaster")
    private ItemMasterInfo itemMaster;

    @Schema(description = "Base unit information for calculation", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("baseUnit")
    private BaseUnitInfo baseUnit;

    @Schema(description = "List of units sorted by display order", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("units")
    private List<UnitInfo> units;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Item master basic information")
    public static class ItemMasterInfo {
        @Schema(description = "Item master ID", example = "24")
        @JsonProperty("itemMasterId")
        private Long itemMasterId;

        @Schema(description = "Item code", example = "DP-AMOX-500")
        @JsonProperty("itemCode")
        private String itemCode;

        @Schema(description = "Item name", example = "Amoxicillin 500mg")
        @JsonProperty("itemName")
        private String itemName;

        @Schema(description = "Whether item is active", example = "true")
        @JsonProperty("isActive")
        private Boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Base unit information")
    public static class BaseUnitInfo {
        @Schema(description = "Unit ID", example = "12")
        @JsonProperty("unitId")
        private Long unitId;

        @Schema(description = "Unit name", example = "Vien")
        @JsonProperty("unitName")
        private String unitName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Unit information with conversion details")
    public static class UnitInfo {
        @Schema(description = "Unit ID", example = "10")
        @JsonProperty("unitId")
        private Long unitId;

        @Schema(description = "Unit name", example = "Hop")
        @JsonProperty("unitName")
        private String unitName;

        @Schema(description = "Conversion rate to base unit", example = "100")
        @JsonProperty("conversionRate")
        private Integer conversionRate;

        @Schema(description = "Whether this is the base unit", example = "false")
        @JsonProperty("isBaseUnit")
        private Boolean isBaseUnit;

        @Schema(description = "Display order for sorting", example = "1")
        @JsonProperty("displayOrder")
        private Integer displayOrder;

        @Schema(description = "Whether unit is active", example = "true")
        @JsonProperty("isActive")
        private Boolean isActive;

        @Schema(description = "Auto-generated description for user clarity", example = "1 Hop = 100 Vien")
        @JsonProperty("description")
        private String description;
    }
}
