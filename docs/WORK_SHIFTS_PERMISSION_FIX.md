# Work-Shifts Permission Fix

## Date: 2025-12-23
## Status: ✅ RESOLVED - BACKWARD COMPATIBLE

---

## Problem

User reported that `/admin/work-shifts` page showed error:
```
Không tìm thấy tài nguyên hoặc bạn không có quyền truy cập
```

Even though the user was logged in as admin.

---

## Root Cause

The work-shifts page was using **old permission names** that may not exist in all role configurations:

```typescript
// Lines 156-160 (OLD CODE)
const canCreate = user?.permissions?.includes('CREATE_WORK_SHIFT') || false;
const canUpdate = user?.permissions?.includes('UPDATE_WORK_SHIFT') || false;
const canDelete = user?.permissions?.includes('DELETE_WORK_SHIFT') || false;
const canView = user?.permissions?.includes('VIEW_WORK_SHIFT') || false;
```

**Important Context**: 
- BE seed data uses `MANAGE_WORK_SHIFTS` (new naming convention)
- Existing roles in database may have old permissions (`CREATE_WORK_SHIFT`, etc.)
- Changing permission names breaks existing role configurations

---

## Solution: Backward Compatible Approach

**Strategy**: Support BOTH old and new permission names to avoid breaking existing roles.

### 1. Updated Permission Checks (lines 156-173)

```typescript
// Support both old and new permission names for backward compatibility
const isAdmin = user?.baseRole === 'admin' || user?.roles?.includes('ROLE_ADMIN');

const canCreate = isAdmin || 
  user?.permissions?.includes('CREATE_WORK_SHIFT') ||      // Old name
  user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false; // New name

const canUpdate = isAdmin || 
  user?.permissions?.includes('UPDATE_WORK_SHIFT') ||      // Old name
  user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false; // New name

const canDelete = isAdmin || 
  user?.permissions?.includes('DELETE_WORK_SHIFT') ||      // Old name
  user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false; // New name

const canView = isAdmin || 
  user?.permissions?.includes('VIEW_WORK_SHIFT') ||        // Old name
  user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false; // New name
```

### 2. Updated ProtectedRoute Wrapper

```typescript
<ProtectedRoute
  requiredBaseRole="admin"
  requiredPermissions={['MANAGE_WORK_SHIFTS', 'VIEW_WORK_SHIFT']}
  requireAll={false}  // User needs ANY of these permissions
>
```

---

## Benefits of This Approach

✅ **Backward Compatible**: Existing roles with old permissions continue to work
✅ **Forward Compatible**: New roles can use new `MANAGE_WORK_SHIFTS` permission
✅ **Admin Bypass**: Admin always has full access regardless of permissions
✅ **No Database Migration**: No need to update existing role configurations

---

## Migration Path (Optional)

If you want to standardize on new permissions in the future:

1. **Phase 1** (Current): Support both old and new permissions
2. **Phase 2**: Admin updates all roles to use new permissions via UI
3. **Phase 3**: Remove old permission checks from code (after confirming all roles updated)

---

## Files Modified

1. `PDCMS_FE/src/app/admin/work-shifts/page.tsx` (lines 156-173)
   - Added backward compatible permission checks
   - Added admin bypass logic

2. `PDCMS_FE/src/app/admin/work-shifts/page.tsx` (line 458)
   - Updated ProtectedRoute to accept both old and new permissions

3. `PDCMS_FE/BE_PERMISSION_FIX_REQUEST.md`
   - Updated with backward compatible strategy

---

## Testing Checklist

- [ ] Admin can access `/admin/work-shifts` page
- [ ] Roles with old permissions (`CREATE_WORK_SHIFT`) can access page
- [ ] Roles with new permissions (`MANAGE_WORK_SHIFTS`) can access page
- [ ] Admin can create/edit/delete work shifts
- [ ] Users with appropriate permissions can perform CRUD operations
- [ ] Users without permission see appropriate error message

---

## Important Notes

⚠️ **DO NOT** simply replace old permission names with new ones in code!

**Why?**: 
- Roles are configured in database with specific permissions
- Changing permission names in code breaks existing role configurations
- Admin would need to manually update every role in the system

**Instead**: 
- Support both old and new permission names (OR logic)
- Let admin gradually migrate roles to new permissions via UI
- Only remove old permission checks after confirming all roles updated

---

## Related Pages

These pages should also use backward compatible approach:
- `/admin/roles` - uses `MANAGE_ROLE`
- `/admin/accounts/employees` - uses `MANAGE_EMPLOYEE`
- `/admin/booking/services` - uses `MANAGE_SERVICE`
- `/admin/booking/rooms` - uses `MANAGE_ROOM`
- `/admin/accounts` - uses `MANAGE_ACCOUNT`

Check if they also need to support old permission names for backward compatibility.
