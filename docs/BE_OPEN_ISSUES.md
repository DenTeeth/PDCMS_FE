# BE Open Issues (2025-01-27)

> ⚠️ Only **open** issues remain below. All resolved warehouse issues (#1‒#14) have been removed as requested.

---

## 📊 Summary

| # | Issue | Status | Priority | Owner | Est. Effort |
|---|-------|--------|----------|-------|-------------|
| 15 | Warehouse `GET /api/v1/warehouse/transactions` returns 500 | 🔴 Open | Critical | BE | ~1h |
| 16 | Transaction Approval Workflow - Missing Approve/Reject/Cancel Endpoints | 🔴 Open | High | BE | ~4h |
| 17 | API 6.7 Response Missing Fields - Approval Info, Payment Info, Appointment Info | 🔴 Open | Medium | BE | ~2h |

---

## #15 – Warehouse `GET /api/v1/warehouse/transactions` returns 500

**Status:** 🔴 **OPEN** • **Priority:** Critical  
**Endpoint:** `GET /api/v1/warehouse/transactions`  
**Files (suspected):** `warehouse/controller/TransactionHistoryController.java`, `warehouse/service/TransactionHistoryService.java`, `warehouse/repository/TransactionHistoryRepository.java`  
**Last Checked:** 2025-01-27 (Next.js console log & screenshot)

### ❌ Problem Statement
- Warehouse list API now responds with HTTP 500 on every request, even with default params.
- Regression occurred immediately after BE reported all warehouse issues resolved, so likely tied to recent mapper/service refactor.
- Because this endpoint powers `/admin/warehouse/storage`, users cannot view, filter, or open transactions; all downstream workflows are blocked.

### 🔎 Evidence
- FE console log: `❌ Get all transactions error: Request failed with status code 500` (`src/services/storageService.ts:67`).
- Stack trace shows Axios rejects before FE processes payload (screenshot shared earlier).
- Network tab confirms `GET /api/v1/warehouse/transactions` → 500 with empty body; request params were `{}` (React Query default).

### 🧪 Reproduction Steps
1. Login with warehouse permissions (admin account).  
2. Navigate to `/admin/warehouse/storage`.  
3. Observe toast + console error; transactions table remains empty because request fails with 500.

### 🚨 Impact
- **Critical blocker**: Warehouse operators cannot list/manage any import/export transactions.
- QA cannot verify the all issues resolved build because the first API already fails.
- Reports tab (which reuses this endpoint) also fails, so analytics are unavailable.

### ✅ Expected Behavior
- Endpoint should return `200 OK` with `List<TransactionResponse>` (even if empty).
- Must gracefully handle missing filters instead of throwing server errors.

### 🛠 Suggested Investigation
1. Inspect BE logs for the stack trace triggered by `/api/v1/warehouse/transactions`; likely originates inside the new TransactionHistory pipeline (service or mapper).
2. Ensure the new mapper/helper guards against null `supplier`, `createdBy`, or `item` references (possible NPE).
3. Verify latest warehouse DB migrations (new columns like `unit_name`, `item_master_id`) are applied to the environment returning 500.
4. Add temporary controller/service logging to capture request params and exception details to speed up debugging.

### ✅ Definition of Done
- `GET /api/v1/warehouse/transactions` reliably returns 200 with valid list payload.
- Warehouse list UI loads again so users can open transaction detail modal.
- Regression checks: import/export creation, detail view, and reports continue to work after the fix.

---

## #16 – Transaction Approval Workflow - Missing Approve/Reject/Cancel Endpoints

**Status:** 🔴 **OPEN** • **Priority:** High  
**Endpoints (Missing):** 
- `POST /api/v1/warehouse/transactions/{id}/approve`
- `POST /api/v1/warehouse/transactions/{id}/reject`
- `POST /api/v1/warehouse/transactions/{id}/cancel`  
**Files (Expected):** `warehouse/controller/TransactionHistoryController.java`, `warehouse/service/TransactionHistoryService.java`  
**Last Checked:** 2025-01-28

### ❌ Problem Statement
- FE đã implement đầy đủ UI để hiển thị và filter theo transaction status (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED).
- Tuy nhiên, BE chưa implement các endpoints để thực hiện các hành động duyệt/từ chối/hủy phiếu.
- Hiện tại `TransactionHistoryController` chỉ có 2 GET endpoints (API 6.6 & 6.7), không có POST endpoints cho approval workflow.
- FE không thể thực hiện các hành động approve/reject/cancel, dẫn đến workflow không hoàn chỉnh.
- **Additional Issue**: Các phiếu mới tạo không có `approvalStatus` được set trong response (null/undefined), FE phải set default = 'DRAFT' để hiển thị. BE nên set default `approvalStatus = DRAFT` khi tạo transaction mới.

### 🔎 Evidence
- `TransactionHistoryController.java` chỉ có:
  - `GET /api/v1/warehouse/transactions` (API 6.6)
  - `GET /api/v1/warehouse/transactions/{id}` (API 6.7)
- FE đã có UI hiển thị status badges và filters nhưng không có buttons để approve/reject vì không có endpoints.
- Document `TRANSACTION_APPROVAL_WORKFLOW.md` đã mô tả workflow nhưng các endpoints vẫn chưa được implement.

### 🧪 Reproduction Steps
1. Login với user có quyền `APPROVE_WAREHOUSE`.
2. Navigate to `/admin/warehouse/storage`.
3. Filter theo `status=PENDING_APPROVAL` để xem các phiếu chờ duyệt.
4. **Expected**: Có buttons "Duyệt" và "Từ chối" để thực hiện hành động.
5. **Actual**: Không có buttons vì FE không biết gọi endpoint nào.

### 🚨 Impact
- **Workflow không hoàn chỉnh**: Users không thể duyệt/từ chối phiếu từ UI.
- **Phải xử lý thủ công**: Phải vào database hoặc dùng tool khác để thay đổi status.
- **FE đã sẵn sàng**: FE đã implement đầy đủ UI, chỉ chờ BE implement endpoints.
- **Business logic thiếu**: Không có validation và business rules cho approval workflow.

### ✅ Expected Behavior

#### 1. **POST /api/v1/warehouse/transactions/{id}/approve**
- **Purpose**: Duyệt phiếu nhập/xuất kho
- **Request Body** (Optional):
  ```json
  {
    "approvedBy": 123,  // Employee ID (lấy từ token)
    "notes": "Đã kiểm tra và duyệt"  // Optional
  }
  ```
- **Response**: `200 OK` với transaction detail đã được cập nhật (status = APPROVED)
- **Business Logic**:
  - Chỉ có thể approve khi `status = PENDING_APPROVAL`
  - Sau khi approve, cập nhật tồn kho (inventory) nếu chưa cập nhật
  - Ghi lại `approvedBy` và `approvedAt`
  - Trả về lỗi nếu status không phải PENDING_APPROVAL
- **Permissions**: `APPROVE_WAREHOUSE` authority required

#### 2. **POST /api/v1/warehouse/transactions/{id}/reject**
- **Purpose**: Từ chối phiếu nhập/xuất kho
- **Request Body**:
  ```json
  {
    "rejectedBy": 123,  // Employee ID (lấy từ token)
    "rejectionReason": "Số lượng không khớp với hóa đơn"  // Required
  }
  ```
- **Response**: `200 OK` với transaction detail đã được cập nhật (status = REJECTED)
- **Business Logic**:
  - Chỉ có thể reject khi `status = PENDING_APPROVAL`
  - Không cập nhật tồn kho
  - Ghi lại `rejectedBy`, `rejectedAt`, và `rejectionReason`
  - Trả về lỗi nếu status không phải PENDING_APPROVAL hoặc thiếu rejectionReason
- **Permissions**: `REJECT_WAREHOUSE` authority required

#### 3. **POST /api/v1/warehouse/transactions/{id}/cancel**
- **Purpose**: Hủy phiếu nhập/xuất kho
- **Request Body** (Optional):
  ```json
  {
    "cancelledBy": 123,  // Employee ID (lấy từ token)
    "cancellationReason": "Nhập nhầm thông tin"  // Optional
  }
  ```
- **Response**: `200 OK` với transaction detail đã được cập nhật (status = CANCELLED)
- **Business Logic**:
  - Có thể cancel khi `status = DRAFT` hoặc `PENDING_APPROVAL`
  - Không cập nhật tồn kho
  - Ghi lại `cancelledBy`, `cancelledAt`, và `cancellationReason`
  - Trả về lỗi nếu status đã là APPROVED (không thể hủy phiếu đã duyệt)
- **Permissions**: `UPDATE_WAREHOUSE` hoặc `CANCEL_WAREHOUSE` authority required

### 🛠 Suggested Implementation

#### Controller Methods
```java
@PostMapping("/transactions/{id}/approve")
@PreAuthorize("hasAuthority('APPROVE_WAREHOUSE')")
public ResponseEntity<?> approveTransaction(
    @PathVariable Long id,
    @RequestBody(required = false) ApprovalRequest request) {
    // Implementation
}

@PostMapping("/transactions/{id}/reject")
@PreAuthorize("hasAuthority('REJECT_WAREHOUSE')")
public ResponseEntity<?> rejectTransaction(
    @PathVariable Long id,
    @RequestBody RejectionRequest request) {
    // Implementation
}

@PostMapping("/transactions/{id}/cancel")
@PreAuthorize("hasAuthority('UPDATE_WAREHOUSE') or hasAuthority('CANCEL_WAREHOUSE')")
public ResponseEntity<?> cancelTransaction(
    @PathVariable Long id,
    @RequestBody(required = false) CancellationRequest request) {
    // Implementation
}
```

#### Service Layer
- Validate transaction status trước khi thay đổi
- Update transaction entity với status mới và audit fields
- Trigger inventory update (chỉ khi approve)
- Log action vào transaction history/audit log

#### Database Updates
- Ensure `StorageTransaction` entity has fields:
  - `approvedBy` (Employee ID)
  - `approvedAt` (LocalDateTime)
  - `rejectedBy` (Employee ID)
  - `rejectedAt` (LocalDateTime)
  - `rejectionReason` (String)
  - `cancelledBy` (Employee ID)
  - `cancelledAt` (LocalDateTime)
  - `cancellationReason` (String)

### ✅ Definition of Done
- [ ] `POST /api/v1/warehouse/transactions/{id}/approve` implemented và tested
- [ ] `POST /api/v1/warehouse/transactions/{id}/reject` implemented và tested
- [ ] `POST /api/v1/warehouse/transactions/{id}/cancel` implemented và tested
- [ ] Proper RBAC permissions checked cho từng endpoint
- [ ] Business logic validation (status checks, inventory updates)
- [ ] Audit fields được ghi lại đầy đủ
- [ ] Error handling rõ ràng (400 Bad Request cho invalid status, 403 Forbidden cho missing permissions)
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] FE có thể gọi các endpoints này và hiển thị kết quả trong UI

### 📝 Related Documents
- `docs/api-guide/warehouse/TRANSACTION_APPROVAL_WORKFLOW.md` - Workflow documentation
- `docs/api-guide/warehouse/API_6.6_TRANSACTION_HISTORY_IMPLEMENTATION_SUMMARY.md` - API 6.6 details

---

## #17 – API 6.7 Response Missing Fields - Approval Info, Payment Info, Appointment Info

**Status:** 🔴 **OPEN** • **Priority:** Medium  
**Endpoint:** `GET /api/v1/warehouse/transactions/{id}` (API 6.7)  
**Files (Affected):** 
- `warehouse/dto/response/ImportTransactionResponse.java`
- `warehouse/dto/response/ExportTransactionResponse.java`
- `warehouse/service/TransactionHistoryService.java`  
**Last Checked:** 2025-01-28

### ❌ Problem Statement
- API 6.7 (`GET /api/v1/warehouse/transactions/{id}`) trả về `ImportTransactionResponse` hoặc `ExportTransactionResponse` nhưng thiếu một số fields quan trọng.
- FE không thể hiển thị đầy đủ thông tin trong transaction detail modal vì BE không trả về các fields này.
- RBAC handling cho payment info và appointment info chưa được implement đầy đủ.

### 🔎 Evidence

#### **ImportTransactionResponse** thiếu:
1. ❌ `approvedByName` (String) - Tên người duyệt phiếu
2. ❌ `approvedAt` (LocalDateTime) - Thời gian duyệt
3. ❌ `paymentStatus` (PaymentStatus enum) - Trạng thái thanh toán
4. ❌ `paidAmount` (BigDecimal) - Số tiền đã thanh toán
5. ❌ `remainingDebt` (BigDecimal) - Số tiền còn nợ
6. ❌ `dueDate` (LocalDate) - Hạn thanh toán
7. ⚠️ `status` có nhưng là String, nên là `TransactionStatus` enum để consistent với API 6.6

#### **ExportTransactionResponse** thiếu:
1. ❌ `approvedByName` (String) - Tên người duyệt phiếu
2. ❌ `approvedAt` (LocalDateTime) - Thời gian duyệt
3. ❌ `status` (TransactionStatus enum) - Trạng thái duyệt
4. ❌ `relatedAppointmentId` (Long) - ID ca điều trị (chỉ có `referenceCode` là appointmentCode)
5. ❌ `patientName` (String) - Tên bệnh nhân (có trong `TransactionHistoryItemDto` nhưng không có trong `ExportTransactionResponse`)

#### **Code Evidence:**
- `TransactionHistoryService.mapToImportResponse()` không map payment info và approval info
- `TransactionHistoryService.mapToExportResponse()` không map approval info và patient info
- `TransactionHistoryItemDto` (API 6.6) có đầy đủ fields nhưng `ImportTransactionResponse` và `ExportTransactionResponse` (API 6.7) thiếu

### 🧪 Reproduction Steps
1. Call `GET /api/v1/warehouse/transactions/{id}` với transaction ID của một phiếu IMPORT đã được duyệt.
2. **Expected**: Response có `approvedByName`, `approvedAt`, `paymentStatus`, `paidAmount`, `remainingDebt`, `dueDate`.
3. **Actual**: Response không có các fields này, chỉ có basic info (transactionCode, supplierName, invoiceNumber, items).

4. Call `GET /api/v1/warehouse/transactions/{id}` với transaction ID của một phiếu EXPORT có liên kết appointment.
5. **Expected**: Response có `approvedByName`, `approvedAt`, `status`, `relatedAppointmentId`, `patientName`.
6. **Actual**: Response không có các fields này, chỉ có `referenceCode` (appointmentCode).

### 🚨 Impact
- **FE không thể hiển thị đầy đủ thông tin**: Users không thấy được ai đã duyệt phiếu, khi nào duyệt, trạng thái thanh toán, thông tin bệnh nhân.
- **Inconsistent với API 6.6**: API 6.6 (`GET /api/v1/warehouse/transactions`) trả về `TransactionHistoryItemDto` có đầy đủ fields, nhưng API 6.7 (detail) lại thiếu.
- **RBAC không hoàn chỉnh**: Payment info và appointment info cần RBAC handling nhưng chưa được implement.

### ✅ Expected Behavior

#### **ImportTransactionResponse** nên có thêm:
```java
// Approval info
private String approvedByName;
private LocalDateTime approvedAt;

// Payment info (RBAC: Requires VIEW_COST for paidAmount, remainingDebt)
private PaymentStatus paymentStatus;
private BigDecimal paidAmount;  // null if no VIEW_COST
private BigDecimal remainingDebt;  // null if no VIEW_COST
private LocalDate dueDate;

// Status (should be TransactionStatus enum, not String)
private TransactionStatus status;  // Instead of String status
```

#### **ExportTransactionResponse** nên có thêm:
```java
// Approval info
private String approvedByName;
private LocalDateTime approvedAt;

// Status
private TransactionStatus status;

// Appointment info
private Long relatedAppointmentId;  // In addition to referenceCode
private String patientName;
```

### 🛠 Suggested Implementation

#### 1. **Update DTOs**
- Add missing fields to `ImportTransactionResponse.java`
- Add missing fields to `ExportTransactionResponse.java`
- Change `status` from `String` to `TransactionStatus` enum in `ImportTransactionResponse`

#### 2. **Update Service Mapping**
- Update `mapToImportResponse()` to include:
  - Approval info: `approvedByName`, `approvedAt`
  - Payment info: `paymentStatus`, `paidAmount` (with RBAC), `remainingDebt` (with RBAC), `dueDate`
  - Status: `tx.getApprovalStatus()` (TransactionStatus enum)
  
- Update `mapToExportResponse()` to include:
  - Approval info: `approvedByName`, `approvedAt`
  - Status: `tx.getApprovalStatus()` (TransactionStatus enum)
  - Appointment info: `relatedAppointmentId`, `patientName` (fetch from appointment if available)

#### 3. **RBAC Handling**
- Payment info (`paidAmount`, `remainingDebt`) chỉ set nếu user có `VIEW_COST` permission
- Other fields (approval info, appointment info) không cần RBAC vì không phải sensitive data

#### 4. **Code Example**
```java
// In mapToImportResponse()
.builder()
    // ... existing fields ...
    .approvedByName(tx.getApprovedBy() != null ? tx.getApprovedBy().getFullName() : null)
    .approvedAt(tx.getApprovedAt())
    .status(tx.getApprovalStatus())  // TransactionStatus enum
    .paymentStatus(tx.getPaymentStatus())
    .dueDate(tx.getDueDate())
    // ... existing fields ...

// Add payment info with RBAC
if (hasViewCostPermission) {
    builder.paidAmount(tx.getPaidAmount())
           .remainingDebt(tx.getRemainingDebt());
}
```

```java
// In mapToExportResponse()
.builder()
    // ... existing fields ...
    .approvedByName(tx.getApprovedBy() != null ? tx.getApprovedBy().getFullName() : null)
    .approvedAt(tx.getApprovedAt())
    .status(tx.getApprovalStatus())  // TransactionStatus enum
    .relatedAppointmentId(tx.getRelatedAppointment() != null ? 
        tx.getRelatedAppointment().getAppointmentId().longValue() : null)
    // ... existing fields ...

// Get patient name
if (tx.getRelatedAppointment() != null && tx.getRelatedAppointment().getPatientId() != null) {
    Optional<Patient> patient = patientRepository.findById(
        tx.getRelatedAppointment().getPatientId());
    patient.ifPresent(p -> builder.patientName(p.getFullName()));
}
```

### ✅ Definition of Done
- [ ] `ImportTransactionResponse` có đầy đủ fields: `approvedByName`, `approvedAt`, `paymentStatus`, `paidAmount`, `remainingDebt`, `dueDate`
- [ ] `ExportTransactionResponse` có đầy đủ fields: `approvedByName`, `approvedAt`, `status`, `relatedAppointmentId`, `patientName`
- [ ] `status` field trong `ImportTransactionResponse` đổi từ `String` sang `TransactionStatus` enum
- [ ] Service mapping (`mapToImportResponse`, `mapToExportResponse`) được cập nhật để map các fields mới
- [ ] RBAC handling cho payment info (`paidAmount`, `remainingDebt`) được implement
- [ ] Patient name được fetch và map vào `ExportTransactionResponse`
- [ ] API documentation (Swagger) được cập nhật
- [ ] FE có thể hiển thị đầy đủ thông tin trong transaction detail modal

### 📝 Related Documents
- `docs/api-guide/warehouse/API_6.7_TRANSACTION_DETAIL_COMPLETE.md` - API 6.7 specification
- `docs/api-guide/warehouse/API_6.7_FE_IMPLEMENTATION_STATUS.md` - FE implementation status
- `docs/api-guide/warehouse/API_6.6_TRANSACTION_HISTORY_IMPLEMENTATION_SUMMARY.md` - API 6.6 (có đầy đủ fields trong `TransactionHistoryItemDto`)
