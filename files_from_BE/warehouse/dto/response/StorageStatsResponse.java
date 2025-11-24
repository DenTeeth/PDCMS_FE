package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho Storage Statistics (Dashboard Xuất/Nhập Kho)
 * FE: storage-in-out/page.tsx - 4 stats cards
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorageStatsResponse {

    private Integer monthlyImportCount; // Số giao dịch nhập trong tháng
    private Integer monthlyExportCount; // Số giao dịch xuất trong tháng
    private Double importGrowthPercent; // % tăng trưởng nhập so với tháng trước
    private Double exportGrowthPercent; // % tăng trưởng xuất so với tháng trước
    private Integer totalTransactionsCount; // Tổng số giao dịch trong tháng

    // 🆕 Expired items tracking
    private Integer expiredItemsCount; // Số items đã hết hạn
}
