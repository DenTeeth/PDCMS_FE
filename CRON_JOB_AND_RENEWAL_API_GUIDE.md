# 📚 Hướng Dẫn Cron Jobs & Shift Renewal API - PDCMS Backend

> **Tài liệu dành cho Frontend Developer**  
> Version: 2.0 | Updated: November 2, 2025

---

## 📑 Mục Lục

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Kiến Trúc Cron Jobs](#2-kiến-trúc-cron-jobs)
3. [API Endpoints - Shift Renewal](#3-api-endpoints---shift-renewal)
4. [Test Cases với Postman](#4-test-cases-với-postman)
5. [Frontend Integration Guide](#5-frontend-integration-guide)
6. [Workflows & Business Logic](#6-workflows--business-logic)

---

## 1. Tổng Quan Hệ Thống

### 1.1 Kiến Trúc Hybrid Scheduling

Hệ thống quản lý lịch làm việc theo **2 luồng**:

| Luồng | Tên | Áp Dụng Cho | Bảng Chính | Renewal? |
|-------|-----|-------------|------------|----------|
| **Luồng 1** | Fixed Schedule | Full-Time, Part-Time Fixed | `fixed_shift_registrations` | ✅ Có (P7) |
| **Luồng 2** | Flex Schedule | Part-Time Flex | `employee_shift_registrations` | ❌ Không |

**Lưu ý quan trọng**: 
- **Chỉ Luồng 1** (Fixed) mới có tính năng Renewal (P7)
- Luồng 2 (Flex) tự động hết hạn, không cần renewal

---

### 1.2 Các Cron Jobs Hoạt Động

| Job Code | Tên | Chạy Lúc | Mục Đích | Status |
|----------|-----|----------|----------|--------|
| **P8** | UnifiedScheduleSyncJob | 00:01 AM hàng ngày | Đồng bộ lịch từ cả 2 luồng vào `employee_shifts` | ✅ Active |
| **P9** | DailyRenewalDetectionJob | 00:05 AM hàng ngày | Phát hiện FIXED registrations sắp hết hạn, tạo renewal request | ✅ Active |
| **P10** | ExpirePendingRenewalsJob | 00:10 AM hàng ngày | Đánh dấu renewal requests quá hạn → EXPIRED | ✅ Active |
| **P11** | CleanupExpiredFlexRegistrations | 00:15 AM hàng ngày | Tự động vô hiệu hóa Flex registrations hết hạn | ✅ Active |
| ~~Job 1~~ | MonthlyFullTimeScheduleJob | ~~Tháng 1 lần~~ | ~~Tạo lịch Full-Time~~ | ⛔ Deprecated |
| ~~Job 2~~ | WeeklyPartTimeScheduleJob | ~~Tuần 1 lần~~ | ~~Tạo lịch Part-Time Flex~~ | ⛔ Deprecated |

---

## 2. Kiến Trúc Cron Jobs

### 2.1 Job P8: UnifiedScheduleSyncJob ⭐ (QUAN TRỌNG NHẤT)

**Chức năng**: Đồng bộ lịch từ cả 2 luồng vào bảng `employee_shifts` để tạo lịch làm việc thực tế.

**Thời gian chạy**: `00:01 AM` mỗi ngày

**Cron Expression**: `0 1 0 * * ?` (Asia/Ho_Chi_Minh)

#### 📊 Business Logic

```
Window: 14 ngày (Hôm nay → Hôm nay + 13 ngày)

BƯỚC 1: Xóa lịch cũ (đề phòng admin đổi lịch)
DELETE FROM employee_shifts
WHERE work_date >= CURRENT_DATE 
  AND work_date <= CURRENT_DATE + 13
  AND status = 'SCHEDULED'
  AND source IN ('BATCH_JOB', 'REGISTRATION_JOB')

BƯỚC 2: Loop qua 14 ngày
FOR EACH day IN [Today → Today+13]:
    IF day là Holiday → SKIP
    
    // Query 1: Lấy lịch Fixed (Luồng 1)
    SELECT employee_id, work_shift_id
    FROM fixed_shift_registrations fsr
    JOIN fixed_registration_days frd 
    WHERE frd.day_of_week = [DAY_OF_WEEK của day]
      AND fsr.effective_from <= day
      AND (fsr.effective_to IS NULL OR fsr.effective_to >= day)
      AND fsr.is_active = true
    
    // Query 2: Lấy lịch Flex (Luồng 2)
    SELECT employee_id, work_shift_id
    FROM employee_shift_registrations esr
    JOIN part_time_slots pts
    WHERE pts.day_of_week = [DAY_OF_WEEK của day]
      AND esr.effective_from <= day
      AND esr.effective_to >= day
      AND esr.is_active = true
    
    // Insert vào employee_shifts
    INSERT INTO employee_shifts (...)
    VALUES 
      (..., 'BATCH_JOB'),        -- Từ Fixed
      (..., 'REGISTRATION_JOB')  -- Từ Flex

BƯỚC 3: Log kết quả
```

#### 🏷️ Source Tags

| Source | Ý Nghĩa | Từ Luồng |
|--------|---------|----------|
| `BATCH_JOB` | Từ lịch cố định | Luồng 1 (Fixed) |
| `REGISTRATION_JOB` | Từ lịch linh hoạt | Luồng 2 (Flex) |
| `OT_APPROVAL` | Từ overtime được duyệt | Manual |
| `MANUAL_ENTRY` | Tạo thủ công bởi admin | Manual |

#### 🎯 Self-Healing Architecture

- Admin đổi lịch Fixed hôm nay → Tự động sync ngày mai
- Part-time đăng ký ca mới → Xuất hiện lịch ngày hôm sau
- **Không cần** restart service hay chạy script thủ công

---

### 2.2 Job P9: DailyRenewalDetectionJob

**Chức năng**: Phát hiện FIXED registrations sắp hết hạn và tạo renewal request.

**Thời gian chạy**: `00:05 AM` mỗi ngày (sau P8)

**Cron Expression**: `0 5 0 * * ?`

#### 📊 Business Logic

```
Window: 14-28 ngày (Tìm registrations hết hạn trong 14-28 ngày nữa)

BƯỚC 1: Query registrations sắp hết hạn
SELECT * FROM fixed_shift_registrations
WHERE effective_to BETWEEN (TODAY + 14 days) AND (TODAY + 28 days)
  AND is_active = true
  AND NOT EXISTS (
      SELECT 1 FROM shift_renewal_requests
      WHERE expiring_registration_id = registration_id
        AND status = 'PENDING_ACTION'
  )

BƯỚC 2: Tạo renewal request cho mỗi registration
INSERT INTO shift_renewal_requests (
    renewal_id,           -- Format: SRR_YYYYMMDD_XXXXX
    expiring_registration_id,
    employee_id,
    status,               -- 'PENDING_ACTION'
    expires_at,           -- effective_to - 2 days
    created_at
)

BƯỚC 3: Log kết quả
- Số lượng renewals tạo
- Số lượng bỏ qua (đã tồn tại)
```

#### 🔔 Notification Trigger

Khi job tạo renewal request mới:
- Frontend có thể query API `GET /api/v1/registrations/renewals/pending`
- Hiển thị badge/notification cho nhân viên
- Email/SMS có thể được gửi (tùy chọn)

---

### 2.3 Job P10: ExpirePendingRenewalsJob

**Chức năng**: Tự động đánh dấu renewal requests quá hạn.

**Thời gian chạy**: `00:10 AM` mỗi ngày (sau P9)

**Cron Expression**: `0 10 0 * * ?`

#### 📊 Business Logic

```
BƯỚC 1: Tìm renewals đã quá hạn
SELECT * FROM shift_renewal_requests
WHERE status = 'PENDING_ACTION'
  AND expires_at <= NOW()

BƯỚC 2: Update status
UPDATE shift_renewal_requests
SET status = 'EXPIRED',
    confirmed_at = NOW()
WHERE renewal_id IN (...)

BƯỚC 3: Log cảnh báo
- Số lượng renewals bị expired
- HR/Admin cần xem lại và xử lý
```

#### ⚠️ Impact

- Nhân viên không còn thể phản hồi renewal đã expired
- Admin cần tạo renewal request mới nếu muốn
- Hoặc tạo Fixed registration mới thủ công

---

### 2.4 Job P11: CleanupExpiredFlexRegistrations

**Chức năng**: Tự động vô hiệu hóa Flex registrations (Luồng 2) đã hết hạn.

**Thời gian chạy**: `00:15 AM` mỗi ngày

**Cron Expression**: `0 15 0 * * ?`

#### 📊 Business Logic

```
BƯỚC 1: Tìm Flex registrations đã hết hạn
SELECT * FROM employee_shift_registrations
WHERE effective_to < CURRENT_DATE
  AND is_active = true

BƯỚC 2: Vô hiệu hóa (soft delete)
UPDATE employee_shift_registrations
SET is_active = false
WHERE registration_id IN (...)

BƯỚC 3: Log kết quả
```

**Lưu ý**: Luồng 2 (Flex) KHÔNG có renewal, chỉ auto-deactivate.

---

## 3. API Endpoints - Shift Renewal

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHIFT RENEWAL WORKFLOW (P7)                  │
│                      (Chỉ áp dụng Luồng 1)                      │
└─────────────────────────────────────────────────────────────────┘

   STEP 1                    STEP 2                    STEP 3
┌──────────┐             ┌──────────┐              ┌──────────┐
│ Job P9   │─────────►   │ Employee │─────────►    │  Admin   │
│ Auto     │  Creates    │ Responds │   Confirms   │ Finalize │
│ Detect   │  Renewal    │ (YES/NO) │      or      │ w/ Date  │
└──────────┘             └──────────┘   Declines   └──────────┘
                                            │
                            ┌───────────────┴───────────────┐
                            │                               │
                         DECLINED                      CONFIRMED
                            │                               │
                    [End: Status                    [Await Admin]
                     = DECLINED]                           │
                                                   ┌────────▼────────┐
                                                   │ Admin Finalize  │
                                                   │ - Set new date  │
                                                   │ - Create new    │
                                                   │   registration  │
                                                   └─────────────────┘
```

---

### 3.2 Employee APIs

Base URL: `http://localhost:8080/api/v1/registrations/renewals`

---

#### 3.2.1 Get Pending Renewals

**Endpoint**: `GET /api/v1/registrations/renewals/pending`

**Mục đích**: Lấy danh sách renewal requests đang chờ nhân viên phản hồi.

**Authentication**: Required (Bearer Token)

**Query Parameters**: Không

**Response (200 OK)**:
```json
[
  {
    "renewalId": "SRR_20251102_00001",
    "expiringRegistrationId": 123,
    "employeeId": 10,
    "employeeName": "Nguyễn Văn A",
    "status": "PENDING_ACTION",
    "expiresAt": "2025-11-15T23:59:59",
    "createdAt": "2025-11-01T00:05:00",
    "confirmedAt": null,
    "declineReason": null,
    "effectiveFrom": "2024-11-01",
    "effectiveTo": "2025-11-30",
    "workShiftName": "Ca sáng (8:00 - 12:00)",
    "shiftDetails": "Thứ 2, Thứ 4, Thứ 6 (Ca sáng)",
    "message": "Lịch làm việc cố định 'Ca sáng' của bạn sẽ hết hạn vào 30/11/2025. Bạn có muốn gia hạn không?"
  },
  {
    "renewalId": "SRR_20251102_00002",
    "expiringRegistrationId": 456,
    "employeeId": 10,
    "employeeName": "Nguyễn Văn A",
    "status": "PENDING_ACTION",
    "expiresAt": "2025-11-20T23:59:59",
    "createdAt": "2025-11-02T00:05:00",
    "confirmedAt": null,
    "declineReason": null,
    "effectiveFrom": "2024-12-01",
    "effectiveTo": "2025-12-05",
    "workShiftName": "Ca chiều (13:00 - 17:00)",
    "shiftDetails": "Thứ 3, Thứ 5 (Ca chiều)",
    "message": "Lịch làm việc cố định 'Ca chiều' của bạn sẽ hết hạn vào 05/12/2025. Bạn có muốn gia hạn không?"
  }
]
```

**Response (401 Unauthorized)**:
```json
{
  "timestamp": "2025-11-02T10:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Authentication required",
  "path": "/api/v1/registrations/renewals/pending"
}
```

**Frontend Implementation**:
```typescript
// React/Vue/Angular Example
async function fetchPendingRenewals() {
  const response = await fetch('/api/v1/registrations/renewals/pending', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch renewals');
  }
  
  const renewals = await response.json();
  
  // Hiển thị notification badge
  const pendingCount = renewals.length;
  updateNotificationBadge(pendingCount);
  
  return renewals;
}
```

---

#### 3.2.2 Respond to Renewal

**Endpoint**: `PATCH /api/v1/registrations/renewals/{renewal_id}/respond`

**Mục đích**: Nhân viên phản hồi renewal request (Đồng ý hoặc Từ chối).

**Authentication**: Required (Bearer Token)

**Path Parameters**:
- `renewal_id` (string, required): ID của renewal request (VD: `SRR_20251102_00001`)

**Request Body**:

**Case 1: CONFIRMED (Đồng ý gia hạn)**
```json
{
  "action": "CONFIRMED",
  "declineReason": null
}
```

**Case 2: DECLINED (Từ chối gia hạn)**
```json
{
  "action": "DECLINED",
  "declineReason": "Tôi sẽ nghỉ việc vào cuối tháng này"
}
```

**Validation Rules**:
- `action`: Required, phải là `"CONFIRMED"` hoặc `"DECLINED"`
- `declineReason`: Required nếu `action = "DECLINED"`, optional nếu `action = "CONFIRMED"`

**Response (200 OK) - CONFIRMED**:
```json
{
  "renewalId": "SRR_20251102_00001",
  "expiringRegistrationId": 123,
  "employeeId": 10,
  "employeeName": "Nguyễn Văn A",
  "status": "CONFIRMED",
  "expiresAt": "2025-11-15T23:59:59",
  "createdAt": "2025-11-01T00:05:00",
  "confirmedAt": "2025-11-02T10:30:00",
  "declineReason": null,
  "effectiveFrom": "2024-11-01",
  "effectiveTo": "2025-11-30",
  "workShiftName": "Ca sáng (8:00 - 12:00)",
  "shiftDetails": "Thứ 2, Thứ 4, Thứ 6 (Ca sáng)",
  "message": "Bạn đã đồng ý gia hạn. Đợi Admin xác nhận và chọn ngày hết hạn mới."
}
```

**Response (200 OK) - DECLINED**:
```json
{
  "renewalId": "SRR_20251102_00001",
  "expiringRegistrationId": 123,
  "employeeId": 10,
  "employeeName": "Nguyễn Văn A",
  "status": "DECLINED",
  "expiresAt": "2025-11-15T23:59:59",
  "createdAt": "2025-11-01T00:05:00",
  "confirmedAt": "2025-11-02T10:30:00",
  "declineReason": "Tôi sẽ nghỉ việc vào cuối tháng này",
  "effectiveFrom": "2024-11-01",
  "effectiveTo": "2025-11-30",
  "workShiftName": "Ca sáng (8:00 - 12:00)",
  "shiftDetails": "Thứ 2, Thứ 4, Thứ 6 (Ca sáng)",
  "message": "Bạn đã từ chối gia hạn. Lịch sẽ kết thúc vào 30/11/2025."
}
```

**Response (400 Bad Request)**:
```json
{
  "timestamp": "2025-11-02T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Decline reason is required when action is DECLINED",
  "path": "/api/v1/registrations/renewals/SRR_20251102_00001/respond"
}
```

**Response (404 Not Found)**:
```json
{
  "timestamp": "2025-11-02T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Renewal request not found: SRR_20251102_00001",
  "path": "/api/v1/registrations/renewals/SRR_20251102_00001/respond"
}
```

**Response (409 Conflict)**:
```json
{
  "timestamp": "2025-11-02T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Renewal request already responded or expired",
  "path": "/api/v1/registrations/renewals/SRR_20251102_00001/respond"
}
```

**Frontend Implementation**:
```typescript
async function respondToRenewal(renewalId: string, action: 'CONFIRMED' | 'DECLINED', reason?: string) {
  const body = {
    action: action,
    declineReason: action === 'DECLINED' ? reason : null
  };
  
  const response = await fetch(`/api/v1/registrations/renewals/${renewalId}/respond`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}

// Usage
try {
  const result = await respondToRenewal('SRR_20251102_00001', 'CONFIRMED');
  showSuccessMessage('Đã xác nhận gia hạn thành công!');
} catch (error) {
  showErrorMessage(error.message);
}
```

---

### 3.3 Admin APIs

Base URL: `http://localhost:8080/api/v1/admin/registrations/renewals`

---

#### 3.3.1 Finalize Renewal

**Endpoint**: `POST /api/v1/admin/registrations/renewals/finalize`

**Mục đích**: Admin hoàn tất renewal đã được nhân viên confirm, chọn ngày hết hạn mới.

**Authentication**: Required (Bearer Token + Permission: `MANAGE_FIXED_REGISTRATIONS`)

**Request Body**:
```json
{
  "renewalRequestId": "SRR_20251102_00001",
  "newEffectiveTo": "2026-11-30"
}
```

**Validation Rules**:
- `renewalRequestId`: Required, phải tồn tại và có status = `CONFIRMED`
- `newEffectiveTo`: Required, phải > old registration's `effective_to`

**Response (200 OK)**:
```json
{
  "renewalId": "SRR_20251102_00001",
  "expiringRegistrationId": 123,
  "employeeId": 10,
  "employeeName": "Nguyễn Văn A",
  "status": "FINALIZED",
  "expiresAt": "2025-11-15T23:59:59",
  "createdAt": "2025-11-01T00:05:00",
  "confirmedAt": "2025-11-02T14:00:00",
  "declineReason": null,
  "effectiveFrom": "2024-11-01",
  "effectiveTo": "2025-11-30",
  "workShiftName": "Ca sáng (8:00 - 12:00)",
  "shiftDetails": "Thứ 2, Thứ 4, Thứ 6 (Ca sáng)",
  "message": "Gia hạn hoàn tất. Registration mới: 2025-12-01 → 2026-11-30"
}
```

**Response (400 Bad Request)**:
```json
{
  "timestamp": "2025-11-02T14:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "New effective_to (2025-10-31) must be after old effective_to (2025-11-30)",
  "path": "/api/v1/admin/registrations/renewals/finalize"
}
```

**Response (403 Forbidden)**:
```json
{
  "timestamp": "2025-11-02T14:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Missing required permission: MANAGE_FIXED_REGISTRATIONS",
  "path": "/api/v1/admin/registrations/renewals/finalize"
}
```

**Response (409 Conflict)**:
```json
{
  "timestamp": "2025-11-02T14:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Renewal request must be CONFIRMED by employee first",
  "path": "/api/v1/admin/registrations/renewals/finalize"
}
```

**Business Logic Behind the Scene**:
```sql
-- BƯỚC 1: Lock old registration
SELECT * FROM fixed_shift_registrations
WHERE registration_id = [expiringRegistrationId]
FOR UPDATE;

-- BƯỚC 2: Deactivate old registration
UPDATE fixed_shift_registrations
SET is_active = false
WHERE registration_id = [expiringRegistrationId];

-- BƯỚC 3: Create new registration
INSERT INTO fixed_shift_registrations (
  registration_id,
  employee_id,
  work_shift_id,
  effective_from,     -- old_effective_to + 1 day
  effective_to,       -- newEffectiveTo từ request
  is_active
) VALUES (...);

-- BƯỚC 4: Copy registration_days
INSERT INTO fixed_registration_days (registration_id, day_of_week)
SELECT [newRegistrationId], day_of_week
FROM fixed_registration_days
WHERE registration_id = [oldRegistrationId];

-- BƯỚC 5: Update renewal status
UPDATE shift_renewal_requests
SET status = 'FINALIZED',
    confirmed_at = NOW()
WHERE renewal_id = [renewalRequestId];
```

**Frontend Implementation**:
```typescript
async function finalizeRenewal(renewalId: string, newEffectiveTo: string) {
  const body = {
    renewalRequestId: renewalId,
    newEffectiveTo: newEffectiveTo  // Format: YYYY-MM-DD
  };
  
  const response = await fetch('/api/v1/admin/registrations/renewals/finalize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}

// Usage với DatePicker
async function handleFinalize() {
  const renewalId = 'SRR_20251102_00001';
  const selectedDate = '2026-11-30'; // From DatePicker
  
  try {
    const result = await finalizeRenewal(renewalId, selectedDate);
    showSuccessMessage('Đã hoàn tất gia hạn!');
    refreshRenewalList();
  } catch (error) {
    showErrorMessage(error.message);
  }
}
```

---

## 4. Test Cases với Postman

### 4.1 Setup Environment

**Tạo Environment trong Postman**:

```json
{
  "base_url": "http://localhost:8080",
  "employee_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "renewal_id": "SRR_20251102_00001"
}
```

---

### 4.2 Test Case 1: Employee - Get Pending Renewals

**Request**:
```
GET {{base_url}}/api/v1/registrations/renewals/pending
```

**Headers**:
```
Authorization: Bearer {{employee_token}}
Content-Type: application/json
```

**Expected Response (200)**:
```json
[
  {
    "renewalId": "SRR_20251102_00001",
    "expiringRegistrationId": 123,
    "employeeId": 10,
    "employeeName": "Nguyễn Văn A",
    "status": "PENDING_ACTION",
    "expiresAt": "2025-11-15T23:59:59",
    "createdAt": "2025-11-01T00:05:00",
    "message": "Lịch làm việc cố định 'Ca sáng' của bạn sẽ hết hạn vào 30/11/2025..."
  }
]
```

**Postman Tests Script**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is an array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});

pm.test("Each renewal has required fields", function () {
    const jsonData = pm.response.json();
    if (jsonData.length > 0) {
        const renewal = jsonData[0];
        pm.expect(renewal).to.have.property('renewalId');
        pm.expect(renewal).to.have.property('status');
        pm.expect(renewal.status).to.equal('PENDING_ACTION');
        
        // Save renewal_id for next test
        pm.environment.set("renewal_id", renewal.renewalId);
    }
});
```

---

### 4.3 Test Case 2: Employee - Confirm Renewal

**Request**:
```
PATCH {{base_url}}/api/v1/registrations/renewals/{{renewal_id}}/respond
```

**Headers**:
```
Authorization: Bearer {{employee_token}}
Content-Type: application/json
```

**Body (raw JSON)**:
```json
{
  "action": "CONFIRMED",
  "declineReason": null
}
```

**Expected Response (200)**:
```json
{
  "renewalId": "SRR_20251102_00001",
  "status": "CONFIRMED",
  "confirmedAt": "2025-11-02T10:30:00",
  "message": "Bạn đã đồng ý gia hạn. Đợi Admin xác nhận..."
}
```

**Postman Tests Script**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Status changed to CONFIRMED", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.status).to.equal('CONFIRMED');
    pm.expect(jsonData.confirmedAt).to.not.be.null;
});

pm.test("Confirmed timestamp is valid", function () {
    const jsonData = pm.response.json();
    const confirmedAt = new Date(jsonData.confirmedAt);
    pm.expect(confirmedAt).to.be.a('date');
});
```

---

### 4.4 Test Case 3: Employee - Decline Renewal

**Request**:
```
PATCH {{base_url}}/api/v1/registrations/renewals/{{renewal_id}}/respond
```

**Headers**:
```
Authorization: Bearer {{employee_token}}
Content-Type: application/json
```

**Body (raw JSON)**:
```json
{
  "action": "DECLINED",
  "declineReason": "Tôi sẽ nghỉ việc vào cuối tháng này"
}
```

**Expected Response (200)**:
```json
{
  "renewalId": "SRR_20251102_00001",
  "status": "DECLINED",
  "confirmedAt": "2025-11-02T10:30:00",
  "declineReason": "Tôi sẽ nghỉ việc vào cuối tháng này",
  "message": "Bạn đã từ chối gia hạn. Lịch sẽ kết thúc vào 30/11/2025."
}
```

**Postman Tests Script**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Status changed to DECLINED", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.status).to.equal('DECLINED');
    pm.expect(jsonData.declineReason).to.not.be.empty;
});
```

---

### 4.5 Test Case 4: Admin - Finalize Renewal

**Request**:
```
POST {{base_url}}/api/v1/admin/registrations/renewals/finalize
```

**Headers**:
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body (raw JSON)**:
```json
{
  "renewalRequestId": "SRR_20251102_00001",
  "newEffectiveTo": "2026-11-30"
}
```

**Expected Response (200)**:
```json
{
  "renewalId": "SRR_20251102_00001",
  "status": "FINALIZED",
  "confirmedAt": "2025-11-02T14:00:00",
  "message": "Gia hạn hoàn tất. Registration mới: 2025-12-01 → 2026-11-30"
}
```

**Postman Tests Script**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Status changed to FINALIZED", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.status).to.equal('FINALIZED');
});

pm.test("Confirmed timestamp updated", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.confirmedAt).to.not.be.null;
});
```

---

### 4.6 Test Case 5: Error - Missing Decline Reason

**Request**:
```
PATCH {{base_url}}/api/v1/registrations/renewals/{{renewal_id}}/respond
```

**Body (raw JSON)**:
```json
{
  "action": "DECLINED",
  "declineReason": null
}
```

**Expected Response (400)**:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Decline reason is required when action is DECLINED"
}
```

---

### 4.7 Test Case 6: Error - Invalid New Effective Date

**Request**:
```
POST {{base_url}}/api/v1/admin/registrations/renewals/finalize
```

**Body (raw JSON)**:
```json
{
  "renewalRequestId": "SRR_20251102_00001",
  "newEffectiveTo": "2025-10-31"
}
```

**Expected Response (400)**:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "New effective_to (2025-10-31) must be after old effective_to (2025-11-30)"
}
```

---

## 5. Frontend Integration Guide

### 5.1 React/TypeScript Example

**Types Definition**:
```typescript
// types/renewal.ts
export enum RenewalStatus {
  PENDING_ACTION = 'PENDING_ACTION',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  FINALIZED = 'FINALIZED',
  EXPIRED = 'EXPIRED'
}

export interface ShiftRenewal {
  renewalId: string;
  expiringRegistrationId: number;
  employeeId: number;
  employeeName: string;
  status: RenewalStatus;
  expiresAt: string;
  createdAt: string;
  confirmedAt: string | null;
  declineReason: string | null;
  effectiveFrom: string;
  effectiveTo: string;
  workShiftName: string;
  shiftDetails: string;
  message: string;
}

export interface RenewalResponse {
  action: 'CONFIRMED' | 'DECLINED';
  declineReason?: string;
}

export interface FinalizeRenewalRequest {
  renewalRequestId: string;
  newEffectiveTo: string;
}
```

**API Service**:
```typescript
// services/renewalService.ts
import axios from 'axios';
import { ShiftRenewal, RenewalResponse, FinalizeRenewalRequest } from '../types/renewal';

const API_BASE = 'http://localhost:8080/api/v1';

class RenewalService {
  // Employee APIs
  async getPendingRenewals(token: string): Promise<ShiftRenewal[]> {
    const response = await axios.get(`${API_BASE}/registrations/renewals/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async respondToRenewal(
    renewalId: string, 
    request: RenewalResponse, 
    token: string
  ): Promise<ShiftRenewal> {
    const response = await axios.patch(
      `${API_BASE}/registrations/renewals/${renewalId}/respond`,
      request,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  // Admin APIs
  async finalizeRenewal(
    request: FinalizeRenewalRequest, 
    adminToken: string
  ): Promise<ShiftRenewal> {
    const response = await axios.post(
      `${API_BASE}/admin/registrations/renewals/finalize`,
      request,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data;
  }
}

export default new RenewalService();
```

**Component Example**:
```typescript
// components/RenewalList.tsx
import React, { useEffect, useState } from 'react';
import { ShiftRenewal, RenewalStatus } from '../types/renewal';
import renewalService from '../services/renewalService';
import { useAuth } from '../hooks/useAuth';

export const RenewalList: React.FC = () => {
  const { token } = useAuth();
  const [renewals, setRenewals] = useState<ShiftRenewal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const data = await renewalService.getPendingRenewals(token);
      setRenewals(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch renewals');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (renewalId: string) => {
    try {
      await renewalService.respondToRenewal(
        renewalId,
        { action: 'CONFIRMED' },
        token
      );
      alert('Đã xác nhận gia hạn thành công!');
      fetchRenewals(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm');
    }
  };

  const handleDecline = async (renewalId: string, reason: string) => {
    try {
      await renewalService.respondToRenewal(
        renewalId,
        { action: 'DECLINED', declineReason: reason },
        token
      );
      alert('Đã từ chối gia hạn');
      fetchRenewals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline');
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className="renewal-list">
      <h2>Yêu cầu gia hạn ({renewals.length})</h2>
      
      {renewals.length === 0 ? (
        <p>Không có yêu cầu gia hạn nào</p>
      ) : (
        renewals.map(renewal => (
          <div key={renewal.renewalId} className="renewal-card">
            <h3>{renewal.workShiftName}</h3>
            <p>{renewal.message}</p>
            <p><strong>Chi tiết:</strong> {renewal.shiftDetails}</p>
            <p><strong>Hết hạn vào:</strong> {new Date(renewal.effectiveTo).toLocaleDateString('vi-VN')}</p>
            <p><strong>Deadline phản hồi:</strong> {new Date(renewal.expiresAt).toLocaleDateString('vi-VN')}</p>
            
            <div className="actions">
              <button 
                className="btn-confirm"
                onClick={() => handleConfirm(renewal.renewalId)}
              >
                Đồng ý gia hạn
              </button>
              <button 
                className="btn-decline"
                onClick={() => {
                  const reason = prompt('Lý do từ chối:');
                  if (reason) handleDecline(renewal.renewalId, reason);
                }}
              >
                Từ chối
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
```

---

### 5.2 Admin Finalize Component

```typescript
// components/AdminFinalizeRenewal.tsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import renewalService from '../services/renewalService';
import { useAuth } from '../hooks/useAuth';

interface Props {
  renewalId: string;
  oldEffectiveTo: string;
  onSuccess: () => void;
}

export const AdminFinalizeRenewal: React.FC<Props> = ({ 
  renewalId, 
  oldEffectiveTo, 
  onSuccess 
}) => {
  const { adminToken } = useAuth();
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFinalize = async () => {
    if (!newDate) {
      alert('Vui lòng chọn ngày hết hạn mới');
      return;
    }

    setLoading(true);
    try {
      await renewalService.finalizeRenewal(
        {
          renewalRequestId: renewalId,
          newEffectiveTo: newDate.toISOString().split('T')[0] // YYYY-MM-DD
        },
        adminToken
      );
      alert('Đã hoàn tất gia hạn!');
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to finalize');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date(oldEffectiveTo);
  minDate.setDate(minDate.getDate() + 1); // Phải sau oldEffectiveTo

  return (
    <div className="finalize-renewal">
      <h3>Hoàn tất gia hạn</h3>
      <p>Ngày hết hạn cũ: {new Date(oldEffectiveTo).toLocaleDateString('vi-VN')}</p>
      
      <div className="date-picker">
        <label>Chọn ngày hết hạn mới:</label>
        <DatePicker
          selected={newDate}
          onChange={(date) => setNewDate(date)}
          minDate={minDate}
          dateFormat="dd/MM/yyyy"
          placeholderText="Chọn ngày..."
        />
      </div>

      <div className="quick-actions">
        <button onClick={() => {
          const date = new Date(oldEffectiveTo);
          date.setMonth(date.getMonth() + 3);
          setNewDate(date);
        }}>
          + 3 tháng
        </button>
        <button onClick={() => {
          const date = new Date(oldEffectiveTo);
          date.setFullYear(date.getFullYear() + 1);
          setNewDate(date);
        }}>
          + 1 năm
        </button>
      </div>

      <button 
        className="btn-primary"
        onClick={handleFinalize}
        disabled={loading || !newDate}
      >
        {loading ? 'Đang xử lý...' : 'Hoàn tất gia hạn'}
      </button>
    </div>
  );
};
```

---

### 5.3 Notification Badge

```typescript
// components/NotificationBadge.tsx
import React, { useEffect, useState } from 'react';
import renewalService from '../services/renewalService';
import { useAuth } from '../hooks/useAuth';

export const NotificationBadge: React.FC = () => {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const renewals = await renewalService.getPendingRenewals(token);
        setCount(renewals.length);
      } catch (err) {
        console.error('Failed to fetch renewal count:', err);
      }
    };

    fetchCount();
    
    // Poll every 5 minutes
    const interval = setInterval(fetchCount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [token]);

  if (count === 0) return null;

  return (
    <span className="notification-badge">
      {count}
    </span>
  );
};
```

---

## 6. Workflows & Business Logic

### 6.1 Complete Renewal Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SHIFT RENEWAL WORKFLOW (P7)                             │
│                              Timeline: 28 Days                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

DAY -28 (T-28)                  DAY -14 (T-14)              DAY -2 (T-2)         DAY 0 (Expiry)
    │                                │                           │                     │
    │                                │                           │                     │
    ▼                                ▼                           ▼                     ▼
┌────────┐                     ┌────────┐                  ┌─────────┐          ┌──────────┐
│ Job P9 │────────────────────►│ Created│─────────────────►│ Expires │─────────►│ Old Reg  │
│ Detect │  Create Renewal     │ Renewal│   Employee      │  At      │  Auto    │ Inactive │
│ Expiring│  Request           │ Request│   Response      │ Deadline │ Expire   │ (Soft    │
│  Reg   │                     │ Status:│   Window        │          │ (Job P10)│  Delete) │
└────────┘                     │PENDING │                 └─────────┘          └──────────┘
                               │ ACTION │
                               └────────┘
                                    │
                                    │ Employee has 14 days to respond
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
              ┌──────────┐                   ┌───────────┐
              │ CONFIRMED│                   │ DECLINED  │
              │ (Agree)  │                   │ (Reject)  │
              └──────────┘                   └───────────┘
                    │                               │
                    │ Wait Admin                    │ End here
                    │ Finalization                  │ Old reg expires
                    │                               │ naturally
                    ▼                               ▼
           ┌─────────────────┐              ┌────────────┐
           │  Admin Finalize │              │   Status:  │
           │  - Choose date  │              │  DECLINED  │
           │  - Create new   │              └────────────┘
           │    registration │
           └─────────────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Status:        │
           │  FINALIZED      │
           │                 │
           │  New Reg Active │
           │  Old Reg        │
           │  Inactive       │
           └─────────────────┘
```

---

### 6.2 Database State Transitions

**Initial State (T-28)**:
```sql
-- fixed_shift_registrations
registration_id | employee_id | effective_from | effective_to | is_active
123            | 10          | 2024-11-01     | 2025-11-30   | true

-- shift_renewal_requests
(empty)
```

**After Job P9 Runs (T-28 00:05 AM)**:
```sql
-- shift_renewal_requests
renewal_id          | expiring_reg_id | employee_id | status         | expires_at
SRR_20251102_00001 | 123             | 10          | PENDING_ACTION | 2025-11-28 23:59:59
```

**After Employee Confirms (T-14 10:00 AM)**:
```sql
-- shift_renewal_requests
renewal_id          | status    | confirmed_at
SRR_20251102_00001 | CONFIRMED | 2025-11-16 10:00:00
```

**After Admin Finalizes (T-14 14:00 PM)**:
```sql
-- fixed_shift_registrations
registration_id | employee_id | effective_from | effective_to | is_active
123            | 10          | 2024-11-01     | 2025-11-30   | false     -- OLD (deactivated)
456            | 10          | 2025-12-01     | 2026-11-30   | true      -- NEW (created)

-- fixed_registration_days (copied from old)
registration_id | day_of_week
456            | MONDAY
456            | WEDNESDAY
456            | FRIDAY

-- shift_renewal_requests
renewal_id          | status    | confirmed_at
SRR_20251102_00001 | FINALIZED | 2025-11-16 14:00:00
```

---

### 6.3 Error Scenarios & Handling

#### Scenario 1: Employee không phản hồi

**Timeline**:
- T-28: Renewal created, expires_at = T-2
- T-2 23:59:59: Deadline passes
- T-2 00:10 AM (next day): Job P10 runs

**Result**:
```sql
UPDATE shift_renewal_requests
SET status = 'EXPIRED', confirmed_at = NOW()
WHERE renewal_id = 'SRR_20251102_00001';
```

**Impact**:
- Nhân viên không thể phản hồi nữa
- Old registration vẫn hết hạn tự nhiên vào Day 0
- Admin cần tạo renewal mới hoặc registration mới

---

#### Scenario 2: Employee confirm nhưng Admin quên finalize

**Timeline**:
- T-14: Employee confirms
- Day 0: Old registration expires
- No admin action

**Result**:
```sql
-- Old registration automatically expires
effective_to = 2025-11-30 (past)
is_active = true (but job P8 won't sync anymore because effective_to < today)

-- Renewal stays CONFIRMED
status = 'CONFIRMED'
```

**Impact**:
- Nhân viên không có lịch mới
- Admin cần finalize ASAP
- Hoặc tạo manual registration

---

#### Scenario 3: Admin finalize với ngày không hợp lệ

**Request**:
```json
{
  "renewalRequestId": "SRR_20251102_00001",
  "newEffectiveTo": "2025-10-31"  // BEFORE old effective_to!
}
```

**Response (400)**:
```json
{
  "status": 400,
  "message": "New effective_to must be after 2025-11-30"
}
```

**Solution**: FE phải validate `newEffectiveTo > oldEffectiveTo`

---

## 7. FAQ & Troubleshooting

### Q1: Tại sao Part-Time Flex không có renewal?

**A**: Part-Time Flex (Luồng 2) tự chọn slots linh hoạt, không có commitment dài hạn. Khi hết hạn (`effective_to`), registration tự động inactive (Job P11). Nếu muốn tiếp tục, nhân viên tạo registration mới.

---

### Q2: Nhân viên có thể gia hạn sau khi expired không?

**A**: Không. Sau khi status = `EXPIRED`, renewal request không thể phản hồi. Admin cần:
- Option 1: Tạo renewal request mới thủ công
- Option 2: Tạo Fixed registration mới cho nhân viên

---

### Q3: Admin có thể finalize nhiều lần không?

**A**: Không. Mỗi renewal chỉ finalize 1 lần. Sau khi status = `FINALIZED`, API sẽ reject với `409 Conflict`.

---

### Q4: Làm sao biết cron job đã chạy thành công?

**A**: Check logs:
```bash
docker logs -f pdcms_be | grep "Unified Schedule Sync\|Renewal Detection\|Expire Pending"
```

Expected logs:
```
2025-11-02 00:01:00 INFO  - === Starting Unified Schedule Sync Job (P8) ===
2025-11-02 00:05:00 INFO  - === Starting Daily Renewal Detection Job (P9) ===
2025-11-02 00:10:00 INFO  - === Starting Expire Pending Renewals Job (P10) ===
```

---

### Q5: Frontend cần poll bao lâu để kiểm tra renewal mới?

**A**: 
- **Real-time critical**: Mỗi 5 phút
- **Normal**: Mỗi 30 phút
- **Low priority**: Mỗi khi user mở trang

**Recommendation**: 5 phút hoặc khi user navigate đến renewal page.

---

## 8. Appendix

### 8.1 Status Flow Diagram

```
┌──────────────┐
│ PENDING_     │ ◄─── Job P9 creates
│ ACTION       │
└──────────────┘
        │
        ├──────► Employee CONFIRMS ──────► ┌──────────┐
        │                                   │ CONFIRMED│
        │                                   └──────────┘
        │                                         │
        │                                         ▼
        │                                   Admin Finalize
        │                                         │
        │                                         ▼
        │                                   ┌──────────┐
        │                                   │ FINALIZED│
        │                                   └──────────┘
        │
        ├──────► Employee DECLINES ───────► ┌─────────┐
        │                                   │ DECLINED│
        │                                   └─────────┘
        │
        └──────► Deadline passes (Job P10)► ┌─────────┐
                                            │ EXPIRED │
                                            └─────────┘
```

---

### 8.2 API Cheat Sheet

| Action | Method | Endpoint | Auth | Body |
|--------|--------|----------|------|------|
| Get pending renewals | GET | `/api/v1/registrations/renewals/pending` | Employee | - |
| Confirm renewal | PATCH | `/api/v1/registrations/renewals/{id}/respond` | Employee | `{action: "CONFIRMED"}` |
| Decline renewal | PATCH | `/api/v1/registrations/renewals/{id}/respond` | Employee | `{action: "DECLINED", declineReason: "..."}` |
| Finalize renewal | POST | `/api/v1/admin/registrations/renewals/finalize` | Admin | `{renewalRequestId, newEffectiveTo}` |

---

### 8.3 Important Dates Calculation

```javascript
// Example: Registration effective_to = 2025-11-30

// T-28: Job P9 detects (28 days before expiry)
const detectDate = new Date('2025-11-30');
detectDate.setDate(detectDate.getDate() - 28);
// Result: 2025-11-02

// T-2: Expires at (2 days before expiry)
const expiresAt = new Date('2025-11-30');
expiresAt.setDate(expiresAt.getDate() - 2);
expiresAt.setHours(23, 59, 59);
// Result: 2025-11-28 23:59:59

// New registration effective_from (old_to + 1 day)
const newFrom = new Date('2025-11-30');
newFrom.setDate(newFrom.getDate() + 1);
// Result: 2025-12-01
```

---

## 📞 Support

Nếu có câu hỏi hoặc vấn đề khi tích hợp:

1. Check logs: `docker logs -f pdcms_be`
2. Check database state: Query `shift_renewal_requests` table
3. Test với Postman collection (attached)
4. Contact Backend Team

---

**Document End** 🎉
