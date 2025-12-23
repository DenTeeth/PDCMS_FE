# 🚀 QUICK TEST GUIDE - 5 Phút

**Nhanh chóng kiểm tra sau khi login**

---

## ✅ TEST NHANH (2 phút)

### 1. **Check Sidebar** (30 giây)
Đếm số menu items hiển thị:

**Admin:** Phải có ít nhất **10+ menu items** (bao gồm cả submenu)
- [ ] Tổng quan
- [ ] Quản lý tài khoản
- [ ] Cấu hình hệ thống
- [ ] Quản lý lịch làm việc
- [ ] Quản lý yêu cầu
- [ ] Quản lý kho
- [ ] Quản lý lịch
- [ ] Cài đặt

**Số menu hiện tại:** _______ (nếu < 8 → có vấn đề)

---

### 2. **Check Console** (30 giây)
Press **F12** → Tab **Console**

**Không được có:**
- ❌ "Access denied"
- ❌ "permission denied"
- ❌ "undefined permissions"
- ❌ Red error messages

**OK to have:**
- ⚠️ Warnings (màu vàng)
- ✅ Blue info logs

---

### 3. **Check Login Response** (1 phút)
Press **F12** → Tab **Network** → Refresh page → Tìm request `/auth/login`

Click vào request → Tab **Response**

**PHẢI CÓ:**
```json
{
  "permissions": [  // ← Array này PHẢI có và không rỗng!
    "VIEW_ACCOUNT",
    "CREATE_ACCOUNT",
    ...
  ]
}
```

**Nếu KHÔNG CÓ `permissions`:**
→ ❌ **Backend chưa fix!** Nhưng frontend vẫn work với admin.

---

## 🎯 TEST CHI TIẾT (3 phút)

### 4. **Test Overtime Page** (1 phút)

Admin: Go to `/admin/overtime-requests`

**Checklist:**
- [ ] Page load không lỗi
- [ ] Table hiển thị data
- [ ] Có buttons: Phê duyệt, Từ chối (nếu có requests)
- [ ] Console không có error

Employee: Go to `/employee/overtime-requests`

- [ ] Chỉ thấy own requests
- [ ] Có button "Tạo yêu cầu"

---

### 5. **Test Leave Type Page** (1 phút)

Admin: Go to `/admin/time-off-types`

**Checklist:**
- [ ] Page load không lỗi
- [ ] Table hiển thị data
- [ ] Có button "Thêm loại nghỉ phép"
- [ ] Có icons Sửa/Xóa cho mỗi row

---

### 6. **Test Warehouse Access** (1 phút)

Admin: Click vào sidebar "Quản lý kho"

**Checklist:**
- [ ] Menu expand/show submenu
- [ ] Click "Tổng quan kho" → page load
- [ ] URL: `/admin/warehouse`

Employee (nếu có VIEW_WAREHOUSE):
- [ ] Thấy menu "Quản lý kho"
- [ ] Access được `/employee/warehouse`

Employee (không có VIEW_WAREHOUSE):
- [ ] KHÔNG thấy menu "Quản lý kho"

---

## 📊 KẾT QUẢ

**Tất cả pass?**
- [x] ✅ YES → **Everything works!** 🎉
- [ ] ❌ NO → Xem section dưới

---

## 🚨 NẾU CÓ VẤN ĐỀ

### Issue 1: Sidebar bị mất menu
**Fix:**
1. Hard refresh: `Ctrl+Shift+R`
2. Clear cache: F12 → Application → Clear Storage
3. Logout → Login lại

### Issue 2: Permission error trong Console
**Check:**
```javascript
// Paste vào Console:
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('Permissions:', user.permissions?.length);
console.log('Roles:', user.roles);
```

**Expected:**
- Admin: `permissions.length` > 100
- Employee: `permissions.length` > 0
- `roles` array phải có giá trị

**Nếu `permissions.length` = 0:**
→ Backend chưa trả về permissions. Nhưng admin vẫn nên thấy menu.

### Issue 3: 403 Forbidden khi access page
**Nguyên nhân:**
- User không có permission cần thiết
- BE chưa cập nhật permission names (dùng tên cũ)

**Check permission names:**
```javascript
// Paste vào Console:
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('Has APPROVE_OVERTIME?', user.permissions?.includes('APPROVE_OVERTIME'));
console.log('Has APPROVE_OT (old)?', user.permissions?.includes('APPROVE_OT'));
```

Nếu có `APPROVE_OT` nhưng không có `APPROVE_OVERTIME`:
→ Backend vẫn dùng tên cũ, cần update.

---

## 📞 BÁO CÁO VẤN ĐỀ

**Nếu tìm thấy bug, cung cấp thông tin:**

1. **User info:**
   - Username: _______
   - Role: _______
   - Employment Type (nếu employee): _______

2. **Issue:**
   - Mô tả ngắn gọn: _______
   - URL đang test: _______
   - Expected: _______
   - Actual: _______

3. **Console error (nếu có):**
   ```
   [copy paste error message]
   ```

4. **Screenshot (nếu có):**
   - Attach screenshot

5. **Login Response (F12 → Network):**
   ```json
   {
     "permissions": [chụp hoặc paste permissions array]
   }
   ```

---

## ✅ DONE!

**Time taken:** _______ minutes

**Result:**
- [ ] ✅ All tests passed
- [ ] ⚠️ Some issues found (documented above)
- [ ] ❌ Major issues (needs immediate attention)

**Next steps:**
- [ ] Report issues to team
- [ ] Create bug tickets
- [ ] Verify fixes

---

**Quick Test Complete! 🎉**

📄 Xem chi tiết: [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
