# Debug 403 Permission Errors

## Date: 2025-12-23

---

## Problem

Getting **403 Forbidden** error when calling API endpoints:
```
GET /api/v1/work-shifts?isActive=true
Response: 403 Forbidden
```

---

## Root Causes

### 1. User doesn't have required permission
BE endpoint requires specific permission that user's role doesn't have.

### 2. Permission name mismatch
FE checks for one permission name, but BE requires a different one.

### 3. Token expired or invalid
JWT token is expired or malformed.

### 4. Role not assigned correctly
User's role doesn't have the permission assigned in database.

---

## Debug Steps

### Step 1: Check User Permissions in Console

Open browser console and look for log:
```javascript
👤 Current user: {
  baseRole: "admin",
  roles: ["ROLE_ADMIN"],
  permissions: ["VIEW_ACCOUNT", "CREATE_ACCOUNT", ...],
  isAdmin: true
}
```

**Questions to answer**:
- Is `isAdmin: true`? → Admin should bypass all permission checks
- Does `permissions` array contain required permission?
- Is `permissions` array empty? → Role might not have permissions assigned

### Step 2: Check BE Error Response

Look for error details in console:
```javascript
Error response: {
  timestamp: "2025-12-23T10:30:00",
  status: 403,
  error: "Forbidden",
  message: "Access Denied",
  path: "/api/v1/work-shifts"
}
```

**BE might return**:
- Generic "Access Denied" → Permission check failed
- Specific message → "Required permission: VIEW_WORK_SHIFT"

### Step 3: Check JWT Token

In browser DevTools → Application → Cookies:
- Find `token` cookie
- Copy value
- Go to https://jwt.io
- Paste token
- Check payload:
  ```json
  {
    "sub": "admin",
    "baseRole": "admin",
    "roles": ["ROLE_ADMIN"],
    "permissions": [...],
    "exp": 1703332800
  }
  ```

**Check**:
- Is token expired? (`exp` timestamp < current time)
- Does token have `permissions` array?
- Does token have correct `baseRole`?

### Step 4: Check BE Endpoint Permission Requirement

According to BE docs, check what permission the endpoint requires.

**Common patterns**:
- `GET /work-shifts` → Might require `VIEW_WORK_SHIFT` or `MANAGE_WORK_SHIFTS`
- `POST /work-shifts` → Requires `CREATE_WORK_SHIFT` or `MANAGE_WORK_SHIFTS`
- `PATCH /work-shifts/{id}` → Requires `UPDATE_WORK_SHIFT` or `MANAGE_WORK_SHIFTS`
- `DELETE /work-shifts/{id}` → Requires `DELETE_WORK_SHIFT` or `MANAGE_WORK_SHIFTS`

---

## Common Issues & Solutions

### Issue 1: Admin gets 403
**Symptom**: User with `baseRole='admin'` still gets 403

**Possible Causes**:
1. BE doesn't have admin bypass logic
2. Token doesn't have `baseRole='admin'`
3. BE checks for specific permission even for admin

**Solution**:
```typescript
// FE: Ensure admin bypass in ProtectedRoute
const isAdmin = user?.baseRole === 'admin' || user?.roles?.includes('ROLE_ADMIN');
if (isAdmin) {
  return true; // Bypass all permission checks
}

// BE: Ensure admin bypass in SecurityConfig or @PreAuthorize
@PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('VIEW_WORK_SHIFT')")
```

### Issue 2: Permission name mismatch
**Symptom**: FE checks for `CREATE_WORK_SHIFT` but BE requires `MANAGE_WORK_SHIFTS`

**Solution**: Use backward compatible approach
```typescript
const canCreate = isAdmin || 
  user?.permissions?.includes('CREATE_WORK_SHIFT') ||      // Old name
  user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false; // New name
```

### Issue 3: Role has no permissions
**Symptom**: User's `permissions` array is empty

**Possible Causes**:
1. Role not assigned permissions in database
2. BE didn't include permissions in JWT token
3. Redis cache is stale

**Solution**:
1. Check database:
   ```sql
   SELECT r.role_id, r.role_name, p.permission_id
   FROM roles r
   LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
   LEFT JOIN permissions p ON rp.permission_id = p.permission_id
   WHERE r.role_id = 'ROLE_ADMIN';
   ```

2. Clear Redis cache:
   ```bash
   redis-cli -a redis123
   FLUSHALL
   ```

3. Re-login to get fresh token

### Issue 4: Token expired
**Symptom**: All API calls return 403 after some time

**Solution**:
1. Check token expiration in jwt.io
2. Implement token refresh logic
3. Redirect to login if token expired

---

## Quick Fixes

### Fix 1: Add Debug Logging
```typescript
// In service file
const fetchData = async () => {
  console.log('👤 User:', user);
  console.log('🔑 Permissions:', user?.permissions);
  console.log('🎭 Roles:', user?.roles);
  console.log('👑 Is Admin:', user?.baseRole === 'admin');
  
  try {
    const response = await api.get('/endpoint');
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data);
    console.error('Status:', error.response?.status);
  }
};
```

### Fix 2: Add Admin Bypass
```typescript
// In permission check
const isAdmin = user?.baseRole === 'admin' || user?.roles?.includes('ROLE_ADMIN');
const canAccess = isAdmin || user?.permissions?.includes('REQUIRED_PERMISSION');
```

### Fix 3: Add Backward Compatibility
```typescript
const canAccess = isAdmin || 
  user?.permissions?.includes('OLD_PERMISSION_NAME') ||
  user?.permissions?.includes('NEW_PERMISSION_NAME') || false;
```

---

## Testing Checklist

After fixing 403 errors:

- [ ] Admin can access all endpoints
- [ ] Users with correct permission can access
- [ ] Users without permission get clear error message
- [ ] Token refresh works correctly
- [ ] Console logs show correct user info
- [ ] No infinite redirect loops
- [ ] Error messages are user-friendly

---

## BE Team Action Items

If 403 persists after FE fixes:

1. **Check BE endpoint security annotation**:
   ```java
   @GetMapping("/work-shifts")
   @PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('VIEW_WORK_SHIFT')")
   public ResponseEntity<?> getAllWorkShifts() { ... }
   ```

2. **Verify permission exists in seed data**:
   ```sql
   SELECT * FROM permissions WHERE permission_id = 'VIEW_WORK_SHIFT';
   ```

3. **Check role has permission assigned**:
   ```sql
   SELECT * FROM role_permissions 
   WHERE role_id = 'ROLE_ADMIN' 
   AND permission_id = 'VIEW_WORK_SHIFT';
   ```

4. **Verify JWT token includes permissions**:
   ```java
   // In JwtTokenProvider
   claims.put("permissions", user.getAuthorities());
   ```

5. **Check Redis cache**:
   ```bash
   redis-cli -a redis123
   GET roles::allRoles
   GET permissions::allActive
   ```

---

## Contact

- **FE Issues**: Check FE permission checks and ProtectedRoute
- **BE Issues**: Check BE security annotations and seed data
- **Token Issues**: Check JWT generation and expiration

**Last Updated**: 2025-12-23
