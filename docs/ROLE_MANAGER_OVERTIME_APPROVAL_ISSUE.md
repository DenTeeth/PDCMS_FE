# ISSUE: ROLE_MANAGER Không Thể Duyệt Đơn Overtime

## Ngày tạo: 2025-12-28
## Priority: High
## Status: Open

---

## 📋 TÓM TẮT

ROLE_MANAGER có quyền `APPROVE_OVERTIME` và `VIEW_OT_ALL` nhưng không thể truy cập trang `/admin/overtime-requests` để duyệt đơn vì baseRole là "employee" (không phải "admin").

---

## 🔍 VẤN ĐỀ CHI TIẾT

### 1. Mô tả vấn đề

- **ROLE_MANAGER** có:
  - ✅ `VIEW_OT_ALL` - Xem tất cả overtime requests (seed data line 563)
  - ✅ `APPROVE_OVERTIME` - Duyệt/từ chối overtime requests (seed data line 565)
  - ✅ `VIEW_SCHEDULE_ALL` - Xem tất cả lịch làm việc
  - ✅ `MANAGE_FIXED_REGISTRATIONS` - Quản lý ca làm việc

- **Nhưng:**
  - ❌ ROLE_MANAGER có `baseRole = "employee"` (seed data line 113)
  - ❌ Admin layout yêu cầu `requiredBaseRole="admin"` (AdminLayout.tsx line 12)
  - ❌ ROLE_MANAGER không thể truy cập `/admin/overtime-requests`
  - ❌ Trang `/employee/overtime-requests` không có chức năng approve/reject

### 2. Nguyên nhân

#### Seed Data:
```sql
('ROLE_MANAGER', 'ROLE_MANAGER', 2, 'Quản lý - Quản lý vận hành và nhân sự', FALSE, TRUE, NOW())
-- base_role_id = 2 (employee), không phải 1 (admin)
```

#### Admin Layout:
```tsx
<ProtectedRoute requiredBaseRole="admin">
  {/* Admin pages */}
</ProtectedRoute>
```

#### Navigation Config:
- `/admin/overtime-requests` yêu cầu `VIEW_OT_ALL` (line 177)
- ROLE_MANAGER có `VIEW_OT_ALL` nhưng không thể truy cập vì baseRole không khớp

---

## 💡 GIẢI PHÁP ĐỀ XUẤT

### Giải pháp 1: Thêm chức năng approve vào `/employee/overtime-requests` (KHUYẾN NGHỊ)

**Lý do:**
1. ROLE_MANAGER thuộc employee portal, nên nên duyệt đơn trong employee section
2. Không cần thay đổi baseRole (giữ nguyên architecture)
3. Dễ implement và maintain

**Thay đổi FE:**

**File: `src/app/employee/overtime-requests/page.tsx`**

1. **Thêm permission checks:**
```tsx
// Thêm vào sau line 228
const canViewAll = user?.permissions?.includes('VIEW_OT_ALL') || false;
const canApprove = user?.permissions?.includes('APPROVE_OVERTIME') || false;
const canReject = user?.permissions?.includes('APPROVE_OVERTIME') || false;
```

2. **Load tất cả requests nếu có VIEW_OT_ALL:**
```tsx
const loadOvertimeRequests = async () => {
  try {
    setLoading(true);
    const params: any = {
      page: 0,
      size: 50,
      sort: 'createdAt,desc',
    };
    
    // Nếu có VIEW_OT_ALL, load tất cả requests
    // Nếu chỉ có VIEW_OT_OWN, load chỉ requests của bản thân
    const response = await OvertimeService.getOvertimeRequests(params);
    setOvertimeRequests(response.content);
  } catch (error) {
    console.error('Error loading overtime requests:', error);
  } finally {
    setLoading(false);
  }
};
```

3. **Thêm approve/reject buttons:**
```tsx
{request.status === OvertimeStatus.PENDING && canApprove && (
  <>
    <Button
      variant="outline"
      size="sm"
      className="text-green-600 border-green-600 hover:bg-green-50"
      onClick={() => handleApprove(request)}
    >
      <FontAwesomeIcon icon={faCheck} className="mr-1" />
      Duyệt
    </Button>
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 border-red-600 hover:bg-red-50"
      onClick={() => handleReject(request)}
    >
      <FontAwesomeIcon icon={faTimes} className="mr-1" />
      Từ chối
    </Button>
  </>
)}
```

4. **Thêm approve/reject handlers:**
```tsx
const handleApprove = async (request: OvertimeRequest) => {
  try {
    await OvertimeService.updateOvertimeStatus(request.requestId, {
      status: 'APPROVED'
    });
    toast.success('Đã duyệt yêu cầu làm thêm giờ');
    loadOvertimeRequests();
  } catch (error) {
    toast.error('Không thể duyệt yêu cầu');
  }
};

const handleReject = async (request: OvertimeRequest) => {
  // Show modal để nhập lý do từ chối
  // Similar to admin page
};
```

5. **Thêm filter theo employee nếu có VIEW_OT_ALL:**
```tsx
{canViewAll && (
  <CustomSelect
    label="Nhân viên"
    value={employeeFilter}
    onChange={(value) => setEmployeeFilter(value)}
    placeholder="Tất cả nhân viên"
    options={employees.map(emp => ({
      value: emp.employeeId.toString(),
      label: emp.fullName
    }))}
  />
)}
```

---

### Giải pháp 2: Sửa Admin Layout để cho phép ROLE_MANAGER (KHÔNG KHUYẾN NGHỊ)

**Lý do không khuyến nghị:**
- Vi phạm architecture (baseRole separation)
- Có thể gây confusion (manager dùng admin layout nhưng không phải admin)
- Khó maintain

**Nếu vẫn muốn:**
```tsx
// AdminLayout.tsx
<ProtectedRoute 
  requiredBaseRole="admin"
  // Hoặc check permission thay vì baseRole
  requiredPermissions={['VIEW_OT_ALL']}
  requireAll={false}
>
```

---

## ⚠️ PHÂN TÍCH ẢNH HƯỞNG

### Nếu KHÔNG sửa:

**Ảnh hưởng:**
- ❌ ROLE_MANAGER không thể duyệt đơn OT
- ❌ Chức năng quản lý bị thiếu
- ❌ User experience kém

### Nếu SỬA (Giải pháp 1):

**Lợi ích:**
- ✅ ROLE_MANAGER có thể duyệt đơn OT trong employee portal
- ✅ Không ảnh hưởng đến architecture
- ✅ Dễ maintain và test

**Rủi ro:**
- ⚠️ **MINIMAL** - Chỉ thêm chức năng approve vào trang hiện có
- ⚠️ Cần test kỹ permission checks

---

## 📝 THAY ĐỔI CẦN THỰC HIỆN

### Frontend:

1. **File: `src/app/employee/overtime-requests/page.tsx`**
   - Thêm permission checks: `canViewAll`, `canApprove`, `canReject`
   - Load tất cả requests nếu có `VIEW_OT_ALL`
   - Thêm approve/reject buttons và handlers
   - Thêm filter theo employee nếu có `VIEW_OT_ALL`
   - Thêm modal để nhập lý do từ chối

2. **File: `src/services/overtimeService.ts`**
   - Verify `updateOvertimeStatus` method đã có
   - Verify có thể gọi API với `APPROVE_OVERTIME` permission

---

## ✅ CHECKLIST

- [ ] FE: Thêm permission checks vào `/employee/overtime-requests`
- [ ] FE: Thêm approve/reject buttons
- [ ] FE: Thêm approve/reject handlers
- [ ] FE: Thêm filter theo employee (nếu có VIEW_OT_ALL)
- [ ] FE: Test với ROLE_MANAGER - verify có thể duyệt đơn
- [ ] FE: Test với ROLE_DENTIST - verify không thấy approve buttons
- [ ] FE: Test với ROLE_ADMIN - verify vẫn hoạt động bình thường

---

## 📊 CURRENT PERMISSIONS

### ROLE_MANAGER (Seed Data):
- ✅ `VIEW_OT_ALL` - Xem tất cả overtime requests (line 563)
- ✅ `APPROVE_OVERTIME` - Duyệt/từ chối overtime (line 565)
- ✅ `VIEW_SCHEDULE_ALL` - Xem tất cả lịch làm việc (line 553)
- ✅ `MANAGE_FIXED_REGISTRATIONS` - Quản lý ca làm việc (line 559)

### BE Endpoint Requirements:
- `GET /api/v1/overtime-requests` - Requires `VIEW_OT_ALL` or `VIEW_OT_OWN`
- `PATCH /api/v1/overtime-requests/{id}` - Requires `APPROVE_OVERTIME` or `CREATE_OVERTIME`

---

## 📞 LIÊN HỆ

Nếu có thắc mắc, vui lòng liên hệ FE team hoặc tạo ticket trong Jira.

