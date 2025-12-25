# BÁO CÁO KIỂM TRA PERMISSIONS CHO CÁC TRANG EMPLOYEE

## Ngày kiểm tra: 2025-12-28

### 1. `/employee/overtime-requests` - Yêu cầu tăng ca

#### Permissions FE yêu cầu:
- **Create**: `CREATE_OVERTIME` (line 228)
- **Cancel own**: `CANCEL_OVERTIME_OWN` (line 229) ⚠️ **KHÔNG TỒN TẠI TRONG SEED DATA**

#### Permissions trong Seed Data:
- ✅ `CREATE_OVERTIME` - Có trong seed data (line 289)
- ❌ `CANCEL_OVERTIME_OWN` - **KHÔNG CÓ** trong seed data (đã bị loại bỏ trong optimization, line 706)

#### BE Logic (OvertimeRequestService.java line 441):
- Employee có thể cancel own request nếu:
  - Có `CREATE_OVERTIME` permission VÀ
  - Là owner của request

#### Seed Data - Permissions được gán:
- ✅ `ROLE_DENTIST`: `CREATE_OVERTIME` (line 395)
- ✅ `ROLE_NURSE`: `CREATE_OVERTIME` (line 437)
- ✅ `ROLE_RECEPTIONIST`: `CREATE_OVERTIME` (line 518)
- ✅ `ROLE_ACCOUNTANT`: `CREATE_OVERTIME` (line 619)
- ✅ `ROLE_INVENTORY_MANAGER`: `CREATE_OVERTIME` (line 652)
- ❌ `ROLE_DENTIST_INTERN`: **KHÔNG CÓ** `CREATE_OVERTIME` (chỉ có `CREATE_TIME_OFF`)
- ❌ `ROLE_MANAGER`: **KHÔNG CÓ** `CREATE_OVERTIME` (chỉ có `APPROVE_OVERTIME`)

#### Vấn đề:
1. ❌ FE đang check `CANCEL_OVERTIME_OWN` nhưng permission này không tồn tại
2. ✅ Nên sửa FE để check `CREATE_OVERTIME` thay vì `CANCEL_OVERTIME_OWN` (theo BE logic)

---

### 2. `/employee/time-off-requests` - Yêu cầu nghỉ phép

#### Permissions FE yêu cầu:
- **Create**: `CREATE_TIME_OFF` (line 414)

#### Permissions trong Seed Data:
- ✅ `CREATE_TIME_OFF` - Có trong seed data (line 287)

#### Seed Data - Permissions được gán:
- ✅ `ROLE_DENTIST`: `CREATE_TIME_OFF` (line 394)
- ✅ `ROLE_NURSE`: `CREATE_TIME_OFF` (line 436)
- ✅ `ROLE_DENTIST_INTERN`: `CREATE_TIME_OFF` (line 468)
- ✅ `ROLE_RECEPTIONIST`: `CREATE_TIME_OFF` (line 517)
- ✅ `ROLE_ACCOUNTANT`: `CREATE_TIME_OFF` (line 618)
- ✅ `ROLE_INVENTORY_MANAGER`: `CREATE_TIME_OFF` (line 651)
- ❌ `ROLE_MANAGER`: **KHÔNG CÓ** `CREATE_TIME_OFF` (chỉ có `APPROVE_TIME_OFF`)

#### Vấn đề:
- ✅ **KHÔNG CÓ VẤN ĐỀ** - Permission đã được gán đúng cho tất cả employee roles (trừ MANAGER)

---

### 3. `/employee/shift-calendar` - Lịch ca làm việc

#### Permissions FE yêu cầu:
- **View**: `VIEW_SCHEDULE_OWN` hoặc `VIEW_SCHEDULE_ALL` (line 650, requireAll=false)
- **Create**: `CREATE_SHIFTS` (old) hoặc `MANAGE_FIXED_REGISTRATIONS` (new) (line 95-97)
- **Update**: `UPDATE_SHIFTS` (old) hoặc `MANAGE_FIXED_REGISTRATIONS` (new) (line 99-101)
- **Delete**: `DELETE_SHIFTS` (old) hoặc `MANAGE_FIXED_REGISTRATIONS` (new) (line 103-105)
- **Summary**: `VIEW_SCHEDULE_ALL` (line 108)

#### Permissions trong Seed Data:
- ✅ `VIEW_SCHEDULE_OWN` - Có trong seed data (line 268)
- ✅ `VIEW_SCHEDULE_ALL` - Có trong seed data (line 267)
- ✅ `MANAGE_FIXED_REGISTRATIONS` - Có trong seed data (line 275)
- ❌ `CREATE_SHIFTS`, `UPDATE_SHIFTS`, `DELETE_SHIFTS` - **KHÔNG CÓ** trong seed data (đã bị loại bỏ)

#### Seed Data - Permissions được gán:

**VIEW_SCHEDULE_OWN:**
- ✅ `ROLE_DENTIST` (line 387)
- ✅ `ROLE_NURSE` (line 429)
- ✅ `ROLE_DENTIST_INTERN` (line 461)
- ✅ `ROLE_RECEPTIONIST` (line 510) - Có cả `VIEW_SCHEDULE_ALL` và `VIEW_SCHEDULE_OWN`
- ✅ `ROLE_ACCOUNTANT` (line 611)
- ✅ `ROLE_INVENTORY_MANAGER` (line 644)

**VIEW_SCHEDULE_ALL:**
- ✅ `ROLE_RECEPTIONIST` (line 509)
- ✅ `ROLE_MANAGER` (line 553)

**MANAGE_FIXED_REGISTRATIONS:**
- ✅ `ROLE_MANAGER` (line 559)

#### Vấn đề:
- ✅ **KHÔNG CÓ VẤN ĐỀ** - Permissions đã được gán đúng
- ✅ FE hỗ trợ backward compatibility với old permissions (`CREATE_SHIFTS`, `UPDATE_SHIFTS`, `DELETE_SHIFTS`) nhưng seed data không có các permissions này

---

## TỔNG KẾT VẤN ĐỀ

### ❌ VẤN ĐỀ CẦN SỬA:

1. **`/employee/overtime-requests` - `CANCEL_OVERTIME_OWN` permission:**
   - **Vấn đề**: FE đang check `CANCEL_OVERTIME_OWN` nhưng permission này không tồn tại trong seed data
   - **Giải pháp**: Sửa FE để check `CREATE_OVERTIME` thay vì `CANCEL_OVERTIME_OWN` (theo BE logic: employee có `CREATE_OVERTIME` có thể cancel own request)

### ✅ KHÔNG CÓ VẤN ĐỀ:

1. **`/employee/time-off-requests`**: Permission `CREATE_TIME_OFF` đã được gán đúng cho tất cả employee roles
2. **`/employee/shift-calendar`**: Permissions `VIEW_SCHEDULE_OWN`, `VIEW_SCHEDULE_ALL`, `MANAGE_FIXED_REGISTRATIONS` đã được gán đúng

---

## KHUYẾN NGHỊ

1. **Sửa FE `/employee/overtime-requests`:**
   - Thay đổi `canCancelOwn` từ `CANCEL_OVERTIME_OWN` sang `CREATE_OVERTIME`
   - Logic: Nếu user có `CREATE_OVERTIME` và là owner của request thì có thể cancel

2. **Kiểm tra lại logic cancel trong BE:**
   - BE đã đúng: Employee có `CREATE_OVERTIME` có thể cancel own request
   - FE cần align với BE logic

