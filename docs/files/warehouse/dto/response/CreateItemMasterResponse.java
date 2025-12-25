package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateItemMasterResponse {

    private Long itemMasterId;
    private String itemCode;
    private String itemName;
    private String baseUnitName;
    private Integer totalQuantity;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private String createdBy;
}
