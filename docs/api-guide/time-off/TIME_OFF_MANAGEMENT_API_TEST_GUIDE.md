#  TIME-OFF MANAGEMENT API TEST GUIDE (P5.1, P5.2, P6.1)

**Version:** V14 Hybrid
**Date:** 2025-10-31 (Updated)
**Modules:** P5.1 (Time-Off Requests), P5.2 (Leave Balances), P6.1 (Time-Off Types)

---

##  CHANGELOG (2025-10-31)

###  Đã sửa và cập nhật:

1. **Exception Message (SHIFT_NOT_FOUND_FOR_LEAVE):**

   -  OLD: "Không thể xin nghỉ. Nhân viên 5 không có lịch làm việc vào 2025-11-20 ca WKS_MORNING_02."
   -  NEW: "Nhân viên không có lịch làm việc vào ngày này. Vui lòng kiểm tra lịch làm việc trước khi đăng ký nghỉ phép. (Ngày: 2025-11-20, Ca: Ca sáng)"
   - **Lý do:** Message chuyên nghiệp hơn, rõ ràng hơn cho FE, có thêm tên ca làm việc thay vì chỉ ID

2. **Test Examples sử dụng đúng Seed Data:**

   -  OLD: Employee 5 test với `WKS_MORNING_02` (SAI - không có trong seed)
   -  NEW: Employee 5 test với `WKS_MORNING_01` (ĐÚNG - theo seed data)
   - **Lý do:** Employee 5 (Tuấn Hoàng Văn) làm ca WKS_MORNING_01 từ Thứ 2-Thứ 7 (Mon-Sat)

3. **Cập nhật Employee Information:**

   - Bổ sung đầy đủ 9 employees từ seed data (trước đó chỉ có 5)
   - Thêm cột Ghi chú để phân biệt employment_type và role

4. **Validation Logic:**

   - Giữ nguyên business logic V14 Hybrid (check từ cả fixed + part-time registrations)
   - Message lỗi tiếng Việt chuyên nghiệp, dễ hiểu cho end-user

5. ** BUG FIX: NullPointerException khi APPROVE/REJECT/CANCEL request:**
   -  **Vấn đề:** `account.getEmployee().getEmployeeId()` gây NPE nếu Account không có Employee liên kết
   -  **Fix:** Thêm null check cho tất cả 6 vị trí trong `TimeOffRequestService`:
     - `getAllRequests()` - LINE 96, 140
     - `getRequestById()` - LINE 140
     - `createRequest()` - LINE 275
     - `handleApproval()` - LINE 357
     - `handleRejection()` - LINE 382
     - `handleCancellation()` - LINE 416
   - **Error message rõ ràng:** "Account {username} không có Employee liên kết."
   - **Impact:** Fix 500 Internal Server Error → Trả về message lỗi rõ ràng

###  Lưu ý quan trọng cho FE Team:

- ️ **Khi test API POST /api/v1/time-off-requests:**

  - Employee 5 → Dùng `workShiftId: "WKS_MORNING_01"` (NOT WKS_MORNING_02)
  - Employee 6 → Dùng `workShiftId: "WKS_MORNING_02"` vào Thứ 2, 4, 6
  - Employee 8 (PART_TIME_FLEX) → Check part_time_registrations trước khi test

-  **Error SHIFT_NOT_FOUND_FOR_LEAVE (409):**
  - Message giờ đã rõ ràng hơn với tên ca làm việc
  - FE có thể hiển thị trực tiếp cho user không cần parse

---

##  OVERVIEW

Hệ thống quản lý nghỉ phép bao gồm 3 modules chính:

1. **P6.1 - TIME-OFF TYPES MANAGEMENT** (Admin quản lý "luật chơi")

   - Định nghĩa các loại nghỉ phép (Nghỉ năm, Nghỉ ốm, Không lương...)
   - Xác định quy tắc: Có trả lương không? Có cần duyệt không?

2. **P5.2 - LEAVE BALANCE MANAGEMENT** (Admin quản lý "ví phép")

   - Cấp phát số dư phép cho nhân viên theo năm
   - Điều chỉnh thủ công (thưởng/phạt)
   - Reset tự động hàng năm

3. **P5.1 - TIME-OFF REQUEST MANAGEMENT** (Nhân viên "xin" và Quản lý "duyệt")
   - Tạo yêu cầu nghỉ phép (toàn ca hoặc nửa ca)
   - **V14 Hybrid:** Kiểm tra lịch làm từ cả Fixed và Part-Time Flex
   - Kiểm tra số dư phép (balance)
   - Duyệt/Từ chối/Hủy yêu cầu
   - Tự động trừ phép và cập nhật employee_shifts

---

##  SEED DATA REFERENCE

### Employees (từ seed data)

| employee_id | Tên                | employment_type | account_id  | Ghi chú                      |
| ----------- | ------------------ | --------------- | ----------- | ---------------------------- |
| 1           | Admin Hệ thống     | FULL_TIME       | 1 (admin)   | ROLE_ADMIN                   |
| 2           | Minh Nguyễn Văn    | FULL_TIME       | 2 (manager) | ROLE_MANAGER (Nha sĩ)        |
| 3           | Lan Trần Thị       | FULL_TIME       | 3           | ROLE_DOCTOR                  |
| 4           | Mai Lê Thị         | FULL_TIME       | 4           | ROLE_RECEPTIONIST            |
| 5           | Tuấn Hoàng Văn     | FULL_TIME       | 5           | ROLE_ACCOUNTANT              |
| 6           | Hoa Phạm Thị       | PART_TIME_FIXED | 6           | ROLE_NURSE (có fixed shift)  |
| 7           | Quản Lý Nguyễn Văn | FULL_TIME       | 7           | ROLE_MANAGER                 |
| 8           | Linh Nguyễn Thị    | PART_TIME_FLEX  | 8           | ROLE_NURSE (flex)            |
| 9           | Trang Võ Thị       | PART_TIME_FIXED | 9           | ROLE_NURSE (fixed part-time) |

### Time-Off Types (từ seed data)

| type_id         | type_code       | type_name                     | is_paid | requires_balance | default_days_per_year |
| --------------- | --------------- | ----------------------------- | ------- | ---------------- | --------------------- |
| ANNUAL_LEAVE    | ANNUAL_LEAVE    | Nghỉ phép năm                 | true    | true             | 12.0                  |
| SICK_LEAVE      | SICK_LEAVE      | Nghỉ ốm (BHXH)                | true    | false            | null                  |
| UNPAID_PERSONAL | UNPAID_PERSONAL | Nghỉ việc riêng (không lương) | false   | false            | null                  |

**Lưu ý:** Từ V15 onwards, `type_id` = `type_code` để dễ sử dụng API.

### Leave Balances 2025 (từ seed data)

| employee_id | employee_name   | time_off_type_id | total_allotted | used | remaining |
| ----------- | --------------- | ---------------- | -------------- | ---- | --------- |
| 1           | Admin Hệ thống  | ANNUAL_LEAVE     | 12.0           | 0.0  | 12.0      |
| 2           | Minh Nguyễn Văn | ANNUAL_LEAVE     | 12.0           | 2.5  | 9.5       |
| 5           | Tuấn Hoàng Văn  | ANNUAL_LEAVE     | 12.0           | 3.5  | 8.5       |
| 6           | Hoa Phạm Thị    | ANNUAL_LEAVE     | 6.0            | 1.0  | 5.0       |
| 8           | Linh Nguyễn Thị | ANNUAL_LEAVE     | 6.0            | 0.5  | 5.5       |

### Work Shifts (từ seed data)

| work_shift_id    | shift_name | start_time | end_time |
| ---------------- | ---------- | ---------- | -------- |
| WKS_MORNING_02   | Ca sáng    | 07:30      | 12:00    |
| WKS_AFTERNOON_02 | Ca chiều   | 13:00      | 17:30    |
| WKS_EVENING_02   | Ca tối     | 18:00      | 21:00    |

---

##  RBAC PERMISSIONS MATRIX

### P6.1 - Time-Off Types Management

| Permission            | ROLE_ADMIN | ROLE_MANAGER | ROLE_EMPLOYEE |
| --------------------- | ---------- | ------------ | ------------- |
| VIEW_TIMEOFF_TYPE_ALL |          |            |             |
| CREATE_TIMEOFF_TYPE   |          |            |             |
| UPDATE_TIMEOFF_TYPE   |          |            |             |
| DELETE_TIMEOFF_TYPE   |          |            |             |

### P5.2 - Leave Balance Management

| Permission             | ROLE_ADMIN | ROLE_MANAGER | ROLE_EMPLOYEE |
| ---------------------- | ---------- | ------------ | ------------- |
| VIEW_LEAVE_BALANCE_ALL |          |            |             |
| ADJUST_LEAVE_BALANCE   |          |            |             |

### P5.1 - Time-Off Requests

| Permission             | ROLE_ADMIN | ROLE_MANAGER | ROLE_EMPLOYEE |
| ---------------------- | ---------- | ------------ | ------------- |
| VIEW_TIMEOFF_ALL       |          |            |             |
| VIEW_TIMEOFF_OWN       |          |            |             |
| CREATE_TIMEOFF         |          |            |             |
| APPROVE_TIMEOFF        |          |            |             |
| REJECT_TIMEOFF         |          |            |             |
| CANCEL_TIMEOFF_OWN     |          |            |             |
| CANCEL_TIMEOFF_PENDING |          |            |             |

---

##  MODULE P6.1: TIME-OFF TYPES MANAGEMENT

Admin định nghĩa các loại nghỉ phép.

### API 1: GET /api/v1/admin/time-off-types

**Lấy danh sách tất cả loại nghỉ phép (Admin View)**

**Authorization:** `VIEW_TIMEOFF_TYPE_ALL`

**Query Parameters:**

- `is_active` (boolean, optional): Filter by active status
- `is_paid` (boolean, optional): Filter by paid status

**Request Examples:**

```bash
# Lấy tất cả loại nghỉ phép
GET /api/v1/admin/time-off-types
Authorization: Bearer {manager_token}

# Lọc chỉ loại đang active
GET /api/v1/admin/time-off-types?is_active=true

# Lọc chỉ loại có lương
GET /api/v1/admin/time-off-types?is_paid=true

# Lọc loại đang active VÀ có lương
GET /api/v1/admin/time-off-types?is_active=true&is_paid=true

# Lọc loại inactive (đã vô hiệu hóa)
GET /api/v1/admin/time-off-types?is_active=false

# Lọc loại không lương
GET /api/v1/admin/time-off-types?is_paid=false
```

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "typeId": "ANNUAL_LEAVE",
      "typeCode": "ANNUAL_LEAVE",
      "typeName": "Nghỉ phép năm",
      "description": null,
      "isPaid": true,
      "requiresApproval": true,
      "requiresBalance": true,
      "defaultDaysPerYear": 12.0,
      "isActive": true
    },
    {
      "typeId": "SICK_LEAVE",
      "typeCode": "SICK_LEAVE",
      "typeName": "Nghỉ ốm (BHXH)",
      "isPaid": true,
      "requiresApproval": true,
      "requiresBalance": false,
      "isActive": true
    }
  ]
}
```

**Error Responses:**

- 403 FORBIDDEN: User không có quyền `VIEW_TIMEOFF_TYPE_ALL`

---

### API 2: POST /api/v1/admin/time-off-types

**Tạo loại nghỉ phép mới**

**Authorization:** `CREATE_TIMEOFF_TYPE`

**Request Body:**

```json
{
  "typeCode": "UNPAID_LEAVE",
  "typeName": "Nghỉ không lương",
  "description": "Nghỉ việc riêng không hưởng lương",
  "requiresBalance": false,
  "defaultDaysPerYear": null,
  "isPaid": false
}
```

**Required Fields:**

- `typeCode` (String): Mã loại nghỉ phép (unique)
- `typeName` (String): Tên loại nghỉ phép
- `requiresBalance` (Boolean): **BẮT BUỘC** - Có cần kiểm tra số dư phép không? (true = ANNUAL_LEAVE, false = SICK_LEAVE/UNPAID)
- `isPaid` (Boolean): Có trả lương không?

**Optional Fields:**

- `description` (String): Mô tả chi tiết
- `defaultDaysPerYear` (Double): Số ngày phép mặc định mỗi năm (dùng cho annual reset)
- `requiresApproval` (Boolean): Cần phê duyệt không? (default: true)
- `isActive` (Boolean): Đang hoạt động? (default: true)

**Response 201 CREATED:**

```json
{
  "statusCode": 201,
  "message": "Created",
  "data": {
    "typeId": "TOT_20251030_ABC123",
    "typeCode": "UNPAID_LEAVE",
    "typeName": "Nghỉ không lương",
    "description": "Nghỉ việc riêng không hưởng lương",
    "requiresBalance": false,
    "defaultDaysPerYear": null,
    "isPaid": false,
    "requiresApproval": true,
    "isActive": true
  }
}
```

**Validation Rules:**

1. **requiresBalance & defaultDaysPerYear (HAI CHIỀU):**
   -  Nếu `requiresBalance = true` → `defaultDaysPerYear` **PHẢI** có giá trị (để dùng cho annual reset)
   -  Nếu `requiresBalance = false` → `defaultDaysPerYear` **PHẢI** là `null` (không cần balance tracking)
   - **Backend sẽ reject cả hai trường hợp sai logic:**
     -  `requiresBalance = true` VÀ `defaultDaysPerYear = null` → 400 `MISSING_DEFAULT_DAYS`
     -  `requiresBalance = false` VÀ `defaultDaysPerYear != null` → 400 `INVALID_DEFAULT_DAYS`
   - Ví dụ:
     -  ANNUAL_LEAVE: `requiresBalance = true, defaultDaysPerYear = 12.0`
     -  SICK_LEAVE: `requiresBalance = false, defaultDaysPerYear = null`
     -  INVALID: `requiresBalance = true, defaultDaysPerYear = null` → 400 BAD_REQUEST
     -  INVALID: `requiresBalance = false, defaultDaysPerYear = 12.0` → 400 BAD_REQUEST

**Error Responses:**

- 400 BAD_REQUEST: Missing required field (`requiresBalance` is required)
- 400 BAD_REQUEST `MISSING_DEFAULT_DAYS`: requiresBalance = true nhưng thiếu defaultDaysPerYear
- 400 BAD_REQUEST `INVALID_DEFAULT_DAYS`: requiresBalance = false nhưng vẫn set defaultDaysPerYear
- 409 CONFLICT `DUPLICATE_TYPE_CODE`: Mã loại nghỉ phép đã tồn tại

---

### API 3: PATCH /api/v1/admin/time-off-types/{type_id}

**Cập nhật loại nghỉ phép**

**Authorization:** `UPDATE_TIMEOFF_TYPE`

**Request:**

```bash
PATCH /api/v1/admin/time-off-types/TOT_20251030_ABC123
Content-Type: application/json
Authorization: Bearer {manager_token}
```

**Request Body (chỉ gửi fields cần update - PARTIAL UPDATE):**

```json
{
  "typeName": "Nghỉ không lương (Việc riêng)"
}
```

**Tất cả fields đều optional, chỉ gửi field nào muốn update:**

- `typeName` (String): Tên loại nghỉ phép
- `typeCode` (String): Mã loại (kiểm tra unique nếu thay đổi)
- `description` (String): Mô tả
- `requiresBalance` (Boolean): Có cần check số dư không
- `defaultDaysPerYear` (Double): Số ngày mặc định
- `isPaid` (Boolean): Có lương không
- `requiresApproval` (Boolean): Cần duyệt không
- `isActive` (Boolean): Đang hoạt động không

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "typeId": "TOT_20251030_ABC123",
    "typeCode": "UNPAID_LEAVE",
    "typeName": "Nghỉ không lương (Việc riêng)",
    "requiresBalance": false,
    "defaultDaysPerYear": null,
    "isPaid": false,
    "requiresApproval": true,
    "isActive": true
  }
}
```

**Error Responses:**

- 404 NOT_FOUND `TIMEOFF_TYPE_NOT_FOUND`
- 409 CONFLICT `DUPLICATE_TYPE_CODE` (nếu update typeCode trùng)

---

### API 4: DELETE /api/v1/admin/time-off-types/{type_id}

**Vô hiệu hóa/Kích hoạt lại loại nghỉ phép (Toggle)**

**Authorization:** `DELETE_TIMEOFF_TYPE`

**Business Logic:**

- Soft delete: Toggle `is_active` (true ↔ false)
- Nếu vô hiệu hóa (true → false), kiểm tra xem có time-off request PENDING nào đang dùng loại này không
- Nếu có → Trả về lỗi 409 CONFLICT

**Request:**

```bash
DELETE /api/v1/admin/time-off-types/TOT_20251030_ABC123
Authorization: Bearer {manager_token}
```

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "typeId": "TOT_20251030_ABC123",
    "typeCode": "UNPAID_LEAVE",
    "typeName": "Nghỉ không lương (Việc riêng)",
    "isActive": false
  }
}
```

**Error Responses:**

- 404 NOT_FOUND `TIMEOFF_TYPE_NOT_FOUND`
- 409 CONFLICT `TIMEOFF_TYPE_IN_USE`: Không thể vô hiệu hóa. Loại nghỉ phép này đang được sử dụng trong các yêu cầu đang chờ duyệt.

---

##  MODULE P5.2: LEAVE BALANCE MANAGEMENT

Admin quản lý "ví phép" của nhân viên.

### API 1.1: GET /api/v1/admin/leave-balances

**⭐ [MỚI] Lấy số dư phép của TẤT CẢ nhân viên (Admin Dashboard)**

**Authorization:** `VIEW_LEAVE_BALANCE_ALL`

**Query Parameters:**

- `cycle_year` (integer, optional): Lọc theo năm (ví dụ: 2025). Mặc định là năm hiện tại.
- `time_off_type_id` (string, optional): Lọc theo một loại phép cụ thể (ví dụ: `ANNUAL_LEAVE`).

**Request Examples:**

```bash
# Lấy tất cả balances năm 2025
GET /api/v1/admin/leave-balances?cycle_year=2025
Authorization: Bearer {manager_token}

# Lọc chỉ Nghỉ phép năm
GET /api/v1/admin/leave-balances?cycle_year=2025&time_off_type_id=ANNUAL_LEAVE

# Mặc định năm hiện tại
GET /api/v1/admin/leave-balances
```

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "filter": {
      "cycle_year": 2025,
      "time_off_type_id": null
    },
    "data": [
      {
        "employee_id": 1,
        "employee_name": "Admin Hệ thống",
        "balances": [
          {
            "time_off_type_name": "Nghỉ phép năm",
            "total_days_allowed": 12.0,
            "days_taken": 0.0,
            "days_remaining": 12.0
          }
        ]
      },
      {
        "employee_id": 5,
        "employee_name": "Hoàng Văn Tuấn",
        "balances": [
          {
            "time_off_type_name": "Nghỉ phép năm",
            "total_days_allowed": 12.0,
            "days_taken": 3.5,
            "days_remaining": 8.5
          }
        ]
      }
    ]
  }
}
```

**Use Case:**

- Admin Dashboard hiển thị tổng quan số dư phép của toàn bộ nhân viên
- Export báo cáo tổng hợp cuối năm
- Kiểm tra nhanh nhân viên nào còn nhiều phép chưa nghỉ

**Performance Note:**

- API này sử dụng JOIN query tối ưu để tránh N+1 problem
- Chỉ load employees đang `is_active = true`

---

### API 1: GET /api/v1/admin/employees/{employee_id}/leave-balances

**Lấy số dư phép của một nhân viên**

**Authorization:** `VIEW_LEAVE_BALANCE_ALL`

**Query Parameters:**

- `cycle_year` (integer, optional): Năm muốn xem (default: năm hiện tại 2025)

**Request:**

```bash
GET /api/v1/admin/employees/5/leave-balances?cycle_year=2025
Authorization: Bearer {manager_token}
```

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "employee_id": 5,
    "cycle_year": 2025,
    "balances": [
      {
        "balance_id": 101,
        "time_off_type": {
          "type_id": "ANNUAL_LEAVE",
          "type_name": "Nghỉ phép năm",
          "is_paid": true
        },
        "total_days_allowed": 12.0,
        "days_taken": 3.5,
        "days_remaining": 8.5
      }
    ]
  }
}
```

**Error Responses:**

- 404 NOT_FOUND `EMPLOYEE_NOT_FOUND`

---

### API 2: POST /api/v1/admin/leave-balances/adjust

**Điều chỉnh số dư phép (Cộng/Trừ thủ công)**

**Authorization:** `ADJUST_LEAVE_BALANCE`

**Business Logic:**

1. Tìm balance record cho (employee_id, time_off_type_id, cycle_year)
2. Nếu không tìm thấy → Tự động tạo record mới với `total_days_allowed = 0, days_taken = 0`
3. Nếu `change_amount > 0`: `total_days_allowed += change_amount`
4. Nếu `change_amount < 0`: `days_taken += abs(change_amount)`
5. Kiểm tra: `(total_days_allowed - days_taken) >= 0`
6. INSERT vào `leave_balance_history`

**Request:**

```json
{
  "employee_id": 5,
  "time_off_type_id": "ANNUAL_LEAVE",
  "cycle_year": 2025,
  "change_amount": 1.5,
  "notes": "Thưởng 1.5 ngày phép do hoàn thành xuất sắc dự án."
}
```

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Điều chỉnh số dư phép thành công",
  "data": {
    "employee_id": 5,
    "time_off_type_id": "ANNUAL_LEAVE",
    "cycle_year": 2025,
    "change_amount": 1.5
  }
}
```

**Error Responses:**

- 400 BAD_REQUEST `INVALID_BALANCE`: Số dư phép không thể âm sau khi điều chỉnh. Total allowed: 12.0, Used: 14.0, Remaining: -2.0
- 404 NOT_FOUND `RELATED_RESOURCE_NOT_FOUND`: Nhân viên hoặc Loại nghỉ phép không tồn tại.

---

### API 3: POST /api/v1/admin/leave-balances/annual-reset

**CRON JOB - Tự động reset ngày nghỉ khi sang năm mới**

**Authorization:** `ROLE_ADMIN` only

**Business Logic:**

1. Lấy danh sách tất cả nhân viên `is_active = true`
2. Với mỗi employee:
   - Kiểm tra xem đã có balance cho (employee_id, type_id, year) chưa
   - Nếu **CHƯA có**: INSERT với `total_days_allowed = default_allowance, days_taken = 0`
   - Nếu **CÓ RỒI**: Bỏ qua (idempotent, tránh cộng dồn)
3. INSERT vào `leave_balance_history` với reason = 'ANNUAL_RESET'

**Request:**

```json
{
  "cycle_year": 2026,
  "apply_to_type_id": "ANNUAL_LEAVE",
  "default_allowance": 12.0
}
```

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Annual reset hoàn tất",
  "data": {
    "cycle_year": 2026,
    "time_off_type_id": "ANNUAL_LEAVE",
    "default_allowance": 12.0,
    "total_employees": 10,
    "created_count": 10,
    "skipped_count": 0
  }
}
```

**Error Responses:**

- 400 BAD_REQUEST `INVALID_YEAR`: Năm reset không hợp lệ: 2023. Chỉ cho phép từ 2025 đến 2027
- 409 CONFLICT `JOB_ALREADY_RUN`: Job reset cho năm 2026 đã được chạy trước đó (nếu skipped_count = total_employees)

---

##  MODULE P5.1: TIME-OFF REQUEST MANAGEMENT

### API 1: GET /api/v1/time-off-requests

**Lấy danh sách yêu cầu nghỉ phép**

**Authorization:** `VIEW_TIMEOFF_ALL` hoặc `VIEW_TIMEOFF_OWN`

**Query Parameters:**

- `employee_id` (integer, optional): Filter by employee
- `status` (string, optional): PENDING | APPROVED | REJECTED | CANCELLED
- `start_date` (date, optional): Filter from date (yyyy-MM-dd)
- `end_date` (date, optional): Filter to date
- `page` (integer, default 0)
- `limit` (integer, default 20)

**Behavior:**

- Nếu user có `VIEW_TIMEOFF_ALL` → Trả về tất cả yêu cầu (có thể filter by employee_id)
- Nếu user chỉ có `VIEW_TIMEOFF_OWN` → Trả về yêu cầu của chính user (ignore employee_id parameter)

**Request:**

```bash
GET /api/v1/time-off-requests?status=PENDING&page=0&limit=20
Authorization: Bearer {employee_token}
```

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "requestId": "TOR_20251030_ABC123",
        "employeeId": 5,
        "employeeName": "Hoàng Thu Hương",
        "timeOffTypeId": "ANNUAL_LEAVE",
        "timeOffTypeName": "Nghỉ phép năm",
        "startDate": "2025-11-20",
        "endDate": "2025-11-20",
        "workShiftId": "WKS_MORNING_01",
        "reason": "Việc gia đình.",
        "status": "PENDING",
        "requestedBy": 5,
        "requestedAt": "2025-10-30T10:30:00",
        "approvedBy": null,
        "approvedAt": null
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "currentPage": 0
  }
}
```

---

### API 2: GET /api/v1/time-off-types

**Lấy danh sách các loại hình nghỉ phép (Employee View)**

**Authorization:** Authenticated user

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "typeId": "ANNUAL_LEAVE",
      "typeName": "Nghỉ phép năm",
      "isPaid": true
    },
    {
      "typeId": "SICK_LEAVE",
      "typeName": "Nghỉ ốm (BHXH)",
      "isPaid": true
    }
  ]
}
```

---

### API 3: GET /api/v1/time-off-requests/{request_id}

**Xem chi tiết một yêu cầu nghỉ phép**

**Authorization:** `VIEW_TIMEOFF_ALL` hoặc `VIEW_TIMEOFF_OWN`

**Business Logic:**

- Nếu user có `VIEW_TIMEOFF_ALL` → Xem được tất cả
- Nếu user chỉ có `VIEW_TIMEOFF_OWN` → Chỉ xem được yêu cầu của chính mình (check employeeId)

**Request:**

```bash
GET /api/v1/time-off-requests/TOR_20251030_ABC123
Authorization: Bearer {employee_token}
```

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "requestId": "TOR_20251030_ABC123",
    "employeeId": 5,
    "timeOffTypeId": "ANNUAL_LEAVE",
    "startDate": "2025-11-20",
    "endDate": "2025-11-20",
    "workShiftId": "WKS_MORNING_01",
    "reason": "Việc gia đình.",
    "status": "PENDING"
  }
}
```

**Error Responses:**

- 404 NOT_FOUND `TIMEOFF_REQUEST_NOT_FOUND`: Không tìm thấy yêu cầu hoặc bạn không có quyền xem

---

### API 4: POST /api/v1/time-off-requests

**⭐ Tạo yêu cầu nghỉ phép (V14 Hybrid - Validation Mới)**

**Authorization:** `CREATE_TIMEOFF`

**Request Body:**

```json
{
  "employeeId": 5,
  "timeOffTypeId": "ANNUAL_LEAVE",
  "startDate": "2025-11-20",
  "endDate": "2025-11-20",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Việc gia đình."
}
```

**Note:**

- `workShiftId` = `null`: Nghỉ cả ngày (full-day)
- `workShiftId` có giá trị: Nghỉ nửa ngày (half-day, 0.5 days)
- **Lưu ý:** Employee 5 làm ca **WKS_MORNING_01** (từ seed data), không phải WKS_MORNING_02

**Business Logic & Validation (Theo thứ tự):**

#### 1. Validate employee và time-off type

- Employee phải tồn tại và active
- TimeOffType phải `is_active = true`

#### 2. Validate date range

- `start_date <= end_date`
- `reason` là bắt buộc

#### 3. Validate balance (CHỈ cho ANNUAL_LEAVE)

- Nếu `time_off_type.type_code = "ANNUAL_LEAVE"`:
  - Tính `daysToRequest` = `work_shift_id` ? 0.5 : (endDate - startDate + 1)
  - Tìm balance trong năm hiện tại
  - Check: `days_remaining >= daysToRequest`
  - Nếu không đủ → 400 `INSUFFICIENT_LEAVE_BALANCE`
- Các loại khác (SICK_LEAVE, UNPAID_PERSONAL) không cần check balance

#### 4. Validate nghỉ nửa ngày

- Nếu `work_shift_id != null`: `start_date` phải bằng `end_date`
- Nếu không → 400 `INVALID_DATE_RANGE`

#### 5. **[V14 HYBRID MỚI] Kiểm tra Lịch làm việc**

**Nghỉ theo ca (work_shift_id != null):**

```
IF CheckEmployeeHasShift(employee_id, start_date, work_shift_id) = false
  → 409 CONFLICT (Code: SHIFT_NOT_FOUND_FOR_LEAVE)
```

**Nghỉ cả ngày (work_shift_id = null):**

```
Lặp từng ngày từ start_date đến end_date:
  IF CheckEmployeeHasShift(employee_id, date, null) = false FOR ALL dates
    → 409 CONFLICT (Code: SHIFT_NOT_FOUND_FOR_LEAVE)
```

**Hàm `CheckEmployeeHasShift(employee_id, date, work_shift_id)`:**

1. Lấy `day_of_week` (MONDAY, TUESDAY, ...)
2. Query `fixed_shift_registrations`:
   - Tìm registration active có `employee_id` match
   - Check date trong khoảng `[effective_from, effective_to]`
   - Check `day_of_week` có trong `registration_days`
   - Nếu `work_shift_id` được chỉ định → Check match
   - Nếu tìm thấy → `return true`
3. Query `part_time_registrations` (qua `part_time_slots`):
   - Tìm slot active có `day_of_week` match
   - Check `work_shift_id` (nếu specified)
   - Check xem employee có claim slot này không
   - Check date trong khoảng `[effective_from, effective_to]`
   - Nếu tìm thấy → `return true`
4. `return false`

#### 6. Check conflict (Duplicate request)

- Query time_off_requests với cùng employee_id, status = PENDING/APPROVED
- Check overlap date range và work_shift_id
- Nếu trùng → 409 `DUPLICATE_TIMEOFF_REQUEST`

#### 7. Create request

- Lấy `requested_by` từ JWT token
- Generate `request_id` = `TOR_{yyyyMMdd}_{random}`
- INSERT với `status = PENDING`

**Response 201 CREATED:**

```json
{
  "statusCode": 201,
  "message": "Created",
  "data": {
    "requestId": "TOR_20251120_XYZ789",
    "employeeId": 5,
    "timeOffTypeId": "ANNUAL_LEAVE",
    "startDate": "2025-11-20",
    "endDate": "2025-11-20",
    "workShiftId": "WKS_MORNING_01",
    "reason": "Việc gia đình.",
    "status": "PENDING",
    "requestedBy": 5,
    "requestedAt": "2025-10-30T14:30:00"
  }
}
```

**Error Responses:**

| Code                          | HTTP Status | Message                                                                                                         |
| ----------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| EMPLOYEE_NOT_FOUND            | 404         | Không tìm thấy nhân viên với ID: {id}                                                                           |
| TIMEOFF_TYPE_NOT_FOUND        | 404         | Không tìm thấy loại nghỉ phép với ID: {id}                                                                      |
| INVALID_DATE_RANGE            | 400         | Ngày bắt đầu không được lớn hơn ngày kết thúc.                                                                  |
| INVALID_DATE_RANGE            | 400         | Khi nghỉ theo ca, ngày bắt đầu và kết thúc phải giống nhau.                                                     |
| INSUFFICIENT_LEAVE_BALANCE    | 400         | Bạn không đủ ngày phép. Còn lại: 2.0 ngày, Yêu cầu: 3.0 ngày                                                    |
| **SHIFT_NOT_FOUND_FOR_LEAVE** | **409**     | **Nhân viên không có lịch làm việc vào ngày này. Vui lòng kiểm tra lịch làm việc trước khi đăng ký nghỉ phép.** |
| DUPLICATE_TIMEOFF_REQUEST     | 409         | Đã tồn tại một yêu cầu nghỉ phép trùng với khoảng thời gian này.                                                |

**Ví dụ lỗi SHIFT_NOT_FOUND_FOR_LEAVE (khi dùng sai shift):**

```json
{
  "statusCode": 409,
  "error": "SHIFT_NOT_FOUND_FOR_LEAVE",
  "message": "Nhân viên không có lịch làm việc vào ngày này. Vui lòng kiểm tra lịch làm việc trước khi đăng ký nghỉ phép. (Ngày: 2025-11-20, Ca: Ca sáng)",
  "data": null
}
```

**Lý do lỗi:** Employee 5 làm ca **WKS_MORNING_01**, không làm ca WKS_MORNING_02. Phải check seed data trước khi test.

---

### API 5: PATCH /api/v1/time-off-requests/{request_id}

**Cập nhật trạng thái yêu cầu (Duyệt/Từ chối/Hủy)**

**Authorization:** Depends on action (see below)

**Request Body:**

```json
// Để duyệt:
{"status": "APPROVED"}

// Để từ chối:
{"status": "REJECTED", "reason": "Nhân sự không đủ."}

// Để hủy:
{"status": "CANCELLED", "reason": "Thay đổi kế hoạch."}
```

**Business Logic:**

#### 1. Tìm yêu cầu

- Nếu không thấy → 404 `TIMEOFF_REQUEST_NOT_FOUND`

#### 2. Kiểm tra trạng thái hiện tại

- Yêu cầu phải đang ở `status = PENDING`
- Nếu không → 409 `INVALID_STATE_TRANSITION`

#### 3. Kiểm tra quyền theo status

**APPROVED:**

- Cần quyền: `APPROVE_TIMEOFF`
- Nếu không có → 403 FORBIDDEN

**REJECTED:**

- Cần quyền: `REJECT_TIMEOFF`
- `reason` là bắt buộc (nếu không có → 400 BAD_REQUEST)
- Nếu không có quyền → 403 FORBIDDEN

**CANCELLED:**

- `reason` là bắt buộc
- Kiểm tra quyền:
  - **Nhân viên**: Có `CANCEL_TIMEOFF_OWN` VÀ là chủ sở hữu (employeeId match)
  - **Quản lý**: Có `CANCEL_TIMEOFF_PENDING`
- Nếu cả hai điều kiện đều false → 403 FORBIDDEN

#### 4. Cập nhật database

- UPDATE `status`, `approved_by`, `approved_at`
- Lưu `rejected_reason` hoặc `cancellation_reason`

#### 5. Hành động tự động (Nếu APPROVED)

**A. Cập nhật employee_shifts:**

- **Nghỉ cả ngày:** Tìm tất cả ca trong `[start_date, end_date]` → `status = ON_LEAVE`
- **Nghỉ nửa ngày:** Tìm ca cụ thể theo `start_date` và `work_shift_id` → `status = ON_LEAVE`

**B. Trừ Balance (Chỉ cho ANNUAL_LEAVE):**

- Tính `daysToDeduct` = work_shift_id ? 0.5 : (endDate - startDate + 1)
- UPDATE `employee_leave_balances`: `days_taken += daysToDeduct`
- INSERT vào `leave_balance_history` với reason = 'APPROVED_REQUEST'

**Response 200 OK:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "requestId": "TOR_20251120_XYZ789",
    "employeeId": 5,
    "status": "APPROVED",
    "approvedBy": 2,
    "approvedAt": "2025-10-30T15:00:00"
  }
}
```

**Error Responses:**

| Code                      | HTTP Status | Message                                                        |
| ------------------------- | ----------- | -------------------------------------------------------------- |
| TIMEOFF_REQUEST_NOT_FOUND | 404         | Không tìm thấy yêu cầu nghỉ phép với ID: {id}                  |
| FORBIDDEN                 | 403         | Bạn không có quyền thực hiện hành động này.                    |
| INVALID_STATE_TRANSITION  | 409         | Không thể cập nhật yêu cầu. Yêu cầu phải ở trạng thái PENDING. |
| BAD_REQUEST               | 400         | Lý do từ chối/hủy là bắt buộc.                                 |

---

##  TESTING SCENARIOS

### Scenario 1: Admin Setup Time-Off Types

**Mục tiêu:** Admin tạo và quản lý các loại nghỉ phép

**Steps:**

```bash
# 1. Login as Admin
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# 2. Lấy danh sách loại nghỉ phép hiện có
GET /api/v1/admin/time-off-types
Authorization: Bearer {admin_token}

# 3. Tạo loại nghỉ mới: "Nghỉ không lương"
POST /api/v1/admin/time-off-types
Authorization: Bearer {admin_token}
{
  "typeCode": "UNPAID_PERSONAL_V2",
  "typeName": "Nghỉ không lương (Việc riêng)",
  "description": "Nghỉ việc riêng không hưởng lương",
  "requiresBalance": false,
  "isPaid": false
}

# 4. Cập nhật mô tả
PATCH /api/v1/admin/time-off-types/TOT_20251030_ABC123
{
  "description": "Nghỉ việc riêng không hưởng lương (Cập nhật)"
}

# 5. Vô hiệu hóa loại nghỉ (toggle)
DELETE /api/v1/admin/time-off-types/TOT_20251030_ABC123

# Expected: is_active = false

# 6. Test validation: requiresBalance = false VÀ defaultDaysPerYear != null
POST /api/v1/admin/time-off-types
Authorization: Bearer {admin_token}
{
  "typeCode": "INVALID_TEST_1",
  "typeName": "Test Invalid Case 1",
  "requiresBalance": false,
  "defaultDaysPerYear": 12.0,
  "isPaid": false
}

# Expected: 400 BAD_REQUEST
# Error: INVALID_DEFAULT_DAYS - Loại nghỉ phép không cần balance tracking không thể có defaultDaysPerYear

# 7. Test validation: requiresBalance = true VÀ defaultDaysPerYear = null
POST /api/v1/admin/time-off-types
Authorization: Bearer {admin_token}
{
  "typeCode": "INVALID_TEST_2",
  "typeName": "Test Invalid Case 2",
  "requiresBalance": true,
  "defaultDaysPerYear": null,
  "isPaid": true
}

# Expected: 400 BAD_REQUEST
# Error: MISSING_DEFAULT_DAYS - Loại nghỉ phép cần balance tracking PHẢI có defaultDaysPerYear
```

**Expected Results:**

- Tạo thành công → 201 CREATED
- Cập nhật thành công → 200 OK
- Vô hiệu hóa thành công → 200 OK (is_active = false)
- Test validation case 1 → 400 BAD_REQUEST với error `INVALID_DEFAULT_DAYS`
- Test validation case 2 → 400 BAD_REQUEST với error `MISSING_DEFAULT_DAYS`

---

### Scenario 2: Annual Leave Balance Reset

**Mục tiêu:** Admin chạy job reset phép đầu năm

**Steps:**

```bash
# 1. Login as Admin
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# 2. Xem tổng quan số dư phép của TẤT CẢ nhân viên năm 2025
GET /api/v1/admin/leave-balances?cycle_year=2025
Authorization: Bearer {admin_token}

# Expected: Danh sách TẤT CẢ employees đang active với balances (nếu có)
# - employee_id = 1, 2, 5, 6, 8 (từ seed data)
# - Mỗi employee có balance cho ANNUAL_LEAVE

# 3. Xem chi tiết số dư phép hiện tại của employee 5
GET /api/v1/admin/employees/5/leave-balances?cycle_year=2025
Authorization: Bearer {admin_token}

# Expected:
# - employee_id = 5
# - balances có ANNUAL_LEAVE: total=12.0, used=3.5, remaining=8.5

# 4. Chạy annual reset cho năm 2026
POST /api/v1/admin/leave-balances/annual-reset
Authorization: Bearer {admin_token}
{
  "cycle_year": 2026,
  "apply_to_type_id": "ANNUAL_LEAVE",
  "default_allowance": 12.0
}

# Expected:
# - statusCode: 200
# - created_count > 0 (số nhân viên active chưa có balance 2026)
# - skipped_count = 0 (nếu chạy lần đầu)

# 5. Xem tổng quan balances năm 2026
GET /api/v1/admin/leave-balances?cycle_year=2026&time_off_type_id=ANNUAL_LEAVE

# Expected:
# - TẤT CẢ active employees có balance mới cho năm 2026
# - total_days_allowed = 12.0
# - days_taken = 0.0
# - days_remaining = 12.0

# 6. Xem số dư phép năm 2026 của employee 5
GET /api/v1/admin/employees/5/leave-balances?cycle_year=2026

# Expected:
# - balance_id mới được tạo
# - total_days_allowed = 12.0
# - days_taken = 0.0
# - days_remaining = 12.0

# 7. Chạy lại job (test idempotent)
POST /api/v1/admin/leave-balances/annual-reset
{
  "cycle_year": 2026,
  "apply_to_type_id": "ANNUAL_LEAVE",
  "default_allowance": 12.0
}

# Expected:
# - statusCode: 200
# - created_count = 0
# - skipped_count = {total_employees} (vì đã tồn tại)
# - message: "Annual reset hoàn tất"
```

---

### Scenario 3: Manual Balance Adjustment

**Mục tiêu:** Manager thưởng phép cho nhân viên

**Steps:**

```bash
# 1. Login as Manager
POST /api/v1/auth/login
{
  "username": "manager",
  "password": "manager123"
}

# 2. Xem số dư hiện tại của employee 5
GET /api/v1/admin/employees/5/leave-balances?cycle_year=2025
Authorization: Bearer {manager_token}

# Current: total_days_allowed = 12.0, days_taken = 0.0, days_remaining = 12.0

# 3. Thưởng 2 ngày phép
POST /api/v1/admin/leave-balances/adjust
Authorization: Bearer {manager_token}
{
  "employee_id": 5,
  "time_off_type_id": "ANNUAL_LEAVE",
  "cycle_year": 2025,
  "change_amount": 2.0,
  "notes": "Thưởng 2 ngày phép do hoàn thành xuất sắc dự án Q4."
}

# Expected: 200 OK

# 4. Xem lại số dư
GET /api/v1/admin/employees/5/leave-balances?cycle_year=2025

# Expected:
# - total_days_allowed = 14.0 (12 + 2)
# - days_taken = 0.0
# - days_remaining = 14.0

# 5. Thử trừ phép quá mức (test validation)
POST /api/v1/admin/leave-balances/adjust
{
  "employee_id": 5,
  "time_off_type_id": "ANNUAL_LEAVE",
  "cycle_year": 2025,
  "change_amount": -20.0,
  "notes": "Test validation"
}

# Expected: 400 BAD_REQUEST
# Error: INVALID_BALANCE - Số dư phép không thể âm sau khi điều chỉnh
```

---

### Scenario 4: Employee Request Time-Off (V14 Hybrid)

**Mục tiêu:** Nhân viên FULL_TIME xin nghỉ phép 1 ngày (có fixed shift)

**Setup:**

- employee_id = 5 (Tuấn Hoàng Văn, FULL_TIME, ROLE_ACCOUNTANT)
- Có fixed_shift_registration cho WKS_MORNING_01 vào thứ 2-7 (Mon-Sat)
- Có balance: total_allowed = 14.0, used = 0.0, remaining = 14.0

**Steps:**

```bash
# 1. Login as employee 5
POST /api/v1/auth/login
{
  "username": "tuanhoangvan",
  "password": "password123"
}

# 2. Xem danh sách loại nghỉ phép
GET /api/v1/time-off-types
Authorization: Bearer {employee_token}

# 3. Xin nghỉ nửa ca sáng ngày 20/11/2025 (Thứ 5)
POST /api/v1/time-off-requests
Authorization: Bearer {employee_token}
{
  "employeeId": 5,
  "timeOffTypeId": "ANNUAL_LEAVE",
  "startDate": "2025-11-20",
  "endDate": "2025-11-20",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Đưa con đi khám bệnh."
}

# Expected: 201 CREATED
# System đã check:
# -  Employee 5 có lịch WKS_MORNING_01 vào Thứ 5 (từ fixed_shift_registration)
# -  Số dư phép đủ (14.0 >= 0.5)
# -  Không trùng request khác
# → Tạo thành công với status = PENDING

# 4. Xem lại request vừa tạo
GET /api/v1/time-off-requests/{request_id}

# Expected:
# - status = PENDING
# - workShiftId = WKS_MORNING_01
```

---

### Scenario 5: Manager Approve Time-Off

**Mục tiêu:** Manager duyệt yêu cầu nghỉ phép

**Setup:**

- Có request từ Scenario 4: request_id = TOR_20251120_XYZ789, status = PENDING

**Steps:**

```bash
# 1. Login as Manager
POST /api/v1/auth/login
{
  "username": "manager",
  "password": "manager123"
}

# 2. Xem danh sách request đang chờ duyệt
GET /api/v1/time-off-requests?status=PENDING
Authorization: Bearer {manager_token}

# 3. Duyệt request
PATCH /api/v1/time-off-requests/TOR_20251120_XYZ789
Authorization: Bearer {manager_token}
{
  "status": "APPROVED"
}

# Expected: 200 OK
# System tự động:
# -  UPDATE employee_shifts: Ca sáng 20/11/2025 → status = ON_LEAVE
# -  UPDATE employee_leave_balances: days_taken = 0.0 + 0.5 = 0.5
# -  INSERT leave_balance_history: change_amount = -0.5, reason = APPROVED_REQUEST
# -  Cập nhật request: status = APPROVED, approved_by = 2 (manager), approved_at = now()

# 4. Xem lại số dư phép của employee 5
GET /api/v1/admin/employees/5/leave-balances?cycle_year=2025

# Expected:
# - total_days_allowed = 14.0
# - days_taken = 0.5
# - days_remaining = 13.5
```

---

### Scenario 6: PART_TIME_FLEX Employee Request (V14 Hybrid)

**Mục tiêu:** Nhân viên PART_TIME_FLEX xin nghỉ (check từ part_time_registrations)

**Setup:**

- employee_id = 8 (Võ Thị Mai, PART_TIME_FLEX, ROLE_RECEPTIONIST)
- Có claim part_time_slot: Thứ 3, Ca sáng (WKS_MORNING_02)

**Steps:**

```bash
# 1. Login as employee 8
POST /api/v1/auth/login
{
  "username": "vothimai",
  "password": "password123"
}

# 2. Xin nghỉ ca sáng ngày 25/11/2025 (Thứ 3)
POST /api/v1/time-off-requests
Authorization: Bearer {employee_token}
{
  "employeeId": 8,
  "timeOffTypeId": "SICK_LEAVE",
  "startDate": "2025-11-25",
  "endDate": "2025-11-25",
  "workShiftId": "WKS_MORNING_02",
  "reason": "Bị cảm lạnh."
}

# Expected: 201 CREATED
# System đã check:
# -  Employee 8 có claim slot Thứ 3 - WKS_MORNING_02 (từ part_time_registrations)
# -  SICK_LEAVE không cần check balance
# → Tạo thành công

# 3. Thử xin nghỉ ngày không có lịch (Thứ 5)
POST /api/v1/time-off-requests
{
  "employeeId": 8,
  "timeOffTypeId": "SICK_LEAVE",
  "startDate": "2025-11-27",
  "endDate": "2025-11-27",
  "workShiftId": "WKS_MORNING_02",
  "reason": "Test validation"
}

# Expected: 409 CONFLICT
# Error: SHIFT_NOT_FOUND_FOR_LEAVE - Không thể xin nghỉ. Nhân viên 8 không có lịch làm việc vào 2025-11-27 ca WKS_MORNING_02.
```

---

### Scenario 7: Insufficient Balance

**Mục tiêu:** Test validation số dư phép không đủ

**Setup:**

- employee_id = 5
- Balance: total_allowed = 14.0, used = 0.5, remaining = 13.5

**Steps:**

```bash
# 1. Login as employee 5
POST /api/v1/auth/login
{
  "username": "hoangthuhuong",
  "password": "password123"
}

# 2. Xin nghỉ 15 ngày (nhiều hơn số dư)
POST /api/v1/time-off-requests
Authorization: Bearer {employee_token}
{
  "employeeId": 5,
  "timeOffTypeId": "ANNUAL_LEAVE",
  "startDate": "2025-12-01",
  "endDate": "2025-12-15",
  "workShiftId": null,
  "reason": "Nghỉ dài hạn."
}

# Expected: 400 BAD_REQUEST
# Error: INSUFFICIENT_LEAVE_BALANCE - Bạn không đủ ngày phép. Còn lại: 13.5 ngày, Yêu cầu: 15.0 ngày

# 3. Xin nghỉ 10 ngày (trong phạm vi số dư)
POST /api/v1/time-off-requests
{
  "employeeId": 5,
  "timeOffTypeId": "ANNUAL_LEAVE",
  "startDate": "2025-12-01",
  "endDate": "2025-12-10",
  "workShiftId": null,
  "reason": "Nghỉ 10 ngày."
}

# Expected: 201 CREATED (nếu có đủ lịch làm)
```

---

##  ERROR CODE SUMMARY

| Error Code                    | HTTP Status | Module   | Description                                              |
| ----------------------------- | ----------- | -------- | -------------------------------------------------------- |
| DUPLICATE_TYPE_CODE           | 409         | P6.1     | Mã loại nghỉ phép đã tồn tại                             |
| TIMEOFF_TYPE_NOT_FOUND        | 404         | P6.1     | Không tìm thấy loại nghỉ phép                            |
| TIMEOFF_TYPE_IN_USE           | 409         | P6.1     | Loại nghỉ phép đang được dùng bởi request PENDING        |
| MISSING_DEFAULT_DAYS          | 400         | P6.1     | requiresBalance = true nhưng thiếu defaultDaysPerYear    |
| INVALID_DEFAULT_DAYS          | 400         | P6.1     | requiresBalance = false nhưng vẫn set defaultDaysPerYear |
| EMPLOYEE_NOT_FOUND            | 404         | P5.2     | Không tìm thấy nhân viên                                 |
| INVALID_BALANCE               | 400         | P5.2     | Số dư phép âm sau điều chỉnh                             |
| INVALID_YEAR                  | 400         | P5.2     | Năm reset không hợp lệ                                   |
| INVALID_DATE_RANGE            | 400         | P5.1     | Ngày bắt đầu > kết thúc hoặc nghỉ nửa ngày sai           |
| INSUFFICIENT_LEAVE_BALANCE    | 400         | P5.1     | Không đủ ngày phép                                       |
| **SHIFT_NOT_FOUND_FOR_LEAVE** | **409**     | **P5.1** | **Nhân viên không có lịch làm vào ngày/ca này**          |
| DUPLICATE_TIMEOFF_REQUEST     | 409         | P5.1     | Request trùng với yêu cầu khác                           |
| TIMEOFF_REQUEST_NOT_FOUND     | 404         | P5.1     | Không tìm thấy yêu cầu nghỉ phép                         |
| INVALID_STATE_TRANSITION      | 409         | P5.1     | Chỉ cập nhật được request PENDING                        |
| FORBIDDEN                     | 403         | All      | Không có quyền thực hiện                                 |

---

##  QUICK REFERENCE

### Test Accounts

| Username      | Password    | Role              | employee_id | employment_type |
| ------------- | ----------- | ----------------- | ----------- | --------------- |
| admin         | admin123    | ROLE_ADMIN        | 1           | FULL_TIME       |
| manager       | manager123  | ROLE_MANAGER      | 2           | FULL_TIME       |
| hoangthuhuong | password123 | ROLE_DOCTOR       | 5           | FULL_TIME       |
| leminhquan    | password123 | ROLE_NURSE        | 6           | PART_TIME_FIXED |
| vothimai      | password123 | ROLE_RECEPTIONIST | 8           | PART_TIME_FLEX  |

### Key Validations (P5.1 - V14 Hybrid)

 **Trước khi tạo request:**

1. Employee exists & active
2. TimeOffType exists & is_active
3. start_date <= end_date
4. Check balance (chỉ ANNUAL_LEAVE)
5. Nếu nửa ngày: start_date = end_date
6. **[V14 NEW]** CheckEmployeeHasShift (query từ fixed + part-time)
7. No duplicate request

 **Khi APPROVED:**

1. UPDATE employee_shifts → ON_LEAVE
2. UPDATE employee_leave_balances → days_taken + X
3. INSERT leave_balance_history

---

##  TROUBLESHOOTING

### Issue 1: "SHIFT_NOT_FOUND_FOR_LEAVE" khi tạo request

**Nguyên nhân:**

- Nhân viên không có lịch làm việc vào ngày/ca đó
- V14 Hybrid check từ 2 nguồn: fixed_shift_registrations VÀ part_time_registrations

**Giải pháp:**

1. Kiểm tra employee_id có fixed_shift_registration nào active không:

   ```sql
   SELECT * FROM fixed_shift_registrations
   WHERE employee_id = 5 AND is_active = true;
   ```

2. Kiểm tra registration_days có chứa day_of_week không:

   ```sql
   SELECT rd.* FROM registration_days rd
   JOIN fixed_shift_registrations fsr ON rd.registration_id = fsr.registration_id
   WHERE fsr.employee_id = 5 AND rd.day_of_week = 'WEDNESDAY';
   ```

3. Kiểm tra date có nằm trong [effective_from, effective_to] không

4. Nếu là PART_TIME_FLEX, kiểm tra part_time_registrations:
   ```sql
   SELECT ptr.* FROM part_time_registrations ptr
   JOIN part_time_slots pts ON ptr.part_time_slot_id = pts.slot_id
   WHERE ptr.employee_id = 8 AND pts.day_of_week = 'TUESDAY' AND ptr.is_active = true;
   ```

---

### Issue 2: "INSUFFICIENT_LEAVE_BALANCE" nhưng nhân viên chưa nghỉ

**Nguyên nhân:**

- Chưa có balance record cho năm hiện tại
- Admin chưa chạy annual reset

**Giải pháp:**

```bash
# 1. Xem balance hiện tại
GET /api/v1/admin/employees/5/leave-balances?cycle_year=2025

# 2. Nếu không có data → Chạy annual reset
POST /api/v1/admin/leave-balances/annual-reset
{
  "cycle_year": 2025,
  "apply_to_type_id": "ANNUAL_LEAVE",
  "default_allowance": 12.0
}

# 3. Hoặc điều chỉnh thủ công
POST /api/v1/admin/leave-balances/adjust
{
  "employee_id": 5,
  "time_off_type_id": "ANNUAL_LEAVE",
  "cycle_year": 2025,
  "change_amount": 12.0,
  "notes": "Cấp phép năm 2025"
}
```

---

### Issue 3: Permission Denied (403 FORBIDDEN)

**Kiểm tra:**

1. User đã login chưa?
2. Role có đúng permissions không?

```sql
-- Kiểm tra permissions của user
SELECT p.permission_name
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE rp.role_id = 'ROLE_DOCTOR';
```

3. Nếu thiếu permission → Cập nhật seed data và restart DB

---

##  CHECKLIST BEFORE TESTING

- [ ] **Database đã restart để load seed data mới:**
  - `time_off_types`: type_id = type_code (ANNUAL_LEAVE, SICK_LEAVE, ...)
  - `employee_leave_balances`: Đã có balance cho employees 1, 2, 5, 6, 8 năm 2025
  - Chạy script: `d:/Code/PDCMS_BE/src/main/resources/db/migration/seed_leave_balances_2025.sql`
- [ ] Tất cả permissions đã được grant (xem RBAC Matrix)
- [ ] employee_id 5, 6, 8 có balance cho năm 2025
- [ ] employee_id 6 có fixed_shift_registration
- [ ] employee_id 8 có part_time_registration
- [ ] Test với 3 accounts: admin, manager, employee
- [ ] Test cả ANNUAL_LEAVE (cần balance) và SICK_LEAVE (không cần)
- [ ] Test nghỉ nửa ca (workShiftId != null) và cả ngày (null)
- [ ] Test validation SHIFT_NOT_FOUND_FOR_LEAVE
- [ ] **Test API mới GET /api/v1/admin/leave-balances (lấy tất cả employees)**

---

**END OF GUIDE**
