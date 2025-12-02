# 📋 Tổng Hợp Các Thay Đổi Mới Từ BE - Warehouse Module

**Ngày cập nhật:** 30/11/2025  
**Phiên bản:** V30  
**Tổng số API mới:** 5 APIs (6.13 - 6.17)

---

## 🎯 Tổng Quan

BE đã cập nhật và bổ sung nhiều tính năng mới cho Warehouse module, tập trung vào:

1. **Supplier Management** - Quản lý nhà cung cấp với business metrics và risk management
2. **Service Consumables** - Quản lý vật tư tiêu hao cho dịch vụ nha khoa
3. **Bug Fixes** - Sửa các lỗi critical trong seed data và transaction service
4. **FE Issues Resolution** - Giải quyết các vấn đề FE đã báo cáo

---

## 📦 API MỚI

### 1. API 6.13: Get Suppliers với Business Metrics

**Endpoint:** `GET /api/v1/warehouse/suppliers/list`

**Mục đích:** Lấy danh sách nhà cung cấp với các metrics kinh doanh để hỗ trợ quyết định procurement thông minh.

**Tính năng chính:**

#### 1.1. Multi-Field Search
- Tìm kiếm đa trường: `supplierName`, `supplierCode`, `phoneNumber`, `email`
- Case-insensitive LIKE search
- Ví dụ: `?search=ABC` tìm được "ABC Corp", "abc@example.com", "SUP-ABC-001"

#### 1.2. Business Metrics (Denormalized)
- **`totalOrders`**: Số lượng đơn hàng đã nhập từ NCC này
  - Use case: Xác định NCC đáng tin cậy (số đơn cao = track record tốt)
  - Tự động cập nhật khi có import transaction mới
  
- **`lastOrderDate`**: Ngày đặt hàng gần nhất
  - Use case: Phát hiện NCC không hoạt động (> 6 tháng = cần follow-up)
  - Frontend có thể highlight NCC không đặt hàng gần đây

#### 1.3. Blacklist Warning System
- **`isBlacklisted`**: Cờ đánh dấu NCC có vấn đề
  - `TRUE` = Có vấn đề chất lượng, fraud, giao hàng trễ, hóa đơn giả
  - Frontend nên hiển thị cảnh báo: ⚠️ "DO NOT ORDER FROM THIS SUPPLIER"
  - Filter: `?isBlacklisted=false` để loại trừ NCC blacklisted khỏi procurement

#### 1.4. Advanced Filtering
- `isBlacklisted`: Filter theo trạng thái blacklist (true/false/null)
- `isActive`: Filter theo trạng thái hoạt động (true/false/null)
- `search`: Multi-field keyword search

#### 1.5. Flexible Sorting
- Sort fields: `supplierName`, `supplierCode`, `totalOrders`, `lastOrderDate`, `createdAt`, `tierLevel`, `ratingScore`
- Sort directions: `ASC` | `DESC`
- Default: `supplierName ASC`

#### 1.6. Pagination
- Page size: 1-100 items (default 20)
- Zero-indexed pages
- Returns full pagination metadata

**Authorization:**
- `ROLE_ADMIN` hoặc
- `VIEW_WAREHOUSE` hoặc
- `MANAGE_SUPPLIERS`

**Response Example:**
```json
{
  "suppliers": [
    {
      "supplierId": 1,
      "supplierCode": "SUP-001",
      "supplierName": "Công ty Vật Tư Nha Khoa A",
      "phoneNumber": "0901234567",
      "email": "info@vatlieunk.vn",
      "address": "123 Nguyen Van Linh, Q.7, TP.HCM",
      "tierLevel": "TIER_1",
      "ratingScore": 4.8,
      "totalOrders": 25,
      "lastOrderDate": "2024-01-15",
      "isBlacklisted": false,
      "isActive": true,
      "notes": "Nhà cung cấp chính, chất lượng tốt",
      "createdAt": "2024-01-10T10:30:00",
      "updatedAt": "2024-01-20T15:45:00"
    }
  ],
  "currentPage": 0,
  "pageSize": 20,
  "totalElements": 150,
  "totalPages": 8,
  "isFirst": true,
  "isLast": false,
  "hasNext": true,
  "hasPrevious": false
}
```

**Helper Method:**
- `SupplierListDTO.isInactive()`: Kiểm tra NCC có inactive không (> 6 tháng không có đơn hàng)

---

### 2. API 6.14: Create New Supplier

**Endpoint:** `POST /api/v1/warehouse/suppliers`

**Mục đích:** Tạo mới nhà cung cấp với auto-generate supplier code.

**Tính năng:**
- Auto-generate supplier code: `SUP-001`, `SUP-002`, ...
- Validate name uniqueness (case-insensitive)
- Validate email uniqueness (case-insensitive)
- Set default values: `isActive=true`, `totalOrders=0`, `lastOrderDate=null`

**Request Body:**
```json
{
  "supplierName": "Cong ty Duoc Pham TW1",
  "phone": "0909123456",
  "email": "sales@tw1.com.vn",
  "address": "350 Hai Ba Trung, Quan 1, TP.HCM",
  "isBlacklisted": false,
  "notes": "Chuyen cung cap thuoc gay te va khang sinh"
}
```

**Validation Rules:**
- `supplierName`: Required, 2-255 chars, unique (case-insensitive)
- `phone`: Required, 10-11 digits, numeric only
- `email`: Optional, valid email format, unique if provided
- `address`: Optional, max 500 characters
- `isBlacklisted`: Optional, default false
- `notes`: Optional, max 1000 characters

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Supplier created successfully",
  "data": {
    "supplierId": 6,
    "supplierCode": "SUP-006",
    "supplierName": "Cong ty Duoc Pham TW1",
    "phoneNumber": "0909123456",
    "email": "sales@tw1.com.vn",
    "address": "350 Hai Ba Trung, Quan 1, TP.HCM",
    "isActive": true,
    "isBlacklisted": false,
    "totalOrders": 0,
    "lastOrderDate": null,
    "notes": "Chuyen cung cap thuoc gay te va khang sinh",
    "createdAt": "2025-11-29T10:30:00",
    "status": "ACTIVE"
  }
}
```

**Authorization:**
- `ROLE_ADMIN` hoặc
- `MANAGE_SUPPLIERS` hoặc
- `MANAGE_WAREHOUSE`

**Error Responses:**
- `409 CONFLICT`: Duplicate supplier name (case-insensitive)
- `409 CONFLICT`: Duplicate email (case-insensitive)

---

### 3. API 6.15: Update Supplier

**Endpoint:** `PUT /api/v1/warehouse/suppliers/{supplierId}`

**Mục đích:** Cập nhật thông tin nhà cung cấp và risk management flags.

**Tính năng:**
- Update profile information (name, contact, address)
- Update risk management flags (`isActive`, `isBlacklisted`)
- **NEW FIELD (V30):** `contactPerson` - Tên người liên hệ

**Request Body:**
```json
{
  "supplierName": "Cong ty Duoc Pham TW1 (CN HCM)",
  "contactPerson": "Tran Thi B (Sales Manager)",
  "phoneNumber": "0909999888",
  "email": "new_sales@tw1.com.vn",
  "address": "350 Hai Ba Trung, District 1, HCMC",
  "isActive": true,
  "isBlacklisted": false,
  "notes": "Updated contact person - previous representative retired"
}
```

**Field Validation:**
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| supplierName | String | Yes | 2-255 chars | Must be unique (case-insensitive) |
| contactPerson | String | No | Max 255 chars | **NEW in V30** |
| phoneNumber | String | Yes | 10-11 digits, starts with 0 | Vietnamese phone format |
| email | String | No | Valid email, max 255 chars | Must be unique if provided |
| address | String | No | Max 500 chars | Physical address |
| isActive | Boolean | No | - | false = Pause orders temporarily |
| isBlacklisted | Boolean | No | - | true = Fraud warning |
| notes | String | No | Max 1000 chars | Additional information |

**Response (200 OK):**
```json
{
  "supplierId": 1,
  "supplierCode": "SUP-001",
  "supplierName": "Cong ty Vat tu Nha khoa A (Updated)",
  "contactPerson": "Nguyen Van A - Sales Manager",
  "phoneNumber": "0901234567",
  "email": "sales@vtnk-a.com",
  "address": "123 Le Loi, District 1, HCMC (New Address)",
  "isActive": true,
  "isBlacklisted": false,
  "totalOrders": 27,
  "lastOrderDate": "2025-11-29",
  "notes": "Updated contact information",
  "createdAt": "2025-05-28T19:05:52.535696",
  "status": "ACTIVE"
}
```

**Authorization:**
- `ROLE_ADMIN` hoặc
- `MANAGE_SUPPLIERS` hoặc
- `MANAGE_WAREHOUSE`

**Error Responses:**
- `404 NOT_FOUND`: Supplier không tồn tại
- `409 CONFLICT`: Duplicate supplier name
- `409 CONFLICT`: Duplicate email

**Note:** Metrics (`totalOrders`, `lastOrderDate`) **KHÔNG** được cập nhật qua API này. Chúng chỉ được cập nhật tự động khi có import transaction mới.

---

### 4. API 6.16: Soft Delete Supplier

**Endpoint:** `DELETE /api/v1/warehouse/suppliers/{id}`

**Mục đích:** Soft delete nhà cung cấp (set `isActive=false`) với validation transaction history.

**Business Rules:**

#### BR-1: Soft Delete Only
- Suppliers **KHÔNG BAO GIỜ** bị xóa vĩnh viễn khỏi database
- DELETE operation set `isActive=false` và `status="INACTIVE"`
- Tất cả historical data (transactions, items, metadata) được giữ lại
- Inactive suppliers không thể được sử dụng trong transactions mới

#### BR-2: Transaction History Protection
- **KHÔNG THỂ xóa suppliers có transaction history**
- System kiểm tra `storage_transaction` table cho bất kỳ records nào liên kết với supplier
- Nếu có transactions → returns `409 Conflict` với error code `SUPPLIER_HAS_TRANSACTIONS`
- Bảo vệ referential integrity và audit trails

#### BR-3: Authorization Requirements
- User phải có **ADMIN** role HOẶC
- User phải có **MANAGE_SUPPLIERS** permission HOẶC
- User phải có **MANAGE_WAREHOUSE** permission
- Unauthorized access returns `403 Forbidden`

**Success Response:**
- **HTTP Status:** `204 No Content`
- **Response Body:** None

**Database Changes:**
- `supplier.is_active` changed from `true` to `false`
- `supplier.status` changed from `ACTIVE` to `INACTIVE`
- `supplier.updated_at` timestamp updated

**Error Responses:**

**404 Not Found:**
```json
{
  "timestamp": "2025-11-29T18:45:00.123Z",
  "status": 404,
  "error": "Not Found",
  "message": "Supplier not found with id: 9999",
  "path": "/api/v1/warehouse/suppliers/9999"
}
```

**409 Conflict - Has Transactions:**
```json
{
  "timestamp": "2025-11-29T18:45:00.123Z",
  "status": 409,
  "error": "Conflict",
  "message": "Cannot delete supplier with id: 1. Supplier has transaction history. Use isActive=false to deactivate instead.",
  "path": "/api/v1/warehouse/suppliers/1"
}
```

**403 Forbidden:**
```json
{
  "timestamp": "2025-11-29T18:45:00.123Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/v1/warehouse/suppliers/1"
}
```

---

### 5. API 6.17: Get Service Consumables (BOM)

**Endpoint:** `GET /api/v1/warehouse/consumables/services/{serviceId}`

**Mục đích:** Lấy **Bill of Materials (BOM)** cho một dịch vụ nha khoa - danh sách vật tư tiêu hao cần thiết với real-time stock availability và cost information.

**Use Cases:**
1. **Can we perform this service?** (Stock availability check)
2. **How much does this service cost in materials?** (COGS calculation)
3. **What items do we need to prepare?** (Material planning)

**Tính năng chính:**

#### 5.1. Real-Time Stock Status
- **`OUT_OF_STOCK`**: `currentStock <= 0`
- **`LOW`**: `currentStock < requiredQuantity` (không đủ cho service này)
- **`OK`**: `currentStock >= requiredQuantity` (đủ)

#### 5.2. Cost Calculation
- `unitPrice`: Latest market price từ `item_masters.current_market_price`
- `totalCost`: `quantity × unitPrice`
- `totalConsumableCost`: Sum of all item totalCosts

#### 5.3. Warning Flag
- `hasInsufficientStock = true`: Nếu BẤT KỲ item nào có status `LOW` hoặc `OUT_OF_STOCK`
- Dùng để block appointment booking hoặc hiển thị warning cho staff

#### 5.4. Permission-Based Pricing (RBAC) ⭐ **NEW FEATURE**

**Price fields (`unitPrice`, `totalCost`, `totalConsumableCost`) được trả về có điều kiện dựa trên user permissions:**

| Permission | View Quantities | View Prices | Use Case |
|------------|----------------|-------------|----------|
| VIEW_WAREHOUSE_COST | Yes | Yes | Admin, Manager, Accountant - Full visibility |
| VIEW_WAREHOUSE (only) | Yes | No | Warehouse Staff - Material planning only |
| VIEW_SERVICES (only) | Yes | No | Doctors/Receptionists - Stock check only |

**Implementation:**
- Users **KHÔNG CÓ** `VIEW_WAREHOUSE_COST` permission: Price fields **KHÔNG CÓ** trong JSON response (không phải null, mà hoàn toàn không có)
- Users **CÓ** `VIEW_WAREHOUSE_COST` permission: Price fields **CÓ** với actual values

**Example Responses:**

**Admin response (has VIEW_WAREHOUSE_COST):**
```json
{
  "serviceId": 7,
  "serviceName": "Nhổ răng sữa",
  "totalConsumableCost": 25000.00,  // ← Price field included
  "hasInsufficientStock": true,
  "consumables": [
    {
      "itemMasterId": 1,
      "itemCode": "CON-GAUZE-01",
      "itemName": "Bông gạc phẫu thuật",
      "quantity": 1.00,
      "unitName": "Gói",
      "currentStock": 0,
      "stockStatus": "OUT_OF_STOCK",
      "unitPrice": 15000,             // ← Price field included
      "totalCost": 15000.00           // ← Price field included
    }
  ]
}
```

**Dentist response (no VIEW_WAREHOUSE_COST):**
```json
{
  "serviceId": 7,
  "serviceName": "Nhổ răng sữa",
  // totalConsumableCost field NOT PRESENT (not null, completely excluded)
  "hasInsufficientStock": true,
  "consumables": [
    {
      "itemMasterId": 1,
      "itemCode": "CON-GAUZE-01",
      "itemName": "Bông gạc phẫu thuật",
      "quantity": 1.00,
      "unitName": "Gói",
      "currentStock": 0,
      "stockStatus": "OUT_OF_STOCK"
      // unitPrice and totalCost fields NOT PRESENT (not null, completely excluded)
    }
  ]
}
```

**Authorization:**
- `ROLE_ADMIN` hoặc
- `VIEW_WAREHOUSE` hoặc
- `VIEW_SERVICES`

**Error Responses:**

**404 Not Found - Service Does Not Exist:**
```json
{
  "timestamp": "2025-11-30T10:30:00.123Z",
  "status": 404,
  "error": "Not Found",
  "message": "Service not found with id: 999",
  "path": "/api/v1/warehouse/consumables/services/999"
}
```

**404 Not Found - No Consumables Defined:**
```json
{
  "timestamp": "2025-11-30T10:30:00.123Z",
  "status": 404,
  "error": "Not Found",
  "message": "No consumables defined for service ID: 5. Please configure consumables in service management.",
  "path": "/api/v1/warehouse/consumables/services/5"
}
```

**403 Forbidden:**
```json
{
  "timestamp": "2025-11-30T10:30:00.123Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/v1/warehouse/consumables/services/1"
}
```

---

## 🐛 Bug Fixes

### 1. Storage Transactions Seed Data Bug (CRITICAL)

**Issue:** INSERT statements trong seed data không khớp với database schema  
**Impact:** Application startup failure  
**Root Cause:** Mismatch giữa entity field names, schema column names, và seed data

**Changes Made:**
- Changed `created_by` → `created_by_id` (6 statements)
- Changed `approved_by` → `approved_by_id` (5 statements)
- Changed `notes` → `description` (6 statements)
- Changed `transaction_type` → `type` (6 statements)
- Added `status` column với values: 'COMPLETED', 'DRAFT', 'CANCELLED' (6 statements)
- Fixed rejected transaction để sử dụng `rejected_by_id` và `rejection_reason` thay vì `approved_by_id` (1 statement)
- Fixed sequence reset: `storage_transactions_storage_transaction_id_seq` thay vì `storage_transactions_transaction_id_seq`
- Fixed column reference: `storage_transaction_id` thay vì `transaction_id`

**Files Modified:**
- `src/main/resources/db/dental-clinic-seed-data.sql` (Lines 3339-3375)

**Status:** ✅ FIXED

---

### 2. TransactionHistoryService Missing Employee Tracking

**Issue:** Code cố gắng gọi method không tồn tại `SecurityUtil.getCurrentEmployeeId()`  
**Impact:** Compilation failure  
**Root Cause:** JWT tokens không chứa employee_id claim

**Changes Made:**
- Removed commented code attempting to create empty Employee objects
- Added log warnings khi approving/rejecting/cancelling mà không có employee tracking
- Left `approvedBy`, `rejectedBy`, `cancelledBy` fields as NULL (acceptable for MVP)
- Added NOTE comments giải thích limitation

**Files Modified:**
- `src/main/java/com/dental/clinic/management/warehouse/service/TransactionHistoryService.java`
  - Line ~469: approve transaction
  - Line ~515: reject transaction
  - Line ~553: cancel transaction

**Status:** ✅ FIXED (temporary workaround, proper fix requires JWT claim changes)

---

### 3. ImportTransactionService Type Conversion Error

**Issue:** Entity returns String status, nhưng response DTO expects TransactionStatus enum  
**Impact:** Compilation failure  
**Root Cause:** Legacy String field trong entity, new enum trong DTO

**Changes Made:**
```java
// Before (compilation error):
.status(transaction.getStatus())  // String → TransactionStatus mismatch

// After (working):
.status(TransactionStatus.valueOf(transaction.getStatus()))  // Explicit conversion
```

**Files Modified:**
- `src/main/java/com/dental/clinic/management/warehouse/service/ImportTransactionService.java` (Line 425)

**Status:** ✅ FIXED

---

### 4. ItemMasterMapper Deprecated Method

**Issue:** `updateEntity()` method sử dụng old UpdateItemMasterRequest structure không có units array  
**Impact:** Compilation errors nếu được gọi  
**Root Cause:** API 6.10 redesigned UpdateItemMasterRequest với units array

**Changes Made:**
- Deprecated `updateEntity()` method
- Method giờ throws `UnsupportedOperationException` với migration message
- Added comment directing to new `ItemMasterService.updateItemMaster()` method

**Files Modified:**
- `src/main/java/com/dental/clinic/management/warehouse/mapper/ItemMasterMapper.java`

**Status:** ✅ FIXED

---

## 🔧 FE Issues Resolution

### Issue #18: API 6.1 - Inventory Summary Returns 500 Error

**Status:** ✅ RESOLVED - NOT A BUG

**Finding:** API đang hoạt động đúng. Lỗi 500 là do FE sử dụng sai endpoint URL.

**Correct Endpoint:**
```
GET /api/v1/inventory/summary
```

**Test Results (2025-11-29):**
- Status Code: 200 OK
- Response Time: 254ms
- Authentication: Valid (admin token)
- Data: Successfully returned 34 inventory items với pagination

**Resolution:**
- BE Code: ✅ Correct implementation
- Seed Data: ✅ Valid and sufficient
- FE Action: **No changes needed** - API is production ready

---

### Issue #19: API 6.2 - Item Batches Returns 500 Error

**Status:** ✅ RESOLVED - INCORRECT ENDPOINT URL

**Finding:** API đang hoạt động đúng. Lỗi 500 là do sai endpoint URL format.

**Incorrect URL (Used by FE Test):**
```
GET /api/v1/inventory/1/batches  // WRONG - causes 404
```

**Correct Endpoint:**
```
GET /api/v1/inventory/batches/{itemMasterId}  // CORRECT
```

**Example Correct URLs:**
```
GET /api/v1/inventory/batches/1   // Get batches for item 1
GET /api/v1/inventory/batches/24  // Get batches for item 24
```

**Test Results (2025-11-29):**
- Status Code: 200 OK
- Response Time: 89ms
- Authentication: Valid (admin token)
- Data: Successfully returned batch list với FEFO sorting

**Resolution:**
- BE Code: ✅ Correct implementation
- Endpoint Format: **/api/v1/inventory/batches/{itemMasterId}** (not /inventory/{id}/batches)
- FE Action: **Update endpoint URL format** trong API calls

---

### Issue #23: Payment Status Default Value for DRAFT Import Transactions

**Status:** ✅ FIXED IN V30

**Finding:** Valid issue. Import transactions với DRAFT status có thể có `paymentStatus = null`, yêu cầu FE handle fallback logic.

**What Changed:**
Modified `StorageTransaction` entity để set default `paymentStatus = UNPAID` cho tất cả import transactions.

**Code Change:**
```java
// Before (V29)
@Enumerated(EnumType.STRING)
@Column(name = "payment_status", length = 20)
private PaymentStatus paymentStatus; // Could be null

// After (V30)
@Enumerated(EnumType.STRING)
@Column(name = "payment_status", length = 20)
@Builder.Default
private PaymentStatus paymentStatus = PaymentStatus.UNPAID; // Never null
```

**Impact:**
- Tất cả new import transactions sẽ có `paymentStatus = "UNPAID"` by default
- API 6.7 (Transaction Detail) sẽ luôn return non-null `paymentStatus`
- FE có thể remove fallback logic: `const paymentStatus = transaction.paymentStatus || 'UNPAID'`

**Resolution:**
- BE Code: ✅ Fixed - Added @Builder.Default to entity
- Schema: V30 - No migration needed (only affects new records)
- FE Action: **Can remove fallback logic** after deployment (optional - keeping it doesn't hurt)

---

## 📊 Database Schema Changes

### V25: Add is_blacklisted Column

**Migration:** `V25_add_is_blacklisted_to_suppliers.sql`

```sql
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX idx_suppliers_blacklisted ON suppliers(is_blacklisted);
```

**Entity Update:**
```java
@Column(name = "is_blacklisted")
@Builder.Default
private Boolean isBlacklisted = false;
```

---

### V30: Add contact_person Column

**Migration:** `V30_add_contact_person_to_suppliers.sql`

```sql
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
```

**Entity Update:**
```java
@Column(name = "contact_person", length = 255)
private String contactPerson;
```

---

### V30: Payment Status Default Value

**Entity Update:**
```java
@Enumerated(EnumType.STRING)
@Column(name = "payment_status", length = 20)
@Builder.Default
private PaymentStatus paymentStatus = PaymentStatus.UNPAID; // Never null
```

**Note:** No migration needed - chỉ ảnh hưởng new records.

---

## 🔐 Authorization & Permissions

### Supplier APIs

| API | Endpoint | Required Permissions |
|-----|----------|---------------------|
| 6.13 | GET `/api/v1/warehouse/suppliers/list` | `ROLE_ADMIN` \| `VIEW_WAREHOUSE` \| `MANAGE_SUPPLIERS` |
| 6.14 | POST `/api/v1/warehouse/suppliers` | `ROLE_ADMIN` \| `MANAGE_SUPPLIERS` \| `MANAGE_WAREHOUSE` |
| 6.15 | PUT `/api/v1/warehouse/suppliers/{id}` | `ROLE_ADMIN` \| `MANAGE_SUPPLIERS` \| `MANAGE_WAREHOUSE` |
| 6.16 | DELETE `/api/v1/warehouse/suppliers/{id}` | `ROLE_ADMIN` \| `MANAGE_SUPPLIERS` \| `MANAGE_WAREHOUSE` |

### Service Consumables API

| API | Endpoint | Required Permissions |
|-----|----------|---------------------|
| 6.17 | GET `/api/v1/warehouse/consumables/services/{id}` | `ROLE_ADMIN` \| `VIEW_WAREHOUSE` \| `VIEW_SERVICES` |

**Price Visibility (RBAC):**
- Users **WITH** `VIEW_WAREHOUSE_COST`: See `unitPrice`, `totalCost`, `totalConsumableCost`
- Users **WITHOUT** `VIEW_WAREHOUSE_COST`: Price fields excluded from JSON response

---

## 🎨 Frontend Integration Recommendations

### 1. Supplier List với Warnings

```jsx
// React example
function SupplierCard({ supplier }) {
  const isInactive = supplier.isInactive(); // Helper method từ DTO

  return (
    <Card>
      <CardHeader>
        <h3>{supplier.supplierName}</h3>
        <Badge>{supplier.supplierCode}</Badge>
      </CardHeader>

      <CardBody>
        {/* ⚠️ CRITICAL WARNING */}
        {supplier.isBlacklisted && (
          <Alert variant="danger">
            <AlertIcon />
            <strong>⛔ BLACKLISTED SUPPLIER - DO NOT USE!</strong>
            <p>
              This supplier has quality/fraud issues. Contact admin for details.
            </p>
          </Alert>
        )}

        {/* 🟡 INACTIVE WARNING */}
        {isInactive && !supplier.isBlacklisted && (
          <Alert variant="warning">
            <AlertIcon />
            <strong>⚠️ Inactive Supplier</strong>
            <p>No orders in 6+ months. Consider checking supplier status.</p>
          </Alert>
        )}

        {/* Business Metrics */}
        <div className="metrics">
          <MetricItem label="Total Orders" value={supplier.totalOrders} />
          <MetricItem label="Last Order" value={supplier.lastOrderDate} />
          <MetricItem label="Rating" value={supplier.ratingScore} />
          <MetricItem label="Tier" value={supplier.tierLevel} />
        </div>

        {/* Contact Info */}
        <div className="contact">
          {supplier.contactPerson && (
            <p>👤 Contact: {supplier.contactPerson}</p>
          )}
          <p>📞 {supplier.phoneNumber}</p>
          <p>📧 {supplier.email}</p>
          <p>📍 {supplier.address}</p>
        </div>
      </CardBody>
    </Card>
  );
}
```

### 2. Smart Procurement Filter

```jsx
// Filter để chỉ hiển thị safe suppliers cho procurement
const safeSuppliers = suppliers.filter(s => 
  s.isActive && 
  !s.isBlacklisted && 
  s.totalOrders > 0
);

// Sort by reliability
const sortedSuppliers = safeSuppliers.sort((a, b) => 
  b.totalOrders - a.totalOrders
);
```

### 3. Service Consumables với Stock Warning

```jsx
function ServiceConsumablesCard({ serviceId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['serviceConsumables', serviceId],
    queryFn: () => serviceConsumableService.getServiceConsumables(serviceId),
  });

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <CardHeader>
        <h3>{data.serviceName}</h3>
        {data.hasInsufficientStock && (
          <Alert variant="warning">
            <AlertIcon />
            <strong>⚠️ Insufficient Stock</strong>
            <p>Cannot perform service - insufficient materials available.</p>
          </Alert>
        )}
        {data.totalConsumableCost && (
          <p>Total Cost: {formatCurrency(data.totalConsumableCost)}</p>
        )}
      </CardHeader>

      <CardBody>
        <Table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Required</th>
              <th>Stock</th>
              <th>Status</th>
              {hasViewCostPermission && <th>Cost</th>}
            </tr>
          </thead>
          <tbody>
            {data.consumables.map(item => (
              <tr key={item.itemMasterId}>
                <td>{item.itemName}</td>
                <td>{item.quantity} {item.unitName}</td>
                <td>{item.currentStock}</td>
                <td>
                  <Badge variant={
                    item.stockStatus === 'OK' ? 'success' : 
                    item.stockStatus === 'LOW' ? 'warning' : 'danger'
                  }>
                    {item.stockStatus}
                  </Badge>
                </td>
                {hasViewCostPermission && (
                  <td>
                    {item.unitPrice && formatCurrency(item.totalCost)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </CardBody>
    </Card>
  );
}
```

---

## 📝 Summary Table

| API | Endpoint | Method | Purpose | Status |
|-----|----------|--------|---------|--------|
| 6.13 | `/api/v1/warehouse/suppliers/list` | GET | Get suppliers với business metrics | ✅ Production Ready |
| 6.14 | `/api/v1/warehouse/suppliers` | POST | Create new supplier | ✅ Production Ready |
| 6.15 | `/api/v1/warehouse/suppliers/{id}` | PUT | Update supplier | ✅ Production Ready |
| 6.16 | `/api/v1/warehouse/suppliers/{id}` | DELETE | Soft delete supplier | ✅ Production Ready |
| 6.17 | `/api/v1/warehouse/consumables/services/{id}` | GET | Get service consumables (BOM) | ✅ Production Ready |

---

## 🚀 Next Steps for FE

1. **Implement API 6.13** - Supplier list với business metrics và blacklist warnings
2. **Implement API 6.14** - Create supplier form với validation
3. **Implement API 6.15** - Update supplier form với contact person field
4. **Implement API 6.16** - Delete supplier với confirmation dialog (check transaction history)
5. **Implement API 6.17** - Service consumables display trong appointment booking flow
6. **Update existing code** - Remove payment status fallback logic (optional)
7. **Update endpoint URLs** - Fix API 6.2 endpoint format nếu chưa fix

---

## 📚 Related Documentation

- `API_6.13_GET_SUPPLIERS_COMPLETE.md` - Full API 6.13 specification
- `API_6.14_CREATE_SUPPLIER_COMPLETE.md` - Full API 6.14 specification
- `API_6.15_UPDATE_SUPPLIER_COMPLETE.md` - Full API 6.15 specification
- `API_6.16_DELETE_SUPPLIER_COMPLETE.md` - Full API 6.16 specification
- `API_6.17_SERVICE_CONSUMABLES_COMPLETE.md` - Full API 6.17 specification
- `FE_ISSUES_RESOLUTION_2025_11_29.md` - FE issues resolution details
- `BUG_FIXES_2025_11_27.md` - Bug fixes summary

---

**Last Updated:** 2025-11-30  
**Reviewed By:** Backend Team  
**Status:** ✅ All APIs Production Ready

