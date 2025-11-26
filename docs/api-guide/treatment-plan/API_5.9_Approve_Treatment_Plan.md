# API 5.9: Duyệt / Từ chối Lộ trình Điều trị (Approve/Reject Treatment Plan)

**Version**: V20
**Date**: 2025-11-15
**Module**: Treatment Plans (Bệnh án & Lộ trình Điều trị)

---

##  Overview

API này được sử dụng bởi **Quản lý** (Manager) để **Duyệt** (Approve) hoặc **Từ chối** (Reject) một Lộ trình điều trị đang ở trạng thái `PENDING_REVIEW`.

Đây là API "then chốt" trong **quy trình kiểm soát tài chính (V19/V20)** - đảm bảo mọi ghi đè giá (price override) đều được cấp quản lý phê duyệt trước khi kích hoạt lộ trình.

---

##  API Specification

| Property                | Value                                                 |
| ----------------------- | ----------------------------------------------------- |
| **Method**              | `PATCH`                                               |
| **Endpoint**            | `/api/v1/patient-treatment-plans/{planCode}/approval` |
| **Content-Type**        | `application/json`                                    |
| **Authorization**       | Bearer Token (JWT)                                    |
| **Permission Required** | `APPROVE_TREATMENT_PLAN`                              |
| **Roles**               | `ROLE_MANAGER`, `ROLE_ADMIN`                          |

---

##  Business Flow (Quy trình nghiệp vụ V19/V20)

```
1. Bác sĩ tạo (API 5.4) hoặc sửa (API 5.7) Lộ trình tùy chỉnh
   └─> Có ghi đè giá (price override)
   └─> approvalStatus = PENDING_REVIEW (Chờ duyệt)
   └─> Lộ trình bị "khóa" (không thể Kích hoạt)

2. Quản lý gọi API 5.9 để duyệt
   └─> APPROVED: Lộ trình "mở khóa" (approvalStatus = APPROVED)
       └─> Bác sĩ/Lễ tân có thể Kích hoạt (API 5.5)
   └─> REJECTED: Lộ trình quay về DRAFT
       └─> Bác sĩ phải sửa lại (API 5.10)

3. Audit log được tự động ghi vào bảng plan_audit_logs
   └─> Ai duyệt? Khi nào? Lý do gì?
```

---

##  Request Body

### JSON Structure

**Approve Request:**

```json
{
  "approvalStatus": "APPROVED",
  "notes": "Đã xác nhận giá override cho ca trám răng phát sinh."
}
```

**Reject Request:**

```json
{
  "approvalStatus": "REJECTED",
  "notes": "Hạng mục 'Ghép xương' (itemId: 538) có giá 0đ. Yêu cầu Bác sĩ cập nhật lại giá trước khi duyệt."
}
```

### Parameters

| Field            | Type   | Required       | Validation                   | Description                                           |
| ---------------- | ------ | -------------- | ---------------------------- | ----------------------------------------------------- |
| `approvalStatus` | String |  Yes         | Enum: `APPROVED`, `REJECTED` | Trạng thái duyệt mới                                  |
| `notes`          | String | ️ Conditional | Max 5000 chars               | Ghi chú của người duyệt<br/>**BẮT BUỘC nếu REJECTED** |

---

## ️ Business Logic & Validation Guards

### 1️⃣ Authentication & Authorization

```java
// Current user must have APPROVE_TREATMENT_PLAN permission
@PreAuthorize("hasAuthority('APPROVE_TREATMENT_PLAN')")
```

### 2️⃣ Find Treatment Plan

```
- Find by planCode
- If NOT FOUND → 404 NOT_FOUND
```

### 3️⃣ Status Validation (Critical Guard)

```
- Check: plan.approvalStatus == PENDING_REVIEW
- If NOT → 409 CONFLICT
  └─> "Không thể duyệt lộ trình ở trạng thái '<current_status>'.
      Chỉ duyệt được lộ trình 'Chờ duyệt'."
```

### 4️⃣ Rejection Notes Validation

```
- If approvalStatus == REJECTED
- AND notes is empty/blank
- Then → 400 BAD_REQUEST
  └─> "Phải có lý do khi từ chối lộ trình điều trị"
```

### 5️⃣ Zero-Price Items Validation (P1 Enhancement)

```
- If approvalStatus == APPROVED
- Check: Are there any items with price ≤ 0?
- If YES → 400 BAD_REQUEST
  └─> "Không thể duyệt: Còn hạng mục có giá 0đ hoặc chưa có giá.
      Yêu cầu Bác sĩ cập nhật lại giá trước khi duyệt."
```

### 6️⃣ Update Treatment Plan

```java
// Store old status for audit
ApprovalStatus oldStatus = plan.getApprovalStatus();

// Determine new status
if (request.isApproval()) {
    plan.setApprovalStatus(APPROVED);
} else if (request.isRejection()) {
    plan.setApprovalStatus(DRAFT); // Return to DRAFT for revision
}

// Record who and when
plan.setApprovedBy(currentManager);
plan.setApprovedAt(LocalDateTime.now());
plan.setRejectionReason(request.getNotes()); // Store notes

// Save
planRepository.save(plan);
```

### 7️⃣ Create Audit Log (P0 Requirement)

```sql
INSERT INTO plan_audit_logs (
    plan_id,
    action_type,      -- 'APPROVED' or 'REJECTED'
    performed_by,     -- Manager's employee_id
    old_approval_status,  -- 'PENDING_REVIEW'
    new_approval_status,  -- 'APPROVED' or 'DRAFT'
    notes,
    created_at
) VALUES (...);
```

---

##  Response Body (200 OK)

### JSON Structure

```json
{
  "planId": 104,
  "planCode": "PLAN-20251111-002",
  "planName": "Lộ trình niềng răng tùy chỉnh (6 tháng)",
  "status": "PENDING",
  "approvalStatus": "APPROVED",

  "approvalMetadata": {
    "approvedBy": {
      "employeeCode": "MGR001",
      "fullName": "Võ Nguyễn Minh Quân"
    },
    "approvedAt": "2025-11-15T10:30:00",
    "notes": "Đã xác nhận giá override cho ca trám răng phát sinh."
  },

  "doctor": {
    "employeeCode": "DR_AN_KHOA",
    "fullName": "Dr. Le An Khoa"
  },

  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Đoàn Thanh Phong"
  },

  "startDate": "2025-11-12",
  "expectedEndDate": "2026-05-12",
  "createdAt": "2025-11-11T14:30:00",

  "totalPrice": 7500000,
  "discountAmount": 0,
  "finalCost": 7500000,
  "paymentType": "PHASED",

  "progressSummary": {
    "totalPhases": 3,
    "completedPhases": 0,
    "totalItems": 5,
    "completedItems": 0
  },

  "phases": []
}
```

### Response Fields

| Field                         | Type     | Description                                                |
| ----------------------------- | -------- | ---------------------------------------------------------- |
| `approvalStatus`              | String   | **NEW**: `APPROVED`, `REJECTED`, `DRAFT`, `PENDING_REVIEW` |
| `approvalMetadata`            | Object   | **NEW (V20)**: Metadata về ai duyệt, khi nào, lý do        |
| `approvalMetadata.approvedBy` | Object   | Thông tin người duyệt                                      |
| `approvalMetadata.approvedAt` | DateTime | Thời gian duyệt                                            |
| `approvalMetadata.notes`      | String   | Ghi chú/lý do duyệt hoặc từ chối                           |

---

##  Error Responses

### 400 BAD REQUEST - Missing Rejection Notes

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Phải có lý do khi từ chối lộ trình điều trị",
  "path": "/api/v1/patient-treatment-plans/PLAN-20251111-002/approval"
}
```

### 400 BAD REQUEST - Zero Price Items

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Không thể duyệt: Còn hạng mục có giá 0đ hoặc chưa có giá. Yêu cầu Bác sĩ cập nhật lại giá trước khi duyệt.",
  "path": "/api/v1/patient-treatment-plans/PLAN-20251111-002/approval"
}
```

### 403 FORBIDDEN - Insufficient Permissions

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/v1/patient-treatment-plans/PLAN-20251111-002/approval"
}
```

### 404 NOT FOUND - Plan Not Found

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Lộ trình điều trị không tồn tại",
  "path": "/api/v1/patient-treatment-plans/PLAN-INVALID-001/approval"
}
```

### 409 CONFLICT - Wrong Status

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Không thể duyệt lộ trình ở trạng thái 'APPROVED'. Chỉ duyệt được lộ trình 'Chờ duyệt'.",
  "path": "/api/v1/patient-treatment-plans/PLAN-20251111-002/approval"
}
```

---

##  Testing Guide

### Prerequisites

1. **Database Setup**: Ensure `plan_audit_logs` table exists (Schema V20)
2. **Seed Data**: Permission `APPROVE_TREATMENT_PLAN` assigned to `ROLE_MANAGER`
3. **Test Account**: Login as Manager with `APPROVE_TREATMENT_PLAN` permission

### Test Scenario 1: Approve Treatment Plan 

**Setup:**

```sql
-- Create a treatment plan in PENDING_REVIEW status
UPDATE patient_treatment_plans
SET approval_status = 'PENDING_REVIEW'
WHERE plan_code = 'PLAN-20251111-002';

-- Ensure all items have price > 0
UPDATE patient_plan_items
SET override_price = 1500000
WHERE plan_phase_id IN (
    SELECT phase_id FROM patient_plan_phases
    WHERE plan_id = (SELECT plan_id FROM patient_treatment_plans WHERE plan_code = 'PLAN-20251111-002')
);
```

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-treatment-plans/PLAN-20251111-002/approval \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalStatus": "APPROVED",
    "notes": "Đã xác nhận giá override cho ca trám răng phát sinh."
  }'
```

**Expected Result:**

-  Status: 200 OK
-  `approvalStatus`: "APPROVED"
-  `approvalMetadata` populated with manager info
-  Audit log created in `plan_audit_logs`

**Verification:**

```sql
-- Check plan status
SELECT plan_code, approval_status, approved_at
FROM patient_treatment_plans
WHERE plan_code = 'PLAN-20251111-002';

-- Check audit log
SELECT * FROM plan_audit_logs
WHERE plan_id = (SELECT plan_id FROM patient_treatment_plans WHERE plan_code = 'PLAN-20251111-002')
ORDER BY created_at DESC LIMIT 1;
```

---

### Test Scenario 2: Reject Treatment Plan (Missing Notes) 

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-treatment-plans/PLAN-20251111-002/approval \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalStatus": "REJECTED"
  }'
```

**Expected Result:**

-  Status: 400 BAD REQUEST
-  Message: "Phải có lý do khi từ chối lộ trình điều trị"

---

### Test Scenario 3: Reject Treatment Plan (With Notes) 

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-treatment-plans/PLAN-20251111-002/approval \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalStatus": "REJECTED",
    "notes": "Hạng mục Ghép xương có giá 0đ. Yêu cầu Bác sĩ cập nhật lại giá."
  }'
```

**Expected Result:**

-  Status: 200 OK
-  `approvalStatus`: "DRAFT" (returned to draft for revision)
-  `approvalMetadata.notes`: Contains rejection reason
-  Audit log created with action_type = "REJECTED"

---

### Test Scenario 4: Approve Plan with Zero-Price Items 

**Setup:**

```sql
-- Set one item price to 0
UPDATE patient_plan_items
SET override_price = 0
WHERE item_id = 538;
```

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-treatment-plans/PLAN-20251111-002/approval \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalStatus": "APPROVED",
    "notes": "OK"
  }'
```

**Expected Result:**

-  Status: 400 BAD REQUEST
-  Message: "Không thể duyệt: Còn hạng mục có giá 0đ..."

---

### Test Scenario 5: Wrong Status (Already Approved) 

**Setup:**

```sql
UPDATE patient_treatment_plans
SET approval_status = 'APPROVED'
WHERE plan_code = 'PLAN-20251111-002';
```

**Request:**

```bash
curl -X PATCH http://localhost:8080/api/v1/patient-treatment-plans/PLAN-20251111-002/approval \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalStatus": "APPROVED",
    "notes": "Double approval"
  }'
```

**Expected Result:**

-  Status: 409 CONFLICT
-  Message: "Không thể duyệt lộ trình ở trạng thái 'APPROVED'..."

---

##  Database Changes (V20)

### New Table: `plan_audit_logs`

```sql
CREATE TABLE plan_audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,      -- 'APPROVED', 'REJECTED', 'SUBMITTED_FOR_REVIEW'
    performed_by BIGINT NOT NULL,          -- FK -> employees.employee_id
    notes TEXT,
    old_approval_status approval_status,   -- Previous status
    new_approval_status approval_status,   -- New status
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_plan_audit_plan FOREIGN KEY (plan_id)
        REFERENCES patient_treatment_plans(plan_id) ON DELETE CASCADE,
    CONSTRAINT fk_plan_audit_employee FOREIGN KEY (performed_by)
        REFERENCES employees(employee_id) ON DELETE SET NULL
);

CREATE INDEX idx_plan_audit_plan ON plan_audit_logs(plan_id);
CREATE INDEX idx_plan_audit_performed_by ON plan_audit_logs(performed_by);
```

### New Permission

```sql
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, is_active)
VALUES ('APPROVE_TREATMENT_PLAN', 'APPROVE_TREATMENT_PLAN', 'TREATMENT_PLAN',
        'Duyệt/Từ chối lộ trình điều trị (Quản lý)', 265, TRUE);

-- Assign to ROLE_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
VALUES ('ROLE_MANAGER', 'APPROVE_TREATMENT_PLAN');
```

---

##  Related APIs

| API         | Endpoint                                                                 | Description                                            |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| **API 5.4** | `POST /api/v1/patients/{patientCode}/treatment-plans/custom`             | Tạo lộ trình tùy chỉnh (có thể trigger PENDING_REVIEW) |
| **API 5.5** | `POST /api/v1/patient-treatment-plans/{planCode}/activate`               | Kích hoạt lộ trình (chỉ khi APPROVED)                  |
| **API 5.7** | `POST /api/v1/patient-treatment-plans/{planCode}/phases/{phaseId}/items` | Thêm items (có thể trigger PENDING_REVIEW)             |
| **API 5.9** | `PATCH /api/v1/patient-treatment-plans/{planCode}/approval`              | **THIS API** - Duyệt/Từ chối                           |

---

##  Notes

- **Audit Trail**: Mọi hành động duyệt/từ chối đều được ghi log vào `plan_audit_logs` để đảm bảo tính minh bạch và tuân thủ (compliance).
- **State Transition**: `REJECTED` → `DRAFT` (không phải `REJECTED` status) để Bác sĩ có thể sửa lại.
- **Zero-Price Validation**: Đây là P1 enhancement quan trọng, ngăn việc duyệt nhầm lộ trình còn thiếu giá.
- **Permission Model**: Chỉ Manager có quyền `APPROVE_TREATMENT_PLAN`, tách biệt với quyền `CREATE_TREATMENT_PLAN` của Bác sĩ (Separation of Duties).

---

**Implementation Date**: 2025-11-15
**Schema Version**: V20
**Status**:  Implemented & Documented
