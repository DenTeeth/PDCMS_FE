package com.dental.clinic.management.warehouse.controller;

import com.dental.clinic.management.utils.annotation.ApiMessage;
import com.dental.clinic.management.warehouse.dto.request.ImportTransactionRequest;
import com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse;
import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;
import com.dental.clinic.management.warehouse.service.ImportTransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 *  API 6.4: Warehouse Import Transaction Controller
 *
 * Enhanced features:
 * - Invoice number tracking
 * - Purchase price per unit
 * - Expected delivery date
 * - Financial summary
 * - Warning generation
 * - Batch status tracking
 */
@RestController
@RequestMapping("/api/v1/warehouse")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Warehouse Import", description = "API 6.4 - Import Transaction Management")
public class WarehouseV3Controller {

        private final ImportTransactionService importTransactionService;

        /**
         * API 6.4: Create Import Transaction
         *
         * @param request        Import transaction details
         * @param authentication Current user authentication
         * @return Transaction response with items and warnings
         */
        @PostMapping("/import")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('IMPORT_ITEMS')")
        @Operation(summary = "Tạo Phiếu Nhập Kho", description = """
                         API 6.4 - Tạo phiếu nhập kho với đầy đủ tính năng:

                        **Tính năng chính:**
                        - Nhập hàng từ nhà cung cấp
                        - Theo dõi số hóa đơn (invoice number) duy nhất
                        - Ghi nhận giá mua cho từng đơn vị
                        - Tính toán tổng giá trị phiếu nhập
                        - Cảnh báo hàng gần hết hạn (< 3 tháng)
                        - Theo dõi trạng thái batch (Tạo mới/Cập nhật)
                        - Hiển thị tồn kho hiện tại sau khi nhập

                        **Quy tắc kinh doanh:**
                        - Invoice number phải duy nhất (tránh nhập trùng)
                        - Ngày giao dịch không được trong tương lai
                        - Hạn sử dụng phải > ngày hiện tại
                        - Cùng lot number phải có cùng hạn sử dụng
                        - Số lượng: 1 - 1,000,000 đơn vị
                        - Giá mua: 0.01 - 100,000,000 VNĐ

                        **Quyền truy cập:** IMPORT_ITEMS
                        """)
        @ApiMessage("Tạo phiếu nhập kho thành công")
        public ResponseEntity<ImportTransactionResponse> createImportTransaction(
                        @Valid @RequestBody ImportTransactionRequest request,
                        Authentication authentication) {

                log.info("📦 POST /api/v1/warehouse/import - Invoice: {}, Items: {}",
                                request.getInvoiceNumber(), request.getItems().size());

                String employeeCode = authentication.getName();

                ImportTransactionResponse response = importTransactionService
                                .createImportTransaction(request, employeeCode);

                log.info(" Import transaction created - Code: {}, Total: {} VNĐ",
                                response.getTransactionCode(), response.getTotalValue());

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
}
