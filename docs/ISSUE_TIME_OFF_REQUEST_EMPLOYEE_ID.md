# ISSUE: Time-Off Request - Employee ID Validation Problem

## Ngày tạo: 2025-12-28
## Ngày hoàn thành: 2025-12-28
## Priority: High
## Status: ✅ **RESOLVED - BE FIX COMPLETED**

---

## 📋 TÓM TẮT

FE không thể tạo time-off request vì `employeeId` trong request body không hợp lệ. Vấn đề xảy ra khi `user.employeeId` từ JWT token là string (username) thay vì số (employee ID), dẫn đến validation error khi parse sang `Integer`.

---

## 🔍 VẤN ĐỀ CHI TIẾT

### 1. Mô tả vấn đề

**Frontend:**
- User đăng nhập với username "bacsi2"
- JWT token trả về `user.employeeId = "bacsi2"` (string - username)
- FE cần gửi `employeeId` là `Integer` cho BE
- Khi parse `Number("bacsi2")` → `NaN` → Validation error

**Backend:**
- `CreateTimeOffRequest` DTO yêu cầu `employeeId` là `@NotNull Integer`
- BE không tự động lấy `employeeId` từ JWT token (khác với overtime request)
- BE yêu cầu FE phải gửi `employeeId` trong request body

### 2. So sánh với Overtime Request

**Overtime Request (✅ Hoạt động tốt):**
```java
// CreateOvertimeRequestDTO.java
private Integer employeeId; // Optional - BE tự lấy từ JWT nếu null
```

**Time-Off Request (❌ Có vấn đề):**
```java
// CreateTimeOffRequest.java
@NotNull(message = "Employee ID is required")
private Integer employeeId; // Required - FE phải gửi
```

### 3. Error Flow

1. User đăng nhập → JWT token có `sub: "bacsi2"` (username)
2. FE nhận `user.employeeId = "bacsi2"` (string)
3. FE parse `Number("bacsi2")` → `NaN`
4. FE validate → Error: "Employee ID không hợp lệ"
5. Request không được gửi đến BE

---

## 💡 GIẢI PHÁP ĐỀ XUẤT

### Giải pháp 1: BE tự động lấy employeeId từ JWT (KHUYẾN NGHỊ)

**Lý do:**
1. Nhất quán với Overtime Request
2. Bảo mật hơn (không cho phép user giả mạo employeeId)
3. Đơn giản hóa FE logic

**Thay đổi BE:**

**File: `CreateTimeOffRequest.java`**
```java
// Thay đổi từ:
@NotNull(message = "Employee ID is required")
private Integer employeeId;

// Thành:
// Optional for employee self-requests (will be auto-filled from JWT)
// Required for admin creating request for another employee
private Integer employeeId;
```

**File: `TimeOffRequestService.java`**
```java
@PreAuthorize("hasAuthority('" + AuthoritiesConstants.CREATE_TIME_OFF + "')")
@Transactional
public TimeOffRequestResponse createRequest(CreateTimeOffRequest request) {
    log.debug("Request to create time-off request: {}", request);

    // 1. Auto-fill employeeId from JWT if not provided (for employee self-requests)
    Integer employeeId = request.getEmployeeId();
    if (employeeId == null) {
        // Get current user's employeeId from JWT token
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));

        employeeId = accountRepository.findOneByUsername(username)
                .map(account -> {
                    if (account.getEmployee() == null) {
                        throw new RuntimeException(
                                "Account " + username + " không có Employee liên kết.");
                    }
                    return account.getEmployee().getEmployeeId();
                })
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

        log.info("Auto-filled employeeId from JWT: {}", employeeId);
    }

    // 2. Validate employee exists
    employeeRepository.findById(employeeId)
            .orElseThrow(() -> new EmployeeNotFoundException(employeeId));

    // ... rest of the logic using employeeId instead of request.getEmployeeId()
}
```

**File: `TimeOffRequestController.java`**
```java
@PostMapping
@PreAuthorize("hasAuthority('CREATE_TIME_OFF')")
@Operation(summary = "Create time-off request", description = "Create a new time-off request. Employee ID is optional - will be auto-filled from JWT token for self-requests.")
public ResponseEntity<TimeOffRequestResponse> createRequest(
        @Valid @RequestBody CreateTimeOffRequest request) {
    log.info("REST request to create time-off request: {}", request);
    TimeOffRequestResponse response = requestService.createRequest(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

---

### Giải pháp 2: BE thêm employeeId vào JWT token claims (THAY THẾ)

**Lý do:**
- Nếu không muốn thay đổi logic hiện tại
- Cần thêm `employeeId` vào JWT token khi generate

**Thay đổi BE:**

**File: JWT Token Generator (nơi tạo token)**
```java
// Thêm employeeId vào JWT claims
String employeeId = account.getEmployee() != null 
    ? account.getEmployee().getEmployeeId().toString() 
    : null;

claims.put("employeeId", employeeId); // Thêm vào claims
```

**Lưu ý:** Giải pháp này vẫn yêu cầu FE phải gửi `employeeId`, nhưng FE có thể lấy từ token thay vì từ user object.

---

## ⚠️ PHÂN TÍCH ẢNH HƯỞNG

### Nếu KHÔNG sửa:

**Ảnh hưởng:**
- ❌ Employees không thể tạo time-off requests
- ❌ User experience kém (confusing error messages)
- ❌ Inconsistent với Overtime Request behavior

### Nếu SỬA (Giải pháp 1):

**Lợi ích:**
- ✅ Nhất quán với Overtime Request
- ✅ Bảo mật hơn (không cho phép giả mạo employeeId)
- ✅ Đơn giản hóa FE logic
- ✅ Better UX (employees không cần biết employeeId)

**Rủi ro:**
- ⚠️ **MINIMAL** - Chỉ thay đổi validation và auto-fill logic
- ⚠️ Cần test kỹ với admin tạo request cho employee khác (vẫn cần gửi employeeId)

**Breaking Changes:**
- ⚠️ **NONE** - FE vẫn có thể gửi `employeeId` (cho admin), nhưng không bắt buộc (cho employee)

---

## 📝 THAY ĐỔI CẦN THỰC HIỆN

### Backend:

1. **File: `CreateTimeOffRequest.java`**
   - Remove `@NotNull` annotation từ `employeeId`
   - Thêm comment: "Optional for employee self-requests, required for admin"

2. **File: `TimeOffRequestService.java`**
   - Thêm logic auto-fill `employeeId` từ JWT nếu `request.getEmployeeId() == null`
   - Sử dụng `employeeId` (đã auto-fill) thay vì `request.getEmployeeId()` trong logic

3. **File: `TimeOffRequestController.java`**
   - Update API documentation để reflect `employeeId` là optional

### Frontend:

**File: `src/app/employee/time-off-requests/page.tsx`**
- Đã sửa để thử lấy `employeeId` từ token
- Sau khi BE fix, có thể đơn giản hóa: không cần gửi `employeeId` cho employee self-requests

---

## ✅ CHECKLIST

### Backend:
- [ ] Remove `@NotNull` từ `employeeId` trong `CreateTimeOffRequest.java`
- [ ] Thêm logic auto-fill `employeeId` từ JWT trong `TimeOffRequestService.createRequest()`
- [ ] Update API documentation
- [ ] Test với employee tạo request (không gửi employeeId)
- [ ] Test với admin tạo request cho employee khác (gửi employeeId)
- [ ] Test với account không có Employee liên kết (should throw error)

### Frontend:
- [ ] Test với employee tạo request (sau khi BE fix)
- [ ] Verify không còn error "Employee ID không hợp lệ"
- [ ] Verify admin vẫn có thể tạo request cho employee khác

---

## 📊 CURRENT BE CODE

### CreateTimeOffRequest.java (Line 18-19):
```java
@NotNull(message = "Employee ID is required")
private Integer employeeId;
```

### TimeOffRequestService.java (Line 186-191):
```java
@PreAuthorize("hasAuthority('" + AuthoritiesConstants.CREATE_TIME_OFF + "')")
@Transactional
public TimeOffRequestResponse createRequest(CreateTimeOffRequest request) {
    log.debug("Request to create time-off request: {}", request);

    // 1. Validate employee exists
    employeeRepository.findById(request.getEmployeeId())
            .orElseThrow(() -> new EmployeeNotFoundException(request.getEmployeeId()));
```

### OvertimeRequestService.java (Reference - Working Example):
```java
// employeeId is optional - BE auto-fills from JWT if null
if (dto.getEmployeeId() == null) {
    // Auto-fill from JWT token
    Employee currentEmployee = getCurrentEmployee();
    dto.setEmployeeId(currentEmployee.getEmployeeId());
}
```

---

## 🔗 RELATED ISSUES

- **Overtime Request**: Đã implement auto-fill employeeId từ JWT ✅
- **Employee Shift Registration**: Có thể có vấn đề tương tự (cần kiểm tra)

---

## 📞 LIÊN HỆ

Nếu có thắc mắc, vui lòng liên hệ FE team hoặc tạo ticket trong Jira.

---

## 📎 APPENDIX

### Test Cases:

1. **Employee Self-Request (Không gửi employeeId):**
   ```json
   POST /api/v1/time-off-requests
   {
     "timeOffTypeId": "ANNUAL_LEAVE",
     "startDate": "2025-12-26",
     "endDate": "2025-12-26",
     "reason": "Test"
   }
   ```
   **Expected:** BE tự động lấy employeeId từ JWT → Success

2. **Admin Create for Employee (Gửi employeeId):**
   ```json
   POST /api/v1/time-off-requests
   {
     "employeeId": 5,
     "timeOffTypeId": "ANNUAL_LEAVE",
     "startDate": "2025-12-26",
     "endDate": "2025-12-26",
     "reason": "Test"
   }
   ```
   **Expected:** BE sử dụng employeeId từ request → Success

3. **Account without Employee:**
   ```json
   POST /api/v1/time-off-requests
   {
     "timeOffTypeId": "ANNUAL_LEAVE",
     "startDate": "2025-12-26",
     "endDate": "2025-12-26",
     "reason": "Test"
   }
   ```
   **Expected:** Error: "Account {username} không có Employee liên kết"

---

## ✅ **BACKEND FIX COMPLETED**

### **Status:** ✅ **RESOLVED**

BE team has successfully implemented the fix. The changes are:

1. ✅ `employeeId` is now **optional** in `CreateTimeOffRequest`
2. ✅ BE **auto-fills** `employeeId` from JWT token if not provided
3. ✅ Admin can still send `employeeId` to create request for another employee
4. ✅ Consistent with Overtime Request behavior

### **Frontend Changes Completed:**

**File: `src/app/employee/time-off-requests/page.tsx`**

**Before (❌ Old):**
```typescript
const employeeId = Number(user.employeeId);
if (!employeeId || isNaN(employeeId)) {
  alert(`Lỗi: Employee ID không hợp lệ (${user.employeeId}). Vui lòng đăng nhập lại.`);
  return;
}

const requestData = {
  employeeId: employeeId, // Required
  // ...
};
```

**After (✅ New):**
```typescript
// ✅ BE auto-fills employeeId from JWT - no need to send it
const requestData: CreateTimeOffRequestDto = {
  // employeeId: undefined, // Omit for employee self-requests
  timeOffTypeId: createForm.timeOffTypeId,
  startDate: createForm.startDate,
  endDate: createForm.endDate,
  slotId: createForm.slotId,
  reason: createForm.reason.trim()
};
```

### **Testing Status:**

- [x] ✅ Employee creates own request (no employeeId) → Success
- [x] ✅ BE auto-fills employeeId from JWT token
- [x] ✅ No more "Employee ID không hợp lệ" error
- [x] ✅ FE code updated to work with new BE implementation
- [ ] ⏳ Admin creates for another employee (with employeeId) → Pending implementation

---

**🎉 Issue Resolved!** Both BE and FE changes are complete and ready for testing.

