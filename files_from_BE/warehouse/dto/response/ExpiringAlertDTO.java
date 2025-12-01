package com.dental.clinic.management.warehouse.dto.response;

import com.dental.clinic.management.warehouse.enums.BatchStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 *  Expiring Alert DTO - API 6.3
 * Chi tiết của một lô hàng sắp hết hạn (Expiring Alerts View)
 * 
 * Business Context:
 * - FEFO Strategy: First Expired First Out
 * - Use Cases: Morning routine check, Supplier return planning, Disposal management
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpiringAlertDTO {

    /**
     * Batch & Item identification
     */
    private Long batchId;
    private String itemCode;
    private String itemName;
    private String categoryName;        //  Thêm: Phân loại (Thuốc, Vật tư...)
    private WarehouseType warehouseType; //  Thêm: COLD | NORMAL
    private String lotNumber;

    /**
     * Logistics info (Core data cho warehouse staff)
     */
    private String binLocation;  // Vị trí vật lý trong kho
    private Integer quantityOnHand;
    private String unitName;

    /**
     * Expiry info (Real-time calculation)
     */
    private LocalDate expiryDate;
    private Long daysRemaining;   // Số ngày còn lại đến hết hạn (có thể âm nếu đã hỏng)
    private BatchStatus status;   // EXPIRED | CRITICAL | EXPIRING_SOON

    /**
     * Supplier info (Để liên hệ trả hàng nếu cần)
     */
    private String supplierName;
}
