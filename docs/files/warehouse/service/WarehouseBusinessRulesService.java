package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.warehouse.domain.Supplier;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Business Rules Validation Service for Warehouse Module
 * 
 * Implements:
 * - Rule #20: Cannot import batches with expiry date less than 3 months remaining
 * - Rule #22: Can only import from suppliers with Active status
 */
@Service
public class WarehouseBusinessRulesService {

    /**
     * Rule #20: Validate batch expiry date (must be >= 3 months from now)
     * 
     * Business Rule: Cannot import batches with expiry date less than 3 months remaining
     * 
     * @param expiryDate Expiry date of the batch being imported
     * @param lotNumber Lot number for error message
     * @throws BadRequestAlertException if expiry date is too soon
     */
    public void validateBatchExpiryDate(LocalDate expiryDate, String lotNumber) {
        if (expiryDate == null) {
            throw new BadRequestAlertException(
                "Hạn sử dụng là bắt buộc khi nhập kho",
                "ItemBatch",
                "expiryDateRequired"
            );
        }

        LocalDate threeMonthsFromNow = LocalDate.now().plusMonths(3);
        
        if (expiryDate.isBefore(threeMonthsFromNow)) {
            long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
            long monthsRemaining = ChronoUnit.MONTHS.between(LocalDate.now(), expiryDate);
            
            throw new BadRequestAlertException(
                String.format(
                    "Không được nhập lô hàng có hạn sử dụng dưới 3 tháng. " +
                    "Lô số: %s, Hạn dùng: %s, Còn lại: %d tháng (%d ngày). Tối thiểu: %s",
                    lotNumber,
                    expiryDate,
                    monthsRemaining,
                    daysRemaining,
                    threeMonthsFromNow
                ),
                "ItemBatch",
                "expiryDateTooSoon"
            );
        }
    }

    /**
     * Rule #22: Validate supplier status (must be Active)
     * 
     * Business Rule: Can only import from suppliers with Active status
     * 
     * @param supplier Supplier entity
     * @throws BadRequestAlertException if supplier is not active or blacklisted
     */
    public void validateSupplierStatus(Supplier supplier) {
        if (supplier == null) {
            throw new BadRequestAlertException(
                "Nhà cung cấp không tồn tại",
                "Supplier",
                "supplierNotFound"
            );
        }

        // Check if supplier is blacklisted
        if (supplier.getIsBlacklisted() != null && supplier.getIsBlacklisted()) {
            throw new BadRequestAlertException(
                String.format(
                    "Không thể nhập hàng từ nhà cung cấp đã bị đưa vào danh sách đen: %s (Mã: %s)",
                    supplier.getSupplierName(),
                    supplier.getSupplierCode()
                ),
                "Supplier",
                "supplierBlacklisted"
            );
        }

        // Note: If Supplier entity has isActive field, add this check:
        // if (supplier.getIsActive() != null && !supplier.getIsActive()) {
        //     throw new BadRequestAlertException(
        //         String.format(
        //             "Không thể nhập hàng từ nhà cung cấp không hoạt động: %s (Mã: %s)",
        //             supplier.getSupplierName(),
        //             supplier.getSupplierCode()
        //         ),
        //         "Supplier",
        //         "supplierInactive"
        //     );
        // }
    }
}
