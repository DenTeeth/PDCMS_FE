# Permission Backward Compatibility Guide

## Ngày: 2025-12-23

---

## Vấn đề

Khi BE thay đổi permission naming convention (ví dụ: `CREATE_*` → `MANAGE_*`), FE không thể đơn giản thay đổi code vì:

1. **Roles đã được cấu hình trong database** với permissions cũ
2. **Admin đã gán permissions** cho từng role cụ thể
3. **Thay đổi code = break tất cả roles hiện có**

---

## Giải pháp: Backward Compatible Approach

### Pattern: Hỗ trợ CẢ HAI tên permission

```typescript
// ❌ WRONG - Chỉ check permission mới
const canCreate = user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false;

// ✅ CORRECT - Check cả permission cũ VÀ mới
const canCreate = isAdmin || 
  user?.permissions?.includes('CREATE_WORK_SHIFT') ||      // Tên cũ
  user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false; // Tên mới
```

### Luôn check Admin bypass trước

```typescript
const isAdmin = user?.baseRole === 'admin' || user?.roles?.includes('ROLE_ADMIN');

const canCreate = isAdmin || /* permission checks */;
const canUpdate = isAdmin || /* permission checks */;
const canDelete = isAdmin || /* permission checks */;
```

---

## Checklist: Các trang cần kiểm tra

### ✅ Đã fix
- [x] `/admin/work-shifts` - Hỗ trợ cả `CREATE_WORK_SHIFT` và `MANAGE_WORK_SHIFTS`

### 🔍 Cần kiểm tra

#### Schedule/Shifts Related
- [ ] `/admin/shift-calendar` - Check `MANAGE_WORK_SHIFTS` vs old names
- [ ] `/employee/shift-calendar` - Check `VIEW_SCHEDULE_OWN` vs old names
- [ ] `/employee/my-calendar` - Check permissions

#### Registration Related
- [ ] `/employee/registrations` - Check `MANAGE_PART_TIME_REGISTRATIONS` vs old names
- [ ] `/admin/registrations` (if exists) - Check permissions

#### Time-off Related
- [ ] `/admin/time-off-requests` - Check `CREATE_TIME_OFF`, `APPROVE_TIME_OFF`
- [ ] `/employee/time-off-requests` - Check `CREATE_TIME_OFF`, `VIEW_LEAVE_OWN`

#### Overtime Related
- [ ] `/admin/overtime-requests` - Check `CREATE_OVERTIME`, `APPROVE_OVERTIME`
- [ ] `/employee/overtime-requests` - Check `CREATE_OVERTIME`, `VIEW_OT_OWN`

#### Account Management
- [ ] `/admin/roles` - Check `MANAGE_ROLE` vs old names
- [ ] `/admin/accounts` - Check `MANAGE_ACCOUNT` vs old names
- [ ] `/admin/accounts/employees` - Check `MANAGE_EMPLOYEE` vs old names
- [ ] `/admin/accounts/users` - Check `MANAGE_PATIENT` vs old names

#### Booking Related
- [ ] `/admin/booking/services` - Check `MANAGE_SERVICE` vs old names
- [ ] `/admin/booking/rooms` - Check `MANAGE_ROOM` vs old names
- [ ] `/admin/booking/appointments` - Check permissions

#### Treatment Plans
- [ ] `/admin/treatment-plans` - Check `MANAGE_TREATMENT_PLAN` vs old names
- [ ] `/dentist/treatment-plans` (if exists) - Check permissions

---

## Cách kiểm tra từng trang

### Bước 1: Tìm permission checks
```bash
# Search for permission checks in file
grep -n "permissions?.includes" path/to/page.tsx
```

### Bước 2: Kiểm tra pattern
```typescript
// Tìm các dòng như:
const canCreate = user?.permissions?.includes('SOME_PERMISSION') || false;
```

### Bước 3: So sánh với BE seed data
- Mở `PDCMS_FE/src/types/permission.ts`
- Kiểm tra permission có tồn tại không
- Kiểm tra có comment `@deprecated` không

### Bước 4: Update nếu cần
```typescript
// Nếu permission cũ khác với BE seed data, thêm backward compatibility:
const canCreate = isAdmin || 
  user?.permissions?.includes('OLD_PERMISSION_NAME') ||    // Tên cũ (nếu có)
  user?.permissions?.includes('NEW_PERMISSION_NAME') || false; // Tên mới (BE)
```

---

## BE Permission Naming Convention

### Pattern hiện tại (BE Seed Data)

| Action | Permission Pattern | Example |
|--------|-------------------|---------|
| View All | `VIEW_*_ALL` | `VIEW_APPOINTMENT_ALL` |
| View Own | `VIEW_*_OWN` | `VIEW_APPOINTMENT_OWN` |
| Create | `CREATE_*` | `CREATE_APPOINTMENT` |
| Manage (CRUD) | `MANAGE_*` | `MANAGE_WORK_SHIFTS` |
| Approve | `APPROVE_*` | `APPROVE_TIME_OFF` |
| Delete (separate) | `DELETE_*` | `DELETE_EMPLOYEE` |

### Mapping cũ → mới

| Old Permission | New Permission | Notes |
|---------------|----------------|-------|
| `CREATE_WORK_SHIFT` | `MANAGE_WORK_SHIFTS` | MANAGE covers CREATE/UPDATE/DELETE |
| `UPDATE_WORK_SHIFT` | `MANAGE_WORK_SHIFTS` | |
| `DELETE_WORK_SHIFT` | `MANAGE_WORK_SHIFTS` | |
| `VIEW_WORK_SHIFT` | `MANAGE_WORK_SHIFTS` or `VIEW_SCHEDULE_ALL` | |
| `VIEW_SHIFTS_ALL` | `VIEW_SCHEDULE_ALL` | Renamed for consistency |
| `VIEW_SHIFTS_OWN` | `VIEW_SCHEDULE_OWN` | Renamed for consistency |

---

## Migration Strategy cho Admin

### Phase 1: Backward Compatible (Hiện tại)
- FE hỗ trợ cả permission cũ và mới
- Roles hiện có vẫn hoạt động bình thường
- Admin có thể từ từ update roles

### Phase 2: Gradual Migration (Tùy chọn)
Admin có thể update từng role:
1. Vào `/admin/roles`
2. Click "Assign Permissions" cho role
3. Thêm permission mới (ví dụ: `MANAGE_WORK_SHIFTS`)
4. Test kỹ với user có role đó
5. Xóa permissions cũ sau khi confirm OK

### Phase 3: Cleanup (Tương lai)
Sau khi tất cả roles đã update:
- Remove old permission checks từ code
- Chỉ giữ lại new permission checks
- Update documentation

---

## Testing Checklist

Khi update permission checks cho một trang:

- [ ] Admin có thể truy cập trang
- [ ] Admin có thể thực hiện tất cả actions (create/update/delete)
- [ ] User với permission cũ vẫn có thể truy cập
- [ ] User với permission mới có thể truy cập
- [ ] User không có permission thấy error message phù hợp
- [ ] Buttons/features bị disable đúng cách khi không có permission
- [ ] Console không có error về permissions

---

## Lưu ý quan trọng

⚠️ **KHÔNG BAO GIỜ** đơn giản thay thế permission name trong code!

**Lý do**:
- Roles được cấu hình trong database với permissions cụ thể
- Thay đổi code = break tất cả roles hiện có
- Admin phải manually update từng role (rất mất công)

**Thay vào đó**:
- Hỗ trợ cả permission cũ VÀ mới (OR logic)
- Để admin tự quyết định khi nào migrate roles
- Chỉ remove old checks sau khi confirm tất cả roles đã update

---

## Contact

Nếu có thắc mắc về permission strategy, liên hệ:
- FE Team Lead
- BE Team Lead (để confirm permission naming convention)
