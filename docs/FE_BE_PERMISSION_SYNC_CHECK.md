# FE-BE Permission Synchronization Check

## Date: 2025-12-23
## Status: 🔍 IN PROGRESS

---

## BE Changes Summary (from BE docs)

### 1. Permissions Removed (52 total)

#### CACHE_MANAGEMENT Module (25 permissions) - COMPLETELY REMOVED
```
VIEW_CACHE_STATS, CLEAR_CACHE_ALL, CLEAR_CACHE_ROLE, etc.
```
**FE Action**: ❌ Remove all CACHE_MANAGEMENT permission checks

#### LEAVE_MANAGEMENT Consolidation (21 removed)
| Old Permission (REMOVED) | New Permission (USE THIS) | Status |
|-------------------------|---------------------------|--------|
| `VIEW_TIMEOFF_TYPE_ALL` | `VIEW_LEAVE_TYPE` | ⚠️ Check FE |
| `CREATE_TIMEOFF_TYPE` | `MANAGE_LEAVE_TYPE` | ⚠️ Check FE |
| `UPDATE_TIMEOFF_TYPE` | `MANAGE_LEAVE_TYPE` | ⚠️ Check FE |
| `DELETE_TIMEOFF_TYPE` | `MANAGE_LEAVE_TYPE` | ⚠️ Check FE |
| `VIEW_LEAVE_BALANCE_ALL` | `VIEW_LEAVE_BALANCE` | ⚠️ Check FE |
| `VIEW_OT_ALL` | `VIEW_OVERTIME_ALL` | ⚠️ Check FE |
| `CREATE_OT` | `CREATE_OVERTIME` | ✅ FE already uses |
| `CANCEL_OT` | `CANCEL_OVERTIME` | ✅ FE already uses |
| `APPROVE_OT` | `APPROVE_OVERTIME` | ⚠️ Check FE |
| `REJECT_OT` | `REJECT_OVERTIME` | ⚠️ Check FE |

#### Other Removals
- ~~`VIEW_APPOINTMENT`~~ → Use `VIEW_APPOINTMENT_ALL` or `VIEW_APPOINTMENT_OWN`

---

## FE Permission Usage Analysis

### ✅ Already Correct (No Changes Needed)

These FE pages already use correct BE permissions:

1. **Treatment Plans**
   - `CREATE_TREATMENT_PLAN` ✅
   - `UPDATE_TREATMENT_PLAN` ✅
   - `APPROVE_TREATMENT_PLAN` ✅
   - `MANAGE_PLAN_PRICING` ✅
   - `VIEW_TREATMENT_PLAN_ALL` ✅
   - `VIEW_TREATMENT_PLAN_OWN` ✅

2. **Appointments**
   - `CREATE_APPOINTMENT` ✅
   - `VIEW_APPOINTMENT_ALL` ✅
   - `VIEW_APPOINTMENT_OWN` ✅
   - `UPDATE_APPOINTMENT_STATUS` ✅

3. **Services**
   - `VIEW_SERVICE` ✅
   - `MANAGE_SERVICE` ✅

4. **Rooms**
   - `VIEW_ROOM` ✅
   - `MANAGE_ROOM` ✅

5. **Employees**
   - `MANAGE_EMPLOYEE` ✅
   - `DELETE_EMPLOYEE` ✅
   - `VIEW_EMPLOYEE` ✅

6. **Roles**
   - `MANAGE_ROLE` ✅
   - `VIEW_ROLE` ✅

7. **Accounts**
   - `MANAGE_ACCOUNT` ✅
   - `VIEW_ACCOUNT` ✅

8. **Overtime** (Employee pages)
   - `CREATE_OVERTIME` ✅
   - `CANCEL_OVERTIME_OWN` ✅

9. **Schedule**
   - `VIEW_SCHEDULE_ALL` ✅
   - `VIEW_SCHEDULE_OWN` ✅

10. **Work Shifts**
    - `MANAGE_WORK_SHIFTS` ✅ (with backward compatibility)

---

### ⚠️ Needs Review/Update

#### 1. Employee Shift Calendar (`/employee/shift-calendar`)
**Current Code**:
```typescript
const canCreate = user?.permissions?.includes('CREATE_SHIFTS') || false;
const canUpdate = user?.permissions?.includes('UPDATE_SHIFTS') || false;
const canDelete = user?.permissions?.includes('DELETE_SHIFTS') || false;
const canViewSummary = user?.permissions?.includes('VIEW_SHIFTS_SUMMARY') || false;
```

**BE Has**:
- `MANAGE_WORK_SHIFTS` (covers CREATE/UPDATE/DELETE)
- `MANAGE_WORK_SLOTS`
- `VIEW_SCHEDULE_ALL`
- `VIEW_SCHEDULE_OWN`

**Action**: ⚠️ Check if `CREATE_SHIFTS`, `UPDATE_SHIFTS`, `DELETE_SHIFTS`, `VIEW_SHIFTS_SUMMARY` exist in BE seed data

#### 2. Customer Contacts
**Current Code**:
```typescript
const canDelete = user?.permissions?.includes('customer-contacts.delete');
const canEdit = user?.permissions?.includes('customer-contacts.update');
const canDelete = user?.permissions?.includes('DELETE_CONTACT');
```

**BE Has**:
- `VIEW_CUSTOMER_CONTACT`
- `MANAGE_CUSTOMER_CONTACT` (covers create/update/delete)

**Action**: ⚠️ Update to use `MANAGE_CUSTOMER_CONTACT` or add backward compatibility

#### 3. Admin Time-Off Requests
**Current Code** (from previous context):
```typescript
const canCreate = user?.permissions?.includes('CREATE_TIME_OFF');
const canApprove = user?.permissions?.includes('APPROVE_TIME_OFF');
```

**BE Has**:
- `CREATE_TIME_OFF` ✅
- `APPROVE_TIME_OFF` ✅
- `VIEW_LEAVE_ALL` ✅
- `VIEW_LEAVE_OWN` ✅

**Action**: ✅ Already correct

#### 4. Admin Overtime Requests
**Current Code**:
```typescript
const canCreate = user?.permissions?.includes('CREATE_OVERTIME');
const canApprove = user?.permissions?.includes('APPROVE_OVERTIME');
const canReject = user?.permissions?.includes('APPROVE_OVERTIME'); // Same permission
```

**BE Has**:
- `CREATE_OVERTIME` ✅
- `APPROVE_OVERTIME` ✅
- `REJECT_OVERTIME` ✅
- `VIEW_OVERTIME_ALL` (was `VIEW_OT_ALL`)

**Action**: ⚠️ Check if FE uses `VIEW_OT_ALL` anywhere

---

## Critical Issues to Fix

### 🔴 HIGH PRIORITY

#### Issue 1: CACHE_MANAGEMENT Permissions
**Problem**: BE removed entire CACHE_MANAGEMENT module (25 permissions)

**FE Check**: Search for any usage of:
```bash
grep -r "CACHE_" PDCMS_FE/src/
```

**Action**: Remove all CACHE_MANAGEMENT permission checks from FE

#### Issue 2: Shift Management Permissions
**Problem**: FE uses `CREATE_SHIFTS`, `UPDATE_SHIFTS`, `DELETE_SHIFTS` but BE may not have these

**BE Has**:
- `MANAGE_WORK_SHIFTS`
- `MANAGE_WORK_SLOTS`
- `MANAGE_PART_TIME_REGISTRATIONS`
- `MANAGE_FIXED_REGISTRATIONS`

**Action**: Update FE to use correct BE permissions or add backward compatibility

#### Issue 3: Customer Contact Permissions
**Problem**: FE uses inconsistent permission names

**Current FE**:
- `customer-contacts.delete` (kebab-case)
- `DELETE_CONTACT` (SCREAMING_SNAKE_CASE)

**BE Has**:
- `VIEW_CUSTOMER_CONTACT`
- `MANAGE_CUSTOMER_CONTACT`

**Action**: Standardize to use BE permission names

---

## Backward Compatibility Strategy

### Current Approach (Work-Shifts Page)
```typescript
// Support both old and new permission names
const canCreate = isAdmin || 
  user?.permissions?.includes('CREATE_WORK_SHIFT') ||      // Old name
  user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false; // New name
```

### Recommended Pattern for All Pages
```typescript
// Helper function in utils
export function hasAnyPermission(
  user: User | null,
  permissions: string[]
): boolean {
  if (!user) return false;
  if (user.baseRole === 'admin' || user.roles?.includes('ROLE_ADMIN')) {
    return true; // Admin bypass
  }
  return permissions.some(p => user.permissions?.includes(p));
}

// Usage in components
const canCreate = hasAnyPermission(user, [
  'CREATE_WORK_SHIFT',      // Old name (backward compat)
  'MANAGE_WORK_SHIFTS'      // New name (BE standard)
]);
```

---

## Testing Checklist

### Phase 1: Permission Verification
- [ ] Extract all unique permissions used in FE code
- [ ] Compare with BE seed data (167 permissions)
- [ ] Identify missing permissions
- [ ] Identify deprecated permissions

### Phase 2: Page-by-Page Testing
- [ ] Admin pages (work-shifts, roles, accounts, employees, services, rooms)
- [ ] Employee pages (shift-calendar, my-calendar, registrations, time-off, overtime)
- [ ] Patient pages (treatment-plans, appointments)
- [ ] Shared components (ProtectedRoute, navigation)

### Phase 3: Role-Based Testing
- [ ] Login as ROLE_ADMIN - should have full access
- [ ] Login as ROLE_DENTIST - test treatment plan permissions
- [ ] Login as ROLE_RECEPTIONIST - test appointment permissions
- [ ] Login as ROLE_NURSE - test clinical record permissions
- [ ] Login as ROLE_PATIENT - test patient portal

### Phase 4: Cache Testing
- [ ] First request - should be slower (cache MISS)
- [ ] Second request - should be faster (cache HIT)
- [ ] After role update - cache should be evicted
- [ ] After permission update - cache should be evicted

---

## Action Items

### Immediate (Today)
1. [ ] Search FE for `CACHE_` permissions - remove if found
2. [ ] Check `CREATE_SHIFTS`, `UPDATE_SHIFTS`, `DELETE_SHIFTS` usage
3. [ ] Standardize customer contact permissions
4. [ ] Add backward compatibility to critical pages

### Short Term (This Week)
1. [ ] Create comprehensive permission mapping document
2. [ ] Update all pages to use backward compatible approach
3. [ ] Test with actual BE API (167 permissions)
4. [ ] Update FE permission constants file

### Long Term (Next Sprint)
1. [ ] Remove old permission checks after confirming all roles updated
2. [ ] Implement permission helper utilities
3. [ ] Add permission validation tests
4. [ ] Document permission best practices

---

## Files to Check

### High Priority
- [ ] `src/app/employee/shift-calendar/page.tsx` - Uses `CREATE_SHIFTS`, etc.
- [ ] `src/app/employee/customer-contacts/**/*.tsx` - Uses `customer-contacts.*`
- [ ] `src/app/admin/customer-contacts/**/*.tsx` - Uses `DELETE_CONTACT`
- [ ] `src/constants/navigationConfig.ts` - Permission-based navigation
- [ ] `src/types/permission.ts` - Permission enum definitions

### Medium Priority
- [ ] All admin pages - Verify MANAGE_* pattern
- [ ] All employee pages - Verify VIEW_*_OWN pattern
- [ ] All patient pages - Verify VIEW_*_OWN pattern

### Low Priority
- [ ] Shared components - Permission checks
- [ ] Utility functions - Permission helpers
- [ ] Test files - Permission mocks

---

## Next Steps

1. **Run Permission Audit Script**:
   ```bash
   # Extract all permissions from FE
   grep -roh "permissions?.includes\('[^']*'\)" PDCMS_FE/src/ | sort | uniq
   
   # Compare with BE seed data
   # BE has 167 permissions across 12 modules
   ```

2. **Create Permission Mapping**:
   - Map FE permission checks to BE permissions
   - Identify gaps and mismatches
   - Document required changes

3. **Implement Fixes**:
   - Add backward compatibility where needed
   - Update permission constants
   - Test thoroughly

4. **Deploy and Monitor**:
   - Deploy to staging
   - Monitor for permission errors
   - Collect feedback from QA team

---

## Contact

- **FE Team**: Review this document and provide feedback
- **BE Team**: Confirm permission list is accurate
- **QA Team**: Test permission-based access control

**Last Updated**: 2025-12-23
