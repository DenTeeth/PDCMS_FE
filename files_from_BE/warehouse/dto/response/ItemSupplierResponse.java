package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO cho danh sách NCC cung cấp 1 item
 * FE: ItemDetailModal - Suppliers Tab
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemSupplierResponse {

    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private String contactPhone;
    private LocalDateTime lastPurchaseDate; // Ngày mua lần cuối
    private Boolean isPreferred; // NCC ưu tiên hay không
}
