# FE TEST CHECKLIST: Work Shifts Permission Fix

## Status: ✅ BE đã sửa xong - Cần test FE

**Date:** 2025-12-28  
**BE Status:** ✅ Completed  
**FE Status:** ⏳ Pending Testing

---

## 📋 TEST SCENARIOS

### ✅ Test 1: ROLE_DENTIST - Xem work shifts và tạo overtime request

**Steps:**
1. Login với tài khoản ROLE_DENTIST (ví dụ: `bacsi2` / `123456`)
2. Navigate to `/employee/overtime-requests`
3. Click button "Tạo yêu cầu" (Create request)

**Expected Results:**
- ✅ Dropdown "Ca làm việc" **KHÔNG bị disable**
- ✅ Dropdown hiển thị danh sách work shifts (ví dụ: "Ca sáng", "Ca chiều", etc.)
- ✅ **KHÔNG** hiển thị error message màu đỏ
- ✅ Có thể chọn work shift từ dropdown
- ✅ Có thể điền "Ngày làm việc" và "Lý do"
- ✅ Có thể submit form thành công
- ✅ Overtime request được tạo thành công

**Verify:**
- [ ] Dropdown work shifts có options
- [ ] Không có error message "Không có quyền xem danh sách ca làm việc"
- [ ] Form có thể submit được
- [ ] Overtime request xuất hiện trong danh sách

---

### ✅ Test 2: ROLE_NURSE - Xem work shifts và tạo overtime request

**Steps:**
1. Login với tài khoản ROLE_NURSE
2. Navigate to `/employee/overtime-requests`
3. Click button "Tạo yêu cầu"

**Expected Results:**
- ✅ Tương tự Test 1 - Dropdown work shifts hoạt động bình thường
- ✅ Có thể tạo overtime request thành công

**Verify:**
- [ ] Dropdown work shifts có options
- [ ] Có thể tạo overtime request

---

### ✅ Test 3: ROLE_DENTIST - Tạo time-off request

**Steps:**
1. Login với tài khoản ROLE_DENTIST
2. Navigate to `/employee/time-off-requests`
3. Click button "Tạo yêu cầu"

**Expected Results:**
- ✅ Dropdown "Ca làm việc" (nếu có) hoạt động bình thường
- ✅ Có thể tạo time-off request thành công

**Verify:**
- [ ] Form hoạt động bình thường
- [ ] Có thể tạo time-off request

---

### ✅ Test 4: ROLE_MANAGER - Verify không bị ảnh hưởng

**Steps:**
1. Login với tài khoản ROLE_MANAGER
2. Navigate to `/employee/overtime-requests`
3. Click button "Tạo yêu cầu"

**Expected Results:**
- ✅ Vẫn hoạt động bình thường như trước (đã có VIEW_SCHEDULE_ALL)
- ✅ Dropdown work shifts có đầy đủ options
- ✅ Có thể tạo overtime request

**Verify:**
- [ ] Không có regression
- [ ] Tất cả chức năng vẫn hoạt động như trước

---

### ✅ Test 5: ROLE_RECEPTIONIST - Verify không bị ảnh hưởng

**Steps:**
1. Login với tài khoản ROLE_RECEPTIONIST
2. Navigate to `/employee/overtime-requests`
3. Click button "Tạo yêu cầu"

**Expected Results:**
- ✅ Vẫn hoạt động bình thường như trước (đã có VIEW_SCHEDULE_ALL)
- ✅ Dropdown work shifts có đầy đủ options

**Verify:**
- [ ] Không có regression
- [ ] Tất cả chức năng vẫn hoạt động như trước

---

### ✅ Test 6: Verify Security - Employee chỉ xem được work shifts, không xem được lịch của người khác

**Steps:**
1. Login với tài khoản ROLE_DENTIST
2. Navigate to `/employee/shift-calendar` (nếu có quyền)
3. Navigate to `/employee/my-calendar`

**Expected Results:**
- ✅ `/employee/shift-calendar` - **KHÔNG hiển thị** trong sidebar (chỉ ROLE_MANAGER mới thấy)
- ✅ `/employee/my-calendar` - Chỉ hiển thị lịch của bản thân
- ✅ **KHÔNG** thể xem lịch của nhân viên khác

**Verify:**
- [ ] Security vẫn được maintain
- [ ] Employee chỉ xem được lịch của bản thân

---

## 🔍 API TESTING (Optional - dùng Postman/Thunder Client)

### Test API: GET /api/v1/work-shifts

**Request:**
```http
GET /api/v1/work-shifts
Authorization: Bearer <ROLE_DENTIST_TOKEN>
```

**Expected Response:**
```json
[
  {
    "workShiftId": "WKS_MORNING_01",
    "shiftName": "Ca sáng",
    "startTime": "08:00:00",
    "endTime": "12:00:00",
    "category": "NORMAL",
    "isActive": true
  },
  ...
]
```

**Status Code:** `200 OK` (không còn 403)

---

## ✅ ACCEPTANCE CRITERIA

- [x] BE đã sửa permission check
- [ ] ROLE_DENTIST có thể xem work shifts
- [ ] ROLE_DENTIST có thể tạo overtime request với work shift
- [ ] ROLE_NURSE có thể xem work shifts
- [ ] ROLE_MANAGER vẫn hoạt động bình thường (không regression)
- [ ] ROLE_RECEPTIONIST vẫn hoạt động bình thường (không regression)
- [ ] Security vẫn được maintain (employee chỉ xem được lịch của bản thân)

---

## 🐛 KNOWN ISSUES

**None** - BE đã sửa xong, chờ FE test.

---

## 📝 NOTES

- ✅ BE changes đã được deploy
- ⚠️ **Cần logout và login lại** để refresh JWT token với permissions mới
- ⚠️ Nếu vẫn thấy lỗi 403, có thể do:
  1. Token chưa được refresh (logout và login lại)
  2. BE chưa restart sau khi deploy
  3. Cache của browser (clear cache và thử lại)
  4. JWT token cũ chưa có `VIEW_SCHEDULE_OWN` permission

---

## 📞 CONTACT

Nếu có vấn đề khi test, vui lòng:
1. Check browser console để xem error
2. Check network tab để xem API response
3. Verify token có chứa `VIEW_SCHEDULE_OWN` permission (check trong JWT payload)
4. Logout và login lại để refresh token
5. Liên hệ BE team nếu vẫn thấy 403 error sau khi refresh token

---

## 🎯 QUICK TEST

**Fastest way to verify fix:**

1. Login với `bacsi2` / `123456` (ROLE_DENTIST)
2. Open browser DevTools → Network tab
3. Navigate to `/employee/overtime-requests`
4. Click "Tạo yêu cầu"
5. Check Network tab:
   - Request: `GET /api/v1/work-shifts`
   - Status: Should be `200 OK` (not `403 Forbidden`)
   - Response: Should contain array of work shifts
6. Check UI:
   - Dropdown "Ca làm việc" should have options
   - No red error message
