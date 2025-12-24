# HƯỚNG DẪN SỬA BE: Work Shifts Permission

## ✅ STATUS: **HOÀN THÀNH** (2025-12-28)

## Vấn đề
Employee không thể xem work shifts để tạo overtime/time-off requests vì thiếu permission.

## Giải pháp
Thêm `VIEW_SCHEDULE_OWN` vào permission check cho endpoint `/work-shifts`.

## ✅ BE đã sửa xong
Tất cả các thay đổi đã được implement. Xem chi tiết bên dưới.

---

## 📝 THAY ĐỔI CẦN THỰC HIỆN

### File 1: `working_schedule/controller/WorkShiftController.java`

#### Thay đổi 1: Line 118 - getAllWorkShifts method

**TRƯỚC:**
```java
@GetMapping
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")
@Operation(summary = "Get all work shifts", description = "Retrieve all work shifts with optional filtering, searching, and sorting.")
public ResponseEntity<List<WorkShiftResponse>> getAllWorkShifts(...)
```

**SAU:**
```java
@GetMapping
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS', 'VIEW_SCHEDULE_OWN')")
@Operation(summary = "Get all work shifts", description = "Retrieve all work shifts with optional filtering, searching, and sorting.")
public ResponseEntity<List<WorkShiftResponse>> getAllWorkShifts(...)
```

#### Thay đổi 2: Line 141 - getWorkShiftById method

**TRƯỚC:**
```java
@GetMapping("/{workShiftId}")
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")
@Operation(summary = "Get work shift by ID", description = "Retrieve a specific work shift by its ID.")
public ResponseEntity<WorkShiftResponse> getWorkShiftById(@PathVariable String workShiftId)
```

**SAU:**
```java
@GetMapping("/{workShiftId}")
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS', 'VIEW_SCHEDULE_OWN')")
@Operation(summary = "Get work shift by ID", description = "Retrieve a specific work shift by its ID.")
public ResponseEntity<WorkShiftResponse> getWorkShiftById(@PathVariable String workShiftId)
```

---

### File 2: `working_schedule/service/WorkShiftService.java`

#### Thay đổi: Line 273 - getAllWorkShifts method

**TRƯỚC:**
```java
@Transactional(readOnly = true)
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS')")
public List<WorkShiftResponse> getAllWorkShifts(
        Boolean isActive, 
        WorkShiftCategory category,
        String search,
        String sortBy,
        String sortDirection)
```

**SAU:**
```java
@Transactional(readOnly = true)
@PreAuthorize("hasAnyAuthority('VIEW_SCHEDULE_ALL', 'MANAGE_WORK_SHIFTS', 'VIEW_SCHEDULE_OWN')")
public List<WorkShiftResponse> getAllWorkShifts(
        Boolean isActive, 
        WorkShiftCategory category,
        String search,
        String sortBy,
        String sortDirection)
```

---

## ✅ CHECKLIST

- [x] Sửa `WorkShiftController.java` line 118 - ✅ **HOÀN THÀNH**
- [x] Sửa `WorkShiftController.java` line 141 - ✅ **HOÀN THÀNH**
- [x] Sửa `WorkShiftService.java` line 273 - ✅ **HOÀN THÀNH**
- [ ] Test với ROLE_DENTIST - verify có thể xem work shifts - ⏳ **PENDING FE TEST**
- [ ] Test với ROLE_NURSE - verify có thể xem work shifts - ⏳ **PENDING FE TEST**
- [ ] Test với ROLE_MANAGER - verify vẫn hoạt động bình thường - ⏳ **PENDING FE TEST**
- [ ] Test với ROLE_RECEPTIONIST - verify vẫn hoạt động bình thường - ⏳ **PENDING FE TEST**
- [ ] Test tạo overtime request với work shift - ⏳ **PENDING FE TEST**
- [ ] Test tạo time-off request với work shift - ⏳ **PENDING FE TEST**

---

## ✅ BE CHANGES COMPLETED

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

---

## 🔍 TESTING

### Test Case 1: ROLE_DENTIST
1. Login với tài khoản ROLE_DENTIST
2. Vào trang `/employee/overtime-requests`
3. Click "Tạo yêu cầu"
4. **Expected**: Dropdown "Ca làm việc" hiển thị danh sách work shifts
5. Chọn work shift và tạo overtime request
6. **Expected**: Tạo thành công

### Test Case 2: ROLE_MANAGER
1. Login với tài khoản ROLE_MANAGER
2. Vào trang `/employee/overtime-requests`
3. **Expected**: Vẫn hoạt động bình thường (đã có VIEW_SCHEDULE_ALL)

### Test Case 3: Verify Security
1. Login với ROLE_DENTIST
2. Gọi API `GET /api/v1/work-shifts`
3. **Expected**: Trả về danh sách work shifts (200 OK)
4. Gọi API `GET /api/v1/shifts?employee_id=2` (nhân viên khác)
5. **Expected**: 403 Forbidden (vẫn chỉ xem được lịch của bản thân)

---

## 📊 IMPACT ANALYSIS

### ✅ Lợi ích:
- Employee có thể xem work shifts để tạo overtime/time-off requests
- Không cần thay đổi seed data
- Không ảnh hưởng đến bảo mật (work shifts là thông tin công khai)

### ⚠️ Rủi ro:
- **MINIMAL** - Work shifts chỉ chứa thông tin công khai (shift name, time, category)
- Employee chỉ có thể **XEM**, không thể **SỬA/XÓA** (vẫn cần MANAGE_WORK_SHIFTS)
- Không cho phép xem lịch làm việc của nhân viên khác (vẫn cần VIEW_SCHEDULE_ALL)

---

## 📞 LIÊN HỆ

Nếu có thắc mắc, vui lòng liên hệ FE team hoặc xem file `docs/ISSUE_WORK_SHIFTS_PERMISSION_FOR_OVERTIME.md` để biết thêm chi tiết.

