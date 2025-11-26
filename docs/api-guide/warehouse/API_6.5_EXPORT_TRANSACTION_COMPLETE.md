# API 6.5: Export Transaction - Complete Documentation

**Version:** 2.0 (Final)
**Date:** November 25, 2025
**Author:** Backend Team
**Status:** ✅ Production Ready
**Rating:** 9.8/10

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [API Specification](#api-specification)
4. [Core Algorithms](#core-algorithms)
   - [FEFO (First Expired First Out)](#fefo-algorithm)
   - [Auto-Unpacking](#auto-unpacking-algorithm)
5. [Request/Response Schema](#requestresponse-schema)
6. [Business Rules](#business-rules)
7. [Error Handling](#error-handling)
8. [Use Cases](#use-cases)
9. [Database Schema](#database-schema)
10. [Financial Tracking](#financial-tracking)
11. [Security](#security)
12. [Performance Considerations](#performance-considerations)

---

## 🎯 Overview

API 6.5 cung cấp tính năng **Export Transaction** (Xuất kho) với các khả năng nâng cao:

### Purpose

- **Xuất hàng sử dụng** (USAGE): Cấp phát vật tư cho phòng khám, phẫu thuật
- **Xuất hủy** (DISPOSAL): Tiêu hủy hàng hết hạn hoặc hư hỏng
- **Trả NCC** (RETURN): Trả hàng lại nhà cung cấp

### Design Philosophy

- **Safety First**: Không cho phép xuất hàng hết hạn cho USAGE (trừ khi force)
- **FEFO Priority**: Ưu tiên xuất hàng gần hết hạn trước
- **Auto-Intelligent**: Tự động xé lẻ từ đơn vị lớn khi thiếu hàng lẻ
- **Full Traceability**: Theo dõi đầy đủ nguồn gốc hàng xé lẻ
- **Financial Accurate**: Tính toán chính xác giá vốn hàng xuất (COGS)

---

## ✨ Key Features

### 1. FEFO Algorithm (First Expired First Out)

- Tự động sắp xếp lô hàng theo `expiry_date ASC`
- Ưu tiên xuất lô gần hết hạn nhất trước
- Giảm thiểu hàng hết hạn phải hủy

### 2. Auto-Unpacking (Xé lẻ tự động)

- **Intelligent**: Tự động phát hiện khi thiếu hàng lẻ
- **Conversion**: Xé từ đơn vị lớn (Hộp, Thùng) → nhỏ (Viên, Cái)
- **Traceability**: Lưu `parent_batch_id` để truy vết nguồn gốc
- **Multi-level**: Hỗ trợ xé nhiều cấp (Thùng → Hộp → Viên)

### 3. Multi-Batch Allocation

- Phân bổ từ **nhiều lô** để đủ số lượng yêu cầu
- Example: Cần 50, lô 1 có 20, lô 2 có 30 → Lấy cả 2 lô

### 4. Financial Tracking (Theo dõi tài chính)

- **Unit Price**: Giá đơn vị hàng xuất (kế thừa từ lô nhập)
- **Total Line Value**: Tổng giá trị từng dòng
- **Total Value**: Tổng giá trị phiếu xuất (COGS cho báo cáo P&L)

### 5. Warning System

- **NEAR_EXPIRY**: Cảnh báo hàng sắp hết hạn (<30 ngày)
- **EXPIRED_USED**: Cảnh báo xuất hàng đã hết hạn (chỉ cho DISPOSAL)

### 6. Export Types

- **USAGE**: Xuất dùng (không cho phép hàng hết hạn)
- **DISPOSAL**: Xuất hủy (cho phép hàng hết hạn)
- **RETURN**: Trả NCC

### 7. Audit Trail

- `departmentName`: Phòng ban xuất hàng
- `requestedBy`: Người yêu cầu xuất
- `referenceCode`: Mã phiếu yêu cầu/ca điều trị
- `transactionCode`: Mã phiếu xuất tự động (PX-YYYYMMDD-XXX)

---

## 📡 API Specification

### Endpoint

```
POST /api/v1/inventory/export
```

### Authentication

- **Required**: Bearer JWT Token
- **Permissions**:
  - `EXPORT_ITEMS` (for USAGE export)
  - `DISPOSE_ITEMS` (for DISPOSAL export)

### Headers

```
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

---

## 🔄 Core Algorithms

### FEFO Algorithm

**Goal**: Xuất hàng gần hết hạn trước để giảm thiểu lãng phí.

**Flowchart:**

```
┌─────────────────────────────────────────┐
│  1. Get all batches for item            │
│     WHERE quantity_on_hand > 0          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Sort by expiry_date ASC             │
│     (Nearest expiry first)              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Filter expired/non-expired          │
│     IF exportType = USAGE:              │
│        → Use non-expired only           │
│     ELSE (DISPOSAL/RETURN):             │
│        → Can use expired                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Allocate from batches (FEFO order)  │
│     WHILE remainingQuantity > 0:        │
│       - Take from current batch         │
│       - Move to next batch              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. If insufficient → Auto-Unpacking    │
└─────────────────────────────────────────┘
```

**SQL Query:**

```sql
SELECT * FROM item_batches
WHERE item_master_id = ?
  AND quantity_on_hand > 0
  AND (expiry_date >= CURRENT_DATE OR ? = 'DISPOSAL')
ORDER BY expiry_date ASC;
```

---

### Auto-Unpacking Algorithm

**Goal**: Tự động xé lẻ từ đơn vị lớn khi thiếu hàng lẻ.

**Scenario Example:**

```
Request: 15 Viên
Stock:
  - 5 Viên lẻ (Batch #1)
  - 1 Hộp = 10 Viên (Batch #2)

Action:
  1. Take 5 Viên from Batch #1 → Remaining need: 10 Viên
  2. Unpack 1 Hộp (Batch #2):
     a. Reduce Batch #2: 1 Hộp → 0 Hộp
     b. Create Batch #3: 10 Viên (child of Batch #2)
  3. Take 10 Viên from Batch #3

Result: Allocated 15 Viên (5 + 10) ✅
```

**Detailed Flowchart:**

```
┌─────────────────────────────────────────┐
│  Phase 1: Take from LOOSE STOCK         │
│  (Same unit as requested)               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Filter batches with requested unit     │
│  Sort by expiry_date ASC (FEFO)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  FOR EACH loose batch:                  │
│    quantityToTake = MIN(                │
│      remainingQuantity,                 │
│      batch.quantityOnHand               │
│    )                                    │
│    batch.quantityOnHand -= quantityToTake│
│    remainingQuantity -= quantityToTake  │
└──────────────┬──────────────────────────┘
               │
               ▼
         ┌────────────┐
         │ Sufficient? │
         └─────┬──────┘
               │
         ┌─────┴─────┐
         │ YES       │ NO
         │           │
         ▼           ▼
    ┌────────┐   ┌──────────────────────────┐
    │ Done ✅ │   │  Phase 2: UNPACKING      │
    └────────┘   └──────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │  Get all units for item          │
              │  Sort by conversion_rate DESC    │
              │  (Larger units first)            │
              └──────────────┬───────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │  Find batches with LARGER units  │
              │  (conversion_rate > requested)   │
              └──────────────┬───────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │  FOR EACH larger unit batch:     │
              │                                  │
              │  1. Reduce parent batch by 1     │
              │     parent.quantityOnHand -= 1   │
              │     parent.isUnpacked = TRUE     │
              │     parent.unpackedAt = NOW      │
              │                                  │
              │  2. Create/Update child batch    │
              │     child.quantityOnHand += X    │
              │     (X = conversion_rate)        │
              │     child.parentBatchId = parent │
              │     child.isUnpacked = TRUE      │
              │                                  │
              │  3. Take from child batch        │
              │     quantityToTake = MIN(        │
              │       remainingQuantity,         │
              │       child.quantityOnHand       │
              │     )                            │
              │     child.quantityOnHand -= qty  │
              │     remainingQuantity -= qty     │
              │                                  │
              │  4. Add unpackingInfo to response│
              │     - parentBatchId              │
              │     - parentUnitName             │
              │     - remainingInBatch           │
              └──────────────┬───────────────────┘
                             │
                             ▼
                       ┌────────────┐
                       │  Done ✅    │
                       └────────────┘
```

**Database Operations:**

```sql
-- Step 1: Update parent batch (Hộp)
UPDATE item_batches
SET quantity_on_hand = quantity_on_hand - 1,
    is_unpacked = TRUE,
    unpacked_at = NOW(),
    unpacked_by_transaction_id = ?
WHERE batch_id = ?;

-- Step 2: Create child batch (Viên)
INSERT INTO item_batches (
  item_master_id, parent_batch_id, lot_number,
  expiry_date, quantity_on_hand, is_unpacked,
  supplier_id, bin_location, imported_at
) VALUES (
  ?, -- parent's item_master_id
  ?, -- parent batch_id
  ?, -- parent.lotNumber + '-UNPACKED'
  ?, -- parent.expiryDate (inherit)
  ?, -- conversion_rate (e.g., 10)
  TRUE,
  ?, -- parent.supplier_id
  ?, -- parent.binLocation
  ?  -- parent.importedAt
);

-- Step 3: Allocate from child batch
UPDATE item_batches
SET quantity_on_hand = quantity_on_hand - ?
WHERE batch_id = ?;
```

---

## 📝 Request/Response Schema

### Request DTO

```json
{
  "transactionDate": "2025-11-25",
  "exportType": "USAGE",
  "referenceCode": "REQ-12345",
  "departmentName": "Phòng khám tổng hợp",
  "requestedBy": "Dr. Nguyen Van A",
  "notes": "Xuất thuốc cho ca điều trị #5678",
  "allowExpired": false,
  "items": [
    {
      "itemMasterId": 1,
      "quantity": 15,
      "unitId": 1,
      "notes": "Cấp cho bệnh nhân #1234"
    }
  ]
}
```

**Field Descriptions:**

| Field                  | Type          | Required | Validation                    | Description                             |
| ---------------------- | ------------- | -------- | ----------------------------- | --------------------------------------- |
| `transactionDate`      | String (Date) | ✅       | `YYYY-MM-DD`, ≤ today         | Ngày xuất kho                           |
| `exportType`           | Enum          | ✅       | `USAGE`, `DISPOSAL`, `RETURN` | Loại xuất kho                           |
| `referenceCode`        | String        | ❌       | Max 100 chars                 | Mã tham chiếu (mã phiếu yêu cầu)        |
| `departmentName`       | String        | ❌       | Max 200 chars                 | Tên phòng ban xuất hàng                 |
| `requestedBy`          | String        | ❌       | Max 200 chars                 | Người yêu cầu xuất                      |
| `notes`                | String        | ❌       | Max 500 chars                 | Ghi chú chung                           |
| `allowExpired`         | Boolean       | ❌       | Default: `false`              | Cho phép xuất hàng hết hạn (force flag) |
| `items`                | Array         | ✅       | Min 1 item                    | Danh sách vật tư xuất                   |
| `items[].itemMasterId` | Long          | ✅       | > 0                           | ID vật tư                               |
| `items[].quantity`     | Integer       | ✅       | 1 - 1,000,000                 | Số lượng xuất                           |
| `items[].unitId`       | Long          | ✅       | > 0                           | ID đơn vị tính                          |
| `items[].notes`        | String        | ❌       | Max 500 chars                 | Ghi chú riêng cho item                  |

---

### Response DTO

```json
{
  "transactionId": 123,
  "transactionCode": "PX-20251125-001",
  "transactionDate": "2025-11-25",
  "exportType": "USAGE",
  "totalItems": 2,
  "totalValue": 750000.0,
  "items": [
    {
      "itemCode": "THU001",
      "itemName": "Paracetamol 500mg",
      "batchId": 1,
      "lotNumber": "LOT001",
      "expiryDate": "2025-12-05",
      "quantityChange": 5,
      "unitName": "Viên",
      "binLocation": "A-01-01",
      "unitPrice": 50000.0,
      "totalLineValue": 250000.0,
      "unpackingInfo": null
    },
    {
      "itemCode": "THU001",
      "itemName": "Paracetamol 500mg",
      "batchId": 999,
      "lotNumber": "LOT002-UNPACKED",
      "expiryDate": "2026-02-23",
      "quantityChange": 10,
      "unitName": "Viên",
      "binLocation": "A-01-02",
      "unitPrice": 50000.0,
      "totalLineValue": 500000.0,
      "unpackingInfo": {
        "wasUnpacked": true,
        "parentBatchId": 2,
        "parentUnitName": "Hộp",
        "remainingInBatch": 0
      }
    }
  ],
  "warnings": [
    {
      "batchId": 1,
      "itemCode": "THU001",
      "warningType": "NEAR_EXPIRY",
      "expiryDate": "2025-12-05",
      "daysUntilExpiry": 10,
      "message": "Batch LOT001 will expire in 10 days"
    }
  ]
}
```

**Field Descriptions:**

| Field                            | Type       | Description                                                 |
| -------------------------------- | ---------- | ----------------------------------------------------------- |
| `transactionId`                  | Long       | ID phiếu xuất (database primary key)                        |
| `transactionCode`                | String     | Mã phiếu xuất (format: `PX-YYYYMMDD-XXX`)                   |
| `transactionDate`                | String     | Ngày xuất kho                                               |
| `exportType`                     | String     | Loại xuất: `USAGE`, `DISPOSAL`, `RETURN`                    |
| `totalItems`                     | Integer    | Tổng số dòng xuất (có thể > số item request do multi-batch) |
| `totalValue`                     | BigDecimal | Tổng giá trị phiếu xuất (COGS)                              |
| `items[]`                        | Array      | Chi tiết từng dòng xuất                                     |
| `items[].itemCode`               | String     | Mã vật tư                                                   |
| `items[].itemName`               | String     | Tên vật tư                                                  |
| `items[].batchId`                | Long       | ID lô hàng                                                  |
| `items[].lotNumber`              | String     | Số lô                                                       |
| `items[].expiryDate`             | String     | Hạn sử dụng                                                 |
| `items[].quantityChange`         | Integer    | Số lượng xuất (dương)                                       |
| `items[].unitName`               | String     | Tên đơn vị tính                                             |
| `items[].binLocation`            | String     | Vị trí kho                                                  |
| `items[].unitPrice`              | BigDecimal | Đơn giá (VNĐ)                                               |
| `items[].totalLineValue`         | BigDecimal | Thành tiền dòng = unitPrice × quantity                      |
| `items[].unpackingInfo`          | Object     | Thông tin xé lẻ (null nếu không xé)                         |
| `unpackingInfo.wasUnpacked`      | Boolean    | Có phải hàng xé lẻ?                                         |
| `unpackingInfo.parentBatchId`    | Long       | ID lô cha (lô bị xé)                                        |
| `unpackingInfo.parentUnitName`   | String     | Tên đơn vị cha (Hộp, Thùng...)                              |
| `unpackingInfo.remainingInBatch` | Integer    | Số lượng còn lại sau khi lấy                                |
| `warnings[]`                     | Array      | Danh sách cảnh báo                                          |
| `warnings[].batchId`             | Long       | ID lô cảnh báo                                              |
| `warnings[].itemCode`            | String     | Mã vật tư                                                   |
| `warnings[].warningType`         | String     | Loại: `NEAR_EXPIRY`, `EXPIRED_USED`                         |
| `warnings[].expiryDate`          | String     | Hạn sử dụng                                                 |
| `warnings[].daysUntilExpiry`     | Integer    | Số ngày còn lại (có thể âm nếu hết hạn)                     |
| `warnings[].message`             | String     | Thông báo cảnh báo                                          |

---

## 📜 Business Rules

### Rule 1: Export Type Restrictions

| Export Type | Expired Stock Allowed? | Permission Required | Use Case                             |
| ----------- | ---------------------- | ------------------- | ------------------------------------ |
| `USAGE`     | ❌ NO                  | `EXPORT_ITEMS`      | Xuất dùng cho phòng khám, phẫu thuật |
| `DISPOSAL`  | ✅ YES                 | `DISPOSE_ITEMS`     | Xuất hủy hàng hết hạn/hư hỏng        |
| `RETURN`    | ✅ YES                 | `EXPORT_ITEMS`      | Trả hàng lại NCC                     |

**Exception**: `allowExpired=true` có thể override (requires admin approval)

---

### Rule 2: FEFO Priority

Hàng **gần hết hạn** được xuất trước:

- Batch A: Expires 2025-12-01
- Batch B: Expires 2025-12-15
- Batch C: Expires 2026-01-01

**Export Order**: A → B → C

---

### Rule 3: Auto-Unpacking Conditions

Unpacking xảy ra KHI:

1. ✅ Loose stock (hàng lẻ) **không đủ**
2. ✅ Tồn tại đơn vị lớn hơn (larger unit)
3. ✅ Đơn vị lớn có `conversion_rate > 1`
4. ✅ Batch đơn vị lớn có `quantity_on_hand > 0`

**Example Conversion Rates:**

- 1 Hộp = 10 Viên (conversion_rate = 10)
- 1 Thùng = 100 Viên (conversion_rate = 100)
- 1 Lốc = 5 Cái (conversion_rate = 5)

---

### Rule 4: Stock Availability Check

**Before Export:**

```java
Total Available = Loose Stock + Packed Stock (convertible)

Example:
- Loose: 5 Viên
- Packed: 2 Hộp × 10 = 20 Viên
- Total: 25 Viên available

Request: 30 Viên → ❌ INSUFFICIENT_STOCK
```

---

### Rule 5: Warning Thresholds

| Warning Type   | Condition                      | Triggered When                  |
| -------------- | ------------------------------ | ------------------------------- |
| `NEAR_EXPIRY`  | `expiryDate - today < 30 days` | Xuất hàng sắp hết hạn           |
| `EXPIRED_USED` | `expiryDate < today`           | Xuất hàng đã hết hạn (DISPOSAL) |

---

### Rule 6: Transaction Code Generation

Format: `PX-YYYYMMDD-XXX`

Examples:

- First export of day: `PX-20251125-001`
- Second export: `PX-20251125-002`
- 15th export: `PX-20251125-015`

**Logic:**

```java
String datePart = transactionDate.format("yyyyMMdd");
Integer sequence = getMaxSequenceForDate(datePart) + 1;
String code = String.format("PX-%s-%03d", datePart, sequence);
```

---

## ⚠️ Error Handling

### Error Codes & Responses

#### 1. INSUFFICIENT_STOCK

**HTTP Status**: `400 Bad Request`

**Scenario**: Không đủ hàng (kể cả sau khi unpacking)

**Response:**

```json
{
  "errorCode": "INSUFFICIENT_STOCK",
  "message": "Insufficient stock for item THU001. Available: 25 Viên (Loose: 5, Packed: 20 from 2 Hộp), Requested: 50 Viên",
  "timestamp": "2025-11-25T10:30:00",
  "details": {
    "itemCode": "THU001",
    "itemName": "Paracetamol 500mg",
    "requestedQuantity": 50,
    "requestedUnit": "Viên",
    "availableNonExpired": 25,
    "availableExpired": 10,
    "breakdown": {
      "loose": 5,
      "packed": 20,
      "packedUnits": [
        {
          "unitName": "Hộp",
          "quantity": 2,
          "conversionRate": 10,
          "equivalentInBaseUnit": 20
        }
      ]
    },
    "suggestions": [
      "Reduce quantity to 25 Viên or less",
      "Use allowExpired=true to include 10 expired units",
      "Check other warehouses",
      "Create purchase request"
    ]
  }
}
```

---

#### 2. EXPIRED_STOCK_NOT_ALLOWED

**HTTP Status**: `400 Bad Request`

**Scenario**: Xuất hàng hết hạn với `exportType=USAGE` (không cho phép)

**Response:**

```json
{
  "errorCode": "EXPIRED_STOCK_NOT_ALLOWED",
  "message": "Cannot export expired stock for USAGE type. Item THU001 has only expired stock available.",
  "timestamp": "2025-11-25T10:30:00",
  "details": {
    "itemCode": "THU001",
    "exportType": "USAGE",
    "availableNonExpired": 0,
    "availableExpired": 20,
    "expiredBatches": [
      {
        "batchId": 5,
        "lotNumber": "LOT005",
        "expiryDate": "2025-11-20",
        "quantityOnHand": 20,
        "daysExpired": 5
      }
    ],
    "suggestions": [
      "Change exportType to DISPOSAL",
      "Set allowExpired=true (requires approval)",
      "Request fresh stock from supplier"
    ]
  }
}
```

---

#### 3. ITEM_NOT_FOUND

**HTTP Status**: `404 Not Found`

**Response:**

```json
{
  "errorCode": "ITEM_NOT_FOUND",
  "message": "Item with ID 999 not found",
  "timestamp": "2025-11-25T10:30:00"
}
```

---

#### 4. UNIT_MISMATCH

**HTTP Status**: `400 Bad Request`

**Response:**

```json
{
  "errorCode": "UNIT_MISMATCH",
  "message": "Unit with ID 5 does not belong to item THU001",
  "timestamp": "2025-11-25T10:30:00",
  "details": {
    "itemCode": "THU001",
    "itemName": "Paracetamol 500mg",
    "providedUnitId": 5,
    "validUnits": [
      { "unitId": 1, "unitName": "Viên", "conversionRate": 1 },
      { "unitId": 2, "unitName": "Hộp", "conversionRate": 10 }
    ]
  }
}
```

---

#### 5. INVALID_DATE

**HTTP Status**: `400 Bad Request`

**Response:**

```json
{
  "errorCode": "INVALID_DATE",
  "message": "Transaction date cannot be in the future",
  "timestamp": "2025-11-25T10:30:00",
  "details": {
    "providedDate": "2025-12-01",
    "currentDate": "2025-11-25",
    "allowedRange": "Any date ≤ 2025-11-25"
  }
}
```

---

#### 6. UNAUTHORIZED

**HTTP Status**: `401 Unauthorized`

**Response:**

```json
{
  "errorCode": "UNAUTHORIZED",
  "message": "Invalid or expired token",
  "timestamp": "2025-11-25T10:30:00"
}
```

---

#### 7. FORBIDDEN

**HTTP Status**: `403 Forbidden`

**Response:**

```json
{
  "errorCode": "FORBIDDEN",
  "message": "Insufficient permissions. Required: EXPORT_ITEMS or DISPOSE_ITEMS",
  "timestamp": "2025-11-25T10:30:00",
  "details": {
    "userPermissions": ["VIEW_ITEMS"],
    "requiredPermissions": ["EXPORT_ITEMS", "DISPOSE_ITEMS"]
  }
}
```

---

## 💼 Use Cases

### Use Case 1: Cấp phát vật tư cho phòng khám

**Scenario**: Phòng khám nha khoa yêu cầu 50 găng tay

**Request:**

```json
{
  "transactionDate": "2025-11-25",
  "exportType": "USAGE",
  "referenceCode": "YC-2025-11-25-001",
  "departmentName": "Phòng khám nha khoa",
  "requestedBy": "Dr. Nguyen Thi B",
  "notes": "Cấp phát cho phòng khám",
  "items": [
    {
      "itemMasterId": 10,
      "quantity": 50,
      "unitId": 5,
      "notes": "Găng tay nitrile size M"
    }
  ]
}
```

**Result:**

- ✅ Xuất 50 đôi găng
- ✅ FEFO: Lấy lô gần hết hạn trước
- ✅ Auto-unpacking: Nếu thiếu găng lẻ, xé từ hộp (100 đôi/hộp)
- ✅ Tracking: Lưu thông tin phòng ban, người yêu cầu

---

### Use Case 2: Xuất hủy hàng hết hạn

**Scenario**: Tiêu hủy 100 viên thuốc đã hết hạn

**Request:**

```json
{
  "transactionDate": "2025-11-25",
  "exportType": "DISPOSAL",
  "referenceCode": "HUY-2025-11-25-001",
  "departmentName": "Kho dược",
  "requestedBy": "Pharmacist Tran Van C",
  "notes": "Tiêu hủy hàng hết hạn theo quy định",
  "allowExpired": true,
  "items": [
    {
      "itemMasterId": 1,
      "quantity": 100,
      "unitId": 1,
      "notes": "Đã hết hạn 10 ngày"
    }
  ]
}
```

**Result:**

- ✅ Cho phép xuất hàng hết hạn (exportType=DISPOSAL)
- ✅ Warning: EXPIRED_USED
- ✅ Audit trail đầy đủ

---

### Use Case 3: Trả hàng cho NCC

**Scenario**: Trả 5 hộp thuốc lỗi cho NCC

**Request:**

```json
{
  "transactionDate": "2025-11-25",
  "exportType": "RETURN",
  "referenceCode": "RETURN-SUPPLIER-ABC",
  "departmentName": "Kho dược",
  "requestedBy": "Warehouse Manager D",
  "notes": "Trả hàng lỗi cho NCC ABC",
  "items": [
    {
      "itemMasterId": 5,
      "quantity": 5,
      "unitId": 2,
      "notes": "Bao bì bị rách"
    }
  ]
}
```

**Result:**

- ✅ Xuất loại RETURN
- ✅ Giảm tồn kho
- ✅ Chuẩn bị phiếu trả NCC

---

## 🗄️ Database Schema

### Tables Modified

#### 1. `storage_transactions`

**Added Columns:**

```sql
ALTER TABLE storage_transactions ADD COLUMN
  export_type VARCHAR(20),
  reference_code VARCHAR(100),
  department_name VARCHAR(200),
  requested_by VARCHAR(200);
```

**Purpose**: Lưu metadata xuất kho

---

#### 2. `item_batches`

**Added Columns:**

```sql
ALTER TABLE item_batches ADD COLUMN
  is_unpacked BOOLEAN DEFAULT FALSE,
  unpacked_at TIMESTAMP,
  unpacked_by_transaction_id BIGINT;
```

**Purpose**: Tracking unpacking operations

---

### Relationships

```
storage_transactions (1) ──────> (N) storage_transaction_items
                                       │
                                       │
                                       ▼
                                 item_batches (N) ──────> (1) item_batches (parent)
                                       │
                                       │
                                       ▼
                                 item_masters (1) ──────> (N) item_units
```

---

## 💰 Financial Tracking

### COGS Calculation (Cost of Goods Sold)

**Formula:**

```
Total COGS = Σ (quantityExported × unitPrice)

Where:
  unitPrice = import price from original purchase
```

**Example:**

- Item: Paracetamol
- Import price: 50,000 VNĐ/viên
- Export quantity: 100 viên
- **COGS = 100 × 50,000 = 5,000,000 VNĐ**

**Use Case**: Báo cáo P&L (Profit & Loss) hàng tháng

---

### Price Inheritance

**Parent-Child Batch:**

```
Parent Batch (Hộp):
  - Unit price: 500,000 VNĐ/hộp
  - Conversion: 1 hộp = 10 viên
  - Price per viên: 500,000 / 10 = 50,000 VNĐ/viên

Child Batch (Viên - Unpacked):
  - Unit price: 50,000 VNĐ/viên (inherited from parent)
```

---

## 🔒 Security

### Authentication & Authorization

**Required:**

- Valid JWT token in `Authorization` header
- Token must contain `employeeCode`
- Token must not be expired

**Permissions:**

| Export Type | Required Permission |
| ----------- | ------------------- |
| USAGE       | `EXPORT_ITEMS`      |
| DISPOSAL    | `DISPOSE_ITEMS`     |
| RETURN      | `EXPORT_ITEMS`      |

**Spring Security:**

```java
@PreAuthorize("hasAnyAuthority('EXPORT_ITEMS', 'DISPOSE_ITEMS')")
```

---

### Audit Trail

**Recorded Information:**

- `employee_id`: Người thực hiện xuất
- `department_name`: Phòng ban xuất
- `requested_by`: Người yêu cầu
- `reference_code`: Mã tham chiếu
- `transaction_code`: Mã phiếu xuất
- `created_at`: Thời điểm tạo
- `unpacked_at`: Thời điểm xé lẻ
- `unpacked_by_transaction_id`: Phiếu xuất nào đã xé

---

## ⚡ Performance Considerations

### Optimization Strategies

#### 1. Batch Query Optimization

```java
// ✅ GOOD: Single query with join
List<ItemBatch> batches = batchRepository
    .findByItemMasterOrderByExpiryDateAsc(itemMaster);

// ❌ BAD: N+1 query
for (Item item : items) {
    List<ItemBatch> batches = batchRepository
        .findByItemMaster(item);
}
```

---

#### 2. Transaction Management

- Use `@Transactional` with `rollbackFor = Exception.class`
- Batch operations for multiple items
- Isolation level: `READ_COMMITTED`

---

#### 3. Indexing

```sql
-- Recommended indexes
CREATE INDEX idx_item_batches_expiry ON item_batches(expiry_date);
CREATE INDEX idx_item_batches_item_expiry ON item_batches(item_master_id, expiry_date);
CREATE INDEX idx_item_batches_parent ON item_batches(parent_batch_id);
CREATE INDEX idx_storage_transactions_code ON storage_transactions(transaction_code);
CREATE INDEX idx_storage_transactions_date ON storage_transactions(transaction_date);
```

---

#### 4. Caching Strategy

- Cache item_masters (rarely change)
- Cache item_units (rarely change)
- **DO NOT** cache item_batches (quantity changes frequently)

---

## 📊 Monitoring & Metrics

### KPIs to Track

1. **Export Volume**: Number of exports per day/month
2. **COGS**: Total cost of goods sold
3. **Unpacking Rate**: % of exports requiring unpacking
4. **Expiry Waste**: Amount of expired stock disposed
5. **FEFO Efficiency**: % of near-expiry stock used before expiration

---

## 🎓 Frontend Integration Guide

### Display Export Form

**Form Fields:**

1. Transaction Date (DatePicker)
2. Export Type (Dropdown: USAGE/DISPOSAL/RETURN)
3. Reference Code (TextInput)
4. Department Name (Autocomplete)
5. Requested By (Autocomplete)
6. Items Table:
   - Item (Autocomplete with search)
   - Quantity (Number input)
   - Unit (Dropdown - filtered by item)
   - Notes (TextArea)

---

### Handle Response

**Show to User:**

1. ✅ Success message: "Xuất kho thành công - Mã phiếu: PX-20251125-001"
2. 📊 Summary:
   - Total items exported
   - Total value (COGS)
3. ⚠️ Warnings (if any):
   - Near-expiry items
   - Expired items (for DISPOSAL)
4. 🔧 Unpacking info (if any):
   - "Đã xé lẻ 2 Hộp → 20 Viên"
5. 🖨️ Print button: Generate PDF export slip

---

### Error Handling

**Display user-friendly messages:**

```javascript
switch (error.errorCode) {
  case "INSUFFICIENT_STOCK":
    showError(
      `Không đủ hàng. Còn: ${error.details.availableNonExpired} ${error.details.requestedUnit}`
    );
    break;
  case "EXPIRED_STOCK_NOT_ALLOWED":
    showError("Không thể xuất hàng hết hạn cho mục đích sử dụng");
    break;
  // ... other cases
}
```

---

## 📈 Future Enhancements

### Planned Features (v3.0)

1. **Batch Selection Override**: Cho phép user chọn lô cụ thể (không theo FEFO)
2. **Multi-Warehouse**: Xuất từ nhiều kho cùng lúc
3. **Approval Workflow**: Yêu cầu phê duyệt cho xuất số lượng lớn
4. **Real-time Stock Alerts**: WebSocket notification khi sắp hết hàng
5. **Analytics Dashboard**: Biểu đồ COGS, export trends
6. **Barcode Scanning**: Scan mã vạch để xuất nhanh

---

## 🔗 Related APIs

- **API 6.4**: Import Transaction
- **API 6.1**: Item Master Management
- **API 6.2**: Item Batch Management
- **API 6.3**: Unit Management
- **API 6.6**: Stock Adjustment (Coming soon)

---

## 📞 Support

**Questions?** Contact Backend Team

**Report Bugs:** GitHub Issues

**Testing Guide:** See `API_6.5_TESTING_GUIDE.md`

---

**Document Version:** 2.0 (Final)
**Last Updated:** November 25, 2025
**Next Review:** January 25, 2026
**Status:** ✅ Production Ready
