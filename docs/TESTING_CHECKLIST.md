# ✅ DANH SÁCH TEST - PERMISSION & SIDEBAR

**Ngày test:** 22/12/2025  
**Tester:** _____________  
**User đang test:** _____________  
**Role:** [ ] Admin  [ ] Employee  [ ] Patient

---

## 🎯 MỤC TIÊU TEST

Kiểm tra sau khi:
1. ✅ Chuẩn hóa permissions (Overtime, Leave Type)
2. ✅ Fix sidebar bị mất menu items
3. ✅ Thêm ADMIN BYPASS logic
4. ✅ Thêm employmentType filtering

---

## 📋 SECTION 1: LOGIN & AUTHENTICATION

### 1.1. Login Process
- [ ] **Login thành công** với credentials hợp lệ
- [ ] **Redirect** đến đúng homepage theo role
  - Admin → `/admin`
  - Employee → `/employee`
  - Patient → `/patient`
- [ ] **Token** được lưu trong localStorage/cookies
- [ ] **User data** được lưu đúng

### 1.2. Login Response Check (F12 → Network tab)
Tìm request `/auth/login`, xem Response:

```json
{
  "token": "eyJhbGc...",
  "username": "...",
  "roles": ["ROLE_ADMIN" hoặc "ROLE_EMPLOYEE" hoặc "ROLE_PATIENT"],
  "permissions": [  // ⚠️ CRITICAL: Array này PHẢI có
    "VIEW_ACCOUNT",
    "CREATE_ACCOUNT",
    ...
  ],
  "groupedPermissions": {  // ✅ Good to have
    "ACCOUNT": [...],
    "EMPLOYEE": [...],
    ...
  },
  "baseRole": "admin" hoặc "employee" hoặc "patient",
  "employmentType": "FULL_TIME" hoặc "PART_TIME_FIXED" hoặc "PART_TIME_FLEX" (chỉ cho employee)
}
```

**Checklist:**
- [ ] ✅ `permissions` array **CÓ** và không rỗng
  - **Nếu KHÔNG CÓ** → Đây là vấn đề của BE, nhưng FE vẫn work với admin bypass
- [ ] ✅ `groupedPermissions` **CÓ**
- [ ] ✅ `baseRole` đúng
- [ ] ✅ `roles` array có đúng role

**Ghi chú:**
```
permissions array length: _______
groupedPermissions keys: _______
```

---

## 📋 SECTION 2: SIDEBAR RENDERING

### 2.1. Admin Sidebar (ROLE_ADMIN)

**Yêu cầu:** Admin PHẢI thấy TẤT CẢ menu items bất kể có permissions hay không

#### Menu Items Cần Hiển Thị:
- [ ] ✅ **Tổng quan** (Dashboard)
- [ ] ✅ **Quản lý tài khoản** (submenu)
  - [ ] Tài khoản người dùng
  - [ ] Tài khoản nhân viên
- [ ] ✅ **Quản lý blog**
- [ ] ✅ **Cấu hình hệ thống** (submenu)
  - [ ] Quản lý vai trò
  - [ ] Quản lý quyền
  - [ ] Chuyên khoa
- [ ] ✅ **Quản lý lịch làm việc** (submenu)
  - [ ] Ca làm việc
  - [ ] Khung giờ làm việc
  - [ ] Đăng ký ca làm
  - [ ] Lịch ca làm việc
- [ ] ✅ **Quản lý yêu cầu** (submenu)
  - [ ] Yêu cầu làm thêm giờ
  - [ ] Yêu cầu nghỉ phép
  - [ ] Yêu cầu đăng ký ca
- [ ] ✅ **Quản lý nghỉ phép** (submenu)
  - [ ] Loại nghỉ phép
- [ ] ✅ **Quản lý kho** (submenu)
  - [ ] Tổng quan kho
  - [ ] Quản lý vật tư
  - [ ] Nhập/Xuất kho
  - [ ] Nhà cung cấp
  - [ ] Báo cáo & thống kê
- [ ] ✅ **Liên hệ khách hàng**
- [ ] ✅ **Quản lý lịch** (submenu)
  - [ ] Phòng khám
  - [ ] Dịch vụ
  - [ ] Lịch hẹn
  - [ ] Kế hoạch điều trị
- [ ] ✅ **Cài đặt**

**Tổng số menu items admin:** _______ / 11 main + ~25 submenu

**⚠️ Nếu thiếu menu:**
```
Menu bị thiếu: _______________________
Console error: _______________________
```

---

### 2.2. Employee Sidebar (ROLE_EMPLOYEE)

**Lưu ý:** Employee menu phụ thuộc vào:
1. Permissions được gán cho role
2. Employment Type (FULL_TIME, PART_TIME_FIXED, PART_TIME_FLEX)

#### Menu Items Phổ Biến (tùy permissions):
- [ ] ✅ **Tổng quan** (Dashboard)
- [ ] **Quản lý lịch** (nếu có `VIEW_APPOINTMENT_OWN` hoặc `VIEW_APPOINTMENT_ALL`)
  - [ ] Lịch hẹn
- [ ] **Kế hoạch điều trị** (nếu có `VIEW_TREATMENT_PLAN_OWN` hoặc `VIEW_TREATMENT_PLAN_ALL`)
- [ ] **Quản lý lịch làm việc** (submenu - thường có)
  - [ ] Đăng ký ca của tôi (nếu có `VIEW_REGISTRATION_OWN`)
  - [ ] Lịch ca làm việc (nếu có `VIEW_SHIFTS_OWN`)
  - [ ] Lịch của tôi (chỉ FULL_TIME & PART_TIME_FIXED)
  - [ ] Đăng ký cố định (chỉ FULL_TIME & PART_TIME_FIXED)
  - [ ] Gia hạn ca (chỉ PART_TIME_FLEX)
- [ ] **Quản lý yêu cầu** (nếu có LEAVE_MANAGEMENT permissions)
  - [ ] Yêu cầu làm thêm giờ (chỉ FULL_TIME & PART_TIME_FIXED)
  - [ ] Yêu cầu nghỉ phép (chỉ FULL_TIME & PART_TIME_FIXED)
- [ ] **Quản lý khách hàng** (nếu có CUSTOMER_MANAGEMENT)
- [ ] **Quản lý kho** (nếu có `VIEW_WAREHOUSE`)
- [ ] **Phân tích** (nếu có ANALYTICS permissions)
- [ ] ✅ **Xem CBCT**
- [ ] ✅ **Cài đặt**

**Employment Type:** _______
**Tổng số menu items employee:** _______ / ?

**⚠️ Kiểm tra Employment Type Filtering:**
- FULL_TIME có thấy "Yêu cầu làm thêm giờ"? ______
- PART_TIME_FLEX có thấy "Gia hạn ca"? ______
- PART_TIME_FLEX KHÔNG thấy "Yêu cầu làm thêm giờ"? ______

---

### 2.3. Patient Sidebar (ROLE_PATIENT)

- [ ] ✅ **Tổng quan**
- [ ] ✅ **Lịch hẹn của tôi**
- [ ] **Kế hoạch điều trị** (nếu có `VIEW_TREATMENT_PLAN_OWN`)
- [ ] ✅ **Xem CBCT**
- [ ] ✅ **Thanh toán**
- [ ] ✅ **Thông báo**
- [ ] ✅ **Hồ sơ cá nhân**

**Tổng số menu items patient:** _______ / ~7

---

## 📋 SECTION 3: PERMISSION CHECKS (Overtime Module)

### 3.1. Admin Overtime Requests Page
**URL:** `/admin/overtime-requests`

**Checklist:**
- [ ] Page load thành công
- [ ] Danh sách overtime requests hiển thị
- [ ] Buttons hiển thị đúng:
  - [ ] **Phê duyệt** button (nếu có `APPROVE_OVERTIME`)
  - [ ] **Từ chối** button (nếu có `REJECT_OVERTIME`)
  - [ ] **Hủy** button (nếu có `CANCEL_OVERTIME_PENDING`)
  - [ ] **Tạo mới** button (nếu có `CREATE_OVERTIME`)

**Console Check (F12):**
```javascript
// Paste vào console để check:
console.log('Permissions:', window.localStorage.getItem('user'));
```

**Expected permissions (mới):**
- `APPROVE_OVERTIME` (KHÔNG phải `APPROVE_OT`)
- `REJECT_OVERTIME` (KHÔNG phải `REJECT_OT`)
- `CANCEL_OVERTIME_OWN`
- `CANCEL_OVERTIME_PENDING`
- `CREATE_OVERTIME`

**⚠️ Nếu có lỗi:**
```
Error message: _______________________
Missing permission: __________________
```

---

### 3.2. Employee Overtime Requests Page
**URL:** `/employee/overtime-requests`

**Checklist:**
- [ ] Page load thành công
- [ ] Chỉ thấy overtime requests của bản thân
- [ ] Buttons:
  - [ ] **Tạo yêu cầu** (nếu có `CREATE_OVERTIME`)
  - [ ] **Hủy** button cho own requests (nếu có `CANCEL_OVERTIME_OWN`)
- [ ] KHÔNG thấy buttons phê duyệt/từ chối

---

## 📋 SECTION 4: PERMISSION CHECKS (Leave Type Module)

### 4.1. Admin Time-Off Types Page
**URL:** `/admin/time-off-types`

**Checklist:**
- [ ] Page load thành công
- [ ] Danh sách loại nghỉ phép hiển thị
- [ ] Buttons:
  - [ ] **Tạo mới** (nếu có `MANAGE_LEAVE_TYPE` hoặc admin)
  - [ ] **Sửa** icon (nếu có `MANAGE_LEAVE_TYPE` hoặc admin)
  - [ ] **Xóa** icon (nếu có `MANAGE_LEAVE_TYPE` hoặc admin)

**Expected permissions (mới):**
- `VIEW_LEAVE_TYPE` (KHÔNG phải `VIEW_TIMEOFF_TYPE`)
- `MANAGE_LEAVE_TYPE` (hợp nhất từ CREATE/UPDATE/DELETE)

**⚠️ Nếu không có buttons:**
```
Missing permission: __________________
isAdmin value: _______________________
```

---

## 📋 SECTION 5: WAREHOUSE ACCESS (RBAC Test)

### 5.1. Warehouse Menu Visibility

**Test với Admin:**
- [ ] Admin LUÔN thấy "Quản lý kho" menu (có permission hoặc không)

**Test với Employee có VIEW_WAREHOUSE:**
- [ ] Employee có `VIEW_WAREHOUSE` → thấy "Quản lý kho" menu
- [ ] Employee KHÔNG có `VIEW_WAREHOUSE` → KHÔNG thấy menu

**Test Access:**
- [ ] Click vào "Quản lý kho" → submenu hiển thị
- [ ] Click vào "Tổng quan kho" → page load thành công
- [ ] URL: `/admin/warehouse` hoặc `/employee/warehouse`

---

## 📋 SECTION 6: NAVIGATION & ROUTING

### 6.1. Direct URL Access
Test với từng role, access các URLs sau:

**Admin URLs:**
- [ ] `/admin` - Dashboard
- [ ] `/admin/accounts/users` - User accounts
- [ ] `/admin/overtime-requests` - Overtime requests
- [ ] `/admin/time-off-types` - Leave types
- [ ] `/admin/warehouse` - Warehouse

**Kết quả mong đợi:**
- Admin có access tất cả → ✅ Page load
- Non-admin access admin URLs → ⚠️ Redirect hoặc 403

**Employee URLs:**
- [ ] `/employee` - Dashboard
- [ ] `/employee/appointments` - Appointments
- [ ] `/employee/overtime-requests` - Own overtime
- [ ] `/employee/warehouse` - Nếu có VIEW_WAREHOUSE

**Patient URLs:**
- [ ] `/patient` - Dashboard
- [ ] `/patient/appointments` - Appointments
- [ ] `/patient/treatment-plans` - Own treatment plans

---

## 📋 SECTION 7: CONSOLE CHECKS

### 7.1. Open Browser Console (F12)

**Check for Errors:**
```
[ ] KHÔNG có permission-related errors
[ ] KHÔNG có "Access denied" warnings
[ ] KHÔNG có "undefined permissions" errors
```

**Expected Console Logs:**
```
✅ User authenticated from localStorage
✅ Login successful
✅ Auth state updated - isAuthenticated: true
```

**⚠️ Warning Logs (OK to have):**
```
⚠️ Access denied. Required permissions: ... (chỉ khi thử access page không có quyền)
```

---

### 7.2. Check User Data in Console

**Paste vào console:**
```javascript
// Get user data
const userData = JSON.parse(localStorage.getItem('user') || '{}');
console.log('=== USER DATA ===');
console.log('Username:', userData.username);
console.log('Base Role:', userData.baseRole);
console.log('Roles:', userData.roles);
console.log('Permissions Count:', userData.permissions?.length || 0);
console.log('Permissions:', userData.permissions);
console.log('Grouped Permissions:', Object.keys(userData.groupedPermissions || {}).join(', '));
console.log('Employment Type:', userData.employmentType);
```

**Expected Output:**
```
=== USER DATA ===
Username: admin (hoặc employee1, patient1, etc.)
Base Role: admin (hoặc employee, patient)
Roles: ["ROLE_ADMIN"] (hoặc ["ROLE_EMPLOYEE"], ["ROLE_PATIENT"])
Permissions Count: [số lượng > 0] ← QUAN TRỌNG
Permissions: [array of permission strings]
Grouped Permissions: ACCOUNT, EMPLOYEE, LEAVE_MANAGEMENT, ... ← QUAN TRỌNG
Employment Type: null (admin/patient) hoặc FULL_TIME/PART_TIME_FIXED/PART_TIME_FLEX (employee)
```

**⚠️ Red Flags:**
```
Permissions Count: 0 hoặc undefined → ❌ BE chưa trả về permissions!
Grouped Permissions: [empty] → ⚠️ Có thể ảnh hưởng menu
```

---

## 📋 SECTION 8: NETWORK TAB CHECKS

### 8.1. Check API Calls (F12 → Network tab)

**Login Request:**
```
Request URL: /auth/login
Method: POST
Status: 200 OK
Response: (check response body có permissions array)
```

**Protected API Calls:**
```
Request: /api/overtime-requests/all
Headers: Authorization: Bearer eyJhbGc...
Status: 200 OK hoặc 403 (nếu không có permission)
```

**⚠️ Nếu gặp 403 Forbidden:**
```
Request URL: _______________________
Missing Permission: _________________
User has permissions: _______________
```

---

## 📋 SECTION 9: SPECIFIC BUGS CHECK

### 9.1. Issues Fixed - Verify

**Issue 1: Sidebar mất menu items**
- [ ] ✅ FIXED: Admin thấy đầy đủ menu
- [ ] ✅ FIXED: Employee menu hiển thị đúng theo employmentType

**Issue 2: Overtime permissions không work**
- [ ] ✅ FIXED: Dùng `APPROVE_OVERTIME` thay vì `APPROVE_OT`
- [ ] ✅ FIXED: Buttons hiển thị đúng theo permission mới

**Issue 3: Leave Type permissions không work**
- [ ] ✅ FIXED: Dùng `VIEW_LEAVE_TYPE` thay vì `VIEW_TIMEOFF_TYPE`
- [ ] ✅ FIXED: `MANAGE_LEAVE_TYPE` covers create/update/delete

**Issue 4: Admin bị block bởi permission checks**
- [ ] ✅ FIXED: Admin bypass logic → admin thấy tất cả menu

---

## 📋 SECTION 10: EDGE CASES

### 10.1. Test Edge Cases

**Test 1: Login với user KHÔNG có permissions array**
- Mock: BE trả về response thiếu `permissions` field
- Expected: Admin vẫn thấy menu (nhờ admin bypass)
- Result: [ ] PASS / [ ] FAIL

**Test 2: Employee với employment type khác nhau**
- FULL_TIME employee → có thấy "Yêu cầu làm thêm giờ"?
- PART_TIME_FLEX → có thấy "Gia hạn ca"?
- PART_TIME_FLEX → KHÔNG thấy "Yêu cầu làm thêm giờ"?

**Test 3: Permission name mismatch**
- BE trả về `VIEW_OT_ALL` (tên cũ)
- FE có handle được không? (enum có alias)
- Result: [ ] PASS / [ ] FAIL

---

## 📋 SECTION 11: PERFORMANCE & UX

### 11.1. Performance Check

**Sidebar Rendering:**
- [ ] Sidebar render < 100ms
- [ ] Không có lag khi expand/collapse menu
- [ ] Smooth transitions

**Page Navigation:**
- [ ] Page load < 500ms
- [ ] Không có flash of content (FOUC)
- [ ] Loading states hiển thị đúng

### 11.2. UX Check

**Visual:**
- [ ] Icons hiển thị đúng
- [ ] Colors nhất quán
- [ ] Active menu item được highlight
- [ ] Hover states hoạt động

**Responsive:**
- [ ] Mobile menu button hoạt động
- [ ] Sidebar collapse trên mobile
- [ ] Desktop sidebar luôn visible

---

## 📊 SUMMARY & SCORE

### Test Results

**Total Tests:** _______
**Passed:** _______
**Failed:** _______
**Success Rate:** _______% 

**Critical Issues Found:**
```
1. _______________________________________
2. _______________________________________
3. _______________________________________
```

**Minor Issues Found:**
```
1. _______________________________________
2. _______________________________________
```

**Notes:**
```
________________________________________________
________________________________________________
________________________________________________
```

---

## 🚨 TROUBLESHOOTING GUIDE

### Nếu Sidebar Vẫn Bị Mất Menu:

1. **Check Login Response:**
   ```javascript
   // F12 → Network → /auth/login → Response
   // Xem có permissions array không?
   ```

2. **Check Console:**
   ```javascript
   // F12 → Console
   // Có error về permissions không?
   ```

3. **Force Refresh:**
   ```
   Ctrl+Shift+R (Windows)
   Cmd+Shift+R (Mac)
   ```

4. **Clear Cache:**
   ```
   F12 → Network → Disable cache (checkbox)
   F12 → Application → Clear Storage
   ```

5. **Check User Role:**
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log(user.roles); // Phải có ROLE_ADMIN, ROLE_EMPLOYEE, etc.
   ```

---

### Nếu Permission Không Hoạt Động:

1. **Verify BE trả về permission mới:**
   ```
   BE trả về: APPROVE_OVERTIME (mới) ✅
   Không phải: APPROVE_OT (cũ) ❌
   ```

2. **Check Code đã dùng tên mới:**
   ```typescript
   // Đúng ✅
   user?.permissions?.includes('APPROVE_OVERTIME')
   
   // Sai ❌
   user?.permissions?.includes('APPROVE_OT')
   ```

3. **Verify SQL seed data:**
   ```sql
   -- Phải dùng tên mới trong database
   SELECT code FROM permission WHERE code LIKE '%OVERTIME%';
   ```

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Đã test tất cả sections
- [ ] Đã ghi lại kết quả
- [ ] Đã document issues (nếu có)
- [ ] Đã báo cáo cho team
- [ ] Đã verify fixes (nếu có issues)

**Tester Signature:** _____________
**Date:** _____________
**Status:** [ ] PASS [ ] FAIL [ ] PARTIAL

---

**END OF TEST CHECKLIST**

💡 **Tips:**
- Test từng section một, không skip
- Document tất cả issues với screenshots
- Test với nhiều user accounts khác nhau
- Test cả happy path và edge cases
