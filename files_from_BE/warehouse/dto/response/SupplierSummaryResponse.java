package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 📋 SupplierSummaryResponse - DTO nhẹ cho GET ALL (Table View)
 * Chỉ chứa thông tin cần thiết để hiển thị trên bảng danh sách
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierSummaryResponse {

    private Long supplierId;
    private String supplierCode; // SUP001
    private String supplierName; // Công ty Dược A
    private String phoneNumber; // 0901234567
    private String email; // contact@a.com
    private String status; // ACTIVE | INACTIVE
}
