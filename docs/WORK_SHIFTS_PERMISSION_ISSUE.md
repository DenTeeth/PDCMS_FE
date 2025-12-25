# VẤN ĐỀ PERMISSION CHO WORK SHIFTS API

## Ngày phát hiện: 2025-12-28

## Vấn đề

### Mô tả:
- User `bacsi2` (ROLE_DENTIST) đăng nhập vào trang `/employee/overtime-requests`
- Hệ thống báo lỗi **403 Forbidden** khi gọi API `/work-shifts`
- User vẫn có thể tạo overtime request (vì có `CREATE_OVERTIME` permission)
- Nhưng khi mở modal form, **không có danh sách ca làm việc** để chọn (vì API `/work-shifts` bị 403)

### Nguyên nhân:

#### BE Permission Check (WorkShiftController.java line 118):
```java
@GetMapping
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")
public ResponseEntity<List<WorkShiftResponse>> getAllWorkShifts(...)
```

**BE yêu cầu một trong hai permissions:**
- `VIEW_SCHEDULE_ALL` - Xem tất cả lịch làm việc
- `MANAGE_WORK_SHIFTS` - Quản lý mẫu ca làm việc

#### ROLE_DENTIST Permissions (seed data line 387):
- ✅ `VIEW_SCHEDULE_OWN` - Xem lịch làm việc của bản thân
- ✅ `CREATE_OVERTIME` - Tạo yêu cầu tăng ca
- ❌ **KHÔNG CÓ** `VIEW_SCHEDULE_ALL`
- ❌ **KHÔNG CÓ** `MANAGE_WORK_SHIFTS`

### Vấn đề logic:
Employee cần **xem danh sách work shifts** để chọn ca làm khi tạo overtime request, nhưng:
- BE chỉ cho phép `VIEW_SCHEDULE_ALL` hoặc `MANAGE_WORK_SHIFTS` xem work shifts
- Employee chỉ có `VIEW_SCHEDULE_OWN` (xem lịch của bản thân, không phải danh sách work shifts)

---

## Giải pháp

### ✅ Giải pháp 1: Sửa BE (KHUYẾN NGHỊ)

**Thay đổi BE:** Thêm `VIEW_SCHEDULE_OWN` vào permission check cho endpoint GET `/work-shifts`

**File:** `docs/files/working_schedule/controller/WorkShiftController.java`

**Thay đổi:**
```java
// TRƯỚC:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")

// SAU:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS', 'VIEW_SCHEDULE_OWN')")
```

**Lý do:**
1. Work shifts là thông tin công khai (danh sách ca làm việc mẫu), không phải dữ liệu nhạy cảm
2. Employee cần xem work shifts để:
   - Tạo overtime request (chọn ca làm)
   - Tạo time-off request (chọn ca làm cần nghỉ)
   - Đăng ký ca làm việc part-time
3. `VIEW_SCHEDULE_OWN` đã được gán cho tất cả employee roles, phù hợp với use case này

**Cũng cần sửa trong WorkShiftService.java (line 273):**
```java
// TRƯỚC:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")

// SAU:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS', 'VIEW_SCHEDULE_OWN')")
```

**Và WorkShiftController.java line 141 (getById):**
```java
// TRƯỚC:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")

// SAU:
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS', 'VIEW_SCHEDULE_OWN')")
```

---

### ✅ Giải pháp 2: FE xử lý lỗi (ĐÃ THỰC HIỆN)

**File:** `src/app/employee/overtime-requests/page.tsx`

**Thay đổi:**
- Xử lý lỗi 403 khi load work shifts
- Hiển thị thông báo rõ ràng cho user
- Set empty array để tránh lỗi UI

**Kết quả:**
- User sẽ thấy thông báo lỗi rõ ràng
- Modal form vẫn mở được nhưng không có danh sách ca làm việc
- User biết cần liên hệ admin để được cấp quyền

---

## Tác động

### Nếu KHÔNG sửa BE:
- ❌ Employee không thể tạo overtime request (không chọn được ca làm)
- ❌ Employee không thể tạo time-off request (không chọn được ca làm)
- ❌ User experience kém (lỗi 403, không có thông báo rõ ràng)

### Nếu SỬA BE:
- ✅ Employee có thể xem danh sách work shifts
- ✅ Employee có thể tạo overtime/time-off requests bình thường
- ✅ Permission logic hợp lý (work shifts là thông tin công khai)

---

## Khuyến nghị

**Nên sửa BE** để thêm `VIEW_SCHEDULE_OWN` vào permission check cho endpoint `/work-shifts` vì:
1. Work shifts là thông tin công khai, không nhạy cảm
2. Employee cần xem work shifts để thực hiện các chức năng cơ bản (tạo overtime/time-off requests)
3. `VIEW_SCHEDULE_OWN` đã được gán cho tất cả employee roles, phù hợp với use case

**FE đã được cập nhật** để xử lý lỗi tốt hơn, nhưng đây chỉ là giải pháp tạm thời.

