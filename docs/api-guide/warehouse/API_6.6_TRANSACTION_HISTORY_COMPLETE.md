# API 6.6 - Transaction History Implementation Complete

## 📋 Overview

Đã hoàn thành implementation API 6.6 - Transaction History với đầy đủ tính năng payment tracking, approval workflow, và appointment linking theo yêu cầu nâng cấp từ review.

## 🌐 API Endpoint

```
GET /api/warehouse/transactions
```

## Features Implemented

### 1. Request Parameters

```java
// Pagination
- page (int, default=0): Số trang (0-based)
- size (int, default=20): Số records/page (max: 100)

// Search
- search (string, optional): Tìm theo transaction_code hoặc invoice_number (LIKE %...%)

// Filters
- type (enum, optional): IMPORT | EXPORT | ADJUSTMENT
- status (enum, optional): DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | CANCELLED
- paymentStatus (enum, optional): UNPAID | PARTIAL | PAID (chỉ cho IMPORT)

// Date Range
- fromDate (date, optional): Lấy giao dịch từ ngày (YYYY-MM-DD)
- toDate (date, optional): Lấy giao dịch đến ngày (YYYY-MM-DD)

// Related Entities
- supplierId (long, optional): Lọc phiếu nhập từ NCC cụ thể
- appointmentId (long, optional): Lọc phiếu xuất cho ca bệnh cụ thể
- createdBy (long, optional): Lọc phiếu do nhân viên cụ thể tạo

// Sorting
- sortBy (string, default=transactionDate): Trường sắp xếp
- sortDir (string, default=desc): Hướng sắp xếp (asc/desc)
```

### 2. Response Structure

```json
{
  "statusCode": 200,
  "message": "Transactions retrieved successfully",
  "data": {
    // Metadata
    "meta": {
      "page": 0,
      "size": 20,
      "totalPages": 5,
      "totalElements": 98
    },

    // Summary Statistics
    "stats": {
      "periodStart": "2025-11-01",
      "periodEnd": "2025-11-24",
      "totalImportValue": 500000000, // Requires VIEW_COST permission
      "totalExportValue": 250000000, // Requires VIEW_COST permission
      "pendingApprovalCount": 3
    },

    // Transaction List
    "content": [
      {
        // Basic Info
        "transactionId": 602,
        "transactionCode": "PX-20251124-005",
        "type": "EXPORT",
        "transactionDate": "2025-11-24T09:00:00",
        "status": "APPROVED",
        "notes": "Xuất thuốc tê và găng tay",

        // Related Entities (Import)
        "supplierName": null,
        "invoiceNumber": null,

        // Related Entities (Export)
        "relatedAppointmentId": 1523,
        "relatedAppointmentCode": "APT-20251124-007",
        "patientName": "Nguyễn Văn X",

        // Creator & Approver
        "createdByName": "Thủ kho A",
        "createdAt": "2025-11-24T08:45:00",
        "approvedByName": "Quản lý B",
        "approvedAt": "2025-11-24T09:15:00",

        // Financial (RBAC: requires VIEW_COST)
        "totalItems": 3,
        "totalValue": 150000.0, // null if no VIEW_COST

        // Payment Tracking (Import only)
        "paymentStatus": null,
        "paidAmount": null,
        "remainingDebt": null,
        "dueDate": null
      },
      {
        // Import Transaction Example
        "transactionId": 501,
        "transactionCode": "PN-20251124-001",
        "type": "IMPORT",
        "transactionDate": "2025-11-24T08:30:00",
        "status": "APPROVED",

        // Import-specific fields
        "supplierName": "Công ty Dược ABC",
        "invoiceNumber": "HD-2025-001234",

        // Payment Tracking
        "paymentStatus": "PARTIAL",
        "totalValue": 122500000.0,
        "paidAmount": 61250000.0, // Requires VIEW_COST
        "remainingDebt": 61250000.0, // Requires VIEW_COST
        "dueDate": "2025-12-24",

        // Workflow
        "createdByName": "Thủ kho A",
        "approvedByName": "Quản lý B",
        "totalItems": 10
      }
    ]
  }
}
```

### 3. Enhanced Features (vs Original Spec)

#### [YES] Payment Tracking (for Accountants)

- **paymentStatus**: UNPAID / PARTIAL / PAID
- **paidAmount**: Số tiền đã thanh toán
- **remainingDebt**: Số tiền còn nợ (totalValue - paidAmount)
- **dueDate**: Hạn thanh toán

**Use Case**: Kế toán đối soát công nợ cuối tháng

```bash
GET /transactions?type=IMPORT&paymentStatus=PARTIAL
→ Ra danh sách phiếu nhập chưa trả hết tiền
```

#### [YES] Approval Workflow (for Managers)

- **approvalStatus**: DRAFT / PENDING_APPROVAL / APPROVED / REJECTED / CANCELLED
- **approvedBy**: Người duyệt phiếu
- **approvedAt**: Thời gian duyệt

**Use Case**: Quản lý duyệt phiếu

```bash
GET /transactions?status=PENDING_APPROVAL
→ Ra 3 phiếu đang chờ ký duyệt
```

#### [YES] Appointment Linking (for Doctors)

- **relatedAppointmentId**: ID ca điều trị
- **relatedAppointmentCode**: Mã ca điều trị
- **patientName**: Tên bệnh nhân

**Use Case**: Bác sĩ tra cứu thuốc đã dùng

```bash
GET /transactions?appointmentId=1523
→ Thấy ngay phiếu PX-xxx đã xuất thuốc gì
```

#### [YES] Enhanced Statistics

- **totalImportValue**: Tổng tiền nhập trong kỳ
- **totalExportValue**: Tổng tiền xuất trong kỳ
- **pendingApprovalCount**: Số phiếu chờ duyệt

**RBAC**: Chỉ hiển thị nếu có quyền `VIEW_COST`

## 🔐 Authorization

```java
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'VIEW_WAREHOUSE')")
```

### Permission Matrix

| Role                   | VIEW_WAREHOUSE | VIEW_COST | Use Case                              |
| ---------------------- | -------------- | --------- | ------------------------------------- |
| ROLE_ADMIN             | [YES]          | ✅        | Full access                           |
| ROLE_INVENTORY_MANAGER | [YES]          | ✅        | Quản lý kho - full financial data     |
| ROLE_MANAGER           | [YES]          | ✅        | Quản lý - duyệt phiếu + xem tài chính |
| ROLE_ACCOUNTANT        | [YES]          | ✅        | Kế toán - đối soát công nợ            |
| ROLE_RECEPTIONIST      | [YES]          | [NO]      | Lễ tân - chỉ xem metadata             |
| ROLE_DOCTOR            | [NO]           | ❌        | Không truy cập warehouse              |

**RBAC Logic**:

- Nếu **không** có `VIEW_COST`: `totalValue`, `paidAmount`, `remainingDebt` = `null`
- Nếu **có** `VIEW_COST`: Hiển thị đầy đủ thông tin tài chính

## 🗄️ Database Schema Changes

### New Enum Types (V22 Migration)

```sql
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
CREATE TYPE transaction_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
```

### New Columns (storage_transactions)

```sql
ALTER TABLE storage_transactions
    -- Payment tracking
    ADD COLUMN payment_status payment_status DEFAULT NULL,
    ADD COLUMN paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    ADD COLUMN remaining_debt DECIMAL(15, 2) DEFAULT 0.00,
    ADD COLUMN due_date DATE DEFAULT NULL,

    -- Approval workflow
    ADD COLUMN approval_status transaction_status DEFAULT 'APPROVED',
    ADD COLUMN approved_by BIGINT REFERENCES employees(employee_id),
    ADD COLUMN approved_at TIMESTAMP DEFAULT NULL,

    -- Appointment linking
    ADD COLUMN related_appointment_id BIGINT REFERENCES appointments(appointment_id);
```

### Performance Indexes

```sql
-- Composite index for search (transaction_code, invoice_number)
CREATE INDEX idx_storage_transactions_search
    ON storage_transactions(transaction_code, invoice_number, transaction_date DESC);

-- Index for date range queries
CREATE INDEX idx_storage_transactions_date
    ON storage_transactions(transaction_date DESC);

-- Index for approval workflow
CREATE INDEX idx_storage_transactions_approval_status
    ON storage_transactions(approval_status);

-- Index for payment status
CREATE INDEX idx_storage_transactions_payment_status
    ON storage_transactions(payment_status)
    WHERE payment_status IS NOT NULL;
```

## 📝 Files Created/Modified

### New Files

1. **PaymentStatus.java** - Enum: UNPAID, PARTIAL, PAID
2. **TransactionStatus.java** - Enum: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED
3. **TransactionHistoryRequest.java** - Request DTO với full filters
4. **TransactionHistoryResponse.java** - Response wrapper
5. **TransactionHistoryItemDto.java** - Transaction item DTO
6. **TransactionSummaryStatsDto.java** - Stats DTO
7. **TransactionHistorySpecification.java** - Dynamic query builder
8. **TransactionHistoryService.java** - Business logic + RBAC
9. **TransactionHistoryController.java** - REST endpoint
10. **V22_add_transaction_history_enhancements.sql** - Schema migration
11. **V23_seed_transaction_history_data.sql** - Seed data

### Modified Files

1. **StorageTransaction.java** - Added payment, approval, appointment fields
2. **StorageTransactionRepository.java** - Added JpaSpecificationExecutor
3. **AuthoritiesConstants.java** - Added VIEW_COST, IMPORT_ITEMS, EXPORT_ITEMS, APPROVE_TRANSACTION

## 🧪 Test Cases

### Test 1: Lấy tất cả transactions (no filters)

```bash
GET /api/warehouse/transactions?page=0&size=20
```

**Expected**: Danh sách 20 transactions mới nhất

### Test 2: Search theo mã phiếu

```bash
GET /api/warehouse/transactions?search=PX-20251124-005
```

**Expected**: Tìm thấy phiếu xuất PX-20251124-005

### Test 3: Filter theo loại phiếu

```bash
GET /api/warehouse/transactions?type=IMPORT&page=0&size=20
```

**Expected**: Chỉ hiển thị phiếu nhập (IMPORT)

### Test 4: Filter công nợ (Kế toán use case)

```bash
GET /api/warehouse/transactions?type=IMPORT&paymentStatus=PARTIAL
```

**Expected**: Danh sách phiếu nhập chưa trả hết tiền

### Test 5: Filter phiếu chờ duyệt (Quản lý use case)

```bash
GET /api/warehouse/transactions?status=PENDING_APPROVAL
```

**Expected**: Danh sách phiếu chờ duyệt

### Test 6: Filter theo khoảng thời gian (Đối soát tháng)

```bash
GET /api/warehouse/transactions?type=IMPORT&fromDate=2025-11-01&toDate=2025-11-30
```

**Expected**: Tất cả phiếu nhập trong tháng 11/2025

### Test 7: Filter theo NCC

```bash
GET /api/warehouse/transactions?supplierId=10
```

**Expected**: Tất cả phiếu nhập từ NCC ID=10

### Test 8: Filter theo ca bệnh (Bác sĩ tra cứu)

```bash
GET /api/warehouse/transactions?appointmentId=1523
```

**Expected**: Phiếu xuất thuốc cho ca bệnh 1523

### Test 9: RBAC Test - User không có VIEW_COST

```bash
# Login as ROLE_RECEPTIONIST (không có VIEW_COST)
GET /api/warehouse/transactions
```

**Expected**: `totalValue`, `paidAmount`, `remainingDebt` = `null`

### Test 10: RBAC Test - User có VIEW_COST

```bash
# Login as ROLE_MANAGER (có VIEW_COST)
GET /api/warehouse/transactions
```

**Expected**: Hiển thị đầy đủ thông tin tài chính

### Test 11: Combined Filters

```bash
GET /api/warehouse/transactions?type=IMPORT&status=APPROVED&paymentStatus=UNPAID&fromDate=2025-11-01&toDate=2025-11-30&sortBy=dueDate&sortDir=asc
```

**Expected**: Phiếu nhập đã duyệt, chưa trả tiền, sắp xếp theo hạn thanh toán

### Test 12: Validation Test - Invalid Date Range

```bash
GET /api/warehouse/transactions?fromDate=2025-12-01&toDate=2025-11-01
```

**Expected**: 400 Bad Request - "fromDate cannot be after toDate"

## 📊 Business Use Cases

### 1. Kế toán đối soát công nợ

**Scenario**: Cuối tháng cần lập báo cáo công nợ nhà cung cấp

```bash
GET /transactions?type=IMPORT&paymentStatus=PARTIAL&fromDate=2025-11-01&toDate=2025-11-30
```

**Result**: Ra danh sách phiếu nhập chưa trả hết → Lên kế hoạch thanh toán

### 2. Bác sĩ tra cứu thuốc

**Scenario**: Bệnh nhân phản ứng phụ, cần xem đã dùng thuốc gì

```bash
GET /transactions?appointmentId=1523
```

**Result**: Thấy ngay phiếu "PX-xxx" đã xuất thuốc tê Septodont 2ml

### 3. Quản lý duyệt phiếu

**Scenario**: Sáng đầu tuần, Manager check phiếu chờ duyệt

```bash
GET /transactions?status=PENDING_APPROVAL
```

**Result**: 3 phiếu chờ duyệt → Duyệt/từ chối qua API riêng

### 4. Kiểm tra hiệu suất NCC

**Scenario**: Đánh giá NCC nào giao hàng đúng hạn

```bash
GET /transactions?type=IMPORT&supplierId=10&fromDate=2025-01-01&toDate=2025-12-31
```

**Result**: Xem tần suất nhập hàng, tổng giá trị, lịch sử thanh toán

### 5. Truy vết sự cố

**Scenario**: Phát hiện thuốc hết hạn trong phiếu xuất

```bash
GET /transactions?search=PX-20251124-005
```

**Result**: Tìm ra phiếu xuất → Check createdBy → Truy trách nhiệm

## 🚀 Performance Optimization

### Current Implementation

- **Specification Pattern**: Dynamic query với JPA Criteria API
- **Pagination**: Spring Data Pageable (database-level)
- **Eager Loading**: JOIN FETCH cho supplier, appointment, createdBy, approvedBy
- **Indexes**: Composite index cho search + date DESC

### Query Example

```sql
SELECT st FROM StorageTransaction st
LEFT JOIN FETCH st.supplier
LEFT JOIN FETCH st.relatedAppointment
LEFT JOIN FETCH st.createdBy
LEFT JOIN FETCH st.approvedBy
WHERE
    LOWER(st.transactionCode) LIKE LOWER(:search)
    OR LOWER(st.invoiceNumber) LIKE LOWER(:search)
AND st.transactionType = :type
AND st.approvalStatus = :status
AND st.paymentStatus = :paymentStatus
AND st.transactionDate BETWEEN :fromDate AND :toDate
ORDER BY st.transactionDate DESC
```

### Future Optimization (if needed)

```sql
-- Option 1: Materialized View cho Stats
CREATE MATERIALIZED VIEW mv_transaction_summary AS
SELECT
    DATE(transaction_date) as tx_date,
    transaction_type,
    SUM(total_value) as daily_total,
    COUNT(*) as tx_count
FROM storage_transactions
GROUP BY DATE(transaction_date), transaction_type;

-- Option 2: Partition By Date
CREATE TABLE storage_transactions_2025_11 PARTITION OF storage_transactions
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

## 📄 API Documentation

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Tag**: Warehouse Transaction History
- **Operation**: API 6.6 - Transaction History Management

## [YES] Implementation Checklist

- [x] Create PaymentStatus enum
- [x] Create TransactionStatus enum
- [x] Update StorageTransaction entity (8 new fields)
- [x] Create Request/Response DTOs
- [x] Implement TransactionHistorySpecification
- [x] Implement TransactionHistoryService với RBAC
- [x] Implement TransactionHistoryController
- [x] Create database migration V22
- [x] Create seed data V23
- [x] Add permissions (VIEW_COST, IMPORT_ITEMS, EXPORT_ITEMS, APPROVE_TRANSACTION)
- [x] Assign permissions to roles
- [x] Update AuthoritiesConstants
- [x] Write documentation
- [ ] Test API với Postman
- [ ] Verify RBAC masking
- [ ] Verify stats calculation
- [ ] Verify appointment linking

## 📚 Next Steps

1. [YES] Start application: `./mvnw spring-boot:run`
2. [YES] Run migrations: V22, V23
3. 🔄 Test API endpoints với các test cases trên
4. 🔄 Verify RBAC: Login as different roles, check financial data visibility
5. 🔄 Test performance với large dataset
6. 🔄 Frontend integration: Update Transaction History Dashboard

## 📝 Notes

- **RBAC**: Sensitive data (totalValue, paidAmount, remainingDebt) tự động ẩn nếu user không có quyền VIEW_COST
- **Backward Compatible**: Existing transactions có `approval_status = 'APPROVED'` (default)
- **Payment Tracking**: Chỉ áp dụng cho IMPORT transactions
- **Appointment Linking**: Chỉ áp dụng cho EXPORT transactions
- **Search Performance**: Sử dụng composite index (transaction_code, invoice_number, transaction_date)

---

**Implementation Date**: 2025-11-25
**API Version**: v1 (không dùng /v3)
**Module**: Warehouse ERP V3
