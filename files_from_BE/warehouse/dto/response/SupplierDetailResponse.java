package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 *  SupplierDetailResponse - DTO đầy đủ cho GET BY ID (Detail View)
 * Chứa toàn bộ thông tin chi tiết + danh sách vật tư cung cấp
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDetailResponse {

    private Long supplierId;
    private String supplierCode; // SUP001
    private String supplierName; // Công ty Dược A
    private String phoneNumber; // 0901234567
    private String email; // contact@a.com
    private String address; // 123 Đường ABC, Quận 1, TP.HCM
    private String notes; // Giao hàng giờ hành chính, uy tín
    private Boolean isActive; // true/false
    private LocalDateTime createdAt; // 2023-01-01T10:00:00
    private LocalDateTime updatedAt; // 2023-10-01T12:00:00

    // Danh sách vật tư mà supplier này cung cấp
    private List<SuppliedItemSummary> suppliedItems;

    /**
     * Nested DTO: Thông tin tóm tắt vật tư
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuppliedItemSummary {
        private Long itemMasterId;
        private String itemCode; // LIDO_2P
        private String itemName; // Thuốc tê Lidocaine 2%
        private String categoryName; // Dược phẩm
        private LocalDateTime lastImportDate; // Ngày nhập gần nhất
        private Integer totalQuantity; // Tổng số lượng tồn kho từ tất cả batches
    }
}
