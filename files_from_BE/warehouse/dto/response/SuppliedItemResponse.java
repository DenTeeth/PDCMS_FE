package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO cho Supplied Items by Supplier
 * FE: SupplierDetailModal - Supplied Items Tab
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuppliedItemResponse {

    private String itemCode;
    private String itemName;
    private BigDecimal lastImportPrice; // Giá nhập lần cuối
    private LocalDateTime lastImportDate; // Ngày nhập lần cuối
}
