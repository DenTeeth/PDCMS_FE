package com.dental.clinic.management.warehouse.controller;

import com.dental.clinic.management.utils.annotation.ApiMessage;
import com.dental.clinic.management.warehouse.dto.request.TransactionHistoryRequest;
import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;
import com.dental.clinic.management.warehouse.dto.response.TransactionHistoryResponse;
import com.dental.clinic.management.warehouse.enums.PaymentStatus;
import com.dental.clinic.management.warehouse.enums.TransactionStatus;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import com.dental.clinic.management.warehouse.service.TransactionHistoryService;
import com.dental.clinic.management.warehouse.service.WarehouseExcelExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 *  API 6.6 & 6.7: Transaction History Controller
 *
 * Features:
 * - API 6.6: List with comprehensive filtering (type, status, payment, date,
 * supplier, appointment)
 * - API 6.7: Detail view with full item breakdown and batch information
 * - RBAC-aware data masking (VIEW_COST permission)
 * - Pagination & sorting
 * - Aggregated statistics
 */
@RestController
@RequestMapping("/api/v1/warehouse")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Warehouse Transaction History", description = "API 6.6 & 6.7 - Transaction History Management")
public class TransactionHistoryController {

        private final TransactionHistoryService transactionHistoryService;
        private final WarehouseExcelExportService excelExportService;

        /**
         * API 6.6: Get Transaction History
         *
         * @param page          Page number (default: 0)
         * @param size          Page size (default: 20)
         * @param search        Search by transaction code or invoice number
         * @param type          Transaction type filter
         * @param status        Approval status filter
         * @param paymentStatus Payment status filter (for IMPORT)
         * @param fromDate      Date range start
         * @param toDate        Date range end
         * @param supplierId    Filter by supplier (for IMPORT)
         * @param appointmentId Filter by appointment (for EXPORT)
         * @param createdBy     Filter by creator
         * @param sortBy        Sort field (default: transactionDate)
         * @param sortDir       Sort direction (default: desc)
         * @return Paginated transaction history with stats
         */
        @GetMapping("/transactions")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        @Operation(summary = "Lấy Lịch sử Giao dịch Kho", description = """
                         API 6.6 - Lấy lịch sử các phiếu Nhập/Xuất/Điều chỉnh kho

                        **Tính năng chính:**
                        - Bộ lọc mạnh mẽ (loại, trạng thái, thanh toán, ngày, NCC, ca bệnh)
                        - Tìm kiếm theo mã phiếu hoặc số hóa đơn
                        - Thống kê tổng hợp (tổng tiền nhập/xuất, phiếu chờ duyệt)
                        - Phân quyền VIEW_COST để ẩn/hiện thông tin tài chính
                        - Liên kết phiếu xuất với ca điều trị
                        - Theo dõi công nợ nhà cung cấp
                        - Quy trình duyệt phiếu

                        **Use Cases:**
                        1. Kế toán đối soát cuối tháng: ?type=IMPORT&fromDate=2025-11-01&toDate=2025-11-30
                        2. Truy vết sự cố: ?search=PX-20251124-005
                        3. Kiểm tra công nợ: ?paymentStatus=PARTIAL
                        4. Duyệt phiếu: ?status=PENDING_APPROVAL

                        **Permissions:**
                        - VIEW_WAREHOUSE: Xem danh sách (bắt buộc)
                        - VIEW_COST: Xem thông tin tài chính (totalValue, paidAmount, remainingDebt)
                        """)
        @ApiMessage("Lấy lịch sử giao dịch thành công")
        public ResponseEntity<TransactionHistoryResponse> getTransactionHistory(
                        @Parameter(description = "Số trang (bắt đầu từ 0)") @RequestParam(defaultValue = "0") Integer page,

                        @Parameter(description = "Số bản ghi mỗi trang (1-100)") @RequestParam(defaultValue = "20") Integer size,

                        @Parameter(description = "Tìm kiếm theo mã phiếu (PN-xxx, PX-xxx) hoặc số hóa đơn") @RequestParam(required = false) String search,

                        @Parameter(description = "Loại phiếu: IMPORT, EXPORT, ADJUSTMENT") @RequestParam(required = false) TransactionType type,

                        @Parameter(description = "Trạng thái duyệt: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED") @RequestParam(required = false) TransactionStatus status,

                        @Parameter(description = "Trạng thái thanh toán (chỉ IMPORT): UNPAID, PARTIAL, PAID") @RequestParam(required = false) PaymentStatus paymentStatus,

                        @Parameter(description = "Lấy giao dịch từ ngày (YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,

                        @Parameter(description = "Lấy giao dịch đến ngày (YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,

                        @Parameter(description = "Lọc theo nhà cung cấp (chỉ IMPORT)") @RequestParam(required = false) Long supplierId,

                        @Parameter(description = "Lọc theo ca điều trị (chỉ EXPORT)") @RequestParam(required = false) Long appointmentId,

                        @Parameter(description = "Lọc theo người tạo (employee_id)") @RequestParam(required = false) Long createdBy,

                        @Parameter(description = "Trường sắp xếp") @RequestParam(defaultValue = "transactionDate") String sortBy,

                        @Parameter(description = "Hướng sắp xếp: asc, desc") @RequestParam(defaultValue = "desc") String sortDir) {

                log.info("GET /api/v1/warehouse/transactions - Page: {}, Size: {}, Type: {}, Status: {}",
                                page, size, type, status);

                TransactionHistoryRequest request = TransactionHistoryRequest.builder()
                                .page(page)
                                .size(size)
                                .search(search)
                                .type(type)
                                .status(status)
                                .paymentStatus(paymentStatus)
                                .fromDate(fromDate)
                                .toDate(toDate)
                                .supplierId(supplierId)
                                .appointmentId(appointmentId)
                                .createdBy(createdBy)
                                .sortBy(sortBy)
                                .sortDir(sortDir)
                                .build();

                TransactionHistoryResponse response = transactionHistoryService.getTransactionHistory(request);

                log.info("Transaction history retrieved - Total: {}, Page: {}/{}",
                                response.getMeta().getTotalElements(),
                                response.getMeta().getPage() + 1,
                                response.getMeta().getTotalPages());

                return ResponseEntity.ok(response);
        }

        /**
         * API 6.7: Get Transaction Detail by ID
         *
         * @param id Transaction ID
         * @return Full transaction details with item breakdown and batch information
         */
        @GetMapping("/transactions/{id}")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        @Operation(summary = "Xem Chi tiết Giao dịch Kho", description = """
                         API 6.7 - Xem chi tiết đầy đủ của một phiếu Nhập/Xuất/Điều chỉnh kho

                        **Tính năng chính:**
                        - Hiển thị đầy đủ thông tin phiếu (header, supplier/appointment, payment)
                        - Danh sách chi tiết tất cả items với batch và số lượng
                        - Thông tin tự động unpacking (nếu có)
                        - Cảnh báo hết hạn và tồn kho âm
                        - Lịch sử duyệt phiếu
                        - Phân quyền VIEW_COST để ẩn/hiện giá trị tài chính

                        **Use Cases:**
                        1. Click vào phiếu từ danh sách → Xem chi tiết đầy đủ
                        2. Kiểm tra items và batch đã xuất trong một ca điều trị
                        3. Đối soát hóa đơn nhà cung cấp với phiếu nhập
                        4. Xem lý do từ chối phiếu

                        **Response Structure:**
                        - IMPORT: Trả về ImportTransactionResponse (supplier, invoice, payment info, items với batch và giá)
                        - EXPORT: Trả về ExportTransactionResponse (appointment, patient, items với FEFO batch, unpacking details)
                        - ADJUSTMENT: Trả về chi tiết điều chỉnh kho

                        **Permissions:**
                        - VIEW_WAREHOUSE: Xem thông tin phiếu và items (bắt buộc)
                        - VIEW_COST: Xem giá trị tài chính (unitPrice, totalPrice, paidAmount, debt)
                        """)
        @ApiMessage("Lấy chi tiết giao dịch thành công")
        public ResponseEntity<?> getTransactionDetail(
                        @Parameter(description = "ID của phiếu giao dịch") @PathVariable Long id) {

                log.info("GET /api/v1/warehouse/transactions/{} - Get transaction detail", id);

                Object response = transactionHistoryService.getTransactionDetail(id);

                log.info("Transaction detail retrieved - ID: {}", id);

                return ResponseEntity.ok(response);
        }

        /**
         * API 6.6.1: Approve Transaction
         */
        @PostMapping("/transactions/{id}/approve")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('APPROVE_TRANSACTION')")
        @Operation(summary = "Duyệt phiếu nhập/xuất kho", description = """
                        Duyệt phiếu giao dịch kho. Chỉ có thể duyệt khi status = PENDING_APPROVAL.

                        **Business Logic:**
                        - Chỉ duyệt được khi approval_status = PENDING_APPROVAL
                        - Cập nhật approved_by, approved_at
                        - Thay đổi status thành APPROVED
                        - Ghi lại notes nếu có

                        **Permissions:**
                        - APPROVE_WAREHOUSE: Quyền duyệt phiếu kho
                        """)
        @ApiMessage("Duyệt phiếu thành công")
        public ResponseEntity<?> approveTransaction(
                        @Parameter(description = "ID của phiếu giao dịch") @PathVariable Long id,
                        @RequestBody(required = false) com.dental.clinic.management.warehouse.dto.request.ApproveTransactionRequest request) {

                log.info("POST /api/v1/warehouse/transactions/{}/approve - Approve transaction", id);

                String notes = request != null ? request.getNotes() : null;
                Object response = transactionHistoryService.approveTransaction(id, notes);

                log.info("Transaction approved - ID: {}", id);

                return ResponseEntity.ok(response);
        }

        /**
         * API 6.6.2: Reject Transaction
         */
        @PostMapping("/transactions/{id}/reject")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('APPROVE_TRANSACTION')")
        @Operation(summary = "Từ chối phiếu nhập/xuất kho", description = """
                        Từ chối phiếu giao dịch kho. Chỉ có thể từ chối khi status = PENDING_APPROVAL.

                        **Business Logic:**
                        - Chỉ từ chối được khi approval_status = PENDING_APPROVAL
                        - Bắt buộc phải có rejection_reason
                        - Cập nhật rejected_by, rejected_at, rejection_reason
                        - Thay đổi status thành REJECTED
                        - Không cập nhật tồn kho

                        **Permissions:**
                        - APPROVE_WAREHOUSE: Quyền duyệt/từ chối phiếu kho
                        """)
        @ApiMessage("Từ chối phiếu thành công")
        public ResponseEntity<?> rejectTransaction(
                        @Parameter(description = "ID của phiếu giao dịch") @PathVariable Long id,
                        @RequestBody @jakarta.validation.Valid com.dental.clinic.management.warehouse.dto.request.RejectTransactionRequest request) {

                log.info("POST /api/v1/warehouse/transactions/{}/reject - Reject transaction", id);

                Object response = transactionHistoryService.rejectTransaction(id, request.getRejectionReason());

                log.info("Transaction rejected - ID: {}", id);

                return ResponseEntity.ok(response);
        }

        /**
         * API 6.6.3: Cancel Transaction
         */
        @PostMapping("/transactions/{id}/cancel")
        @PreAuthorize("hasRole('" + ADMIN
                        + "') or hasAuthority('UPDATE_WAREHOUSE') or hasAuthority('CANCEL_WAREHOUSE')")
        @Operation(summary = "Hủy phiếu nhập/xuất kho", description = """
                        Hủy phiếu giao dịch kho. Chỉ có thể hủy khi status = DRAFT hoặc PENDING_APPROVAL.

                        **Business Logic:**
                        - Chỉ hủy được khi approval_status = DRAFT hoặc PENDING_APPROVAL
                        - Không thể hủy phiếu đã APPROVED
                        - Cập nhật cancelled_by, cancelled_at, cancellation_reason (optional)
                        - Thay đổi status thành CANCELLED
                        - Không cập nhật tồn kho

                        **Permissions:**
                        - UPDATE_WAREHOUSE hoặc CANCEL_WAREHOUSE: Quyền hủy phiếu kho
                        """)
        @ApiMessage("Hủy phiếu thành công")
        public ResponseEntity<?> cancelTransaction(
                        @Parameter(description = "ID của phiếu giao dịch") @PathVariable Long id,
                        @RequestBody(required = false) com.dental.clinic.management.warehouse.dto.request.CancelTransactionRequest request) {

                log.info("POST /api/v1/warehouse/transactions/{}/cancel - Cancel transaction", id);

                String reason = request != null ? request.getCancellationReason() : null;
                Object response = transactionHistoryService.cancelTransaction(id, reason);

                log.info("Transaction cancelled - ID: {}", id);

                return ResponseEntity.ok(response);
        }

        /**
         * API 6.6.4: Export Transaction History to Excel
         * Issue #50: Export warehouse transactions to Excel file
         */
        @GetMapping("/transactions/export")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        @Operation(summary = "Xuất lịch sử giao dịch kho ra Excel", description = """
                        Export Transaction History to Excel file (.xlsx)
                        
                        **Features:**
                        - Exports ALL transactions (not paginated)
                        - Preserves filters from UI (type, status, paymentStatus, dateRange, supplierId, etc.)
                        - Formatted headers with bold styling
                        - Currency formatting for financial columns
                        - Auto-sized columns
                        - Frozen header row for better navigation
                        
                        **Permissions:**
                        - VIEW_WAREHOUSE: Required to export
                        - VIEW_COST: Required to see financial values (totalValue, paidAmount, debt)
                        """)
        @ApiMessage("Xuất lịch sử giao dịch thành công")
        public ResponseEntity<byte[]> exportTransactionHistory(
                        @Parameter(description = "Tìm kiếm theo mã phiếu hoặc số hóa đơn") @RequestParam(required = false) String search,

                        @Parameter(description = "Loại phiếu: IMPORT, EXPORT, ADJUSTMENT") @RequestParam(required = false) TransactionType type,

                        @Parameter(description = "Trạng thái duyệt") @RequestParam(required = false) TransactionStatus status,

                        @Parameter(description = "Trạng thái thanh toán (chỉ IMPORT)") @RequestParam(required = false) PaymentStatus paymentStatus,

                        @Parameter(description = "Lấy giao dịch từ ngày (YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,

                        @Parameter(description = "Lấy giao dịch đến ngày (YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,

                        @Parameter(description = "Lọc theo nhà cung cấp (chỉ IMPORT)") @RequestParam(required = false) Long supplierId,

                        @Parameter(description = "Lọc theo ca điều trị (chỉ EXPORT)") @RequestParam(required = false) Long appointmentId,

                        @Parameter(description = "Lọc theo người tạo") @RequestParam(required = false) Long createdBy,

                        @Parameter(description = "Trường sắp xếp") @RequestParam(defaultValue = "transactionDate") String sortBy,

                        @Parameter(description = "Hướng sắp xếp: asc, desc") @RequestParam(defaultValue = "desc") String sortDir) {

                log.info("API 6.6.4 - GET /api/v1/warehouse/transactions/export - Type: {}, Status: {}, DateRange: {} to {}",
                                type, status, fromDate, toDate);

                try {
                        // Build request to get ALL data without pagination
                        TransactionHistoryRequest request = TransactionHistoryRequest.builder()
                                        .page(0)
                                        .size(Integer.MAX_VALUE)
                                        .search(search)
                                        .type(type)
                                        .status(status)
                                        .paymentStatus(paymentStatus)
                                        .fromDate(fromDate)
                                        .toDate(toDate)
                                        .supplierId(supplierId)
                                        .appointmentId(appointmentId)
                                        .createdBy(createdBy)
                                        .sortBy(sortBy)
                                        .sortDir(sortDir)
                                        .build();

                        TransactionHistoryResponse response = transactionHistoryService.getTransactionHistory(request);

                        // Generate Excel file
                        byte[] excelBytes = excelExportService.exportTransactionHistory(response);

                        log.info("Exported {} transactions to Excel", response.getContent().size());

                        return ResponseEntity.ok()
                                        .header("Content-Disposition", "attachment; filename=transaction_history.xlsx")
                                        .header("Content-Type",
                                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                        .body(excelBytes);

                } catch (Exception e) {
                        log.error("Error exporting transaction history to Excel", e);
                        throw new RuntimeException("Failed to export transaction history: " + e.getMessage());
                }
        }
}
