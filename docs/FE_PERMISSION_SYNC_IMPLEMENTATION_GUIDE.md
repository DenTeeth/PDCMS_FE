# FRONTEND PERMISSION SYNC - IMPLEMENTATION GUIDE

**Date**: 2025-12-23  
**Status**: ✅ READY TO IMPLEMENT  
**Backend Permissions**: 70 (consolidated from 200+)

---

## 📋 TL;DR

Backend đã giảm permissions từ 200+ xuống **70 permissions** theo chiến lược **CONSOLIDATION**:
- ✅ **MANAGE_*** pattern covers CREATE/UPDATE/DELETE
- ✅ **VIEW_*_ALL / VIEW_*_OWN** pattern for RBAC
- ❌ **Removed 125 unused permissions**

Frontend cần:
1. ✅ Sử dụng `BE_PERMISSIONS` constant (70 permissions)
2. ✅ Sử dụng `checkPermission()` helper function (auto-mapping)
3. ✅ Cập nhật tất cả pages để dùng permissions mới

---

## 🎯 CHIẾN LƯỢC BACKEND (Ngày 19/12/2025)

### Trước khi optimize:
- **169 permissions defined**
- **44 permissions được dùng** (26% usage)
- **74% WASTE** (125 permissions không dùng)

### Sau khi optimize:
- **70 permissions** (giảm 59%)
- **100% usage** (tất cả đều có mục đích)

### Chiến lược tối ưu:

1. ✅ **Consolidate CRUD operations** → `MANAGE_X` pattern
   - ❌ Xóa: `CREATE_WORK_SHIFT`, `UPDATE_WORK_SHIFT`, `DELETE_WORK_SHIFT`
   - ✅ Thay bằng: `MANAGE_WORK_SHIFTS` (1 permission làm cả 3 việc)

2. ✅ **Giữ RBAC patterns** cho view operations
   - ✅ Giữ: `VIEW_SCHEDULE_ALL` (admin/manager xem tất cả)
   - ✅ Giữ: `VIEW_SCHEDULE_OWN` (employee xem của mình)

3. ✅ **Giữ workflow permissions** quan trọng
   - ✅ Giữ: `APPROVE_TIME_OFF`, `APPROVE_OVERTIME`

4. ❌ **Xóa 125 permissions không dùng**
   - Bao gồm: Toàn bộ CACHE_MANAGEMENT module (25 perms)
   - Bao gồm: 21 permissions duplicate trong LEAVE_MANAGEMENT

---

## 📦 FILES ĐÃ TẠO

### 1. `src/constants/bePermissions.ts`
**Single source of truth** cho 70 permissions của BE.

```typescript
export const BE_PERMISSIONS = {
  // SCHEDULE_MANAGEMENT (6 permissions - giảm từ 27!)
  VIEW_SCHEDULE_ALL: 'VIEW_SCHEDULE_ALL',
  VIEW_SCHEDULE_OWN: 'VIEW_SCHEDULE_OWN',
  MANAGE_WORK_SHIFTS: 'MANAGE_WORK_SHIFTS',
  MANAGE_WORK_SLOTS: 'MANAGE_WORK_SLOTS',
  MANAGE_PART_TIME_REGISTRATIONS: 'MANAGE_PART_TIME_REGISTRATIONS',
  MANAGE_FIXED_REGISTRATIONS: 'MANAGE_FIXED_REGISTRATIONS',

  // LEAVE_MANAGEMENT (8 permissions - giảm từ 35!)
  VIEW_TIME_OFF_ALL: 'VIEW_TIME_OFF_ALL',
  VIEW_TIME_OFF_OWN: 'VIEW_TIME_OFF_OWN',
  CREATE_TIME_OFF: 'CREATE_TIME_OFF',
  APPROVE_TIME_OFF: 'APPROVE_TIME_OFF',
  VIEW_OVERTIME_ALL: 'VIEW_OVERTIME_ALL',
  VIEW_OVERTIME_OWN: 'VIEW_OVERTIME_OWN',
  CREATE_OVERTIME: 'CREATE_OVERTIME',
  APPROVE_OVERTIME: 'APPROVE_OVERTIME',
  
  // ... 54 permissions khác
} as const;
```

### 2. `src/constants/permissionMapping.ts`
**Mapping layer** để backward compatibility.

```typescript
export const PERMISSION_MAPPING: Record<string, string | null> = {
  // Old → New mapping
  'CREATE_WORK_SHIFT': 'MANAGE_WORK_SHIFTS',
  'UPDATE_WORK_SHIFT': 'MANAGE_WORK_SHIFTS',
  'DELETE_WORK_SHIFT': 'MANAGE_WORK_SHIFTS',
  'VIEW_WORK_SHIFTS': 'MANAGE_WORK_SHIFTS',
  
  // Removed features → null
  'VIEW_RENEWAL_OWN': null,
  'RESPOND_RENEWAL_OWN': null,
  
  // ... 100+ mappings
};

// Helper function with auto-mapping
export function checkPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Admin bypass
  if (userPermissions.includes('ROLE_ADMIN')) return true;
  
  // Map old → new
  const mapped = PERMISSION_MAPPING[requiredPermission] || requiredPermission;
  
  // Check
  return userPermissions.includes(mapped);
}
```

---

## 🔧 CÁCH SỬ DỤNG

### ❌ TRƯỚC (Sai - tìm permissions không tồn tại):

```typescript
// pages/admin/work-shifts.tsx
const canView = user?.permissions?.includes('VIEW_WORK_SHIFTS');  // ❌ Không có trong BE
const canCreate = user?.permissions?.includes('CREATE_WORK_SHIFT'); // ❌ Không có
const canUpdate = user?.permissions?.includes('UPDATE_WORK_SHIFT'); // ❌ Không có
```

### ✅ SAU (Đúng - dùng helper function):

```typescript
// pages/admin/work-shifts.tsx
import { checkPermission } from '@/constants/permissionMapping';
import { BE_PERMISSIONS } from '@/constants/bePermissions';

const canManage = checkPermission(user?.permissions || [], BE_PERMISSIONS.MANAGE_WORK_SHIFTS);

// Hoặc nếu muốn chi tiết:
const canView = isAdmin || canManage;  // MANAGE bao gồm VIEW
const canCreate = canManage;
const canUpdate = canManage;
const canDelete = canManage;
```

### ✅ HOẶC (Backward compatible - dùng old permission names):

```typescript
// Vẫn hoạt động vì checkPermission() tự động map
const canCreate = checkPermission(user?.permissions || [], 'CREATE_WORK_SHIFT');
// → Tự động map sang MANAGE_WORK_SHIFTS
```

---

## 📝 MAPPING CHO CÁC MODULE QUAN TRỌNG

### 1. WORK SHIFTS

| Old Permission (FE) | New Permission (BE) | Notes |
|---------------------|---------------------|-------|
| `VIEW_WORK_SHIFTS` | `MANAGE_WORK_SHIFTS` | Admin có MANAGE thì có VIEW |
| `CREATE_WORK_SHIFT` | `MANAGE_WORK_SHIFTS` | Merged |
| `UPDATE_WORK_SHIFT` | `MANAGE_WORK_SHIFTS` | Merged |
| `DELETE_WORK_SHIFT` | `MANAGE_WORK_SHIFTS` | Merged |

### 2. EMPLOYEE SCHEDULE

| Old Permission (FE) | New Permission (BE) | Notes |
|---------------------|---------------------|-------|
| `VIEW_SHIFTS_ALL` | `VIEW_SCHEDULE_ALL` | Renamed |
| `VIEW_SHIFTS_OWN` | `VIEW_SCHEDULE_OWN` | Renamed |
| `CREATE_SHIFTS` | `MANAGE_WORK_SHIFTS` | Merged |

### 3. PART-TIME REGISTRATION

| Old Permission (FE) | New Permission (BE) | Notes |
|---------------------|---------------------|-------|
| `VIEW_REGISTRATION_ALL` | `MANAGE_PART_TIME_REGISTRATIONS` | View included in MANAGE |
| `VIEW_REGISTRATION_OWN` | `VIEW_SCHEDULE_OWN` | Xem lịch của mình |
| `CREATE_REGISTRATION` | `MANAGE_PART_TIME_REGISTRATIONS` | Merged |

### 4. TIME-OFF / LEAVE

| Old Permission (FE) | New Permission (BE) | Notes |
|---------------------|---------------------|-------|
| `VIEW_TIMEOFF_ALL` | `VIEW_TIME_OFF_ALL` | Renamed |
| `VIEW_TIMEOFF_OWN` | `VIEW_TIME_OFF_OWN` | Renamed |
| `CREATE_TIMEOFF` | `CREATE_TIME_OFF` | Renamed |
| `APPROVE_TIMEOFF` | `APPROVE_TIME_OFF` | Renamed |
| `REJECT_TIMEOFF` | `APPROVE_TIME_OFF` | Same permission |
| `VIEW_LEAVE_TYPE` | `APPROVE_TIME_OFF` | Manager có quyền xem types |
| `MANAGE_LEAVE_TYPE` | `APPROVE_TIME_OFF` | Manager quản lý types |
| `VIEW_LEAVE_BALANCE` | `VIEW_TIME_OFF_ALL` | View all includes balance |
| `ADJUST_LEAVE_BALANCE` | `APPROVE_TIME_OFF` | Manager adjust balance |

### 5. OVERTIME

| Old Permission (FE) | New Permission (BE) | Notes |
|---------------------|---------------------|-------|
| `VIEW_OVERTIME_ALL` | `VIEW_OVERTIME_ALL` | No change |
| `VIEW_OVERTIME_OWN` | `VIEW_OVERTIME_OWN` | No change |
| `CREATE_OVERTIME` | `CREATE_OVERTIME` | No change |
| `APPROVE_OVERTIME` | `APPROVE_OVERTIME` | No change |
| `REJECT_OVERTIME` | `APPROVE_OVERTIME` | Same permission |

### 6. REMOVED FEATURES (Map to `null`)

| Old Permission (FE) | New Permission (BE) | Notes |
|---------------------|---------------------|-------|
| `VIEW_RENEWAL_OWN` | `null` | Feature removed |
| `RESPOND_RENEWAL_OWN` | `null` | Feature removed |

---

## 🚀 ACTION ITEMS

### ✅ BẮT BUỘC PHẢI LÀM:

1. **Import helper functions** vào tất cả pages:
   ```typescript
   import { checkPermission } from '@/constants/permissionMapping';
   import { BE_PERMISSIONS } from '@/constants/bePermissions';
   ```

2. **Cập nhật permission checks** trong các pages:
   - `/admin/work-shifts` → `MANAGE_WORK_SHIFTS`
   - `/admin/registrations` → `MANAGE_PART_TIME_REGISTRATIONS` hoặc `MANAGE_FIXED_REGISTRATIONS`
   - `/admin/schedules` → `VIEW_SCHEDULE_ALL`/`VIEW_SCHEDULE_OWN`
   - `/admin/time-off-requests` → `VIEW_TIME_OFF_ALL`, `CREATE_TIME_OFF`, `APPROVE_TIME_OFF`
   - `/admin/overtime-requests` → `VIEW_OVERTIME_ALL`, `CREATE_OVERTIME`, `APPROVE_OVERTIME`
   - `/employee/*` → Dùng `VIEW_*_OWN` permissions

3. **Cập nhật `ProtectedRoute` components**:
   ```typescript
   <ProtectedRoute
     requiredPermissions={[BE_PERMISSIONS.MANAGE_WORK_SHIFTS]}
     requireAll={false}
   >
   ```

4. **Test kỹ với roles khác ADMIN**:
   - ROLE_RECEPTIONIST
   - ROLE_MANAGER
   - ROLE_EMPLOYEE
   - ROLE_DENTIST

### ❌ KHÔNG NÊN LÀM:

- ❌ Yêu cầu BE thêm lại 125 permissions đã xóa
- ❌ Tạo permissions ảo ở FE không match với BE
- ❌ Hard-code admin bypass mà không check permissions thật

---

## 🧪 TESTING CHECKLIST

### 1. Work Shifts Page
- [ ] Admin có thể xem danh sách ca làm
- [ ] Admin có thể tạo/sửa/xóa ca làm
- [ ] Manager có thể xem nhưng không sửa (nếu không có MANAGE_WORK_SHIFTS)
- [ ] Employee không thể truy cập

### 2. Registrations Page
- [ ] Admin có thể xem tất cả registrations
- [ ] Employee chỉ xem được registrations của mình
- [ ] PART_TIME_FLEX employee có thể đăng ký ca part-time
- [ ] Full-time employee chỉ xem fixed registrations

### 3. Time-Off Requests Page
- [ ] Admin/Manager có thể xem tất cả requests (VIEW_TIME_OFF_ALL)
- [ ] Admin/Manager có thể approve/reject (APPROVE_TIME_OFF)
- [ ] Employee chỉ xem được requests của mình (VIEW_TIME_OFF_OWN)
- [ ] Employee có thể tạo request (CREATE_TIME_OFF)

### 4. Overtime Requests Page
- [ ] Admin/Manager có thể xem tất cả requests (VIEW_OVERTIME_ALL)
- [ ] Admin/Manager có thể approve/reject (APPROVE_OVERTIME)
- [ ] Employee chỉ xem được requests của mình (VIEW_OVERTIME_OWN)
- [ ] Employee có thể tạo request (CREATE_OVERTIME)

---

## 📚 TÀI LIỆU THAM KHẢO

- `BE_ROLE_PERMISSION_OPTIMIZATION_2025-12-19.md` (Backend)
- `API_PERMISSION_MANAGEMENT.md` (Backend)
- `ROLE_PERMISSION_OPTIMIZATION_CHANGES.md` (Backend)
- `src/constants/bePermissions.ts` (Frontend - Single source of truth)
- `src/constants/permissionMapping.ts` (Frontend - Mapping layer)

---

## ❓ FAQ

### Q: Tại sao không có `VIEW_WORK_SHIFTS` permission?
**A**: Backend đã merge vào `MANAGE_WORK_SHIFTS`. Nếu có quyền MANAGE thì tự động có quyền VIEW.

### Q: Tại sao `REJECT_TIMEOFF` và `APPROVE_TIMEOFF` dùng chung permission?
**A**: Backend logic: Nếu có quyền approve thì cũng có quyền reject. Không cần tách riêng.

### Q: Module RENEWAL đi đâu rồi?
**A**: Backend đã xóa module này (merged vào schedule management).

### Q: Làm sao biết permission nào còn tồn tại?
**A**: Xem file `src/constants/bePermissions.ts` - đây là **single source of truth**.

### Q: Có thể yêu cầu BE thêm permission mới không?
**A**: Có, nhưng phải:
1. Mô tả rõ use case
2. Giải thích tại sao không dùng được permissions hiện tại
3. BE sẽ review và thêm nếu hợp lý

---

## 🎉 KẾT LUẬN

✅ **Backend KHÔNG THIẾU permissions**  
✅ **Backend đã CONSOLIDATE permissions một cách có chủ đích**  
✅ **Frontend cần sử dụng helper functions để tự động map**

**Next Steps**:
1. Import `checkPermission()` và `BE_PERMISSIONS` vào tất cả pages
2. Thay thế tất cả permission checks bằng `checkPermission()`
3. Test kỹ với roles khác ADMIN
4. Deploy và monitor

---

**Last Updated**: 2025-12-23  
**Author**: Kiro AI Assistant  
**Status**: ✅ READY TO IMPLEMENT
