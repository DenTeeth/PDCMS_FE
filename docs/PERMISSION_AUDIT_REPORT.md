# 🔐 BÁO CÁO KIỂM TRA QUYỀN HỆ THỐNG (BE & FE)

**Ngày tạo:** 22/12/2025  
**Người thực hiện:** GitHub Copilot  
**Phiên bản:** 2.0 - ✅ Đã chuẩn hóa FE
**Cập nhật:** 22/12/2025 - Frontend đã hoàn tất chuẩn hóa permissions

---

## ✅ TRẠNG THÁI CẬP NHẬT

### Frontend: ✅ HOÀN TẤT
- ✅ Đã chuẩn hóa Overtime permissions (`*_OT` → `*_OVERTIME`)
- ✅ Đã chuẩn hóa Leave Type permissions (`VIEW_TIMEOFF_TYPE` → `VIEW_LEAVE_TYPE`)
- ✅ Đã cập nhật tất cả usage trong pages và services
- ✅ Đã cập nhật navigationConfig
- ✅ Code đã sẵn sàng để sử dụng

### Backend: ⏳ ĐANG CHỜ
- ⏳ Cần trả về `permissions` array trong login response (CRITICAL)
- ⏳ Cần cập nhật Overtime permissions trong SQL và code
- ⏳ Cần cập nhật Leave Type permissions trong SQL và code
- 📄 Xem chi tiết: [BE_REQUIREMENTS_PERMISSION_STANDARDIZATION.md](BE_REQUIREMENTS_PERMISSION_STANDARDIZATION.md)

---

## 📋 TÓM TẮT

Báo cáo này kiểm tra toàn diện hệ thống phân quyền (permissions) của Frontend và Backend, bao gồm:
- ✅ Phân tích các permissions được định nghĩa trong FE
- ✅ So sánh với BE permissions (từ SQL seed data)
- ✅ Kiểm tra cấu hình sidebar/navigation cho từng role
- ✅ Rà soát usage của permissions trong các module
- ✅ Phát hiện các vấn đề và đưa ra khuyến nghị
- ✅ **HOÀN THÀNH:** Chuẩn hóa toàn bộ permissions trong Frontend

---

## 🎯 I. PHÂN TÍCH PERMISSIONS

### 1.1. Frontend Permissions ([src/types/permission.ts](../src/types/permission.ts))

**Tổng số permissions trong FE:** ~130 permissions được định nghĩa

#### Nhóm permissions chính:

##### **MODULE: TREATMENT**
```typescript
CREATE_TREATMENT
VIEW_TREATMENT
UPDATE_TREATMENT
```

##### **MODULE: APPOINTMENT**
```typescript
CREATE_APPOINTMENT
VIEW_APPOINTMENT
VIEW_APPOINTMENT_ALL      //  Thêm từ BE
VIEW_APPOINTMENT_OWN      //  Thêm từ BE
UPDATE_APPOINTMENT
UPDATE_APPOINTMENT_STATUS //  Thêm từ BE
DELETE_APPOINTMENT
CANCEL_APPOINTMENT        //  Thêm từ BE
DELAY_APPOINTMENT         //  Thêm từ BE
RESCHEDULE_APPOINTMENT    //  Thêm từ BE
```

##### **MODULE: ACCOUNT**
```typescript
CREATE_ACCOUNT
VIEW_ACCOUNT
UPDATE_ACCOUNT
DELETE_ACCOUNT
```

##### **MODULE: PATIENT**
```typescript
CREATE_PATIENT
VIEW_PATIENT
UPDATE_PATIENT
DELETE_PATIENT
```

##### **MODULE: EMPLOYEE**
```typescript
CREATE_EMPLOYEE
VIEW_EMPLOYEE
UPDATE_EMPLOYEE
DELETE_EMPLOYEE
READ_ALL_EMPLOYEES        //  Thêm từ BE
READ_EMPLOYEE_BY_CODE     //  Thêm từ BE
```

##### **MODULE: WORK SHIFTS**
```typescript
CREATE_WORK_SHIFTS
VIEW_WORK_SHIFTS
UPDATE_WORK_SHIFTS
DELETE_WORK_SHIFTS
MANAGE_WORK_SLOTS
VIEW_AVAILABLE_SLOTS
```

##### **MODULE: EMPLOYEE SHIFTS (BE-307)**
```typescript
VIEW_SHIFTS_ALL
VIEW_SHIFTS_OWN
VIEW_SHIFTS_SUMMARY
CREATE_SHIFTS
UPDATE_SHIFTS
DELETE_SHIFTS
```

##### **MODULE: ROOM MANAGEMENT**
```typescript
VIEW_ROOM
CREATE_ROOM
UPDATE_ROOM
DELETE_ROOM
UPDATE_ROOM_SERVICES      //  Thêm từ BE
```

##### **MODULE: SERVICE MANAGEMENT**
```typescript
VIEW_SERVICE
CREATE_SERVICE
UPDATE_SERVICE
DELETE_SERVICE
```

##### **MODULE: CONTACT**
```typescript
CREATE_CONTACT
VIEW_CONTACT
UPDATE_CONTACT
DELETE_CONTACT
CREATE_CONTACT_HISTORY
VIEW_CONTACT_HISTORY
UPDATE_CONTACT_HISTORY
DELETE_CONTACT_HISTORY
```

##### **MODULE: SHIFT REGISTRATION**
```typescript
VIEW_REGISTRATION_ALL
VIEW_REGISTRATION_OWN
CREATE_REGISTRATION
UPDATE_REGISTRATION_ALL
UPDATE_REGISTRATION_OWN
DELETE_REGISTRATION_ALL
DELETE_REGISTRATION_OWN
```

##### **MODULE: OVERTIME REQUEST (Đã cập nhật)**
```typescript
VIEW_OVERTIME_ALL
VIEW_OVERTIME_OWN
CREATE_OVERTIME
APPROVE_OVERTIME
REJECT_OVERTIME
CANCEL_OVERTIME_OWN
CANCEL_OVERTIME_PENDING

// @deprecated - Tên cũ (vẫn giữ để backward compatible)
VIEW_OT_ALL              // → VIEW_OVERTIME_ALL
CREATE_OT                // → CREATE_OVERTIME
APPROVE_OT               // → APPROVE_OVERTIME
REJECT_OT                // → REJECT_OVERTIME
CANCEL_OT_OWN            // → CANCEL_OVERTIME_OWN
CANCEL_OT_PENDING        // → CANCEL_OVERTIME_PENDING
```

##### **MODULE: TIME OFF REQUEST**
```typescript
VIEW_LEAVE_ALL
VIEW_LEAVE_OWN
CREATE_TIME_OFF
CANCEL_TIME_OFF
CANCEL_TIME_OFF_OWN
APPROVE_TIME_OFF
REJECT_TIME_OFF
VIEW_TIME_OFF_ALL        //  Thêm từ BE (alias)
VIEW_TIME_OFF_OWN        //  Thêm từ BE (alias)

// BE sử dụng TIMEOFF (không có underscore)
VIEW_TIMEOFF_ALL
VIEW_TIMEOFF_OWN
CREATE_TIMEOFF
APPROVE_TIMEOFF
REJECT_TIMEOFF
CANCEL_TIMEOFF_OWN
CANCEL_TIMEOFF_PENDING
```

##### **MODULE: RENEWAL**
```typescript
VIEW_RENEWAL_OWN
RESPOND_RENEWAL_OWN
```

##### **MODULE: EMPLOYEE SHIFT**
```typescript
VIEW_EMPLOYEE_SHIFT_ALL
VIEW_EMPLOYEE_SHIFT_OWN
```

##### **MODULE: LEAVE TYPE (Đã hợp nhất)**
```typescript
VIEW_LEAVE_TYPE
MANAGE_LEAVE_TYPE         // Covers create/update/delete

// @deprecated - Đã hợp nhất thành MANAGE_LEAVE_TYPE
VIEW_TIME_OFF_TYPE        // → VIEW_LEAVE_TYPE
CREATE_TIME_OFF_TYPE      // → MANAGE_LEAVE_TYPE
UPDATE_TIME_OFF_TYPE      // → MANAGE_LEAVE_TYPE
DELETE_TIME_OFF_TYPE      // → MANAGE_LEAVE_TYPE
VIEW_TIMEOFF_TYPE_ALL     // → VIEW_LEAVE_TYPE
```

##### **MODULE: LEAVE BALANCE**
```typescript
VIEW_LEAVE_BALANCE
ADJUST_LEAVE_BALANCE
VIEW_LEAVE_BALANCE_ALL    // @deprecated → VIEW_LEAVE_BALANCE
```

##### **MODULE: FIXED SHIFT REGISTRATION (FE-303v2)**
```typescript
MANAGE_FIXED_REGISTRATIONS
VIEW_FIXED_REGISTRATIONS_ALL
VIEW_FIXED_REGISTRATIONS_OWN
```

##### **MODULE: TREATMENT PLAN (BE-5)**
```typescript
VIEW_TREATMENT_PLAN_ALL
VIEW_TREATMENT_PLAN_OWN
CREATE_TREATMENT_PLAN
UPDATE_TREATMENT_PLAN
DELETE_TREATMENT_PLAN     //  Thêm từ BE
APPROVE_TREATMENT_PLAN    // Phase 3.5: Manager approval
VIEW_ALL_TREATMENT_PLANS  //  Thêm từ BE - Manager view all
MANAGE_PLAN_PRICING       //  Thêm từ BE - V21.4: Finance
```

##### **MODULE: SPECIALIZATION**
```typescript
VIEW_SPECIALIZATION       //  Thêm từ BE
CREATE_SPECIALIZATION     //  Thêm từ BE
```

##### **MODULE: WAREHOUSE (V23 - NEW MODULE)**
```typescript
VIEW_WAREHOUSE            //  Module mới
CREATE_WAREHOUSE
UPDATE_WAREHOUSE
DELETE_WAREHOUSE
```

---

### 1.2. Backend Permissions (từ SQL seed data & docs)

Theo [ISSUE_LOGIN_PERMISSIONS_DIAGNOSTIC.md](../docs/troubleshooting/ISSUE_LOGIN_PERMISSIONS_DIAGNOSTIC.md), Backend có **~125 permissions** được chia thành **17 modules**:

1. **ACCOUNT** (4)
2. **EMPLOYEE** (6)
3. **PATIENT** (4)
4. **TREATMENT** (4)
5. **APPOINTMENT** (9)
6. **CUSTOMER_MANAGEMENT** (8)
7. **SCHEDULE_MANAGEMENT** (31)
8. **LEAVE_MANAGEMENT** (35)
9. **SYSTEM_CONFIGURATION** (12)
10. **HOLIDAY** (4)
11. **ROOM_MANAGEMENT** (5)
12. **SERVICE_MANAGEMENT** (4)
13. **TREATMENT_PLAN** (8)
14. **WAREHOUSE** (17)
15. **PATIENT_IMAGES** (8)
16. **NOTIFICATION** (3)
17. **CLINICAL_RECORDS** (5)

---

## 🎨 II. PHÂN TÍCH NAVIGATION/SIDEBAR

### 2.1. Admin Navigation ([src/constants/navigationConfig.ts](../src/constants/navigationConfig.ts))

#### **Menu Items:**

| Menu | Permission Group | Specific Permissions | Status |
|------|------------------|---------------------|--------|
| Tổng quan | - | - | ✅ OK |
| **Quản lý tài khoản** | `ACCOUNT` | | ✅ OK |
| ├─ Tài khoản người dùng | | `VIEW_ACCOUNT` | ✅ OK |
| └─ Tài khoản nhân viên | `EMPLOYEE` | | ✅ OK |
| Quản lý blog | - | - | ✅ OK |
| **Cấu hình hệ thống** | `SYSTEM_CONFIGURATION` | | ✅ OK |
| ├─ Quản lý vai trò | | `VIEW_ROLE` | ✅ OK |
| ├─ Quản lý quyền | | `VIEW_PERMISSION` | ✅ OK |
| └─ Chuyên khoa | | `VIEW_SPECIALIZATION` | ✅ OK |
| **Quản lý lịch làm việc** | `SCHEDULE_MANAGEMENT` | | ✅ OK |
| ├─ Ca làm việc | | `VIEW_WORK_SHIFTS` | ✅ OK |
| ├─ Khung giờ làm việc | | `VIEW_WORK_SHIFTS` | ✅ OK |
| ├─ Đăng ký ca làm | | `VIEW_REGISTRATION_ALL` OR `VIEW_FIXED_REGISTRATIONS_ALL` | ✅ OK |
| └─ Lịch ca làm việc | | `VIEW_SHIFTS_ALL` | ✅ OK |
| **Quản lý yêu cầu** | `LEAVE_MANAGEMENT` | | ✅ OK |
| ├─ Yêu cầu làm thêm giờ | | `VIEW_OVERTIME_ALL` OR `VIEW_OT_ALL` | ⚠️ Cả 2 tên |
| ├─ Yêu cầu nghỉ phép | | `VIEW_TIMEOFF_ALL` | ✅ OK |
| └─ Yêu cầu đăng ký ca | | `VIEW_REGISTRATION_ALL` | ✅ OK |
| **Quản lý nghỉ phép** | `LEAVE_MANAGEMENT` | | ✅ OK |
| └─ Loại nghỉ phép | | `VIEW_TIMEOFF_TYPE` | ⚠️ BE dùng VIEW_LEAVE_TYPE |
| **Quản lý kho** | | | ✅ OK (RBAC) |
| ├─ Tổng quan kho | | `VIEW_WAREHOUSE` | ✅ OK |
| ├─ Quản lý vật tư | | `VIEW_WAREHOUSE` | ✅ OK |
| ├─ Nhập/Xuất kho | | `VIEW_WAREHOUSE` | ✅ OK |
| ├─ Nhà cung cấp | | `VIEW_WAREHOUSE` | ✅ OK |
| └─ Báo cáo & thống kê | | `VIEW_WAREHOUSE` | ✅ OK |
| Liên hệ khách hàng | `CUSTOMER_MANAGEMENT` | | ✅ OK |
| **Quản lý lịch** | | | ✅ OK |
| ├─ Phòng khám | `ROOM_MANAGEMENT` | | ✅ OK |
| ├─ Dịch vụ | `SERVICE_MANAGEMENT` | | ✅ OK |
| ├─ Lịch hẹn | `APPOINTMENT` | | ✅ OK |
| └─ Kế hoạch điều trị | | `VIEW_TREATMENT_PLAN_ALL` | ✅ OK |
| Cài đặt | - | - | ✅ OK |

---

### 2.2. Employee Navigation ([src/constants/navigationConfig.ts](../src/constants/navigationConfig.ts))

#### **Menu Items:**

| Menu | Permission Group | Specific Permissions | Employment Type | Status |
|------|------------------|---------------------|-----------------|--------|
| Tổng quan | - | - | All | ✅ OK |
| **Quản lý lịch** | | | All | ✅ OK |
| └─ Lịch hẹn | | `VIEW_APPOINTMENT_OWN` OR `VIEW_APPOINTMENT_ALL` | All | ✅ OK |
| Kế hoạch điều trị | | `VIEW_TREATMENT_PLAN_ALL` OR `VIEW_TREATMENT_PLAN_OWN` | All | ✅ OK |
| **Quản lý lịch làm việc** | | | All | ✅ OK |
| ├─ Đăng ký ca của tôi | | `VIEW_REGISTRATION_OWN` OR `VIEW_FIXED_REGISTRATIONS_OWN` | All | ✅ OK |
| ├─ Lịch ca làm việc | | `VIEW_SHIFTS_OWN` | All | ✅ OK |
| ├─ Lịch của tôi | | `VIEW_SHIFTS_OWN` OR `VIEW_APPOINTMENT_OWN` | FULL_TIME, PART_TIME_FIXED | ✅ OK |
| ├─ Đăng ký cố định | | `VIEW_FIXED_REGISTRATIONS_OWN` | FULL_TIME, PART_TIME_FIXED | ✅ OK |
| └─ Gia hạn ca | `SCHEDULE_MANAGEMENT` | | PART_TIME_FLEX | ✅ OK |
| **Quản lý yêu cầu** | `LEAVE_MANAGEMENT` | | | ✅ OK |
| ├─ Yêu cầu làm thêm giờ | `LEAVE_MANAGEMENT` | | FULL_TIME, PART_TIME_FIXED | ✅ OK |
| └─ Yêu cầu nghỉ phép | `LEAVE_MANAGEMENT` | | FULL_TIME, PART_TIME_FIXED | ✅ OK |
| **Quản lý khách hàng** | `CUSTOMER_MANAGEMENT` | | All | ✅ OK |
| ├─ Khách hàng | `CUSTOMER_MANAGEMENT` | | All | ✅ OK |
| ├─ Liên hệ khách hàng | `CUSTOMER_MANAGEMENT` | | All | ✅ OK |
| └─ Phản hồi khách hàng | `CUSTOMER_MANAGEMENT` | | All | ✅ OK |
| **Quản lý kho** (RBAC) | | `VIEW_WAREHOUSE` | All | ✅ OK |
| ├─ Tổng quan kho | | `VIEW_WAREHOUSE` | All | ✅ OK |
| ├─ Quản lý vật tư | | `VIEW_WAREHOUSE` | All | ✅ OK |
| ├─ Nhập/Xuất kho | | `VIEW_WAREHOUSE` | All | ✅ OK |
| ├─ Nhà cung cấp | | `VIEW_WAREHOUSE` | All | ✅ OK |
| └─ Báo cáo & thống kê | | `VIEW_WAREHOUSE` | All | ✅ OK |
| Phân tích | `ANALYTICS` | | All | ⚠️ Permission group chưa rõ |
| Xem CBCT | - | - | All | ✅ OK |
| Cài đặt | - | - | All | ✅ OK |

---

### 2.3. Patient Navigation ([src/constants/navigationConfig.ts](../src/constants/navigationConfig.ts))

#### **Menu Items:**

| Menu | Specific Permissions | Status |
|------|---------------------|--------|
| Tổng quan | - | ✅ OK |
| Lịch hẹn của tôi | - | ✅ OK |
| Kế hoạch điều trị | `VIEW_TREATMENT_PLAN_OWN` OR `VIEW_TREATMENT_PLAN_ALL` | ✅ OK |
| Xem CBCT | - | ✅ OK |
| Thanh toán | - | ✅ OK |
| Thông báo | - | ✅ OK |
| Hồ sơ cá nhân | - | ✅ OK |

---

## 🔍 III. KIỂM TRA PERMISSIONS USAGE TRONG CODE

### 3.1. AuthContext ([src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx))

#### **Permission Check Functions:**

```typescript
// Line 315-341: CORRECT Implementation ✅
const hasPermission = useCallback((permission: string): boolean => {
  if (!user?.permissions) return false;
  return user.permissions.includes(permission);
}, [user]);

const hasAnyPermission = useCallback((permissions: string[]): boolean => {
  if (!user?.permissions || permissions.length === 0) return false;
  return permissions.some(permission => user.permissions.includes(permission));
}, [user]);

const hasAllPermissions = useCallback((permissions: string[]): boolean => {
  if (!user?.permissions || permissions.length === 0) return false;
  return permissions.every(permission => user.permissions.includes(permission));
}, [user]);
```

**✅ Đánh giá:** Implementation đúng, nhưng phụ thuộc vào BE trả về `permissions` array trong login response.

---

### 3.2. ProtectedRoute Component ([src/components/auth/ProtectedRoute.tsx](../src/components/auth/ProtectedRoute.tsx))

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];              // Check theo roles
  requiredBaseRole?: string;             // Check theo baseRole
  requiredPermissions?: string[];        //  Check theo permissions (RBAC)
  requireAll?: boolean;                  // true = cần tất cả, false = chỉ cần 1
  fallbackPath?: string;
}
```

**✅ Đánh giá:** Component hỗ trợ đầy đủ RBAC, có thể check theo:
- Roles
- Base role
- Permissions (cả `requireAll` và `requireAny`)

---

### 3.3. Usage trong Pages

#### **Admin Overtime Requests** ([src/app/admin/overtime-requests/page.tsx](../src/app/admin/overtime-requests/page.tsx))

```typescript
// Line 250-255: ⚠️ ISSUE - Sử dụng cả tên cũ và tên mới
const canApprove = useMemo(() => 
  user?.permissions?.includes('APPROVE_OT'), [user?.permissions]
);
const canReject = useMemo(() => 
  user?.permissions?.includes('REJECT_OT'), [user?.permissions]
);
const canCancelPending = useMemo(() => 
  user?.permissions?.includes('CANCEL_OT_PENDING'), [user?.permissions]
);
const canCancelOwn = useMemo(() => 
  user?.permissions?.includes('CANCEL_OT_OWN'), [user?.permissions]
);
const canCreate = useMemo(() =>
  user?.permissions?.includes('CREATE_OT') || 
  user?.permissions?.includes('CREATE_OVERTIME'),
  [user?.permissions]
);
```

**⚠️ Vấn đề:** Sử dụng tên cũ (`APPROVE_OT`, `REJECT_OT`, v.v.) thay vì tên mới đã chuẩn hóa (`APPROVE_OVERTIME`, `REJECT_OVERTIME`, v.v.)

---

#### **Employee Overtime Requests** ([src/app/employee/overtime-requests/page.tsx](../src/app/employee/overtime-requests/page.tsx))

```typescript
// Line 228-229: ✅ CORRECT - Sử dụng tên mới
const canCreate = user?.permissions?.includes('CREATE_OVERTIME');
const canCancelOwn = user?.permissions?.includes('CANCEL_OVERTIME_OWN');
```

**✅ Đánh giá:** Sử dụng đúng tên permission mới.

---

#### **Patient Treatment Plans** ([src/app/patient/treatment-plans/page.tsx](../src/app/patient/treatment-plans/page.tsx))

```typescript
// Line 72: ✅ CORRECT
const canView = user?.permissions?.includes('VIEW_TREATMENT_PLAN_OWN') || false;

// Line 271: ✅ CORRECT - Sử dụng ProtectedRoute
<ProtectedRoute requiredPermissions={['VIEW_TREATMENT_PLAN_OWN']}>
  {/* content */}
</ProtectedRoute>
```

**✅ Đánh giá:** Sử dụng đúng và nhất quán.

---

### 3.4. Renewal Badge Component ([src/components/renewal/RenewalBadge.tsx](../src/components/renewal/RenewalBadge.tsx))

```typescript
// Line 94, 196: ✅ CORRECT
if (!hasPermission(Permission.VIEW_RENEWAL_OWN)) {
  return;
}
```

**✅ Đánh giá:** Sử dụng `hasPermission()` helper function đúng cách.

---

## ⚠️ IV. CÁC VẤN ĐỀ PHÁT HIỆN

### 🔴 **CRITICAL - Vấn đề nghiêm trọng**

#### **1. BE không trả về permissions array trong login response**

**Vị trí:** Backend API `/auth/login`

**Mô tả:**
- Frontend code **ĐÚNG** và đã implement đầy đủ RBAC
- AuthContext mong đợi nhận `permissions` array từ BE
- Nếu BE không trả về, tất cả permission checks sẽ fail → "Mất quyền nhiều chổ"

**Ảnh hưởng:**
- ❌ Tất cả `hasPermission()` checks trả về `false`
- ❌ Navigation items bị ẩn
- ❌ Protected routes bị chặn
- ❌ Buttons/actions bị disable

**Giải pháp:**
```java
// Backend: LoginController.java hoặc AuthenticationService.java
public LoginResponse login(LoginRequest request) {
    // ... authenticate user ...
    
    return LoginResponse.builder()
        .token(jwtToken)
        .username(user.getUsername())
        .email(user.getEmail())
        .roles(roles)                    // ✅ List<String>
        .permissions(permissions)        // ❌ CRITICAL: PHẢI TRẢ VỀ
        .groupedPermissions(grouped)     // ✅ Map<String, List<String>>
        .baseRole(baseRole)              // ✅ "admin", "employee", "patient"
        .employmentType(employmentType)  // ✅ "FULL_TIME", "PART_TIME_FIXED", etc.
        .tokenExpiresAt(expiresAt)
        .refreshTokenExpiresAt(refreshExpiresAt)
        .build();
}
```

**Example Response:**
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
    "VIEW_EMPLOYEE",
    // ... all ~125 permissions
  ],
  "groupedPermissions": {
    "ACCOUNT": ["VIEW_ACCOUNT", "CREATE_ACCOUNT", ...],
    "EMPLOYEE": ["VIEW_EMPLOYEE", "CREATE_EMPLOYEE", ...],
    // ... grouped by module
  },
  "baseRole": "admin",
  "tokenExpiresAt": 1735123456
}
```

---

### ⚠️ **MEDIUM - Vấn đề cần sửa**

#### **2. Permission naming không nhất quán (Overtime Module)**

**Vị trí:** [src/app/admin/overtime-requests/page.tsx](../src/app/admin/overtime-requests/page.tsx:250)

**Mô tả:**
- Admin page sử dụng tên cũ: `APPROVE_OT`, `REJECT_OT`, `CANCEL_OT_PENDING`, `CANCEL_OT_OWN`
- Employee page sử dụng tên mới: `APPROVE_OVERTIME`, `REJECT_OVERTIME`, etc.
- Types đã định nghĩa cả 2 (tên mới + `@deprecated` cho tên cũ)

**Giải pháp:**
```typescript
// Đổi từ:
const canApprove = useMemo(() => 
  user?.permissions?.includes('APPROVE_OT'), [user?.permissions]
);

// Thành:
const canApprove = useMemo(() => 
  user?.permissions?.includes('APPROVE_OVERTIME'), [user?.permissions]
);
```

**Files cần sửa:**
- [src/app/admin/overtime-requests/page.tsx](../src/app/admin/overtime-requests/page.tsx)
- Tất cả files khác sử dụng `*_OT` permissions

---

#### **3. Time Off Type permissions không khớp với BE**

**Vị trí:** [src/constants/navigationConfig.ts](../src/constants/navigationConfig.ts)

**Mô tả:**
- FE sử dụng: `VIEW_TIMEOFF_TYPE`
- BE đã hợp nhất thành: `VIEW_LEAVE_TYPE`
- Có alias nhưng không rõ BE đang dùng tên nào

**Giải pháp:** Xác nhận với BE team, nên dùng `VIEW_LEAVE_TYPE` (tên đã chuẩn hóa)

---

#### **4. Permission group `ANALYTICS` chưa được định nghĩa rõ ràng**

**Vị trí:** [src/constants/navigationConfig.ts](../src/constants/navigationConfig.ts) (Employee navigation)

**Mô tả:**
- Menu "Phân tích" yêu cầu permission group `ANALYTICS`
- Không có thông tin về group này trong BE seed data hoặc docs

**Giải pháp:**
- Xác nhận với BE team về permission group này
- Hoặc thay bằng specific permissions như `VIEW_ANALYTICS` hoặc `VIEW_REPORT`

---

### 💡 **LOW - Cải thiện và khuyến nghị**

#### **5. Loại bỏ deprecated permissions**

**Vị trí:** [src/types/permission.ts](../src/types/permission.ts)

**Mô tả:**
Có nhiều permissions được đánh dấu `@deprecated` nhưng vẫn giữ trong enum:

```typescript
// @deprecated - Use VIEW_OVERTIME_ALL instead
VIEW_OT_ALL = 'VIEW_OVERTIME_ALL',

// @deprecated - Use VIEW_LEAVE_TYPE instead
VIEW_TIME_OFF_TYPE = 'VIEW_LEAVE_TYPE',
```

**Khuyến nghị:**
1. **Giai đoạn 1 (Hiện tại):** Giữ cả 2 để backward compatible
2. **Giai đoạn 2:** Tạo migration script để update tất cả usage
3. **Giai đoạn 3:** Xóa deprecated permissions sau khi đã migrate

---

#### **6. Thêm unit tests cho permission checks**

**Khuyến nghị:** Tạo tests cho:
- `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`
- `filterNavigationItems()`
- `canAccessWarehouse()`

Example:
```typescript
// tests/contexts/AuthContext.test.tsx
describe('AuthContext Permission Checks', () => {
  test('hasPermission returns true for valid permission', () => {
    const user = { permissions: ['VIEW_ACCOUNT', 'CREATE_ACCOUNT'] };
    expect(hasPermission('VIEW_ACCOUNT')).toBe(true);
  });
  
  test('hasAnyPermission works with OR logic', () => {
    const user = { permissions: ['VIEW_ACCOUNT'] };
    expect(hasAnyPermission(['VIEW_ACCOUNT', 'CREATE_ACCOUNT'])).toBe(true);
  });
});
```

---

#### **7. Warehouse permissions sử dụng RBAC pattern tốt**

**Vị trí:** [src/constants/navigationConfig.ts](../src/constants/navigationConfig.ts) (canAccessWarehouse function)

**✅ Đánh giá:** Implementation tốt, ưu tiên permission check trước, fallback mới là role check.

```typescript
export const canAccessWarehouse = (
  userRoles?: string[],
  userPermissions?: string[]
): boolean => {
  // Priority 1: Check VIEW_WAREHOUSE permission (RBAC) ✅
  const hasViewWarehouse = userPermissions?.includes('VIEW_WAREHOUSE') || false;
  if (hasViewWarehouse) return true;

  // Priority 2: Fallback - ROLE_ADMIN (has all permissions) ✅
  const isAdmin = userRoles?.includes('ROLE_ADMIN') || false;
  return isAdmin;
};
```

**Khuyến nghị:** Áp dụng pattern này cho các modules khác.

---

## ✅ V. ĐIỂM MẠNH CỦA HỆ THỐNG

### 1. **RBAC Implementation hoàn chỉnh**
- ✅ AuthContext có đầy đủ permission helper functions
- ✅ ProtectedRoute component linh hoạt
- ✅ Navigation filtering dựa trên permissions & groups
- ✅ Employment type filtering cho menu items

### 2. **Sidebar Navigation Logic tốt**
- ✅ Hiển thị menu dựa trên `groupedPermissions`
- ✅ Submenu filtering đúng
- ✅ Parent menu tự động ẩn khi không có submenu visible
- ✅ Hỗ trợ `requireAll` và `requireAny` logic

### 3. **Permission Organization rõ ràng**
- ✅ Được nhóm theo modules
- ✅ Có comments đầy đủ
- ✅ Deprecated permissions được đánh dấu rõ ràng

### 4. **Code Quality tốt**
- ✅ TypeScript types đầy đủ
- ✅ Comments chi tiết
- ✅ Consistent naming convention (hầu hết)

---

## 📊 VI. THỐNG KÊ

### Frontend Permissions
- **Tổng số:** ~130 permissions
- **Deprecated:** ~12 permissions
- **Mới thêm từ BE:** ~15 permissions

### Backend Permissions (từ docs)
- **Tổng số:** ~125 permissions
- **Modules:** 17 modules

### Navigation Items
- **Admin:** 13 main items, ~30 submenu items
- **Employee:** 10 main items, ~20 submenu items
- **Patient:** 7 main items

### Permission Usage
- **Pages sử dụng permission checks:** ~20+ files
- **Components sử dụng permission checks:** ~10+ files
- **Protected routes:** ~15+ routes

---

## 🎯 VII. KHUYẾN NGHỊ VÀ HÀNH ĐỘNG

### 🔴 **URGENT (Cần làm ngay)**

#### 1. **Fix Backend Login Response**
- [ ] Backend team: Thêm `permissions` array vào login response
- [ ] Đảm bảo trả về đầy đủ ~125 permissions cho admin
- [ ] Test login flow sau khi fix

#### 2. **Chuẩn hóa Overtime permissions**
- [ ] Đổi tất cả `*_OT` thành `*_OVERTIME` trong [src/app/admin/overtime-requests/page.tsx](../src/app/admin/overtime-requests/page.tsx)
- [ ] Search toàn project: `_OT` để tìm usage khác
- [ ] Test lại tất cả overtime features

---

### ⚠️ **MEDIUM (Nên làm trong sprint này)**

#### 3. **Xác nhận permissions với BE team**
- [ ] Confirm `VIEW_LEAVE_TYPE` vs `VIEW_TIMEOFF_TYPE`
- [ ] Confirm permission group `ANALYTICS`
- [ ] Sync danh sách ~125 permissions với BE SQL seed data

#### 4. **Update documentation**
- [ ] Document permission naming conventions
- [ ] Tạo mapping table BE ↔️ FE permissions
- [ ] Update README về RBAC implementation

---

### 💡 **NICE TO HAVE (Cải thiện dần)**

#### 5. **Code cleanup**
- [ ] Xóa deprecated permissions sau khi migrate
- [ ] Refactor permission checks thành reusable hooks
- [ ] Add TypeScript strict mode cho permission types

#### 6. **Testing**
- [ ] Viết unit tests cho permission checks
- [ ] Viết integration tests cho protected routes
- [ ] Thêm E2E tests cho RBAC flows

#### 7. **Monitoring & Logging**
- [ ] Log khi permission check fails
- [ ] Track permission usage để tối ưu
- [ ] Alert khi có permission mismatch

---

## 📚 VIII. TÀI LIỆU THAM KHẢO

### Files liên quan:
1. **Permissions Definition:**
   - [src/types/permission.ts](../src/types/permission.ts) - FE permission enum
   - [src/types/auth.ts](../src/types/auth.ts) - Auth types
   
2. **Navigation Config:**
   - [src/constants/navigationConfig.ts](../src/constants/navigationConfig.ts) - Sidebar config
   - [src/constants/permissions.ts](../src/constants/permissions.ts) - Old permission config (có thể deprecated)

3. **Authentication:**
   - [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx) - Auth context & helpers
   - [src/components/auth/ProtectedRoute.tsx](../src/components/auth/ProtectedRoute.tsx) - Route protection
   - [src/middleware.ts](../src/middleware.ts) - Next.js middleware

4. **Documentation:**
   - [docs/troubleshooting/ISSUE_LOGIN_PERMISSIONS_DIAGNOSTIC.md](../docs/troubleshooting/ISSUE_LOGIN_PERMISSIONS_DIAGNOSTIC.md)
   - [docs/BE_FE_SYNC_STATUS_2025_12_25.md](../docs/BE_FE_SYNC_STATUS_2025_12_25.md)

---

## 🔍 IX. CHECKLIST KIỂM TRA SAU KHI FIX

### Backend:
- [ ] Login response có field `permissions` (array of strings)
- [ ] Permissions đầy đủ (~125 cho admin)
- [ ] `groupedPermissions` được trả về đúng format
- [ ] Test với Postman/curl

### Frontend:
- [ ] Overtime permissions đã đổi sang tên mới
- [ ] Tất cả permission checks đều pass
- [ ] Sidebar hiển thị đúng menu items
- [ ] Protected routes cho phép access với đúng permissions

### Testing:
- [ ] Login với admin account → có đầy đủ quyền
- [ ] Login với employee account → có đúng quyền theo role
- [ ] Login với patient account → có đúng quyền
- [ ] Sidebar items hiển thị đúng cho từng role
- [ ] Navigation không bị mất menu items
- [ ] Buttons/actions enable/disable đúng theo permissions

---

## 📝 NOTES

- Báo cáo này được tạo dựa trên phân tích code tại thời điểm 22/12/2025
- Cần sync với BE team để confirm chính xác permissions trong database
- Một số permissions có thể được thêm/xóa trong tương lai khi có features mới
- Nên review lại báo cáo này mỗi sprint để cập nhật

---

**END OF REPORT**

Nếu có thắc mắc hoặc cần làm rõ thêm, vui lòng liên hệ hoặc tạo issue mới.
