package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateItemMasterResponse {

    private Long itemMasterId;
    private String itemCode;
    private String itemName;
    private Integer totalQuantity;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private Boolean safetyLockApplied;
    private List<UnitInfo> units;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnitInfo {
        private Long unitId;
        private String unitName;
        private Integer conversionRate;
        private Boolean isBaseUnit;
        private Boolean isActive;
        private Integer displayOrder;
    }
}
