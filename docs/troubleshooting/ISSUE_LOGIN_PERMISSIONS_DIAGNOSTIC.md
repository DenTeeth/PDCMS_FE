# LOGIN & PERMISSION ISSUES DIAGNOSTIC REPORT

## ⚠️ VẤN ĐỀ BÁO CÁO

**User reports:**
- ✅ Backend (localhost:8080) login works
- ❌ Frontend (localhost:3000) login doesn't work
- ❌ Mất quyền nhiều chổ (losing permissions in many places)

---

## 🔍 PHÂN TÍCH NGUYÊN NHÂN

### 1. **Permission Mismatch Between FE & BE**

**Frontend**: Định nghĩa **229 permissions** trong `src/types/permission.ts`
```typescript
export enum Permission {
  CREATE_TREATMENT = 'CREATE_TREATMENT',
  VIEW_TREATMENT = 'VIEW_TREATMENT',
  // ... 229 permissions total
}
```

**Backend SQL**: Chỉ có **~125 permissions** trong `dental-clinic-seed-data.sql`
- Module 1: ACCOUNT (4 permissions)
- Module 2: EMPLOYEE (6 permissions)  
- Module 3: PATIENT (4 permissions)
- Module 4: TREATMENT (4 permissions)
- Module 5: APPOINTMENT (9 permissions)
- Module 6: CUSTOMER_MANAGEMENT (8 permissions)
- Module 7: SCHEDULE_MANAGEMENT (31 permissions)
- Module 8: LEAVE_MANAGEMENT (35 permissions)
- Module 9: SYSTEM_CONFIGURATION (12 permissions)
- Module 10: HOLIDAY (4 permissions)
- Module 11: ROOM_MANAGEMENT (5 permissions)
- Module 12: SERVICE_MANAGEMENT (4 permissions)
- Module 13: TREATMENT_PLAN (8 permissions)
- Module 14: WAREHOUSE (17 permissions)
- Module 15: PATIENT_IMAGES (8 permissions)
- Module 16: NOTIFICATION (3 permissions)
- Module 17: CLINICAL_RECORDS (5 permissions)

**Frontend permissions NOT in Backend:**
```typescript
// These permissions are defined in FE but missing in BE SQL:
UPDATE_SPECIALIZATION
DELETE_SPECIALIZATION
UPDATE_ROLE
DELETE_ROLE
UPDATE_PERMISSION
DELETE_PERMISSION
CREATE_LEAVE_TYPE (deprecated - now MANAGE_LEAVE_TYPE)
UPDATE_LEAVE_TYPE (deprecated)
DELETE_LEAVE_TYPE (deprecated)
// ... and many more
```

---

### 2. **Authentication Flow Analysis**

**Kiểm tra code flow:**

#### ✅ Login Page ([src/app/(public)/login/page.tsx](src/app/(public)/login/page.tsx))
```typescript
// CORRECT - Calls AuthContext login
await login({
  username: username.trim(),
  password: password,
});
```

#### ✅ AuthContext ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx))
```typescript
// Line 143-258: LOGIN FUNCTION
const login = async (credentials: LoginRequest) => {
  const response = await apiClient.login(credentials);
  
  const userData: User = {
    username: response.username,
    permissions: response.permissions, // ⚠️ CRITICAL: BE must return this!
    groupedPermissions: response.groupedPermissions,
    baseRole: response.baseRole, // ⚠️ CRITICAL: BE must return this!
    roles: response.roles,
    // ...
  };
  
  setUser(userData);
  setIsAuthenticated(true);
}

// Line 315-341: PERMISSION CHECK FUNCTIONS
const hasPermission = useCallback((permission: string): boolean => {
  if (!user?.permissions) return false; // ❌ Returns false if permissions missing!
  return user.permissions.includes(permission);
}, [user]);
```

#### ✅ API Client ([src/lib/api.ts](src/lib/api.ts))
```typescript
// Line 180-201: LOGIN METHOD
async login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await this.axiosInstance.post<LoginResponse>(
    '/auth/login',
    credentials
  );
  
  // Store token
  if (response.data.token) {
    setToken(response.data.token);
  }
  
  return response.data; // ⚠️ Returns whatever BE sends
}
```

**🔴 CRITICAL FINDING:**
Frontend code is CORRECT! The issue is **Backend is NOT returning `permissions` array** in login response!

---

## 🎯 GIẢI PHÁP

### **Solution 1: Fix Backend Login Response (RECOMMENDED)**

**Backend cần trả về đầy đủ thông tin:**

```java
// Backend: AuthenticationService.java or LoginController.java
public LoginResponse login(LoginRequest request) {
    // ... authenticate user ...
    
    // ✅ MUST return these fields:
    return LoginResponse.builder()
        .token(jwtToken)
        .username(user.getUsername())
        .email(user.getEmail())
        .roles(roles)                    // List<String> of role names
        .permissions(permissions)        // ⚠️ CRITICAL: List<String> of permission names
        .groupedPermissions(grouped)     // Map<String, List<String>> (optional but recommended)
        .baseRole(baseRole)              // ⚠️ CRITICAL: "admin", "employee", or "patient"
        .employmentType(employmentType)  // "FULL_TIME" or "PART_TIME" (for employees)
        .mustChangePassword(false)
        .tokenExpiresAt(expiresAt)
        .refreshTokenExpiresAt(refreshExpiresAt)
        .build();
}
```

**Example correct response:**
```json
{
  "token": "eyJhbGc...",
  "username": "admin",
  "email": "admin@denteeth.com",
  "roles": ["ROLE_ADMIN"],
  "permissions": [
    "VIEW_ACCOUNT",
    "CREATE_ACCOUNT",
    "UPDATE_ACCOUNT",
    "DELETE_ACCOUNT",
    // ... all permissions for admin (125 total)
  ],
  "groupedPermissions": {
    "ACCOUNT": ["VIEW_ACCOUNT", "CREATE_ACCOUNT", "UPDATE_ACCOUNT", "DELETE_ACCOUNT"],
    "EMPLOYEE": ["VIEW_EMPLOYEE", "CREATE_EMPLOYEE", ...],
    // ... grouped by module
  },
  "baseRole": "admin",
  "employmentType": null,
  "mustChangePassword": false,
  "tokenExpiresAt": 1735123456,
  "refreshTokenExpiresAt": 1735209856
}
```

---

### **Solution 2: Sync Frontend Permissions with Backend**

**Update `src/types/permission.ts` to match Backend SQL exactly:**

```typescript
export enum Permission {
  // MODULE 1: ACCOUNT (4)
  VIEW_ACCOUNT = 'VIEW_ACCOUNT',
  CREATE_ACCOUNT = 'CREATE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',

  // MODULE 2: EMPLOYEE (6)
  VIEW_EMPLOYEE = 'VIEW_EMPLOYEE',
  READ_ALL_EMPLOYEES = 'READ_ALL_EMPLOYEES',
  READ_EMPLOYEE_BY_CODE = 'READ_EMPLOYEE_BY_CODE',
  CREATE_EMPLOYEE = 'CREATE_EMPLOYEE',
  UPDATE_EMPLOYEE = 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE = 'DELETE_EMPLOYEE',

  // MODULE 3: PATIENT (4)
  VIEW_PATIENT = 'VIEW_PATIENT',
  CREATE_PATIENT = 'CREATE_PATIENT',
  UPDATE_PATIENT = 'UPDATE_PATIENT',
  DELETE_PATIENT = 'DELETE_PATIENT',

  // ... continue matching SQL exactly ...
  // Remove deprecated permissions
  // Remove FE-only permissions not in BE
}
```

**⚠️ WARNING:** This will require updating all UI code that uses removed permissions!

---

### **Solution 3: Debug Current Login Response**

**Run test script to see what Backend actually returns:**

```bash
cd c:\Users\ASUS-PC\Desktop\PDCMS_FE\PDCMS_FE
npm install --save-dev tsx
npx tsx scripts/test-login-permissions.ts
```

**Update credentials in script first:**
```typescript
// scripts/test-login-permissions.ts
const adminLogin = await axios.post(
  `${API_BASE_URL}/auth/login`,
  {
    username: 'admin',        // ⚠️ Change to your admin username
    password: 'admin123',     // ⚠️ Change to your admin password
  }
);
```

**This will show:**
- ✅ If login works
- ✅ What fields Backend returns
- ❌ What's missing from response
- ✅ If permissions array exists
- ✅ If baseRole exists

---

## 🔧 HÀNH ĐỘNG CẦN LÀM

### **Priority 1: Critical (DO FIRST!)**

1. **Check Backend Login Response**
   ```bash
   # Test với Postman hoặc curl:
   curl -X POST https://pdcms.duckdns.org/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```
   
   **Verify response includes:**
   - ✅ `permissions` array (not empty!)
   - ✅ `baseRole` field ("admin", "employee", or "patient")
   - ✅ `roles` array

2. **If permissions array is missing → FIX BACKEND FIRST!**
   - Update `AuthenticationService.login()` method
   - Add `getPermissionsByRoles()` method
   - Include permissions in `LoginResponse` DTO

### **Priority 2: High**

3. **Run test script to diagnose**
   ```bash
   npx tsx scripts/test-login-permissions.ts
   ```

4. **Check Browser Console during login**
   - Open DevTools (F12)
   - Go to Network tab
   - Login
   - Check `/auth/login` request response
   - Verify `permissions` array exists

5. **Check Browser Console for AuthContext logs**
   ```
   Look for these logs:
   - "� User data prepared:" (should show permissions)
   - " Login successful"
   - "� Access token stored in localStorage"
   ```

### **Priority 3: Medium**

6. **If Backend returns permissions correctly, check localStorage**
   ```javascript
   // In Browser Console:
   JSON.parse(localStorage.getItem('user'))
   
   // Should show:
   // {
   //   username: "admin",
   //   permissions: ["VIEW_ACCOUNT", "CREATE_ACCOUNT", ...],
   //   baseRole: "admin",
   //   ...
   // }
   ```

7. **Sync Frontend permissions enum with Backend SQL**
   - Remove deprecated permissions
   - Add missing permissions
   - Update all components using removed permissions

---

## 📊 EXPECTED RESULTS

After fixes, login should:

1. **Backend returns:**
   ```json
   {
     "permissions": ["VIEW_ACCOUNT", "CREATE_ACCOUNT", ...],
     "baseRole": "admin",
     "roles": ["ROLE_ADMIN"]
   }
   ```

2. **Frontend stores in localStorage:**
   ```json
   {
     "username": "admin",
     "permissions": ["VIEW_ACCOUNT", ...],
     "baseRole": "admin"
   }
   ```

3. **AuthContext hasPermission() works:**
   ```typescript
   hasPermission('VIEW_ACCOUNT') // ✅ true
   hasPermission('CREATE_ACCOUNT') // ✅ true
   hasPermission('FAKE_PERMISSION') // ✅ false (not error)
   ```

4. **Navigation shows correct menu items**
5. **No 401/403 errors on protected routes**

---

## 🚨 COMMON MISTAKES

1. **Backend returns `authorities` instead of `permissions`**
   - ❌ Spring Security default: `authorities: ["ROLE_ADMIN"]`
   - ✅ Need: `permissions: ["VIEW_ACCOUNT", "CREATE_ACCOUNT", ...]`

2. **Backend returns nested structure**
   - ❌ `{ data: { permissions: [...] } }`
   - ✅ `{ permissions: [...] }`

3. **Backend returns permission objects instead of strings**
   - ❌ `permissions: [{id: 1, name: "VIEW_ACCOUNT"}, ...]`
   - ✅ `permissions: ["VIEW_ACCOUNT", ...]`

4. **CORS not allowing cookies**
   - Backend needs: `Access-Control-Allow-Credentials: true`
   - Frontend needs: `withCredentials: true` (already set in apiClient)

---

## 📝 TESTING CHECKLIST

- [ ] Backend returns `permissions` array in login response
- [ ] Backend returns `baseRole` field
- [ ] Frontend stores permissions in localStorage
- [ ] `hasPermission('VIEW_ACCOUNT')` returns true for admin
- [ ] Navigation menu shows correct items based on permissions
- [ ] Protected routes work (no 401 errors)
- [ ] Refresh token works without losing permissions
- [ ] Logout clears permissions

---

## 🔗 FILES TO CHECK

**Frontend:**
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) - Lines 143-258, 315-341
- [src/lib/api.ts](src/lib/api.ts) - Lines 180-201
- [src/types/permission.ts](src/types/permission.ts) - Permission enum
- [src/types/auth.ts](src/types/auth.ts) - LoginResponse interface

**Backend (check these):**
- `AuthenticationService.java` - login() method
- `LoginResponse.java` - DTO structure
- `UserService.java` - getPermissionsByRoles() method
- `application.yml` - CORS configuration

**Database:**
- `docs/files/dental-clinic-seed-data.sql` - Permissions and role_permissions tables

---

## 💡 QUICK FIX (Temporary)

If you need immediate workaround while fixing Backend:

```typescript
// src/contexts/AuthContext.tsx - Line 143
const login = async (credentials: LoginRequest) => {
  const response = await apiClient.login(credentials);
  
  // ⚠️ TEMPORARY FIX: If BE doesn't return permissions, use role-based defaults
  let permissions = response.permissions;
  
  if (!permissions || permissions.length === 0) {
    console.warn('⚠️ Backend did not return permissions! Using role-based defaults...');
    
    // Get default permissions based on role
    if (response.roles?.includes('ROLE_ADMIN')) {
      // Admin gets all permissions (fetch from enum)
      permissions = Object.values(Permission);
    } else if (response.roles?.includes('ROLE_EMPLOYEE')) {
      // Employee gets basic permissions
      permissions = [
        Permission.VIEW_PATIENT,
        Permission.VIEW_APPOINTMENT,
        Permission.VIEW_TREATMENT,
        // ... add more as needed
      ];
    } else {
      // Patient gets minimal permissions
      permissions = [
        Permission.VIEW_APPOINTMENT_OWN,
        Permission.VIEW_TREATMENT_PLAN_OWN,
      ];
    }
  }
  
  const userData: User = {
    ...response,
    permissions, // Use fixed permissions
  };
  
  setUser(userData);
  setIsAuthenticated(true);
};
```

**⚠️ THIS IS NOT A PERMANENT SOLUTION!** Fix the Backend properly!

---

## ✅ CONCLUSION

**Root cause:** Backend is NOT returning `permissions` array in login response.

**Solution:** Fix Backend `AuthenticationService.login()` to include permissions.

**Next steps:**
1. Run test script: `npx tsx scripts/test-login-permissions.ts`
2. Check Backend login response structure
3. Update Backend to return permissions array
4. Verify in frontend that permissions are stored
5. Test permission-based features work correctly

---

Generated: 2024-12-26
