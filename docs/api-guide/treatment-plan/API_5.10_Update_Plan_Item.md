# API 5.10: Sửa Hạng mục trong Lộ trình (Update Treatment Plan Item)

**Version**: V20
**Date**: 2025-11-15
**Module**: Treatment Plans (Bệnh án & Lộ trình Điều trị)

---

##  Overview

API này được sử dụng bởi **Bác sĩ** để cập nhật thông tin chi tiết của một hạng mục cụ thể trong lộ trình điều trị, ví dụ như sửa lại `price` (giá) hoặc `itemName` (tên) đã nhập sai.

**Typical Use Case**: Sau khi Quản lý từ chối (REJECT) lộ trình vì giá sai, Bác sĩ dùng API này để sửa giá các items, sau đó gửi duyệt lại.

---

##  API Specification

| Property                | Value                                        |
| ----------------------- | -------------------------------------------- |
| **Method**              | `PATCH`                                      |
| **Endpoint**            | `/api/v1/patient-plan-items/{itemId}`        |
| **Content-Type**        | `application/json`                           |
| **Authorization**       | Bearer Token (JWT)                           |
| **Permission Required** | `UPDATE_TREATMENT_PLAN`                      |
| **Roles**               | `ROLE_DENTIST`, `ROLE_MANAGER`, `ROLE_ADMIN` |

---

##  Business Flow

```
Scenario: Manager rejects plan due to incorrect prices

1. Bác sĩ tạo lộ trình với item có giá sai (500.000đ thay vì 1.500.000đ)
   └─> Plan.approvalStatus = PENDING_REVIEW

2. Quản lý REJECT plan (API 5.9)
   └─> Plan.approvalStatus = DRAFT
   └─> Notes: "Item 'Trám răng' có giá 500.000đ, cần sửa lại 1.500.000đ"

3. Bác sĩ gọi API 5.10 để sửa giá
   PATCH /api/v1/patient-plan-items/536
   { "price": 1500000 }
   └─> Item updated
   └─> Plan finances recalculated
   └─> Plan.approvalStatus vẫn là DRAFT

4. Bác sĩ có thể sửa thêm items khác (API 5.10 nhiều lần)

5. Sau khi sửa xong tất cả, Bác sĩ gửi duyệt lại
   └─> (Future API: Submit for Review)
```

---

##  Request Body

### JSON Structure (All Fields Optional)

**Example 1: Update price only**

```json
{
  "price": 1500000
}
```

**Example 2: Update name and price**

```json
{
  "itemName": "Trám răng Composite (Răng 46 - Đã sửa giá)",
  "price": 1500000
}
```

**Example 3: Update all fields**

```json
{
  "itemName": "Trám răng Composite (Răng 46)",
  "price": 1500000,
  "estimatedTimeMinutes": 90
}
```

### Parameters

| Field                  | Type    | Required | Validation    | Description                          |
| ---------------------- | ------- | -------- | ------------- | ------------------------------------ |
| `itemName`             | String  | Optional | Max 500 chars | Tên hạng mục mới                     |
| `price`                | Decimal | Optional | > 0           | Giá snapshot mới (để sửa giá bị sai) |
| `estimatedTimeMinutes` | Integer | Optional | > 0           | Thời gian dự kiến mới (phút)         |

**Important**: Phải có ít nhất 1 field trong request.

---

## ️ Business Logic & Validation Guards

### 1️⃣ Find Item

```java
PatientPlanItem item = itemRepository.findById(itemId)
    .orElseThrow(() -> new NotFoundException("Hạng mục không tồn tại"));
```

### 2️⃣ GUARD 1: Item Status Check (CRITICAL!)

```java
// Item must be PENDING (not scheduled or completed)
if (item.status IN [SCHEDULED, IN_PROGRESS, COMPLETED]) {
    throw new ConflictException(
        "Không thể sửa hạng mục đã được đặt lịch hoặc đã hoàn thành. " +
        "Vui lòng hủy lịch hẹn trước khi sửa."
    );
}
```

**Why?** Ngăn chặn sửa item đã linked với appointment → Tránh data inconsistency.

### 3️⃣ GUARD 2: Approval Status Check (CRITICAL!)

```java
// Plan must be DRAFT (not APPROVED or PENDING_REVIEW)
if (plan.approvalStatus IN [APPROVED, PENDING_REVIEW]) {
    throw new ConflictException(
        "Không thể sửa lộ trình đã được duyệt hoặc đang chờ duyệt. " +
        "Yêu cầu Quản lý 'Từ chối' (Reject) về DRAFT trước khi sửa."
    );
}
```

**Why?** Enforce approval workflow → Chỉ sửa được khi plan ở DRAFT.

### 4️⃣ Update Item Fields (Partial Update)

```java
if (request.itemName != null) {
    item.setItemName(request.itemName);
}
if (request.price != null) {
    item.setPrice(request.price);
}
if (request.estimatedTimeMinutes != null) {
    item.setEstimatedTimeMinutes(request.estimatedTimeMinutes);
}

itemRepository.save(item);
```

### 5️⃣ Recalculate Plan Finances

```java
if (!oldPrice.equals(newPrice)) {
    BigDecimal priceChange = newPrice.subtract(oldPrice);

    // Update plan totals
    plan.totalPrice = plan.totalPrice + priceChange;
    plan.finalCost = plan.finalCost + priceChange;

    planRepository.save(plan);
}
```

**Assumption**: Discount amount is fixed, so finalCost changes by same amount as totalPrice.

### 6️⃣ Create Audit Log

```sql
INSERT INTO plan_audit_logs (
    plan_id,
    action_type,             -- 'ITEM_UPDATED'
    performed_by,            -- Doctor's employee_id
    notes,                   -- "Item 536: 500000 -> 1500000"
    old_approval_status,     -- 'DRAFT'
    new_approval_status,     -- 'DRAFT' (no change)
    created_at
) VALUES (...);
```

### 7️⃣ Approval Status (Option A - Keep DRAFT)

```
Plan.approvalStatus REMAINS DRAFT
(No auto-trigger to PENDING_REVIEW)
```

**Why?** Bác sĩ có thể sửa nhiều items liên tiếp, chỉ submit 1 lần cuối cùng.

---

##  Response Body (200 OK)

### JSON Structure

```json
{
  "updatedItem": {
    "itemId": 536,
    "sequenceNumber": 6,
    "itemName": "Trám răng Composite (Răng 46 - Đã sửa giá)",
    "serviceId": 6,
    "price": 1500000,
    "estimatedTimeMinutes": 90,
    "status": "PENDING"
  },
  "financialImpact": {
    "planTotalCost": 16100000,
    "planFinalCost": 14600000,
    "priceChange": 1000000
  }
}
```

### Response Fields

| Field                           | Type    | Description                                   |
| ------------------------------- | ------- | --------------------------------------------- |
| `updatedItem`                   | Object  | Chi tiết item đã được cập nhật                |
| `updatedItem.itemId`            | Long    | ID của item                                   |
| `updatedItem.price`             | Decimal | Giá mới                                       |
| `financialImpact`               | Object  | Tác động tài chính lên toàn bộ plan           |
| `financialImpact.planTotalCost` | Decimal | Tổng chi phí mới của plan (trước discount)    |
| `financialImpact.planFinalCost` | Decimal | Chi phí cuối cùng mới của plan (sau discount) |
| `financialImpact.priceChange`   | Decimal | Mức thay đổi giá (newPrice - oldPrice)        |

---

##  Error Responses

### 400 BAD REQUEST - No Fields Provided

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Phải có ít nhất một trường cần cập nhật",
  "path": "/api/v1/patient-plan-items/536"
}
```

### 400 BAD REQUEST - Invalid Price

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Giá phải lớn hơn 0",
  "path": "/api/v1/patient-plan-items/536"
}
```

### 404 NOT FOUND - Item Not Found

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Hạng mục không tồn tại",
  "path": "/api/v1/patient-plan-items/999"
}
```

### 409 CONFLICT - Item Already Scheduled

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Không thể sửa hạng mục đã được đặt lịch hoặc đã hoàn thành (Trạng thái: SCHEDULED). Vui lòng hủy lịch hẹn trước khi sửa.",
  "path": "/api/v1/patient-plan-items/536"
}
```

### 409 CONFLICT - Plan Already Approved

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Không thể sửa lộ trình đã được duyệt hoặc đang chờ duyệt (Trạng thái: APPROVED). Yêu cầu Quản lý 'Từ chối' (Reject) về DRAFT trước khi sửa.",
  "path": "/api/v1/patient-plan-items/536"
}
```

---

##  Testing Guide

### Prerequisites

1. **Database**: Ensure `plan_audit_logs` table exists (Schema V20)
2. **Permissions**: `UPDATE_TREATMENT_PLAN` assigned to `ROLE_DENTIST`
3. **Test Account**: Login as Doctor
4. **Test Data**: Plan with items in DRAFT status

### Test Scenario 1: Update Price Successfully 

**Setup:**

```sql
-- Create item in DRAFT plan
INSERT INTO patient_plan_items (item_id, phase_id, service_id, sequence_number, item_name, status, price, estimated_time_minutes)
VALUES (536, 12, 6, 6, 'Trám răng Composite', 'PENDING', 500000, 60);

-- Ensure plan is in DRAFT
UPDATE patient_treatment_plans
SET approval_status = 'DRAFT'
WHERE plan_id = 104;
```

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-plan-items/536 \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1500000
  }'
```

**Expected Result:**

-  Status: 200 OK
-  `updatedItem.price`: 1500000
-  `financialImpact.priceChange`: 1000000 (1500000 - 500000)
-  `financialImpact.planTotalCost`: Increased by 1000000
-  Audit log created with action_type = "ITEM_UPDATED"

**Verification:**

```sql
-- Check item
SELECT * FROM patient_plan_items WHERE item_id = 536;

-- Check plan finances
SELECT plan_id, total_price, final_cost, approval_status
FROM patient_treatment_plans
WHERE plan_id = 104;

-- Check audit log
SELECT * FROM plan_audit_logs
WHERE plan_id = 104 AND action_type = 'ITEM_UPDATED'
ORDER BY created_at DESC LIMIT 1;
```

---

### Test Scenario 2: Update Multiple Fields 

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-plan-items/536 \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "itemName": "Trám răng Composite (Răng 46 - Đã sửa)",
    "price": 1800000,
    "estimatedTimeMinutes": 90
  }'
```

**Expected Result:**

-  All 3 fields updated
-  Financial impact calculated correctly

---

### Test Scenario 3: Update Item Already Scheduled 

**Setup:**

```sql
-- Set item status to SCHEDULED
UPDATE patient_plan_items
SET status = 'SCHEDULED'
WHERE item_id = 536;
```

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-plan-items/536 \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 2000000
  }'
```

**Expected Result:**

-  Status: 409 CONFLICT
-  Message: "Không thể sửa hạng mục đã được đặt lịch..."

---

### Test Scenario 4: Update Plan Already Approved 

**Setup:**

```sql
-- Set plan to APPROVED
UPDATE patient_treatment_plans
SET approval_status = 'APPROVED'
WHERE plan_id = 104;

-- Set item to PENDING
UPDATE patient_plan_items
SET status = 'PENDING'
WHERE item_id = 536;
```

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-plan-items/536 \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 2000000
  }'
```

**Expected Result:**

-  Status: 409 CONFLICT
-  Message: "Không thể sửa lộ trình đã được duyệt..."

---

### Test Scenario 5: Empty Request Body 

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-plan-items/536 \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:**

-  Status: 400 BAD REQUEST
-  Message: "Phải có ít nhất một trường cần cập nhật"

---

##  Related APIs

| API          | Endpoint                                                                 | Relationship                                       |
| ------------ | ------------------------------------------------------------------------ | -------------------------------------------------- |
| **API 5.9**  | `PATCH /api/v1/patient-treatment-plans/{planCode}/approval`              | Manager rejects plan → Doctor uses API 5.10 to fix |
| **API 5.7**  | `POST /api/v1/patient-treatment-plans/{planCode}/phases/{phaseId}/items` | Add new items to phase                             |
| **API 5.11** | `DELETE /api/v1/patient-plan-items/{itemId}`                             | Delete item (if need to change quantity)           |
| **API 3.x**  | Appointment APIs                                                         | Cannot update item if already scheduled            |

---

##  Database Impact

### Tables Modified

1. **`patient_plan_items`** - Item fields updated
2. **`patient_treatment_plans`** - Financial totals recalculated
3. **`plan_audit_logs`** - Audit record created

### Sample Audit Log Entry

```sql
SELECT * FROM plan_audit_logs WHERE action_type = 'ITEM_UPDATED';

| log_id | plan_id | action_type  | performed_by | notes                          | old_approval_status | new_approval_status | created_at          |
|--------|---------|--------------|--------------|--------------------------------|---------------------|---------------------|---------------------|
| 42     | 104     | ITEM_UPDATED | 5            | Item 536: 500000 -> 1500000   | DRAFT               | DRAFT               | 2025-11-15 10:30:00 |
```

---

##  Important Notes

###  What API 5.10 Does NOT Do

1. **Does NOT change `quantity`**

   - Quantity is handled by "exploding" into multiple items
   - To change quantity: DELETE item (API 5.11) or ADD new item (API 5.7)

2. **Does NOT change `serviceId`**

   - This API updates existing item, not replace service
   - To change service: DELETE old item + ADD new item

3. **Does NOT auto-trigger PENDING_REVIEW**
   - Approval status stays DRAFT
   - Doctor must explicitly submit for review (future API)

###  What API 5.10 DOES Do

1.  Update item name, price, estimated time
2.  Recalculate plan finances automatically
3.  Create audit trail
4.  Enforce guards (status checks)
5.  Support multiple updates (call API many times for different items)

---

##  Key Design Decisions

### Option A: Keep DRAFT (CHOSEN )

```
When doctor updates items:
- Plan.approvalStatus REMAINS DRAFT
- Doctor can update multiple items
- Doctor explicitly submits when ready
```

**Pros**:

-  Avoid spam PENDING_REVIEW
-  Doctor has full control
-  Can fix multiple errors in one session

### Option B: Auto PENDING_REVIEW (NOT CHOSEN )

```
When doctor updates items:
- Plan.approvalStatus AUTO-CHANGES to PENDING_REVIEW
- Manager must review again immediately
```

**Cons**:

-  Spam notifications
-  Manager sees incomplete fixes
-  Poor UX for doctor

---

**Implementation Date**: 2025-11-15
**Schema Version**: V20
**Status**:  Implemented & Documented
