# API 6.4: Import Transaction - Test Guide

## 📋 Overview

**API Endpoint:** `POST /api/v1/inventory/import`
**Permission Required:** `IMPORT_ITEMS`
**Purpose:** Tạo phiếu nhập kho với tracking hóa đơn, giá nhập, xử lý lô hàng, chuyển đổi đơn vị

---

## 🎯 Business Features

### [YES] Core Features

1. **Invoice Number Tracking** - Mã hóa đơn unique cho đối chiếu kế toán
2. **Batch Handling** - Tự động tạo lô mới hoặc cập nhật lô cũ
3. **Unit Conversion** - Chuyển đổi từ đơn vị nhập → đơn vị cơ bản
4. **Purchase Price Tracking** - Tracking giá nhập cho tính COGS
5. **Expiry Date Validation** - Kiểm tra batch conflict (cùng lot phải cùng hạn)
6. **Financial Summary** - Tổng giá trị phiếu nhập
7. **Warning Generation** - Cảnh báo sắp hết hạn, giá lệch
8. **Current Stock** - Số lượng tồn sau khi nhập

---

## 🔑 Authentication

Trước tiên, login để lấy token:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer"
}
```

Lưu token để dùng cho các request sau.

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path - Import New Batch

**Test Case:** Nhập vật tư mới (tạo batch mới)

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "INV-2025-001",
    "expectedDeliveryDate": "2025-11-20",
    "notes": "Nhập vật tư tháng 11",
    "items": [
      {
        "itemMasterId": 1,
        "lotNumber": "LOT-2025-001",
        "expiryDate": "2026-11-25",
        "quantity": 100,
        "unitId": 1,
        "purchasePrice": 50000.00,
        "binLocation": "A-01-01",
        "notes": "Hàng mới về"
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "status": 201,
  "message": "Tạo phiếu nhập kho thành công",
  "data": {
    "transactionId": 1,
    "transactionCode": "PN-20251125-001",
    "transactionDate": "2025-11-25T10:00:00",
    "supplierName": "Công ty TNHH ABC",
    "invoiceNumber": "INV-2025-001",
    "createdBy": "Nguyễn Văn A",
    "createdAt": "2025-11-25T10:00:15",
    "status": "COMPLETED",
    "totalItems": 1,
    "totalValue": 5000000.0,
    "items": [
      {
        "itemCode": "MAT-001",
        "itemName": "Gạc y tế 10x10cm",
        "batchId": 101,
        "batchStatus": "CREATED",
        "lotNumber": "LOT-2025-001",
        "expiryDate": "2026-11-25",
        "quantityChange": 100,
        "unitName": "Hộp",
        "purchasePrice": 50000.0,
        "totalLineValue": 5000000.0,
        "binLocation": "A-01-01",
        "currentStock": 100
      }
    ],
    "warnings": []
  }
}
```

**[YES] Verification:**

- ✓ Transaction code generated: `PN-20251125-001`
- ✓ Batch created with status: `CREATED`
- ✓ `currentStock` = 100 (batch mới)
- ✓ `totalValue` = quantity × purchasePrice = 100 × 50,000 = 5,000,000 VNĐ
- ✓ No warnings (hạn sử dụng còn 1 năm)

---

### Scenario 2: Update Existing Batch

**Test Case:** Nhập thêm vào lô đã tồn tại

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T14:00:00",
    "invoiceNumber": "INV-2025-002",
    "notes": "Nhập bổ sung lô cũ",
    "items": [
      {
        "itemMasterId": 1,
        "lotNumber": "LOT-2025-001",
        "expiryDate": "2026-11-25",
        "quantity": 50,
        "unitId": 1,
        "purchasePrice": 48000.00,
        "binLocation": "A-01-01"
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "status": 201,
  "message": "Tạo phiếu nhập kho thành công",
  "data": {
    "transactionId": 2,
    "transactionCode": "PN-20251125-002",
    "items": [
      {
        "itemCode": "MAT-001",
        "batchId": 101,
        "batchStatus": "UPDATED",
        "currentStock": 150,
        "purchasePrice": 48000.0,
        "totalLineValue": 2400000.0
      }
    ],
    "totalValue": 2400000.0,
    "warnings": []
  }
}
```

**[YES] Verification:**

- ✓ Batch status: `UPDATED` (không tạo batch mới)
- ✓ `currentStock` = 150 (100 + 50)
- ✓ Giá nhập khác nhau được (50k → 48k)

---

### Scenario 3: Near Expiry Warning

**Test Case:** Nhập vật tư sắp hết hạn (< 3 tháng)

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "INV-2025-003",
    "items": [
      {
        "itemMasterId": 2,
        "lotNumber": "LOT-NEAR-EXPIRY",
        "expiryDate": "2026-01-15",
        "quantity": 20,
        "unitId": 2,
        "purchasePrice": 30000.00,
        "binLocation": "B-02-03"
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "data": {
    "items": [
      {
        "itemCode": "MAT-002",
        "expiryDate": "2026-01-15",
        "currentStock": 20
      }
    ],
    "warnings": [
      {
        "itemCode": "MAT-002",
        "warningType": "NEAR_EXPIRY",
        "message": "Item will expire in 1 months (Expiry: 2026-01-15). Consider using this batch first."
      }
    ]
  }
}
```

**[YES] Verification:**

- ✓ Warning type: `NEAR_EXPIRY`
- ✓ Message hiển thị số tháng còn lại
- ✓ Transaction vẫn thành công (warning không block)

---

### Scenario 4: Unit Conversion

**Test Case:** Nhập bằng đơn vị lớn (Thùng → Hộp)

**Setup:**

- Item Master: `MAT-001` (Gạc y tế)
- Base Unit: `Hộp` (Conversion Rate = 1)
- Alternative Unit: `Thùng` (Conversion Rate = 10)

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "INV-2025-004",
    "items": [
      {
        "itemMasterId": 1,
        "lotNumber": "LOT-2025-002",
        "expiryDate": "2027-06-30",
        "quantity": 5,
        "unitId": 3,
        "purchasePrice": 480000.00,
        "binLocation": "A-01-02",
        "notes": "Nhập 5 thùng"
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "data": {
    "items": [
      {
        "itemCode": "MAT-001",
        "quantityChange": 5,
        "unitName": "Thùng",
        "currentStock": 50,
        "notes": "Base quantity = 5 × 10 = 50 hộp"
      }
    ]
  }
}
```

**[YES] Verification:**

- ✓ Input: 5 Thùng
- ✓ Stored: 50 Hộp (5 × 10 conversion rate)
- ✓ `currentStock` hiển thị theo base unit

---

## [NO] Error Test Cases

### Error 1: Duplicate Invoice Number

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "INV-2025-001",
    "items": [...]
  }'
```

**Expected Error:**

```json
{
  "status": 409,
  "error": "DUPLICATE_INVOICE",
  "message": "Invoice Number 'INV-2025-001' has already been imported. Please use a different invoice number."
}
```

---

### Error 2: Batch Expiry Conflict

**Scenario:** Cùng lot number nhưng khác expiry date

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "INV-2025-005",
    "items": [
      {
        "itemMasterId": 1,
        "lotNumber": "LOT-2025-001",
        "expiryDate": "2027-12-31",
        "quantity": 10,
        "unitId": 1,
        "purchasePrice": 50000.00
      }
    ]
  }'
```

**Expected Error:**

```json
{
  "status": 409,
  "error": "BATCH_EXPIRY_CONFLICT",
  "message": "Lot Number 'LOT-2025-001' already exists with Expiry Date 2026-11-25. Cannot add same lot with different expiry 2027-12-31."
}
```

---

### Error 3: Invalid Expiry Date (Expired Item)

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "INV-2025-006",
    "items": [
      {
        "itemMasterId": 1,
        "lotNumber": "LOT-EXPIRED",
        "expiryDate": "2024-12-31",
        "quantity": 10,
        "unitId": 1,
        "purchasePrice": 50000.00
      }
    ]
  }'
```

**Expected Error:**

```json
{
  "status": 400,
  "error": "EXPIRED_ITEM",
  "message": "Cannot import expired item: MAT-001 (Expiry: 2024-12-31)"
}
```

---

### Error 4: Inactive Supplier

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 999,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "INV-2025-007",
    "items": [...]
  }'
```

**Expected Error:**

```json
{
  "status": 400,
  "error": "SUPPLIER_INACTIVE",
  "message": "Cannot import from inactive supplier: Công ty XYZ"
}
```

---

### Error 5: Invalid Quantity

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "INV-2025-008",
    "items": [
      {
        "itemMasterId": 1,
        "lotNumber": "LOT-2025-003",
        "expiryDate": "2027-06-30",
        "quantity": 0,
        "unitId": 1,
        "purchasePrice": 50000.00
      }
    ]
  }'
```

**Expected Error:**

```json
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Quantity must be at least 1"
}
```

---

### Error 6: Invalid Price

```bash
curl -X POST http://localhost:8080/api/v1/inventory/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "INV-2025-009",
    "items": [
      {
        "itemMasterId": 1,
        "lotNumber": "LOT-2025-004",
        "expiryDate": "2027-06-30",
        "quantity": 10,
        "unitId": 1,
        "purchasePrice": 0
      }
    ]
  }'
```

**Expected Error:**

```json
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Purchase price must be at least 0.01"
}
```

---

## 📊 Response Fields

### Transaction Header

| Field             | Type       | Description                |
| ----------------- | ---------- | -------------------------- |
| `transactionId`   | Long       | ID phiếu nhập              |
| `transactionCode` | String     | Mã phiếu (PN-YYYYMMDD-XXX) |
| `transactionDate` | DateTime   | Ngày nhập                  |
| `supplierName`    | String     | Tên NCC                    |
| `invoiceNumber`   | String     | Mã hóa đơn                 |
| `createdBy`       | String     | Người tạo                  |
| `createdAt`       | DateTime   | Thời gian tạo              |
| `status`          | String     | COMPLETED/DRAFT/CANCELLED  |
| `totalItems`      | Integer    | Tổng số items              |
| `totalValue`      | BigDecimal | Tổng giá trị (VNĐ)         |

### Item Response

| Field            | Type       | Description                   |
| ---------------- | ---------- | ----------------------------- |
| `itemCode`       | String     | Mã vật tư                     |
| `itemName`       | String     | Tên vật tư                    |
| `batchId`        | Long       | ID lô hàng                    |
| `batchStatus`    | String     | CREATED/UPDATED               |
| `lotNumber`      | String     | Số lô                         |
| `expiryDate`     | Date       | Hạn sử dụng                   |
| `quantityChange` | Integer    | Số lượng nhập (theo unit)     |
| `unitName`       | String     | Đơn vị                        |
| `purchasePrice`  | BigDecimal | Giá nhập/đơn vị               |
| `totalLineValue` | BigDecimal | Thành tiền (quantity × price) |
| `binLocation`    | String     | Vị trí kho                    |
| `currentStock`   | Integer    | Tồn sau nhập (base unit)      |

### Warning

| Field         | Type   | Description                  |
| ------------- | ------ | ---------------------------- |
| `itemCode`    | String | Mã vật tư                    |
| `warningType` | String | NEAR_EXPIRY / PRICE_VARIANCE |
| `message`     | String | Chi tiết warning             |

---

## 🔍 Database Changes

Sau khi nhập thành công, kiểm tra DB:

```sql
-- Check transaction
SELECT * FROM storage_transactions
WHERE transaction_code = 'PN-20251125-001';

-- Check batch created/updated
SELECT ib.*, im.item_name
FROM item_batches ib
JOIN item_masters im ON ib.item_master_id = im.item_master_id
WHERE ib.lot_number = 'LOT-2025-001';

-- Check transaction items
SELECT sti.*, im.item_name
FROM storage_transaction_items sti
JOIN item_batches ib ON sti.batch_id = ib.batch_id
JOIN item_masters im ON ib.item_master_id = im.item_master_id
WHERE sti.transaction_id = 1;
```

---

## 📝 Notes for FE Team

### 1. Invoice Number

- [YES] MUST be unique
- [YES] Recommend format: `INV-YYYYMMDD-XXX` hoặc `HD-NCC-001`
- [NO] Không được trùng (409 DUPLICATE_INVOICE)

### 2. Expiry Date

- [YES] MUST be future date (> today)
- [YES] Cùng lot number MUST có cùng expiry date
- [WARN] Warning nếu < 3 months

### 3. Unit Conversion

- [YES] Chọn unit phù hợp (Hộp/Thùng/Lọ)
- [YES] BE tự động convert về base unit
- [YES] Response trả về theo unit đã chọn

### 4. Price Tracking

- [YES] Giá nhập bắt buộc (0.01 - 100M VNĐ)
- [YES] Dùng cho tính COGS sau này
- [YES] Giá có thể khác nhau giữa các lần nhập

### 5. Warnings

- [WARN] Warnings KHÔNG block transaction
- [WARN] Hiển thị cho user để nhận biết
- [WARN] Types: NEAR_EXPIRY, PRICE_VARIANCE

### 6. Batch Status

- 🆕 `CREATED` - Lô mới tạo
- 🔄 `UPDATED` - Lô đã tồn tại, cập nhật số lượng

### 7. Current Stock

- [YES] Luôn hiển thị theo **base unit**
- [YES] Dùng để verify số lượng sau nhập
- [YES] Cập nhật real-time

---

## 🚀 Quick Test Script

Save as `test_import_api.sh`:

```bash
#!/bin/bash

TOKEN="YOUR_TOKEN_HERE"
BASE_URL="http://localhost:8080/api/v1/inventory"

echo "=== Test 1: Happy Path ==="
curl -X POST $BASE_URL/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T10:00:00",
    "invoiceNumber": "TEST-001",
    "items": [{
      "itemMasterId": 1,
      "lotNumber": "TEST-LOT-001",
      "expiryDate": "2026-12-31",
      "quantity": 50,
      "unitId": 1,
      "purchasePrice": 50000.00
    }]
  }' | jq

echo -e "\n=== Test 2: Duplicate Invoice ==="
curl -X POST $BASE_URL/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T11:00:00",
    "invoiceNumber": "TEST-001",
    "items": [{
      "itemMasterId": 1,
      "lotNumber": "TEST-LOT-002",
      "expiryDate": "2026-12-31",
      "quantity": 30,
      "unitId": 1,
      "purchasePrice": 48000.00
    }]
  }' | jq

echo -e "\n=== Test 3: Update Existing Batch ==="
curl -X POST $BASE_URL/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierId": 1,
    "transactionDate": "2025-11-25T12:00:00",
    "invoiceNumber": "TEST-002",
    "items": [{
      "itemMasterId": 1,
      "lotNumber": "TEST-LOT-001",
      "expiryDate": "2026-12-31",
      "quantity": 30,
      "unitId": 1,
      "purchasePrice": 52000.00
    }]
  }' | jq
```

---

## [YES] Checklist for Testing

- [ ] Happy path - Import new batch
- [ ] Update existing batch
- [ ] Unit conversion (large unit → base unit)
- [ ] Near expiry warning
- [ ] Duplicate invoice error
- [ ] Batch expiry conflict error
- [ ] Expired item error
- [ ] Invalid quantity error
- [ ] Invalid price error
- [ ] Inactive supplier error
- [ ] Item not found error
- [ ] Unit not found error
- [ ] Unauthorized access (no IMPORT_ITEMS permission)

---

**Created:** 2025-11-25
**Version:** 1.0
**Contact:** Backend Team
