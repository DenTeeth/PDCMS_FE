# ISSUE: Work Shifts Permission for Overtime Requests

## Ngày tạo: 2025-12-28
## Ngày hoàn thành: 2025-12-28
## Priority: High
## Status: ✅ **RESOLVED** - BE đã sửa xong

---

## 📋 TÓM TẮT

Employee roles (ROLE_DENTIST, ROLE_NURSE, etc.) không thể xem danh sách work shifts để chọn ca làm khi tạo overtime request, dẫn đến lỗi 403 và không thể hoàn thành chức năng.

---

## 🔍 VẤN ĐỀ CHI TIẾT

### 1. Mô tả vấn đề

- **Endpoint bị ảnh hưởng**: `GET /api/v1/work-shifts`
- **Lỗi**: `403 Forbidden`
- **User bị ảnh hưởng**: Tất cả employee roles (ROLE_DENTIST, ROLE_NURSE, ROLE_ACCOUNTANT, ROLE_INVENTORY_MANAGER, ROLE_DENTIST_INTERN)
- **Trang bị ảnh hưởng**: 
  - `/employee/overtime-requests` - Tạo yêu cầu tăng ca
  - `/employee/time-off-requests` - Tạo yêu cầu nghỉ phép

### 2. Nguyên nhân

#### BE Permission Check (WorkShiftController.java line 118):
```java
@GetMapping
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")
public ResponseEntity<List<WorkShiftResponse>> getAllWorkShifts(...)
```

**BE yêu cầu một trong hai permissions:**
- `VIEW_SCHEDULE_ALL` - Xem tất cả lịch làm việc nhân viên
- `MANAGE_WORK_SHIFTS` - Quản lý mẫu ca làm việc

#### Seed Data - Permissions được gán:

**VIEW_SCHEDULE_ALL:**
- ✅ `ROLE_RECEPTIONIST` (line 509) - Cần để điều phối lịch hẹn
- ✅ `ROLE_MANAGER` (line 553) - Quản lý lịch làm việc
- ❌ **KHÔNG CÓ** cho các role khác (ROLE_DENTIST, ROLE_NURSE, etc.)

**VIEW_SCHEDULE_OWN:**
- ✅ Tất cả employee roles đều có (ROLE_DENTIST, ROLE_NURSE, ROLE_ACCOUNTANT, etc.)

**MANAGE_WORK_SHIFTS:**
- ✅ `ROLE_MANAGER` (line 556)
- ❌ **KHÔNG CÓ** cho các role khác

### 3. Vấn đề logic

Employee cần **xem danh sách work shifts** (mẫu ca làm việc) để:
1. Chọn ca làm khi tạo overtime request
2. Chọn ca làm khi tạo time-off request
3. Đăng ký ca làm việc part-time

Nhưng BE chỉ cho phép:
- `VIEW_SCHEDULE_ALL` - Xem lịch làm việc của **nhân viên** (không phải work shifts)
- `MANAGE_WORK_SHIFTS` - Quản lý mẫu ca làm việc (CRUD operations)

**Work shifts** (mẫu ca làm việc) là thông tin công khai, không nhạy cảm, khác với **employee shifts** (lịch làm việc của nhân viên).

---

## 💡 GIẢI PHÁP ĐỀ XUẤT

### Giải pháp 1: Thêm `VIEW_SCHEDULE_OWN` vào permission check (KHUYẾN NGHỊ)

**Lý do:**
1. Work shifts là thông tin công khai (danh sách ca làm việc mẫu), không phải dữ liệu nhạy cảm
2. Employee cần xem work shifts để thực hiện các chức năng cơ bản (tạo overtime/time-off requests)
3. `VIEW_SCHEDULE_OWN` đã được gán cho tất cả employee roles, phù hợp với use case này
4. Không ảnh hưởng đến bảo mật vì work shifts không chứa thông tin nhạy cảm

**Thay đổi BE:**

**File 1: `working_schedule/controller/WorkShiftController.java`**

**Line 118 - getAllWorkShifts:**
```java
// TRƯỚC:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")

// SAU:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS', 'VIEW_SCHEDULE_OWN')")
```

**Line 141 - getWorkShiftById:**
```java
// TRƯỚC:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")

// SAU:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS', 'VIEW_SCHEDULE_OWN')")
```

**File 2: `working_schedule/service/WorkShiftService.java`**

**Line 273 - getAllWorkShifts method:**
```java
// TRƯỚC:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")

// SAU:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS', 'VIEW_SCHEDULE_OWN')")
```

---

### Giải pháp 2: Tạo permission mới `VIEW_WORK_SHIFTS` (KHÔNG KHUYẾN NGHỊ)

**Lý do không khuyến nghị:**
- Tạo thêm permission mới không cần thiết
- `VIEW_SCHEDULE_OWN` đã đủ để cover use case này
- Tăng complexity của hệ thống permission

**Nếu vẫn muốn tạo:**
1. Thêm permission `VIEW_WORK_SHIFTS` vào seed data
2. Gán cho tất cả employee roles
3. Cập nhật BE permission check

---

## ⚠️ PHÂN TÍCH ẢNH HƯỞNG

### Nếu KHÔNG sửa:

**Ảnh hưởng:**
- ❌ Employee không thể tạo overtime request (không chọn được ca làm)
- ❌ Employee không thể tạo time-off request (không chọn được ca làm)
- ❌ User experience kém (lỗi 403, không có thông báo rõ ràng)
- ❌ Chức năng cơ bản của hệ thống bị ảnh hưởng

**Workaround hiện tại:**
- FE đã xử lý lỗi 403 và hiển thị thông báo rõ ràng
- Nhưng user vẫn không thể hoàn thành chức năng

---

### Nếu SỬA (Giải pháp 1 - Thêm VIEW_SCHEDULE_OWN):

**Lợi ích:**
- ✅ Employee có thể xem danh sách work shifts
- ✅ Employee có thể tạo overtime/time-off requests bình thường
- ✅ Permission logic hợp lý (work shifts là thông tin công khai)
- ✅ Không cần thay đổi seed data

**Rủi ro:**
- ⚠️ **MINIMAL** - Work shifts là thông tin công khai, không nhạy cảm
- ⚠️ Employee chỉ có thể **XEM** work shifts, không thể **SỬA/XÓA** (vẫn cần MANAGE_WORK_SHIFTS)
- ⚠️ Không ảnh hưởng đến bảo mật vì:
  - Work shifts chỉ chứa thông tin: shift name, start time, end time, category (NORMAL/NIGHT)
  - Không chứa thông tin nhạy cảm về nhân viên
  - Không cho phép xem lịch làm việc của nhân viên khác (vẫn cần VIEW_SCHEDULE_ALL)

**So sánh với VIEW_SCHEDULE_ALL:**

| Aspect | VIEW_SCHEDULE_OWN | VIEW_SCHEDULE_ALL |
|--------|-------------------|-------------------|
| **Work Shifts** (mẫu ca làm) | ✅ Xem được (nếu thêm vào permission check) | ✅ Xem được |
| **Employee Shifts** (lịch nhân viên) | ❌ Chỉ xem của bản thân | ✅ Xem tất cả nhân viên |
| **Bảo mật** | ✅ An toàn | ⚠️ Có thể xem lịch của người khác |
| **Use case** | ✅ Đủ cho employee self-service | ✅ Cần cho manager/admin |

**Kết luận:**
- ✅ **AN TOÀN** để cấp `VIEW_SCHEDULE_OWN` cho tất cả employee roles để xem work shifts
- ✅ Không ảnh hưởng đến bảo mật vì work shifts không chứa thông tin nhạy cảm
- ✅ Phù hợp với use case: employee cần xem work shifts để tạo overtime/time-off requests

---

### Nếu cấp VIEW_SCHEDULE_ALL cho tất cả employee:

**Rủi ro:**
- ⚠️ **CAO** - Employee có thể xem lịch làm việc của **TẤT CẢ** nhân viên khác
- ⚠️ Vi phạm nguyên tắc "least privilege" - employee không cần xem lịch của người khác
- ⚠️ Có thể ảnh hưởng đến privacy của nhân viên

**Kết luận:**
- ❌ **KHÔNG NÊN** cấp `VIEW_SCHEDULE_ALL` cho tất cả employee
- ✅ Chỉ nên cấp cho ROLE_RECEPTIONIST (cần để điều phối lịch hẹn) và ROLE_MANAGER (quản lý)

---

## 📝 KHUYẾN NGHỊ

### Khuyến nghị chính:
✅ **Sửa BE** để thêm `VIEW_SCHEDULE_OWN` vào permission check cho endpoint `/work-shifts`

### Lý do:
1. Work shifts là thông tin công khai, không nhạy cảm
2. Employee cần xem work shifts để thực hiện các chức năng cơ bản
3. `VIEW_SCHEDULE_OWN` đã được gán cho tất cả employee roles
4. Không ảnh hưởng đến bảo mật
5. Phù hợp với nguyên tắc "least privilege"

### Không nên:
❌ Cấp `VIEW_SCHEDULE_ALL` cho tất cả employee (vi phạm privacy)
❌ Tạo permission mới `VIEW_WORK_SHIFTS` (không cần thiết)

---

## 🔧 THAY ĐỔI CẦN THỰC HIỆN

### Backend:

1. **File: `working_schedule/controller/WorkShiftController.java`**
   - Line 118: Thêm `VIEW_SCHEDULE_OWN` vào `@PreAuthorize`
   - Line 141: Thêm `VIEW_SCHEDULE_OWN` vào `@PreAuthorize`

2. **File: `working_schedule/service/WorkShiftService.java`**
   - Line 273: Thêm `VIEW_SCHEDULE_OWN` vào `@PreAuthorize`

### Frontend:

✅ **ĐÃ HOÀN THÀNH** - FE đã xử lý lỗi 403 và hiển thị thông báo rõ ràng

---

## 📊 TESTING

### Test Cases:

1. **Test với ROLE_DENTIST:**
   - ✅ Có thể xem danh sách work shifts
   - ✅ Có thể tạo overtime request với work shift
   - ✅ Có thể tạo time-off request với work shift
   - ❌ Không thể xem lịch làm việc của nhân viên khác (vẫn chỉ có VIEW_SCHEDULE_OWN)

2. **Test với ROLE_MANAGER:**
   - ✅ Có thể xem danh sách work shifts (đã có VIEW_SCHEDULE_ALL)
   - ✅ Có thể xem lịch làm việc của tất cả nhân viên
   - ✅ Có thể quản lý work shifts (có MANAGE_WORK_SHIFTS)

3. **Test với ROLE_RECEPTIONIST:**
   - ✅ Có thể xem danh sách work shifts (đã có VIEW_SCHEDULE_ALL)
   - ✅ Có thể xem lịch làm việc của tất cả nhân viên

---

## 📚 TÀI LIỆU THAM KHẢO

- **WorkShiftController.java**: `docs/files/working_schedule/controller/WorkShiftController.java`
- **WorkShiftService.java**: `docs/files/working_schedule/service/WorkShiftService.java`
- **Seed Data**: `docs/files/dental-clinic-seed-data.sql` (line 267-275, 387-396, 509-510, 553-559)
- **FE Issue Report**: `docs/WORK_SHIFTS_PERMISSION_ISSUE.md`

---

## ✅ CHECKLIST

- [x] BE: Cập nhật WorkShiftController.java (line 118, 141) - ✅ **HOÀN THÀNH**
- [x] BE: Cập nhật WorkShiftService.java (line 273) - ✅ **HOÀN THÀNH**
- [ ] BE: Test với ROLE_DENTIST - ⏳ **PENDING FE TEST**
- [ ] BE: Test với ROLE_NURSE - ⏳ **PENDING FE TEST**
- [ ] BE: Test với ROLE_MANAGER (verify không bị ảnh hưởng) - ⏳ **PENDING FE TEST**
- [ ] BE: Test với ROLE_RECEPTIONIST (verify không bị ảnh hưởng) - ⏳ **PENDING FE TEST**
- [x] FE: Verify error handling vẫn hoạt động - ✅ **ĐÃ HOÀN THÀNH**
- [ ] FE: Test tạo overtime request với work shift - ⏳ **PENDING TEST**
- [ ] FE: Test tạo time-off request với work shift - ⏳ **PENDING TEST**

---

## ✅ BE CHANGES COMPLETED (2025-12-28)

### Files Updated:

1. **WorkShiftController.java**
   - ✅ Line 118: `getAllWorkShifts` - Added `VIEW_SCHEDULE_OWN`
   - ✅ Line 141: `getWorkShiftById` - Added `VIEW_SCHEDULE_OWN`

2. **WorkShiftService.java**
   - ✅ Line 273: `getAllWorkShifts` - Added `VIEW_SCHEDULE_OWN`

### Current Permission Configuration:

```java
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'VIEW_SCHEDULE_OWN', 'MANAGE_WORK_SHIFTS')")
```

### Verified Employee Permissions:

All employee roles have `VIEW_SCHEDULE_OWN`:
- ✅ ROLE_DENTIST
- ✅ ROLE_NURSE
- ✅ ROLE_RECEPTIONIST
- ✅ ROLE_INVENTORY_MANAGER
- ✅ ROLE_DENTIST_INTERN
- ✅ ROLE_ACCOUNTANT

### Ready for FE Testing:

The backend is now ready for FE to test. See `docs/FE_TEST_CHECKLIST_WORK_SHIFTS.md` for detailed test scenarios.

---

## 📞 LIÊN HỆ

Nếu có thắc mắc, vui lòng liên hệ FE team hoặc tạo ticket trong Jira.

