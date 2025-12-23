# YÊU CẦU SỬA BACKEND - PERMISSION SYNC

## Ngày: 2025-12-23
## Mức độ: HIGH PRIORITY
## Status: ✅ FE FIXED - Backward Compatible Solution

---

## 1. GIẢI PHÁP ĐÃ ÁP DỤNG (FE)

### Backward Compatible Permission Checks ✅

**Vấn đề**: Không thể thay đổi permission names trong code vì sẽ ảnh hưởng đến tất cả roles đã được cấu hình trong database.

**Giải pháp**: Hỗ trợ CẢ HAI tên permission (cũ và mới) để tương thích ngược.

**Ví dụ - Work-Shifts Page**:
```typescript
// Hỗ trợ cả tên cũ và tên mới
const canCreate = isAdmin || 
  user?.permissions?.includes('CREATE_WORK_SHIFT') ||      // Tên cũ (nếu role có)
  user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false; // Tên mới (BE standard)

const canUpdate = isAdmin || 
  user?.permissions?.includes('UPDATE_WORK_SHIFT') ||      // Tên cũ
  user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false; // Tên mới
```

**Lợi ích**:
- ✅ Roles cũ với permissions cũ vẫn hoạt động
- ✅ Roles mới có thể dùng permissions mới
- ✅ Admin luôn có full access
- ✅ Không cần migration database

---

## 2. HƯỚNG DẪN CHO ADMIN (Migration Path)

### Cách cập nhật roles sang permissions mới (Optional)

**Bước 1**: Kiểm tra permissions hiện tại của role
- Vào `/admin/roles`
- Xem permissions đã gán cho từng role

**Bước 2**: Thêm permissions mới vào role
- Click "Assign Permissions" cho role cần update
- Tìm và thêm permission mới (ví dụ: `MANAGE_WORK_SHIFTS`)
- Giữ nguyên permissions cũ (để tương thích)

**Bước 3**: Test kỹ
- Đăng nhập với user có role đó
- Kiểm tra tất cả chức năng vẫn hoạt động

**Bước 4**: Xóa permissions cũ (sau khi confirm OK)
- Quay lại "Assign Permissions"
- Xóa permissions cũ (ví dụ: `CREATE_WORK_SHIFT`, `UPDATE_WORK_SHIFT`)
- Chỉ giữ lại permission mới (`MANAGE_WORK_SHIFTS`)

---

## 3. VẤN ĐỀ CÒN LẠI (CẦN BE FIX)

FE đã cập nhật để sử dụng đúng permissions theo BE seed data. Tuy nhiên, vẫn còn một số permissions mà FE cần nhưng BE chưa có.

### 2.1 Schedule/Work Shifts

| FE cần | BE có | Status |
|--------|-------|--------|
| `VIEW_WORK_SHIFTS` | ❌ Không có | ❌ THIẾU |
| `VIEW_WORK_SLOT` | ❌ Không có | ❌ THIẾU |
| `VIEW_SCHEDULE_ALL` | ✅ Có | ✅ OK |
| `VIEW_SCHEDULE_OWN` | ✅ Có | ✅ OK |
| `MANAGE_WORK_SHIFTS` | ✅ Có | ✅ OK |
| `MANAGE_WORK_SLOTS` | ✅ Có | ✅ OK |

**Đề xuất BE:** Thêm `VIEW_WORK_SHIFTS` và `VIEW_WORK_SLOT` vào seed data, hoặc FE sẽ dùng `MANAGE_WORK_SHIFTS` thay thế.

### 2.2 Registration

| FE cần | BE có | Status |
|--------|-------|--------|
| `VIEW_REGISTRATION_ALL` | ❌ Không có | ❌ THIẾU |
| `VIEW_REGISTRATION_OWN` | ❌ Không có | ❌ THIẾU |
| `CREATE_REGISTRATION` | ❌ Không có | ❌ THIẾU |
| `MANAGE_PART_TIME_REGISTRATIONS` | ✅ Có | ✅ OK |
| `MANAGE_FIXED_REGISTRATIONS` | ✅ Có | ✅ OK |

**Đề xuất BE:** Thêm các permissions VIEW/CREATE cho registration, hoặc FE sẽ dùng `MANAGE_*` thay thế.

### 2.3 Fixed Registration

| FE cần | BE có | Status |
|--------|-------|--------|
| `VIEW_FIXED_REGISTRATIONS_ALL` | ❌ Không có | ❌ THIẾU |
| `VIEW_FIXED_REGISTRATIONS_OWN` | ❌ Không có | ❌ THIẾU |
| `MANAGE_FIXED_REGISTRATIONS` | ✅ Có | ✅ OK |

### 2.4 Employee Shifts

| FE cần | BE có | Status |
|--------|-------|--------|
| `VIEW_SHIFTS_ALL` | ❌ Không có | ❌ THIẾU |
| `VIEW_SHIFTS_OWN` | ❌ Không có | ❌ THIẾU |
| `CREATE_SHIFTS` | ❌ Không có | ❌ THIẾU |
| `UPDATE_SHIFTS` | ❌ Không có | ❌ THIẾU |
| `DELETE_SHIFTS` | ❌ Không có | ❌ THIẾU |

**Lưu ý:** BE dùng `VIEW_SCHEDULE_ALL/OWN` thay vì `VIEW_SHIFTS_*`. FE đã cập nhật để dùng naming của BE.

### 2.5 Renewal

| FE cần | BE có | Status |
|--------|-------|--------|
| `VIEW_RENEWAL_OWN` | ❌ Không có | ❌ THIẾU |
| `RESPOND_RENEWAL_OWN` | ❌ Không có | ❌ THIẾU |

### 2.6 Leave Type

| FE cần | BE có | Status |
|--------|-------|--------|
| `VIEW_LEAVE_TYPE` | ❌ Không có | ❌ THIẾU |
| `MANAGE_LEAVE_TYPE` | ❌ Không có | ❌ THIẾU |

### 2.7 Leave Balance

| FE cần | BE có | Status |
|--------|-------|--------|
| `VIEW_LEAVE_BALANCE` | ❌ Không có | ❌ THIẾU |
| `ADJUST_LEAVE_BALANCE` | ❌ Không có | ❌ THIẾU |

---

## 3. ĐỀ XUẤT SỬA BE

### Option A: Thêm permissions mới vào seed data (Recommended)

```sql
-- Schedule/Work Shifts
INSERT INTO permissions (permission_name, description) VALUES
('VIEW_WORK_SHIFTS', 'View work shifts'),
('VIEW_WORK_SLOT', 'View work slots');

-- Registration
INSERT INTO permissions (permission_name, description) VALUES
('VIEW_REGISTRATION_ALL', 'View all registrations'),
('VIEW_REGISTRATION_OWN', 'View own registrations'),
('CREATE_REGISTRATION', 'Create registration');

-- Fixed Registration
INSERT INTO permissions (permission_name, description) VALUES
('VIEW_FIXED_REGISTRATIONS_ALL', 'View all fixed registrations'),
('VIEW_FIXED_REGISTRATIONS_OWN', 'View own fixed registrations');

-- Renewal
INSERT INTO permissions (permission_name, description) VALUES
('VIEW_RENEWAL_OWN', 'View own renewals'),
('RESPOND_RENEWAL_OWN', 'Respond to own renewals');

-- Leave Type
INSERT INTO permissions (permission_name, description) VALUES
('VIEW_LEAVE_TYPE', 'View leave types'),
('MANAGE_LEAVE_TYPE', 'Manage leave types');

-- Leave Balance
INSERT INTO permissions (permission_name, description) VALUES
('VIEW_LEAVE_BALANCE', 'View leave balances'),
('ADJUST_LEAVE_BALANCE', 'Adjust leave balances');

-- Assign to ROLE_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'ROLE_ADMIN'
AND p.permission_name IN (
  'VIEW_WORK_SHIFTS', 'VIEW_WORK_SLOT',
  'VIEW_REGISTRATION_ALL', 'VIEW_REGISTRATION_OWN', 'CREATE_REGISTRATION',
  'VIEW_FIXED_REGISTRATIONS_ALL', 'VIEW_FIXED_REGISTRATIONS_OWN',
  'VIEW_RENEWAL_OWN', 'RESPOND_RENEWAL_OWN',
  'VIEW_LEAVE_TYPE', 'MANAGE_LEAVE_TYPE',
  'VIEW_LEAVE_BALANCE', 'ADJUST_LEAVE_BALANCE'
);
```

### Option B: FE tự map permissions (Đã làm)

FE đã cập nhật `ProtectedRoute.tsx` để:
1. Admin bypass - ROLE_ADMIN hoặc baseRole='admin' có full access
2. Map các permissions cũ sang permissions mới của BE

---

## 4. DANH SÁCH PERMISSIONS BE HIỆN TẠI (Từ Seed Data)

```
ACCOUNT: VIEW_ACCOUNT, MANAGE_ACCOUNT
EMPLOYEE: VIEW_EMPLOYEE, MANAGE_EMPLOYEE, DELETE_EMPLOYEE
PATIENT: VIEW_PATIENT, MANAGE_PATIENT, DELETE_PATIENT
APPOINTMENT: VIEW_APPOINTMENT_ALL, VIEW_APPOINTMENT_OWN, CREATE_APPOINTMENT, MANAGE_APPOINTMENT, UPDATE_APPOINTMENT_STATUS
CLINICAL: WRITE_CLINICAL_RECORD, VIEW_VITAL_SIGNS_REFERENCE
ATTACHMENT: VIEW_ATTACHMENT, MANAGE_ATTACHMENTS
PATIENT_IMAGE: PATIENT_IMAGE_READ, MANAGE_PATIENT_IMAGES, DELETE_PATIENT_IMAGES
NOTIFICATION: VIEW_NOTIFICATION, DELETE_NOTIFICATION, MANAGE_NOTIFICATION
HOLIDAY: VIEW_HOLIDAY, MANAGE_HOLIDAY
SERVICE: VIEW_SERVICE, MANAGE_SERVICE
ROOM: VIEW_ROOM, MANAGE_ROOM
WAREHOUSE: VIEW_WAREHOUSE, VIEW_ITEMS, VIEW_MEDICINES, VIEW_WAREHOUSE_COST, MANAGE_WAREHOUSE, MANAGE_SUPPLIERS, IMPORT_ITEMS, EXPORT_ITEMS, DISPOSE_ITEMS, APPROVE_TRANSACTION
SCHEDULE: VIEW_SCHEDULE_ALL, VIEW_SCHEDULE_OWN, MANAGE_WORK_SHIFTS, MANAGE_WORK_SLOTS, MANAGE_PART_TIME_REGISTRATIONS, MANAGE_FIXED_REGISTRATIONS
LEAVE: VIEW_LEAVE_ALL, VIEW_LEAVE_OWN, CREATE_TIME_OFF, APPROVE_TIME_OFF
OVERTIME: VIEW_OT_ALL, VIEW_OT_OWN, CREATE_OVERTIME, APPROVE_OVERTIME
TREATMENT_PLAN: VIEW_TREATMENT_PLAN_ALL, VIEW_TREATMENT_PLAN_OWN, MANAGE_TREATMENT_PLAN
TREATMENT: VIEW_TREATMENT, MANAGE_TREATMENT
ROLE: VIEW_ROLE, MANAGE_ROLE
PERMISSION: VIEW_PERMISSION, MANAGE_PERMISSION
SPECIALIZATION: VIEW_SPECIALIZATION, MANAGE_SPECIALIZATION
CUSTOMER_CONTACT: VIEW_CUSTOMER_CONTACT, MANAGE_CUSTOMER_CONTACT
```

---

## 5. ROLE_ADMIN PERMISSIONS (Từ Seed Data)

ROLE_ADMIN có tất cả permissions trên. Nếu FE check permission mà BE không có trong seed data, admin sẽ bị block.

**Giải pháp tạm thời (FE đã làm):**
- `ProtectedRoute.tsx` đã được cập nhật để admin bypass tất cả permission checks
- Check cả `baseRole === 'admin'` và `roles.includes('ROLE_ADMIN')`

---

## 6. ACTION ITEMS

### BE Team:
- [ ] Review danh sách permissions thiếu ở Section 2
- [ ] Quyết định: Thêm permissions mới hay FE tự map?
- [ ] Nếu thêm: Chạy SQL script ở Section 3
- [ ] Update API `/auth/me` để trả về đầy đủ permissions

### FE Team (Đã hoàn thành):
- [x] Cập nhật `ProtectedRoute.tsx` với admin bypass
- [x] Cập nhật `permission.ts` với permissions từ BE
- [x] Map các permissions cũ sang mới trong navigation config

---

## 7. TESTING

Sau khi BE fix, test các trang sau với ROLE_ADMIN:
- [ ] `/admin/work-shifts` - Phải truy cập được
- [ ] `/admin/roles` - Phải truy cập được
- [ ] `/admin/accounts/employees` - Phải truy cập được
- [ ] `/admin/registrations` - Phải truy cập được
- [ ] `/admin/time-off-types` - Phải truy cập được

---

## 8. CONTACT

Nếu có thắc mắc, liên hệ FE team để clarify requirements.
