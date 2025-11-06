# Working Schedule Management API - Complete Test Guide

## Overview

API này quản lý 2 luồng đăng ký ca làm việc:

### **Luồng 1: Fixed Shift Registration (Lịch Cố định)**
- **Dành cho:** Nhân viên **FULL_TIME** và **PART_TIME_FIXED**
- **Đặc điểm:** Admin/Manager gán lịch cố định (ví dụ: Ca Sáng T2-T6)
- **Base URL:** `http://localhost:8080/api/v1/fixed-registrations`

### **Luồng 2: Part-Time Flex Registration (Lịch Linh hoạt)**
- **Dành cho:** Nhân viên **PART_TIME_FLEX** (và legacy **PART_TIME**)
- **Đặc điểm:** Nhân viên tự đăng ký (claim) các suất làm việc có sẵn
- **Base URLs:**
  - Work Slots (Admin): `http://localhost:8080/api/v1/work-slots`
  - Registrations (Employee): `http://localhost:8080/api/v1/registrations`

---

## ⚠️ IMPORTANT: JSON Format

**API sử dụng camelCase** cho tất cả field names:

- ✅ `employeeId`, `workShiftId`, `daysOfWeek`, `effectiveFrom`, `effectiveTo`, `partTimeSlotId`, `slotId`, `quota`
- ❌ KHÔNG dùng snake_case: `employee_id`, `work_shift_id`, `part_time_slot_id`, etc.

---

## Seed Data - Test Accounts & Employees

### Employees by Employment Type

| ID  | Name            | Account | Role         | Employment Type     | Luồng 1 (Fixed) | Luồng 2 (Flex) |
| --- | --------------- | ------- | ------------ | ------------------- | --------------- | -------------- |
| 1   | Admin Hệ thống  | admin   | ADMIN        | FULL_TIME           | ✅ Allowed      | ❌ Forbidden   |
| 2   | Nguyễn Văn Minh | nhasi1  | DOCTOR       | FULL_TIME           | ✅ Allowed      | ❌ Forbidden   |
| 3   | Trần Thị Lan    | nhasi2  | DOCTOR       | FULL_TIME           | ✅ Allowed      | ❌ Forbidden   |
| 4   | Lê Thị Mai      | letan   | RECEPTIONIST | FULL_TIME           | ✅ Allowed      | ❌ Forbidden   |
| 5   | Hoàng Văn Tuấn  | ketoan  | ACCOUNTANT   | FULL_TIME           | ✅ Allowed      | ❌ Forbidden   |
| 6   | Phạm Thị Hoa    | yta     | NURSE        | **PART_TIME_FIXED** | ✅ Allowed      | ❌ Forbidden   |
| 7   | Trần Minh Quân  | manager | MANAGER      | FULL_TIME           | ✅ Allowed      | ❌ Forbidden   |
| 8   | Nguyễn Thị Linh | yta2    | NURSE        | **PART_TIME_FLEX**  | ❌ Forbidden    | ✅ Allowed     |
| 9   | Võ Thị Trang    | yta3    | NURSE        | **PART_TIME_FIXED** | ✅ Allowed      | ❌ Forbidden   |

### Work Shifts

| ID               | Name                         | Start | End   | Category |
| ---------------- | ---------------------------- | ----- | ----- | -------- |
| WKS_MORNING_01   | Ca Sáng (8h-16h)             | 08:00 | 16:00 | NORMAL   |
| WKS_AFTERNOON_01 | Ca Chiều (13h-20h)           | 13:00 | 20:00 | NORMAL   |
| WKS_MORNING_02   | Ca Part-time Sáng (8h-12h)   | 08:00 | 12:00 | NORMAL   |
| WKS_AFTERNOON_02 | Ca Part-time Chiều (13h-17h) | 13:00 | 17:00 | NORMAL   |

### Default Password & Permissions

- All accounts: `123456`

#### **Luồng 1 (Fixed) Permissions:**
- **ROLE_ADMIN** & **ROLE_MANAGER**: 
  - `MANAGE_FIXED_REGISTRATIONS` (Create, Update, Delete)
  - `VIEW_FIXED_REGISTRATIONS_ALL` (View all employees' schedules)
- **All employee roles**: 
  - `VIEW_FIXED_REGISTRATIONS_OWN` (View own schedule only)

#### **Luồng 2 (Flex) Permissions:**
- **ROLE_ADMIN** & **ROLE_MANAGER**:
  - `MANAGE_WORK_SLOTS` (Create, View, Update work slots)
  - `UPDATE_REGISTRATIONS_ALL` (View, Cancel, Update all registrations)
- **PART_TIME_FLEX Employees**:
  - `VIEW_AVAILABLE_SLOTS` (View available slots)
  - `CREATE_REGISTRATION` (Claim a slot)
  - `VIEW_REGISTRATION_OWN` (View own registrations)
  - `CANCEL_REGISTRATION_OWN` (Cancel own registration)

**Quick Test Examples:**

- ✅ employeeId=6 (Phạm Thị Hoa - PART_TIME_FIXED) → Luồng 1 Allowed, Luồng 2 Forbidden
- ❌ employeeId=8 (Nguyễn Thị Linh - PART_TIME_FLEX) → Luồng 1 Forbidden, Luồng 2 Allowed
- ✅ employeeId=9 (Võ Thị Trang - PART_TIME_FIXED) → Luồng 1 Allowed, Luồng 2 Forbidden

---

## Authentication

Tất cả các endpoints đều yêu cầu JWT token trong header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Permissions Summary

### Luồng 1: Fixed Shift Registration

| Action                    | Permission                     |
| ------------------------- | ------------------------------ |
| Create Fixed Registration | `MANAGE_FIXED_REGISTRATIONS`   |
| Update Fixed Registration | `MANAGE_FIXED_REGISTRATIONS`   |
| Delete Fixed Registration | `MANAGE_FIXED_REGISTRATIONS`   |
| View All Fixed Schedules  | `VIEW_FIXED_REGISTRATIONS_ALL` |
| View Own Fixed Schedule   | `VIEW_FIXED_REGISTRATIONS_OWN` |

### Luồng 2: Part-Time Flex Registration

| Action                         | Permission                  |
| ------------------------------ | --------------------------- |
| Manage Work Slots (Admin)      | `MANAGE_WORK_SLOTS`         |
| View Available Slots           | `VIEW_AVAILABLE_SLOTS`      |
| Claim Slot                     | `CREATE_REGISTRATION`       |
| View Own Registrations         | `VIEW_REGISTRATION_OWN`     |
| Cancel Own Registration        | `CANCEL_REGISTRATION_OWN`   |
| Manage All Registrations       | `UPDATE_REGISTRATIONS_ALL`  |

**Who has what:**

- ✅ **admin** / **manager**: All MANAGE permissions + VIEW_ALL permissions
- ✅ **yta** (PART_TIME_FIXED): Fixed VIEW_OWN only
- ✅ **yta2** (PART_TIME_FLEX): Flex VIEW/CREATE/CANCEL permissions

---

# PART 1: LUỒNG 1 - FIXED SHIFT REGISTRATION API

## 1. Create Fixed Shift Registration

**Endpoint**: `POST /api/v1/fixed-registrations`

**Permission**: `MANAGE_FIXED_REGISTRATIONS`

### Request Body (camelCase format!)

```json
{
  "employeeId": 6,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31"
}
```

### Field Descriptions

- `employeeId` (required): ID của nhân viên (phải là FULL_TIME hoặc PART_TIME_FIXED, KHÔNG được là PART_TIME_FLEX)
- `workShiftId` (required): ID của ca làm việc
- `daysOfWeek` (required): Mảng các ngày (1=Monday, 2=Tuesday, ..., 7=Sunday)
- `effectiveFrom` (required): Ngày bắt đầu (format: YYYY-MM-DD)
- `effectiveTo` (optional): Ngày kết thúc (null = vô thời hạn, thường dùng cho FULL_TIME)

### Success Response (201 Created)

```json
{
  "registrationId": 1,
  "employeeId": 6,
  "employeeName": "Phạm Thị Hoa",
  "workShiftId": "WKS_MORNING_02",
  "workShiftName": "Ca Part-time Sáng (8h-12h)",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31",
  "isActive": true
}
```

### Error Cases

#### Case 1: Employee không tồn tại (404)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Employee not found with id: 999",
  "errorCode": "EMPLOYEE_NOT_FOUND"
}
```

#### Case 2: Work Shift không tồn tại (404)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Work shift not found with id: INVALID_ID",
  "errorCode": "WORK_SHIFT_NOT_FOUND"
}
```

#### Case 3: Employee là PART_TIME_FLEX (409) ⚠️ CRITICAL VALIDATION

**Request:**

```json
{
  "employeeId": 8,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3],
  "effectiveFrom": "2025-11-01"
}
```

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Không thể gán lịch cố định. Nhân viên này thuộc luồng Đăng ký Linh hoạt (Flex).",
  "errorCode": "INVALID_EMPLOYEE_TYPE"
}
```

**Giải thích:** 
- Nhân viên PART_TIME_FLEX phải dùng Luồng 2 (Part-Time Flex Registration)
- Họ không được phép có lịch cố định (Fixed Schedule)
- Backend phải validate `employee_type` từ DB trước khi tạo registration

#### Case 4: Duplicate Registration (409)

**Scenario:** Employee 6 đã có registration với `WKS_MORNING_02`, cố tạo thêm 1 registration nữa với cùng `workShiftId`.

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Nhân viên này đã được gán Ca Sáng. Vui lòng cập nhật bản ghi cũ.",
  "errorCode": "DUPLICATE_FIXED_SHIFT_REGISTRATION"
}
```

**Business Rule:** Một nhân viên không thể có 2 lịch cố định cùng `workShiftId` (ngay cả với `daysOfWeek` khác nhau).

#### Case 5: Missing Required Fields (400)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "employeeId": "Employee ID is required",
    "workShiftId": "Work shift ID is required",
    "daysOfWeek": "Days of week cannot be empty",
    "effectiveFrom": "Effective from date is required"
  }
}
```

#### Case 6: Invalid daysOfWeek (400)

**Request:**

```json
{
  "employeeId": 6,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [0, 8, 10],
  "effectiveFrom": "2025-11-01"
}
```

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Ngày làm việc phải từ 1 (Thứ 2) đến 7 (Chủ nhật): 8",
  "errorCode": "INVALID_INPUT"
}
```

#### Case 7: Empty daysOfWeek (400)

**Request:**

```json
{
  "employeeId": 6,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [],
  "effectiveFrom": "2025-11-01"
}
```

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Dữ liệu đầu vào không hợp lệ (ví dụ: daysOfWeek rỗng).",
  "errorCode": "INVALID_INPUT"
}
```

---

## 2. Get Fixed Shift Registrations (List/Filter)

**Endpoint**: `GET /api/v1/fixed-registrations?employeeId={id}`

**Permissions**:

- `VIEW_FIXED_REGISTRATIONS_ALL` - Xem tất cả
- `VIEW_FIXED_REGISTRATIONS_OWN` - Chỉ xem của mình

### Query Parameters

- `employeeId` (optional):
  - Nếu có VIEW_ALL permission: có thể xem tất cả hoặc filter theo employeeId
  - Nếu chỉ có VIEW_OWN permission: bắt buộc phải truyền employeeId của chính mình

### Use Cases

#### Case 1: Admin/Manager xem tất cả

**Request:**

```
GET /api/v1/fixed-registrations
Authorization: Bearer <admin_token>
```

**Response (200 OK):**

```json
[
  {
    "registrationId": 1,
    "employeeId": 2,
    "employeeName": "Nguyễn Văn Minh",
    "workShiftId": "WKS_MORNING_01",
    "workShiftName": "Ca Sáng (8h-16h)",
    "daysOfWeek": [1, 2, 3, 4, 5],
    "effectiveFrom": "2025-11-01",
    "effectiveTo": "2026-10-31",
    "isActive": true
  },
  {
    "registrationId": 2,
    "employeeId": 6,
    "employeeName": "Phạm Thị Hoa",
    "workShiftId": "WKS_MORNING_02",
    "workShiftName": "Ca Part-time Sáng (8h-12h)",
    "daysOfWeek": [1, 3, 5],
    "effectiveFrom": "2025-11-01",
    "effectiveTo": null,
    "isActive": true
  }
]
```

#### Case 2: Admin filter theo employeeId

**Request:**

```
GET /api/v1/fixed-registrations?employeeId=6
Authorization: Bearer <admin_token>
```

**Response:** Array với chỉ registrations của employee 6

#### Case 3: Employee xem của mình (SUCCESS)

**Request:** (yta account - employeeId=6)

```
GET /api/v1/fixed-registrations?employeeId=6
Authorization: Bearer <yta_token>
```

**Response:** 200 OK với registrations của employee 6

#### Case 4: Employee không truyền employeeId (AUTO-FILL)

**Request:**

```
GET /api/v1/fixed-registrations
Authorization: Bearer <yta_token>
```

**Response (200 OK):**

**Backend Logic:** 
- System tự động lấy `employeeId` từ JWT token (username → employee_id)
- Tự động filter `WHERE employee_id = 6` (Phạm Thị Hoa)
- Trả về array với chỉ registrations của employee 6

**Note:** Spec V2 đã bỏ yêu cầu bắt buộc truyền `employeeId`. Backend tự động xử lý.

#### Case 5: Employee cố xem của người khác (FORBIDDEN)

**Request:** (yta account - employeeId=6 cố xem của employeeId=9)

```
GET /api/v1/fixed-registrations?employeeId=9
Authorization: Bearer <yta_token>
```

**Response (403):**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Bạn không thể chỉ định employeeId. Hệ thống sẽ tự động lấy từ tài khoản của bạn.",
  "errorCode": "ACCESS_DENIED"
}
```

**Backend Logic:**
- User chỉ có `VIEW_FIXED_REGISTRATIONS_OWN` permission
- Backend phớt lờ `employeeId` param nếu user cố tình truyền
- Luôn chỉ trả về data của chính user đó

---

## 3. Update Fixed Shift Registration

**Endpoint**: `PUT /api/v1/fixed-registrations/{id}`

**Permission**: `MANAGE_FIXED_REGISTRATIONS`

### Request Body (all fields optional)

```json
{
  "workShiftId": "WKS_AFTERNOON_02",
  "daysOfWeek": [1, 3, 5],
  "effectiveFrom": "2025-12-01",
  "effectiveTo": "2026-11-30"
}
```

**Note**: Tất cả fields đều optional. Chỉ update những fields được gửi lên.

### Success Response (200 OK)

```json
{
  "registrationId": 1,
  "employeeId": 6,
  "employeeName": "Phạm Thị Hoa",
  "workShiftId": "WKS_AFTERNOON_02",
  "workShiftName": "Ca Part-time Chiều (13h-17h)",
  "daysOfWeek": [1, 3, 5],
  "effectiveFrom": "2025-12-01",
  "effectiveTo": "2026-11-30",
  "isActive": true
}
```

### Error Cases

#### Case 1: Registration không tồn tại (404)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Fixed shift registration not found with id: 999",
  "errorCode": "FIXED_REGISTRATION_NOT_FOUND"
}
```

#### Case 2: Update chỉ workShiftId

**Request:**

```json
{
  "workShiftId": "WKS_MORNING_01"
}
```

**Response:** 200 OK - Chỉ workShiftId thay đổi, fields khác giữ nguyên

#### Case 3: Set effectiveTo = null

**Request:**

```json
{
  "effectiveTo": null
}
```

**Response:** 200 OK - Registration trở thành vô thời hạn

---

## 4. Delete Fixed Shift Registration (Soft Delete)

**Endpoint**: `DELETE /api/v1/fixed-registrations/{id}`

**Permission**: `MANAGE_FIXED_REGISTRATIONS`

**Note**: Soft delete - chỉ set `isActive = false`

### Success Response (204 No Content)

Không có response body, chỉ HTTP 204.

### Error Case: Registration không tồn tại (404)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Fixed shift registration not found with id: 999",
  "errorCode": "FIXED_REGISTRATION_NOT_FOUND"
}
```

---

# PART 2: LUỒNG 2 - PART-TIME FLEX REGISTRATION API

## Section A: Work Slot Management (Admin APIs)

### 5. Create Work Slot (Admin)

**Endpoint**: `POST /api/v1/work-slots`

**Permission**: `MANAGE_WORK_SLOTS`

**Miêu tả**: Admin mở một suất làm việc mới (VD: Cần 2 người Ca Sáng T3).

#### Request Body

```json
{
  "workShiftId": "WKS_MORNING_02",
  "dayOfWeek": "TUESDAY",
  "quota": 2
}
```

#### Field Descriptions

- `workShiftId` (required): ID của ca làm việc
- `dayOfWeek` (required): Ngày trong tuần (MONDAY, TUESDAY, ..., SUNDAY - uppercase)
- `quota` (required): Số lượng nhân viên cần (VD: 2 người)

#### Success Response (201 Created)

```json
{
  "slotId": 1,
  "workShiftId": "WKS_MORNING_02",
  "workShiftName": "Ca Part-time Sáng (8h-12h)",
  "dayOfWeek": "TUESDAY",
  "quota": 2,
  "registered": 0,
  "isActive": true
}
```

#### Error Cases

##### Case 1: Work Shift không tồn tại (404)

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Work shift not found with id: INVALID_ID",
  "errorCode": "WORK_SHIFT_NOT_FOUND"
}
```

##### Case 2: Duplicate Slot (409)

**Scenario:** Admin cố tạo slot duplicate (cùng `workShiftId` + `dayOfWeek`).

**Request:**

```json
{
  "workShiftId": "WKS_MORNING_02",
  "dayOfWeek": "TUESDAY",
  "quota": 3
}
```

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Suất [Ca Part-time Sáng (8h-12h) - TUESDAY] đã tồn tại.",
  "errorCode": "SLOT_ALREADY_EXISTS"
}
```

##### Case 3: Invalid dayOfWeek (400)

**Request:**

```json
{
  "workShiftId": "WKS_MORNING_02",
  "dayOfWeek": "INVALID_DAY",
  "quota": 2
}
```

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "dayOfWeek": "Day of week must be MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, or SUNDAY"
  }
}
```

##### Case 4: Invalid quota (400)

**Request:**

```json
{
  "workShiftId": "WKS_MORNING_02",
  "dayOfWeek": "TUESDAY",
  "quota": 0
}
```

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "quota": "Quota must be at least 1"
  }
}
```

---

### 6. Get Work Slots (Admin Dashboard)

**Endpoint**: `GET /api/v1/work-slots`

**Permission**: `MANAGE_WORK_SLOTS`

**Miêu tả**: Admin xem tất cả các suất đã mở và số lượng đã đăng ký.

#### Success Response (200 OK)

```json
[
  {
    "slotId": 1,
    "workShiftId": "WKS_MORNING_02",
    "workShiftName": "Ca Part-time Sáng (8h-12h)",
    "dayOfWeek": "TUESDAY",
    "quota": 2,
    "registered": 1,
    "isActive": true
  },
  {
    "slotId": 2,
    "workShiftId": "WKS_AFTERNOON_02",
    "workShiftName": "Ca Part-time Chiều (13h-17h)",
    "dayOfWeek": "WEDNESDAY",
    "quota": 3,
    "registered": 3,
    "isActive": true
  }
]
```

#### Response Fields

- `slotId`: ID của suất
- `workShiftId`: ID ca làm việc
- `workShiftName`: Tên ca làm việc (từ work_shifts table)
- `dayOfWeek`: Ngày trong tuần
- `quota`: Số lượng tối đa
- `registered`: Số lượng đã đăng ký (`COUNT` từ `employee_shift_registrations` WHERE `is_active = true`)
- `isActive`: Trạng thái (true = đang mở, false = đã đóng)

---

### 7. Update Work Slot (Admin)

**Endpoint**: `PUT /api/v1/work-slots/{slotId}`

**Permission**: `MANAGE_WORK_SLOTS`

**Miêu tả**: Admin thay đổi `quota` (tăng/giảm số lượng) hoặc `isActive` (đóng/mở suất).

#### Request Body

```json
{
  "quota": 3,
  "isActive": true
}
```

**Note**: Cả 2 fields đều optional. Có thể update riêng từng field.

#### Success Response (200 OK)

```json
{
  "slotId": 1,
  "workShiftId": "WKS_MORNING_02",
  "workShiftName": "Ca Part-time Sáng (8h-12h)",
  "dayOfWeek": "TUESDAY",
  "quota": 3,
  "registered": 1,
  "isActive": true
}
```

#### Error Cases

##### Case 1: Slot không tồn tại (404)

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Work slot not found with id: 999",
  "errorCode": "WORK_SLOT_NOT_FOUND"
}
```

##### Case 2: Quota Violation (409) ⚠️ CRITICAL

**Scenario:** Slot đã có 2 người đăng ký (`registered = 2`), Admin cố giảm `quota` xuống 1.

**Request:**

```json
{
  "quota": 1
}
```

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Không thể giảm quota. Đã có 2 nhân viên đăng ký suất này.",
  "errorCode": "QUOTA_VIOLATION"
}
```

**Business Rule:** `quota` không được nhỏ hơn `registered`. Admin chỉ có thể tăng quota hoặc giữ nguyên.

##### Case 3: Update chỉ isActive

**Request:**

```json
{
  "isActive": false
}
```

**Response:** 200 OK - Slot bị đóng, nhưng các registrations hiện tại vẫn giữ nguyên.

---

## Section B: Employee Registration APIs

### 8. Get Available Slots (Employee)

**Endpoint**: `GET /api/v1/registrations/available-slots`

**Permission**: `VIEW_AVAILABLE_SLOTS`

**Miêu tả**: Nhân viên PART_TIME_FLEX xem các suất còn trống để đăng ký.

**Business Logic (Filter):** Backend chỉ trả về các slot thỏa mãn TẤT CẢ điều kiện:
- `slot.isActive = true` (Suất đang mở)
- `slot.registered < slot.quota` (Suất còn chỗ)
- Employee chưa đăng ký slot này (`is_active = true`)

#### Success Response (200 OK)

```json
[
  {
    "slotId": 1,
    "workShiftId": "WKS_MORNING_02",
    "shiftName": "Ca Part-time Sáng (8h-12h)",
    "dayOfWeek": "TUESDAY",
    "quota": 2,
    "registered": 0,
    "remaining": 2
  },
  {
    "slotId": 3,
    "workShiftId": "WKS_AFTERNOON_02",
    "shiftName": "Ca Part-time Chiều (13h-17h)",
    "dayOfWeek": "THURSDAY",
    "quota": 3,
    "registered": 1,
    "remaining": 2
  }
]
```

#### Response Fields

- `remaining`: `quota - registered` (số chỗ còn lại)
- Các fields khác giống `GET /api/v1/work-slots`

**Note:** 
- Nếu employee đã đăng ký slot #1, slot đó sẽ KHÔNG xuất hiện trong list
- Nếu slot đã full (`registered >= quota`), slot đó sẽ KHÔNG xuất hiện

---

### 9. Claim Slot (Employee)

**Endpoint**: `POST /api/v1/registrations`

**Permission**: `CREATE_REGISTRATION`

**Miêu tả**: Nhân viên PART_TIME_FLEX "claim" (nhận) một suất làm việc.

#### Request Body

```json
{
  "partTimeSlotId": 1,
  "effectiveFrom": "2025-11-01"
}
```

#### Field Descriptions

- `partTimeSlotId` (required): ID của suất muốn đăng ký (từ `/available-slots`)
- `effectiveFrom` (required): Ngày bắt đầu hiệu lực (format: YYYY-MM-DD)
- `effectiveTo`: Backend tự tính (VD: `effectiveFrom + 3 months`)

#### Success Response (201 Created)

```json
{
  "registrationId": 10,
  "employeeId": 8,
  "employeeName": "Nguyễn Thị Linh",
  "partTimeSlotId": 1,
  "workShiftName": "Ca Part-time Sáng (8h-12h)",
  "dayOfWeek": "TUESDAY",
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-02-01",
  "isActive": true
}
```

#### Error Cases

##### Case 1: Employee không phải PART_TIME_FLEX (400)

**Scenario:** Employee FULL_TIME (ID=2) cố claim slot.

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Chỉ nhân viên PART_TIME_FLEX mới có thể đăng ký ca linh hoạt. Vui lòng liên hệ Admin để được gán lịch cố định.",
  "errorCode": "INVALID_EMPLOYEE_TYPE"
}
```

##### Case 2: Slot không tồn tại hoặc đã đóng (404)

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Suất này đã bị đóng hoặc không tồn tại.",
  "errorCode": "WORK_SLOT_NOT_FOUND"
}
```

##### Case 3: Slot đã đủ người (409) ⚠️ CRITICAL (Pessimistic Lock)

**Scenario:** Slot có `quota = 2`, đã có 2 người đăng ký. Employee thứ 3 cố claim.

**Business Logic:**
```sql
-- Backend sử dụng Pessimistic Locking
SELECT * FROM part_time_slots WHERE slot_id = 1 FOR UPDATE;
-- Kiểm tra COUNT(registrations) >= quota
```

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Suất [Ca Part-time Sáng (8h-12h) - TUESDAY] đã đủ người đăng ký.",
  "errorCode": "SLOT_IS_FULL"
}
```

##### Case 4: Employee đã đăng ký slot này rồi (409)

**Scenario:** Employee 8 đã có registration với `partTimeSlotId = 1`, cố claim lại.

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Bạn đã đăng ký suất này rồi. Không thể đăng ký trùng lặp.",
  "errorCode": "REGISTRATION_CONFLICT"
}
```

##### Case 5: Xung đột thời gian (409) ⚠️ ENHANCED VALIDATION

**Scenario:** Employee 8 đã có registration:
- Slot #1: TUESDAY + WKS_MORNING_02
- Cố claim Slot #5: TUESDAY + WKS_MORNING_02 (khác slotId nhưng cùng ngày + cùng ca)

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Bạn đã có ca làm việc vào TUESDAY - Ca Part-time Sáng (8h-12h). Không thể đăng ký ca trùng giờ.",
  "errorCode": "REGISTRATION_CONFLICT"
}
```

**Business Rule:** Employee không thể đăng ký 2 ca trùng (same `dayOfWeek` + same `workShiftId`), ngay cả khi là 2 slots khác nhau.

##### Case 6: effectiveFrom là quá khứ (400)

**Request:**

```json
{
  "partTimeSlotId": 1,
  "effectiveFrom": "2024-01-01"
}
```

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "effectiveFrom": "Effective from date cannot be in the past"
  }
}
```

---

### 10. Get My Registrations (Employee)

**Endpoint**: `GET /api/v1/registrations`

**Permissions**: `VIEW_REGISTRATION_OWN` (Employee) hoặc `UPDATE_REGISTRATIONS_ALL` (Admin)

**Miêu tả**: Lấy danh sách các đăng ký đã thực hiện.

#### Query Parameters

- `employeeId` (optional): Chỉ dùng cho Admin/Manager
  - Nếu có `UPDATE_REGISTRATIONS_ALL`: Có thể filter theo employeeId hoặc xem tất cả
  - Nếu chỉ có `VIEW_REGISTRATION_OWN`: Backend tự động lấy từ token

#### Use Cases

##### Case 1: Employee xem của mình

**Request:**

```
GET /api/v1/registrations
Authorization: Bearer <yta2_token>
```

**Backend Logic:** Tự động `WHERE employee_id = 8` (Nguyễn Thị Linh)

**Response (200 OK):**

```json
[
  {
    "registrationId": 10,
    "employeeId": 8,
    "partTimeSlotId": 1,
    "workShiftName": "Ca Part-time Sáng (8h-12h)",
    "dayOfWeek": "TUESDAY",
    "effectiveFrom": "2025-11-01",
    "effectiveTo": "2026-02-01",
    "isActive": true
  },
  {
    "registrationId": 11,
    "employeeId": 8,
    "partTimeSlotId": 3,
    "workShiftName": "Ca Part-time Chiều (13h-17h)",
    "dayOfWeek": "THURSDAY",
    "effectiveFrom": "2025-11-01",
    "effectiveTo": "2026-02-01",
    "isActive": true
  }
]
```

##### Case 2: Admin xem tất cả

**Request:**

```
GET /api/v1/registrations
Authorization: Bearer <admin_token>
```

**Response:** Array với registrations của TẤT CẢ employees

##### Case 3: Admin filter theo employeeId

**Request:**

```
GET /api/v1/registrations?employeeId=8
Authorization: Bearer <admin_token>
```

**Response:** Array với chỉ registrations của employee 8

---

### 11. Cancel Registration (Employee)

**Endpoint**: `DELETE /api/v1/registrations/{registrationId}`

**Permissions**: `CANCEL_REGISTRATION_OWN` (Employee) hoặc `UPDATE_REGISTRATIONS_ALL` (Admin)

**Miêu tả**: Hủy đăng ký (giải phóng suất trong quota). Soft delete: `is_active = false`.

#### Success Response (204 No Content)

Không có response body, chỉ HTTP 204.

#### Error Cases

##### Case 1: Registration không tồn tại (404)

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Registration not found with id: 999",
  "errorCode": "REGISTRATION_NOT_FOUND"
}
```

##### Case 2: Employee cố hủy của người khác (404)

**Scenario:** Employee 8 có `CANCEL_REGISTRATION_OWN`, cố hủy registration của employee 9.

**Request:**

```
DELETE /api/v1/registrations/20
Authorization: Bearer <yta2_token>
```

**Backend Logic:** 
- Tìm `registrationId = 20`
- Check `registration.employee_id == 8` (token user)
- Không khớp → Return 404 (không phải 403, để tránh lộ thông tin)

**Response:**

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Registration not found with id: 20",
  "errorCode": "REGISTRATION_NOT_FOUND"
}
```

---

### 12. Update Effective-To (Admin Only)

**Endpoint**: `PATCH /api/v1/registrations/{registrationId}/effective-to`

**Permission**: `UPDATE_REGISTRATIONS_ALL`

**Miêu tả**: Admin gia hạn hoặc thay đổi thời hạn của một đăng ký.

#### Request Body

```json
{
  "effectiveTo": "2026-05-31"
}
```

**Note:** Có thể set `effectiveTo: null` để gia hạn vĩnh viễn.

#### Success Response (200 OK)

```json
{
  "registrationId": 10,
  "employeeId": 8,
  "employeeName": "Nguyễn Thị Linh",
  "partTimeSlotId": 1,
  "workShiftName": "Ca Part-time Sáng (8h-12h)",
  "dayOfWeek": "TUESDAY",
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-05-31",
  "isActive": true
}
```

#### Error Cases

##### Case 1: Registration không tồn tại (404)

```json
{
  "timestamp": "2025-10-31T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Registration not found with id: 999",
  "errorCode": "REGISTRATION_NOT_FOUND"
}
```

##### Case 2: Set vĩnh viễn

**Request:**

```json
{
  "effectiveTo": null
}
```

**Response:** 200 OK - `effectiveTo` thành null (vĩnh viễn)

---

## Testing Workflow

## Scenario 1: Luồng 1 - Fixed Registration (CRUD Full)

```bash
# Step 1: Login as Admin
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "123456"
}
# => Lấy JWT token

# Step 2: Tạo fixed registration cho PART_TIME_FIXED
POST /api/v1/fixed-registrations
Authorization: Bearer <token>
{
  "employeeId": 6,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31"
}
# => Expect: 201 Created

# Step 3: Xem danh sách
GET /api/v1/fixed-registrations?employeeId=6
Authorization: Bearer <token>
# => Expect: 200 OK, array có 1 item

# Step 4: Update daysOfWeek
PUT /api/v1/fixed-registrations/1
Authorization: Bearer <token>
{
  "daysOfWeek": [1, 3, 5],
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31"
}
# => Expect: 200 OK

# Step 5: Delete (Soft delete)
DELETE /api/v1/fixed-registrations/1
Authorization: Bearer <token>
# => Expect: 204 No Content

# Step 6: Verify (không còn trong list)
GET /api/v1/fixed-registrations?employeeId=6
Authorization: Bearer <token>
# => Expect: 200 OK, array rỗng []
```

## Scenario 2: Luồng 1 - Test PART_TIME_FLEX bị reject

```bash
# Step 1: Cố tạo fixed registration cho PART_TIME_FLEX
POST /api/v1/fixed-registrations
Authorization: Bearer <admin_token>
{
  "employeeId": 8,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3],
  "effectiveFrom": "2025-11-01"
}
# => Expect: 409 Conflict
# errorCode: "INVALID_EMPLOYEE_TYPE"
# message: "Không thể gán lịch cố định. Nhân viên này thuộc luồng Đăng ký Linh hoạt (Flex)."

# Step 2: Tương tự với UPDATE
PUT /api/v1/fixed-registrations/1
Authorization: Bearer <admin_token>
{
  "daysOfWeek": [1, 3, 5]
}
# => Expect: 409 Conflict nếu registration của employee PART_TIME_FLEX
```

## Scenario 3: Luồng 1 - Test duplicate detection

```bash
# Step 1: Tạo registration đầu tiên
POST /api/v1/fixed-registrations
Authorization: Bearer <admin_token>
{
  "employeeId": 9,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31"
}
# => Expect: 201 Created

# Step 2: Cố tạo duplicate (cùng employeeId + cùng workShiftId)
POST /api/v1/fixed-registrations
Authorization: Bearer <admin_token>
{
  "employeeId": 9,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 3, 5],
  "effectiveFrom": "2025-12-01"
}
# => Expect: 409 Conflict
# errorCode: "DUPLICATE_FIXED_SHIFT_REGISTRATION"
# message: "Nhân viên này đã được gán Ca Sáng. Vui lòng cập nhật bản ghi cũ."
```

## Scenario 4: Luồng 1 - Test employee permissions

```bash
# Step 1: Login as PART_TIME_FIXED employee
POST /api/v1/auth/login
{
  "username": "yta",
  "password": "123456"
}
# => employeeId = 6

# Step 2: Xem của mình (OK - auto-fill)
GET /api/v1/fixed-registrations
Authorization: Bearer <token>
# => Expect: 200 OK (backend tự động filter WHERE employee_id = 6)

# Step 3: Cố xem của người khác (FORBIDDEN)
GET /api/v1/fixed-registrations?employeeId=9
Authorization: Bearer <token>
# => Expect: 403 Forbidden
# errorCode: "ACCESS_DENIED"
# message: "Bạn không thể chỉ định employeeId. Hệ thống sẽ tự động lấy từ tài khoản của bạn."
```

## Scenario 5: Luồng 2 - Work Slot Management (Admin)

```bash
# Step 1: Login as Admin
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "123456"
}

# Step 2: Tạo work slot
POST /api/v1/work-slots
Authorization: Bearer <token>
{
  "workShiftId": "WKS_MORNING_02",
  "dayOfWeek": "TUESDAY",
  "quota": 2
}
# => Expect: 201 Created, slotId=1

# Step 3: Xem danh sách slots
GET /api/v1/work-slots
Authorization: Bearer <token>
# => Expect: 200 OK, array có 1 slot (registered=0)

# Step 4: Update quota (tăng lên 3)
PUT /api/v1/work-slots/1
Authorization: Bearer <token>
{
  "quota": 3
}
# => Expect: 200 OK

# Step 5: Cố giảm quota xuống 1 (sẽ fail nếu có registrations)
PUT /api/v1/work-slots/1
Authorization: Bearer <token>
{
  "quota": 1
}
# => Expect: 409 Conflict "QUOTA_VIOLATION" nếu đã có người đăng ký
```

## Scenario 6: Luồng 2 - Employee Claim Slot

```bash
# Step 1: Login as PART_TIME_FLEX employee
POST /api/v1/auth/login
{
  "username": "yta2",
  "password": "123456"
}
# => employeeId = 8

# Step 2: Xem available slots
GET /api/v1/registrations/available-slots
Authorization: Bearer <token>
# => Expect: 200 OK, array với các slots còn chỗ

# Step 3: Claim slot TUESDAY Ca Sáng
POST /api/v1/registrations
Authorization: Bearer <token>
{
  "partTimeSlotId": 1,
  "effectiveFrom": "2025-11-01"
}
# => Expect: 201 Created

# Step 4: Xem registrations của mình
GET /api/v1/registrations
Authorization: Bearer <token>
# => Expect: 200 OK, array có 1 registration

# Step 5: Cố claim lại slot đã claim (DUPLICATE)
POST /api/v1/registrations
Authorization: Bearer <token>
{
  "partTimeSlotId": 1,
  "effectiveFrom": "2025-11-01"
}
# => Expect: 409 Conflict
# errorCode: "REGISTRATION_CONFLICT"
# message: "Bạn đã đăng ký suất này rồi. Không thể đăng ký trùng lặp."

# Step 6: Hủy registration
DELETE /api/v1/registrations/10
Authorization: Bearer <token>
# => Expect: 204 No Content
```

## Scenario 7: Luồng 2 - Test Time Conflict

```bash
# Setup: Tạo 2 slots cùng TUESDAY + WKS_MORNING_02
POST /api/v1/work-slots
{
  "workShiftId": "WKS_MORNING_02",
  "dayOfWeek": "TUESDAY",
  "quota": 2
}
# => slotId = 1

POST /api/v1/work-slots
{
  "workShiftId": "WKS_MORNING_02",
  "dayOfWeek": "TUESDAY",
  "quota": 2
}
# => slotId = 5

# Step 1: Employee claim slot 1
POST /api/v1/registrations
Authorization: Bearer <yta2_token>
{
  "partTimeSlotId": 1,
  "effectiveFrom": "2025-11-01"
}
# => Expect: 201 Created

# Step 2: Cố claim slot 5 (cùng ngày + cùng ca)
POST /api/v1/registrations
Authorization: Bearer <yta2_token>
{
  "partTimeSlotId": 5,
  "effectiveFrom": "2025-11-01"
}
# => Expect: 409 Conflict
# errorCode: "REGISTRATION_CONFLICT"
# message: "Bạn đã có ca làm việc vào TUESDAY - Ca Part-time Sáng (8h-12h). Không thể đăng ký ca trùng giờ."
```

## Scenario 8: Luồng 2 - Test Slot Full (Pessimistic Lock)

```bash
# Setup: Tạo slot với quota=2
POST /api/v1/work-slots
{
  "workShiftId": "WKS_AFTERNOON_02",
  "dayOfWeek": "WEDNESDAY",
  "quota": 2
}
# => slotId = 2

# Step 1: Employee A claim
POST /api/v1/registrations
Authorization: Bearer <employee_A_token>
{
  "partTimeSlotId": 2,
  "effectiveFrom": "2025-11-01"
}
# => Expect: 201 Created

# Step 2: Employee B claim
POST /api/v1/registrations
Authorization: Bearer <employee_B_token>
{
  "partTimeSlotId": 2,
  "effectiveFrom": "2025-11-01"
}
# => Expect: 201 Created

# Step 3: Employee C claim (slot đã full)
POST /api/v1/registrations
Authorization: Bearer <employee_C_token>
{
  "partTimeSlotId": 2,
  "effectiveFrom": "2025-11-01"
}
# => Expect: 409 Conflict
# errorCode: "SLOT_IS_FULL"
# message: "Suất [Ca Part-time Chiều (13h-17h) - WEDNESDAY] đã đủ người đăng ký."
```

## Scenario 9: Luồng 2 - Admin Update Effective-To

```bash
# Step 1: Login as Admin
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "123456"
}

# Step 2: Xem tất cả registrations
GET /api/v1/registrations
Authorization: Bearer <admin_token>
# => Expect: 200 OK, array với all employees' registrations

# Step 3: Gia hạn registration của employee
PATCH /api/v1/registrations/10/effective-to
Authorization: Bearer <admin_token>
{
  "effectiveTo": "2026-05-31"
}
# => Expect: 200 OK

# Step 4: Set vĩnh viễn
PATCH /api/v1/registrations/10/effective-to
Authorization: Bearer <admin_token>
{
  "effectiveTo": null
}
# => Expect: 200 OK (effectiveTo = null)
```

## Scenario 10: Cross-Luồng Validation

```bash
# Verify: PART_TIME_FLEX không thể dùng Luồng 1
POST /api/v1/fixed-registrations
Authorization: Bearer <admin_token>
{
  "employeeId": 8,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3],
  "effectiveFrom": "2025-11-01"
}
# => Expect: 409 "INVALID_EMPLOYEE_TYPE"

# Verify: FULL_TIME không thể dùng Luồng 2
POST /api/v1/registrations
Authorization: Bearer <nhasi1_token>
{
  "partTimeSlotId": 1,
  "effectiveFrom": "2025-11-01"
}
# => Expect: 400 "INVALID_EMPLOYEE_TYPE"
# message: "Chỉ nhân viên PART_TIME_FLEX mới có thể đăng ký ca linh hoạt..."
```

---

## Common HTTP Status Codes

- **200 OK**: Success (GET, PUT, PATCH)
- **201 Created**: Resource created (POST)
- **204 No Content**: Deleted successfully (DELETE)
- **400 Bad Request**: Validation error / missing fields / invalid input
- **403 Forbidden**: Không có permission hoặc cố truy cập resource của người khác
- **404 Not Found**: Employee / WorkShift / Slot / Registration không tồn tại
- **409 Conflict**: Duplicate / quota violation / slot full / invalid employee type / time conflict

---

## Error Codes Summary

### Luồng 1: Fixed Shift Registration

| Error Code                           | HTTP Status | Vietnamese Message                                                                        |
| ------------------------------------ | ----------- | ----------------------------------------------------------------------------------------- |
| `EMPLOYEE_NOT_FOUND`                 | 404         | Employee not found with id: X                                                             |
| `WORK_SHIFT_NOT_FOUND`               | 404         | Work shift not found with id: X                                                           |
| `FIXED_REGISTRATION_NOT_FOUND`       | 404         | Fixed shift registration not found with id: X                                             |
| `INVALID_EMPLOYEE_TYPE`              | 409         | Không thể gán lịch cố định. Nhân viên này thuộc luồng Đăng ký Linh hoạt (Flex).          |
| `DUPLICATE_FIXED_SHIFT_REGISTRATION` | 409         | Nhân viên này đã được gán Ca X. Vui lòng cập nhật bản ghi cũ.                            |
| `INVALID_INPUT`                      | 400         | Dữ liệu đầu vào không hợp lệ (ví dụ: daysOfWeek rỗng).                                   |
| `ACCESS_DENIED`                      | 403         | Bạn không thể chỉ định employeeId. Hệ thống sẽ tự động lấy từ tài khoản của bạn.         |
| `VALIDATION_ERROR`                   | 400         | Validation failed (với sub-errors cho từng field)                                         |

### Luồng 2: Part-Time Flex Registration

| Error Code                | HTTP Status | Vietnamese Message                                                                                  |
| ------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `WORK_SLOT_NOT_FOUND`     | 404         | Work slot not found with id: X / Suất này đã bị đóng hoặc không tồn tại.                           |
| `REGISTRATION_NOT_FOUND`  | 404         | Registration not found with id: X                                                                   |
| `SLOT_ALREADY_EXISTS`     | 409         | Suất \[Ca X - DayOfWeek\] đã tồn tại.                                                               |
| `QUOTA_VIOLATION`         | 409         | Không thể giảm quota. Đã có X nhân viên đăng ký suất này.                                          |
| `SLOT_IS_FULL`            | 409         | Suất \[Ca X - DayOfWeek\] đã đủ người đăng ký.                                                      |
| `REGISTRATION_CONFLICT`   | 409         | Bạn đã đăng ký suất này rồi. Không thể đăng ký trùng lặp. / Bạn đã có ca làm việc vào X - Y...     |
| `INVALID_EMPLOYEE_TYPE`   | 400         | Chỉ nhân viên PART_TIME_FLEX mới có thể đăng ký ca linh hoạt. Vui lòng liên hệ Admin...            |
| `VALIDATION_ERROR`        | 400         | Validation failed (với sub-errors: dayOfWeek must be MONDAY/TUESDAY..., quota must be at least 1)  |

---

## Notes for Frontend Developers

### 1. JSON Format
**PHẢI dùng camelCase** cho tất cả requests:
- ✅ `employeeId`, `workShiftId`, `daysOfWeek`, `partTimeSlotId`, `slotId`, `quota`
- ❌ KHÔNG dùng snake_case: `employee_id`, `work_shift_id`, `part_time_slot_id`

### 2. Days of Week Format

**Luồng 1 (Fixed):** Array of integers
- `daysOfWeek: [1, 2, 3, 4, 5]`
- 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
- UI: Hiển thị checkbox cho user chọn

**Luồng 2 (Flex):** String uppercase
- `dayOfWeek: "TUESDAY"`
- Valid values: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
- UI: Dropdown hoặc radio button

### 3. Employee Type Validation (CRITICAL!)

**Trước khi hiển thị UI:**
```javascript
if (employee.employmentType === 'FULL_TIME' || 
    employee.employmentType === 'PART_TIME_FIXED') {
  // Show Luồng 1: Fixed Registration (Admin gán)
  // Routes: /api/v1/fixed-registrations
  // Employee chỉ có VIEW permission
}

if (employee.employmentType === 'PART_TIME_FLEX') {
  // Show Luồng 2: Part-Time Flex Registration (Employee tự đăng ký)
  // Routes: /api/v1/work-slots, /api/v1/registrations
  // Employee có CREATE/CANCEL permissions
}
```

**Không hiển thị sai UI → Tránh user gặp 409 error!**

### 4. Permissions & UI Controls

#### Luồng 1 (Fixed Registration)

| User Role       | Permissions            | UI Actions                                     |
| --------------- | ---------------------- | ---------------------------------------------- |
| Admin/Manager   | MANAGE + VIEW_ALL      | ✅ Create, Update, Delete, View All            |
| FULL_TIME       | VIEW_OWN               | ✅ View own schedule only (Read-only)          |
| PART_TIME_FIXED | VIEW_OWN               | ✅ View own schedule only (Read-only)          |
| PART_TIME_FLEX  | None                   | ❌ Hide entire Luồng 1 UI                      |

#### Luồng 2 (Flex Registration)

| User Role       | Permissions                                       | UI Actions                                                |
| --------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Admin/Manager   | MANAGE_WORK_SLOTS + UPDATE_REGISTRATIONS_ALL      | ✅ Manage slots, View/Cancel/Update all registrations     |
| PART_TIME_FLEX  | VIEW_AVAILABLE + CREATE + VIEW_OWN + CANCEL_OWN   | ✅ View available slots, Claim, View own, Cancel own      |
| FULL_TIME       | None                                              | ❌ Hide entire Luồng 2 UI                                 |
| PART_TIME_FIXED | None                                              | ❌ Hide entire Luồng 2 UI                                 |

### 5. Soft Delete Behavior

- Registration bị DELETE không còn hiện trong `GET` list
- Backend: `is_active = false`, nhưng data vẫn tồn tại trong DB
- Frontend: Không cần xử lý gì đặc biệt (backend đã filter)

### 6. Date Format

**Request (JSON):**
```json
{
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31"
}
```
Format: `YYYY-MM-DD`

**Response (JSON):**
```json
{
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31",
  "timestamp": "2025-10-31T10:00:00"
}
```
Date fields: `YYYY-MM-DD`  
Timestamp fields: ISO 8601 `YYYY-MM-DDTHH:mm:ss`

### 7. Error Handling

**Display Vietnamese messages to users:**
```javascript
if (error.status === 409 && error.errorCode === 'SLOT_IS_FULL') {
  showNotification(error.message); 
  // "Suất [Ca Part-time Sáng (8h-12h) - TUESDAY] đã đủ người đăng ký."
}

if (error.status === 400 && error.errorCode === 'VALIDATION_ERROR') {
  // Display field-level errors
  Object.keys(error.errors).forEach(field => {
    showFieldError(field, error.errors[field]);
  });
}
```

### 8. Real-time Updates (Recommended)

**Luồng 2 - Available Slots:**
- Quota có thể thay đổi khi có người claim/cancel
- Recommendation: Refresh available-slots list sau mỗi action (claim/cancel)
- Hoặc implement polling/WebSocket để real-time update

**Example:**
```javascript
// After claim success
POST /api/v1/registrations → 201 Created
// Immediately refresh available slots
GET /api/v1/registrations/available-slots
```

### 9. Quota Display

**Admin Dashboard (GET /api/v1/work-slots):**
```javascript
{
  quota: 3,
  registered: 2,
  // Calculate remaining
  remaining: 3 - 2 = 1
}

// Display: "2/3 đã đăng ký (còn 1 chỗ)"
```

**Employee View (GET /api/v1/registrations/available-slots):**
```javascript
{
  remaining: 1
}

// Display: "Còn 1 chỗ trống"
// If remaining === 0 → Don't show in list
```

### 10. Conflict Validation (Luồng 2)

**Before claim, show warning if:**
- Employee đã có registration với cùng `dayOfWeek` + `workShiftId`
- Example: "Bạn đã có ca Sáng vào Thứ 3. Bạn có chắc muốn hủy và đăng ký ca mới?"

**Backend sẽ reject (409) nếu:**
- Duplicate slot (cùng partTimeSlotId)
- Time conflict (cùng day + shift)

### 11. Auto-fill Employee ID

**Luồng 1 - Fixed Registration (Employee View):**
```javascript
// DON'T send employeeId in query param (Spec V2)
GET /api/v1/fixed-registrations
// Backend tự động lấy từ JWT token

// If admin wants to filter:
GET /api/v1/fixed-registrations?employeeId=6
```

**Luồng 2 - Flex Registration:**
```javascript
// Employee claims (no need to send employeeId)
POST /api/v1/registrations
{
  "partTimeSlotId": 1,
  "effectiveFrom": "2025-11-01"
  // Backend lấy employeeId từ token
}
```

---

## Quick Reference - Test Data

### Login Accounts

```bash
# Admin/Manager (Full permissions for both Luồng)
username: admin, password: 123456
username: manager, password: 123456

# PART_TIME_FIXED (Luồng 1 VIEW_OWN only)
username: yta, password: 123456      # employeeId=6 (Phạm Thị Hoa)
username: yta3, password: 123456     # employeeId=9 (Võ Thị Trang)

# PART_TIME_FLEX (Luồng 2 full employee permissions)
username: yta2, password: 123456     # employeeId=8 (Nguyễn Thị Linh)

# FULL_TIME (Luồng 1 VIEW_OWN only)
username: nhasi1, password: 123456   # employeeId=2 (Nguyễn Văn Minh)
```

### Employees by Type

| ID  | Name            | Employment Type     | Luồng 1 (Fixed) | Luồng 2 (Flex) |
| --- | --------------- | ------------------- | --------------- | -------------- |
| 2   | Nguyễn Văn Minh | FULL_TIME           | ✅ Allowed      | ❌ Forbidden   |
| 6   | Phạm Thị Hoa    | PART_TIME_FIXED     | ✅ Allowed      | ❌ Forbidden   |
| 8   | Nguyễn Thị Linh | **PART_TIME_FLEX**  | ❌ Forbidden    | ✅ Allowed     |
| 9   | Võ Thị Trang    | PART_TIME_FIXED     | ✅ Allowed      | ❌ Forbidden   |

### Work Shifts

```bash
WKS_MORNING_01: Ca Sáng (8h-16h)              # Full-time shift
WKS_AFTERNOON_01: Ca Chiều (13h-20h)          # Full-time shift
WKS_MORNING_02: Ca Part-time Sáng (8h-12h)    # Part-time shift
WKS_AFTERNOON_02: Ca Part-time Chiều (13h-17h) # Part-time shift
```

### Days of Week

**Luồng 1 (Integer):** `[1, 2, 3, 4, 5, 6, 7]`  
**Luồng 2 (String):** `MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY`

---

## API Endpoints Summary

### Luồng 1: Fixed Shift Registration

| Method | Endpoint                              | Permission                     | Description                         |
| ------ | ------------------------------------- | ------------------------------ | ----------------------------------- |
| POST   | `/api/v1/fixed-registrations`         | MANAGE_FIXED_REGISTRATIONS     | Tạo lịch cố định                    |
| GET    | `/api/v1/fixed-registrations`         | VIEW_ALL / VIEW_OWN            | Xem danh sách lịch cố định          |
| PUT    | `/api/v1/fixed-registrations/{id}`    | MANAGE_FIXED_REGISTRATIONS     | Cập nhật lịch cố định               |
| DELETE | `/api/v1/fixed-registrations/{id}`    | MANAGE_FIXED_REGISTRATIONS     | Xóa lịch cố định (soft delete)      |

### Luồng 2: Part-Time Flex Registration

#### Admin - Work Slot Management

| Method | Endpoint                     | Permission          | Description                        |
| ------ | ---------------------------- | ------------------- | ---------------------------------- |
| POST   | `/api/v1/work-slots`         | MANAGE_WORK_SLOTS   | Tạo suất làm việc mới              |
| GET    | `/api/v1/work-slots`         | MANAGE_WORK_SLOTS   | Xem danh sách suất (Admin view)    |
| PUT    | `/api/v1/work-slots/{id}`    | MANAGE_WORK_SLOTS   | Cập nhật quota hoặc isActive       |

#### Employee - Registration Management

| Method | Endpoint                                       | Permission                  | Description                      |
| ------ | ---------------------------------------------- | --------------------------- | -------------------------------- |
| GET    | `/api/v1/registrations/available-slots`        | VIEW_AVAILABLE_SLOTS        | Xem suất còn trống               |
| POST   | `/api/v1/registrations`                        | CREATE_REGISTRATION         | Claim (nhận) một suất            |
| GET    | `/api/v1/registrations`                        | VIEW_OWN / UPDATE_ALL       | Xem danh sách đăng ký            |
| DELETE | `/api/v1/registrations/{id}`                   | CANCEL_OWN / UPDATE_ALL     | Hủy đăng ký (giải phóng suất)    |
| PATCH  | `/api/v1/registrations/{id}/effective-to`      | UPDATE_REGISTRATIONS_ALL    | Cập nhật thời hạn (Admin only)   |

---

## Contact & Support

- **Backend API Issues**: Liên hệ Backend Team
- **Test Guide Updates**: Check Git commits for latest changes
- **Postman Collection**: Import từ `/postman` folder

**Last Updated:** October 31, 2025  
**API Version:** V2 (Hybrid Schedule System)  
**Branch:** `feat/BE-307-manage-shift-registration-renewal-and-batch-job`
