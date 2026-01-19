# Missing Pages in Employee Folder

**Date:** 2026-01-16  
**Comparison:** `src/app/admin/` vs `src/app/employee/`

---

## Summary

Có một số pages trong `admin/` mà chưa có trong `employee/`. Dưới đây là danh sách chi tiết:

---

## Missing Pages

### 1. **Invoice Detail Page** ❌
- **Admin:** `src/app/admin/invoices/[invoiceCode]/page.tsx`
- **Employee:** `src/app/employee/invoices/[invoiceCode]/page.tsx` - **THIẾU**
- **Description:** Trang chi tiết hóa đơn với QR code thanh toán
- **Priority:** High (đã có trong admin, cần có trong employee)

### 2. **Employee Detail Page** ❌
- **Admin:** `src/app/admin/accounts/employees/[employeeCode]/page.tsx`
- **Employee:** `src/app/employee/accounts/employees/[employeeCode]/page.tsx` - **THIẾU**
- **Description:** Trang chi tiết nhân viên
- **Priority:** Medium (có thể employee không cần xem chi tiết employee khác)

### 3. **Patient/User Detail Page** ❌
- **Admin:** `src/app/admin/accounts/users/[patientCode]/page.tsx`
- **Employee:** `src/app/employee/accounts/users/[patientCode]/page.tsx` - **THIẾU**
- **Description:** Trang chi tiết bệnh nhân/người dùng
- **Priority:** Medium (có thể employee không cần xem chi tiết user)

### 4. **Blogs Page** ❌
- **Admin:** `src/app/admin/blogs/page.tsx`
- **Employee:** `src/app/employee/blogs/page.tsx` - **THIẾU**
- **Description:** Trang quản lý blog
- **Priority:** Low (có thể chỉ admin mới cần)

### 5. **Appointments Page (Direct)** ❌
- **Admin:** `src/app/admin/appointments/page.tsx`
- **Employee:** `src/app/employee/appointments/page.tsx` - **THIẾU**
- **Note:** Employee có `booking/appointments/page.tsx` nhưng không có `appointments/page.tsx` trực tiếp
- **Priority:** Low (có thể không cần thiết vì đã có booking/appointments)

### 6. **Employee Shifts Page** ❌
- **Admin:** `src/app/admin/employee-shifts/page.tsx`
- **Employee:** `src/app/employee/employee-shifts/page.tsx` - **THIẾU**
- **Description:** Trang quản lý ca làm việc của nhân viên
- **Priority:** Medium (có thể employee không cần quản lý shifts của người khác)

### 7. **Feedback Statistics Page** ❌
- **Admin:** `src/app/admin/feedbacks/statistics/page.tsx`
- **Employee:** `src/app/employee/feedbacks/statistics/page.tsx` - **THIẾU**
- **Description:** Trang thống kê feedback
- **Priority:** Medium (có thể chỉ admin mới cần)

### 8. **Leave Balances Page** ❌
- **Admin:** `src/app/admin/leave-balances/page.tsx`
- **Employee:** `src/app/employee/leave-balances/page.tsx` - **THIẾU**
- **Description:** Trang quản lý số ngày nghỉ phép
- **Priority:** High (employee có thể cần xem leave balances của mình)

### 9. **Payments Page** ❌
- **Admin:** `src/app/admin/payments/page.tsx`
- **Employee:** `src/app/employee/payments/page.tsx` - **THIẾU**
- **Description:** Trang quản lý thanh toán
- **Priority:** Medium (có thể chỉ admin mới cần)

### 10. **Role Detail Page** ❌
- **Admin:** `src/app/admin/roles/[roleId]/page.tsx`
- **Employee:** `src/app/employee/roles/[roleId]/page.tsx` - **THIẾU**
- **Description:** Trang chi tiết role
- **Priority:** Low (có thể chỉ admin mới cần)

### 11. **Specialization Detail Page** ❌
- **Admin:** `src/app/admin/specializations/[specializationId]/page.tsx`
- **Employee:** `src/app/employee/specializations/[specializationId]/page.tsx` - **THIẾU**
- **Description:** Trang chi tiết chuyên khoa
- **Priority:** Low (có thể chỉ admin mới cần)

---

## Pages That Exist in Employee But Not in Admin

### 1. **My Calendar** ✅
- **Employee:** `src/app/employee/my-calendar/page.tsx`
- **Admin:** Không có
- **Description:** Lịch cá nhân của employee

### 2. **My Schedule** ✅
- **Employee:** `src/app/employee/my-schedule/page.tsx`
- **Admin:** Không có
- **Description:** Lịch trình cá nhân của employee

### 3. **Slot Registration** ✅
- **Employee:** `src/app/employee/slot-registration/page.tsx`
- **Admin:** Không có
- **Description:** Đăng ký ca làm việc

### 4. **NII Viewer** ✅
- **Employee:** `src/app/employee/nii-viewer/page.tsx`
- **Admin:** Không có
- **Description:** Xem file NII (medical imaging)

### 5. **Customers Pages** ✅
- **Employee:** `src/app/employee/customers/` (với nhiều sub-pages)
- **Admin:** Không có (chỉ có `customer-contacts`)
- **Description:** Quản lý khách hàng với nhiều tính năng hơn

### 6. **Overtime Management** ✅
- **Employee:** `src/app/employee/overtime-management/`
- **Admin:** Không có
- **Description:** Quản lý overtime

### 7. **Treatments** ✅
- **Employee:** `src/app/employee/treatments/`
- **Admin:** Không có
- **Description:** Quản lý điều trị

---

## Recommendations

### High Priority (Cần tạo ngay)

1. **Invoice Detail Page** (`/employee/invoices/[invoiceCode]`)
   - **Reason:** Employee cần xem chi tiết hóa đơn và QR code thanh toán
   - **Action:** Copy từ admin và điều chỉnh permissions

2. **Leave Balances Page** (`/employee/leave-balances`)
   - **Reason:** Employee cần xem số ngày nghỉ phép của mình
   - **Action:** Copy từ admin và filter theo employee hiện tại

### Medium Priority (Nên có)

3. **Feedback Statistics Page** (`/employee/feedbacks/statistics`)
   - **Reason:** Employee có thể cần xem thống kê feedback
   - **Action:** Copy từ admin và điều chỉnh permissions

4. **Payments Page** (`/employee/payments`)
   - **Reason:** Employee có thể cần xem thanh toán (nếu có quyền)
   - **Action:** Copy từ admin và điều chỉnh permissions

### Low Priority (Có thể không cần)

5. **Employee Detail Page** - Có thể không cần vì employee không nên xem chi tiết employee khác
6. **Patient Detail Page** - Có thể không cần vì employee có thể xem qua customers
7. **Blogs Page** - Có thể chỉ admin mới cần
8. **Role/Specialization Detail Pages** - Có thể chỉ admin mới cần

---

## Implementation Steps

### Step 1: Create Invoice Detail Page
```bash
# Copy from admin
cp -r src/app/admin/invoices/[invoiceCode] src/app/employee/invoices/[invoiceCode]

# Update permissions in the file
# Change: requiredPermissions={['VIEW_INVOICE_ALL']}
# To: requiredPermissions={['VIEW_INVOICE_ALL', 'VIEW_INVOICE_OWN']}
```

### Step 2: Create Leave Balances Page
```bash
# Copy from admin
cp src/app/admin/leave-balances/page.tsx src/app/employee/leave-balances/page.tsx

# Update to filter by current employee
# Add: const { user } = useAuth();
# Filter: employeeId === user?.employeeId
```

### Step 3: Review and Test
- Test permissions
- Test navigation
- Verify all links work correctly

---

## Notes

- Một số pages có thể không cần thiết cho employee (ví dụ: quản lý roles, specializations)
- Employee có một số pages riêng mà admin không có (my-calendar, my-schedule, slot-registration)
- Cần kiểm tra permissions cho từng page trước khi copy
- Cần đảm bảo navigation config có đầy đủ routes cho employee




