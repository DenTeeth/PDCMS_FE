# 📋 YÊU CẦU CHO BACKEND - CHUẨN HÓA PERMISSIONS

**Ngày tạo:** 22/12/2025  
**Mục đích:** Đồng bộ hóa permissions giữa Backend và Frontend sau khi chuẩn hóa

---

## 🎯 TÓM TẮT

Frontend đã hoàn tất chuẩn hóa tất cả permissions. Backend cần thực hiện các thay đổi sau để đảm bảo đồng bộ.

---

## 🔴 CRITICAL - YÊU CẦU BẮT BUỘC

### 1. **Trả về `permissions` array trong Login Response**

**Vấn đề:** Backend hiện không trả về mảng `permissions` trong response của `/auth/login`

**Yêu cầu:**
```java
// Backend: LoginController.java hoặc AuthenticationService.java
public LoginResponse login(LoginRequest request) {
    // ... authenticate user ...
    
    // Get all permissions for user
    List<String> permissions = userService.getAllPermissionsForUser(user);
    Map<String, List<String>> groupedPermissions = userService.getGroupedPermissionsForUser(user);
    
    return LoginResponse.builder()
        .token(jwtToken)
        .username(user.getUsername())
        .email(user.getEmail())
        .roles(roles)                        // ✅ Existing
        .permissions(permissions)            // ❌ CRITICAL: PHẢI THÊM
        .groupedPermissions(groupedPermissions) // ✅ Existing (good to have)
        .baseRole(baseRole)                  // ✅ Existing
        .employmentType(employmentType)      // ✅ Existing
        .mustChangePassword(false)
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
    "CREATE_EMPLOYEE",
    "VIEW_OVERTIME_ALL",
    "CREATE_OVERTIME",
    "APPROVE_OVERTIME",
    "VIEW_LEAVE_TYPE",
    "MANAGE_LEAVE_TYPE",
    "VIEW_WAREHOUSE",
    "CREATE_WAREHOUSE",
    ... // Tất cả ~125 permissions cho admin
  ],
  "groupedPermissions": {
    "ACCOUNT": ["VIEW_ACCOUNT", "CREATE_ACCOUNT", "UPDATE_ACCOUNT", "DELETE_ACCOUNT"],
    "EMPLOYEE": ["VIEW_EMPLOYEE", "CREATE_EMPLOYEE", "UPDATE_EMPLOYEE", "DELETE_EMPLOYEE"],
    "LEAVE_MANAGEMENT": ["VIEW_OVERTIME_ALL", "CREATE_OVERTIME", "APPROVE_OVERTIME", ...],
    "WAREHOUSE": ["VIEW_WAREHOUSE", "CREATE_WAREHOUSE", "UPDATE_WAREHOUSE", "DELETE_WAREHOUSE"]
    ... // Grouped by module
  },
  "baseRole": "admin",
  "employmentType": null,
  "mustChangePassword": false,
  "tokenExpiresAt": 1735123456,
  "refreshTokenExpiresAt": 1735209856
}
```

**Ảnh hưởng nếu không làm:**
- ❌ Frontend RBAC hoàn toàn không hoạt động
- ❌ Tất cả menu items bị ẩn
- ❌ Tất cả protected routes bị chặn
- ❌ Người dùng không thể sử dụng hệ thống

---

## ⚠️ MEDIUM - YÊU CẦU CHUẨN HÓA PERMISSIONS

### 2. **Overtime Permissions - Đổi từ `*_OT` sang `*_OVERTIME`**

**Hiện tại Backend (SQL seed data):**
```sql
-- Tên cũ (hiện tại)
INSERT INTO permission (name, code, permission_group, description, display_order, parent_code, active, created_at) VALUES
('VIEW_OT_ALL', 'VIEW_OT_ALL', 'LEAVE_MANAGEMENT', 'Xem tất cả yêu cầu tăng ca', 114, NULL, TRUE, NOW()),
('VIEW_OT_OWN', 'VIEW_OT_OWN', 'LEAVE_MANAGEMENT', 'Xem yêu cầu tăng ca của bản thân', 115, 'VIEW_OT_ALL', TRUE, NOW()),
('CREATE_OT', 'CREATE_OT', 'LEAVE_MANAGEMENT', 'Tạo yêu cầu tăng ca', 116, NULL, TRUE, NOW()),
('APPROVE_OT', 'APPROVE_OT', 'LEAVE_MANAGEMENT', 'Phê duyệt yêu cầu tăng ca', 117, NULL, TRUE, NOW()),
('REJECT_OT', 'REJECT_OT', 'LEAVE_MANAGEMENT', 'Từ chối yêu cầu tăng ca', 118, NULL, TRUE, NOW()),
('CANCEL_OT_OWN', 'CANCEL_OT_OWN', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu tăng ca của bản thân', 119, NULL, TRUE, NOW()),
('CANCEL_OT_PENDING', 'CANCEL_OT_PENDING', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu tăng ca đang chờ', 120, NULL, TRUE, NOW());
```

**✅ Yêu cầu - Tên mới (chuẩn hóa):**
```sql
-- OPTION 1: Cập nhật hoàn toàn (RECOMMENDED)
UPDATE permission SET name = 'VIEW_OVERTIME_ALL', code = 'VIEW_OVERTIME_ALL' WHERE code = 'VIEW_OT_ALL';
UPDATE permission SET name = 'VIEW_OVERTIME_OWN', code = 'VIEW_OVERTIME_OWN' WHERE code = 'VIEW_OT_OWN';
UPDATE permission SET name = 'CREATE_OVERTIME', code = 'CREATE_OVERTIME' WHERE code = 'CREATE_OT';
UPDATE permission SET name = 'APPROVE_OVERTIME', code = 'APPROVE_OVERTIME' WHERE code = 'APPROVE_OT';
UPDATE permission SET name = 'REJECT_OVERTIME', code = 'REJECT_OVERTIME' WHERE code = 'REJECT_OT';
UPDATE permission SET name = 'CANCEL_OVERTIME_OWN', code = 'CANCEL_OVERTIME_OWN' WHERE code = 'CANCEL_OT_OWN';
UPDATE permission SET name = 'CANCEL_OVERTIME_PENDING', code = 'CANCEL_OVERTIME_PENDING' WHERE code = 'CANCEL_OT_PENDING';

-- Cập nhật parent_code reference
UPDATE permission SET parent_code = 'VIEW_OVERTIME_ALL' WHERE parent_code = 'VIEW_OT_ALL';

-- OPTION 2: Giữ backward compatibility (thêm alias)
-- Giữ cả tên cũ và thêm tên mới, nhưng mark tên cũ là deprecated
-- (Nếu chọn option này, cần thêm field is_deprecated trong permission table)
```

**Files Backend cần update:**
1. **SQL seed data:** `dental-clinic-seed-data.sql`
2. **Constants:** `AuthoritiesConstants.java`
   ```java
   // Đổi từ:
   public static final String VIEW_OT_ALL = "VIEW_OT_ALL";
   public static final String CREATE_OT = "CREATE_OT";
   public static final String APPROVE_OT = "APPROVE_OT";
   public static final String REJECT_OT = "REJECT_OT";
   public static final String CANCEL_OT_OWN = "CANCEL_OT_OWN";
   public static final String CANCEL_OT_PENDING = "CANCEL_OT_PENDING";
   
   // Sang:
   public static final String VIEW_OVERTIME_ALL = "VIEW_OVERTIME_ALL";
   public static final String VIEW_OVERTIME_OWN = "VIEW_OVERTIME_OWN";
   public static final String CREATE_OVERTIME = "CREATE_OVERTIME";
   public static final String APPROVE_OVERTIME = "APPROVE_OVERTIME";
   public static final String REJECT_OVERTIME = "REJECT_OVERTIME";
   public static final String CANCEL_OVERTIME_OWN = "CANCEL_OVERTIME_OWN";
   public static final String CANCEL_OVERTIME_PENDING = "CANCEL_OVERTIME_PENDING";
   ```

3. **Security annotations:** Tất cả controllers/services sử dụng `@PreAuthorize`
   ```java
   // Đổi từ:
   @PreAuthorize("hasAuthority('APPROVE_OT')")
   
   // Sang:
   @PreAuthorize("hasAuthority('APPROVE_OVERTIME')")
   ```

---

### 3. **Time Off Type Permissions - Hợp nhất thành `MANAGE_LEAVE_TYPE`**

**Hiện tại Backend:**
```sql
-- Tách riêng cho từng action
INSERT INTO permission (name, code, permission_group, description) VALUES
('VIEW_TIMEOFF_TYPE_ALL', 'VIEW_TIMEOFF_TYPE_ALL', 'LEAVE_MANAGEMENT', 'Xem tất cả loại nghỉ phép'),
('CREATE_TIMEOFF_TYPE', 'CREATE_TIMEOFF_TYPE', 'LEAVE_MANAGEMENT', 'Tạo loại nghỉ phép'),
('UPDATE_TIMEOFF_TYPE', 'UPDATE_TIMEOFF_TYPE', 'LEAVE_MANAGEMENT', 'Cập nhật loại nghỉ phép'),
('DELETE_TIMEOFF_TYPE', 'DELETE_TIMEOFF_TYPE', 'LEAVE_MANAGEMENT', 'Xóa loại nghỉ phép');
```

**✅ Yêu cầu - Chuẩn hóa:**
```sql
-- OPTION 1: Hợp nhất thành 2 permissions (RECOMMENDED)
INSERT INTO permission (name, code, permission_group, description) VALUES
('VIEW_LEAVE_TYPE', 'VIEW_LEAVE_TYPE', 'LEAVE_MANAGEMENT', 'Xem tất cả loại nghỉ phép'),
('MANAGE_LEAVE_TYPE', 'MANAGE_LEAVE_TYPE', 'LEAVE_MANAGEMENT', 'Quản lý loại nghỉ phép (tạo/sửa/xóa)');

-- Migration script
UPDATE permission SET name = 'VIEW_LEAVE_TYPE', code = 'VIEW_LEAVE_TYPE' 
WHERE code = 'VIEW_TIMEOFF_TYPE_ALL';

-- Xóa hoặc mark deprecated các permissions cũ
UPDATE permission SET active = FALSE 
WHERE code IN ('CREATE_TIMEOFF_TYPE', 'UPDATE_TIMEOFF_TYPE', 'DELETE_TIMEOFF_TYPE');

-- OPTION 2: Đổi tên nhưng giữ tách riêng
UPDATE permission SET name = 'VIEW_LEAVE_TYPE', code = 'VIEW_LEAVE_TYPE' WHERE code = 'VIEW_TIMEOFF_TYPE_ALL';
UPDATE permission SET name = 'CREATE_LEAVE_TYPE', code = 'CREATE_LEAVE_TYPE' WHERE code = 'CREATE_TIMEOFF_TYPE';
UPDATE permission SET name = 'UPDATE_LEAVE_TYPE', code = 'UPDATE_LEAVE_TYPE' WHERE code = 'UPDATE_TIMEOFF_TYPE';
UPDATE permission SET name = 'DELETE_LEAVE_TYPE', code = 'DELETE_LEAVE_TYPE' WHERE code = 'DELETE_TIMEOFF_TYPE';
```

**Files Backend cần update:**
1. **SQL seed data**
2. **AuthoritiesConstants.java**
   ```java
   // Đổi từ:
   public static final String VIEW_TIMEOFF_TYPE_ALL = "VIEW_TIMEOFF_TYPE_ALL";
   public static final String CREATE_TIMEOFF_TYPE = "CREATE_TIMEOFF_TYPE";
   public static final String UPDATE_TIMEOFF_TYPE = "UPDATE_TIMEOFF_TYPE";
   public static final String DELETE_TIMEOFF_TYPE = "DELETE_TIMEOFF_TYPE";
   
   // Sang (OPTION 1 - RECOMMENDED):
   public static final String VIEW_LEAVE_TYPE = "VIEW_LEAVE_TYPE";
   public static final String MANAGE_LEAVE_TYPE = "MANAGE_LEAVE_TYPE";
   
   // Hoặc (OPTION 2):
   public static final String VIEW_LEAVE_TYPE = "VIEW_LEAVE_TYPE";
   public static final String CREATE_LEAVE_TYPE = "CREATE_LEAVE_TYPE";
   public static final String UPDATE_LEAVE_TYPE = "UPDATE_LEAVE_TYPE";
   public static final String DELETE_LEAVE_TYPE = "DELETE_LEAVE_TYPE";
   ```

3. **Security annotations trong controllers**

---

## 💡 NICE TO HAVE - GỢI Ý CẢI THIỆN

### 4. **Thêm Permission Group `ANALYTICS`**

**Vấn đề:** Frontend có menu "Phân tích" nhưng chưa có permission group tương ứng

**Gợi ý:**
```sql
-- Thêm permissions cho Analytics
INSERT INTO permission (name, code, permission_group, description, display_order) VALUES
('VIEW_ANALYTICS', 'VIEW_ANALYTICS', 'ANALYTICS', 'Xem báo cáo phân tích', 200),
('VIEW_ANALYTICS_REVENUE', 'VIEW_ANALYTICS_REVENUE', 'ANALYTICS', 'Xem phân tích doanh thu', 201),
('VIEW_ANALYTICS_APPOINTMENT', 'VIEW_ANALYTICS_APPOINTMENT', 'ANALYTICS', 'Xem phân tích lịch hẹn', 202),
('VIEW_ANALYTICS_EMPLOYEE', 'VIEW_ANALYTICS_EMPLOYEE', 'ANALYTICS', 'Xem phân tích nhân viên', 203),
('EXPORT_ANALYTICS', 'EXPORT_ANALYTICS', 'ANALYTICS', 'Xuất báo cáo phân tích', 204);
```

---

### 5. **Standardize Time Off vs Leave Naming**

**Vấn đề:** Hệ thống sử dụng cả 2 từ: `TIMEOFF` và `LEAVE`

**Hiện tại:**
- `VIEW_TIMEOFF_ALL` vs `VIEW_LEAVE_ALL`
- `VIEW_TIMEOFF_TYPE` vs `VIEW_LEAVE_TYPE`
- `VIEW_LEAVE_BALANCE` (nhất quán)

**Gợi ý:** Chuẩn hóa hoàn toàn sang `LEAVE` (hoặc `TIME_OFF` với underscore)
```sql
-- Đổi tất cả TIMEOFF (không underscore) sang LEAVE hoặc TIME_OFF
UPDATE permission SET code = REPLACE(code, 'TIMEOFF', 'LEAVE') WHERE code LIKE '%TIMEOFF%';
```

---

## 📊 BẢNG MAPPING PERMISSIONS (FE ↔️ BE)

### Overtime Permissions

| Frontend (Đã chuẩn hóa) | Backend (Hiện tại) | Backend (Yêu cầu) | Status |
|---|---|---|---|
| `VIEW_OVERTIME_ALL` | `VIEW_OT_ALL` | `VIEW_OVERTIME_ALL` | ⚠️ Cần đổi |
| `VIEW_OVERTIME_OWN` | `VIEW_OT_OWN` | `VIEW_OVERTIME_OWN` | ⚠️ Cần đổi |
| `CREATE_OVERTIME` | `CREATE_OT` | `CREATE_OVERTIME` | ⚠️ Cần đổi |
| `APPROVE_OVERTIME` | `APPROVE_OT` | `APPROVE_OVERTIME` | ⚠️ Cần đổi |
| `REJECT_OVERTIME` | `REJECT_OT` | `REJECT_OVERTIME` | ⚠️ Cần đổi |
| `CANCEL_OVERTIME_OWN` | `CANCEL_OT_OWN` | `CANCEL_OVERTIME_OWN` | ⚠️ Cần đổi |
| `CANCEL_OVERTIME_PENDING` | `CANCEL_OT_PENDING` | `CANCEL_OVERTIME_PENDING` | ⚠️ Cần đổi |

### Leave Type Permissions

| Frontend (Đã chuẩn hóa) | Backend (Hiện tại) | Backend (Yêu cầu) | Status |
|---|---|---|---|
| `VIEW_LEAVE_TYPE` | `VIEW_TIMEOFF_TYPE_ALL` | `VIEW_LEAVE_TYPE` | ⚠️ Cần đổi |
| `MANAGE_LEAVE_TYPE` | `CREATE_TIMEOFF_TYPE`<br>`UPDATE_TIMEOFF_TYPE`<br>`DELETE_TIMEOFF_TYPE` | `MANAGE_LEAVE_TYPE` (hợp nhất) | ⚠️ Cần đổi |

### Other Permissions

| Frontend | Backend | Status |
|---|---|---|
| `VIEW_WAREHOUSE` | `VIEW_WAREHOUSE` | ✅ OK |
| `VIEW_TREATMENT_PLAN_ALL` | `VIEW_TREATMENT_PLAN_ALL` | ✅ OK |
| `VIEW_APPOINTMENT_ALL` | `VIEW_APPOINTMENT_ALL` | ✅ OK |
| `VIEW_SHIFTS_ALL` | `VIEW_SHIFTS_ALL` | ✅ OK |
| `VIEW_REGISTRATION_ALL` | `VIEW_REGISTRATION_ALL` | ✅ OK |

---

## 🔧 MIGRATION PLAN

### Phase 1: Critical (Phải làm ngay)
1. ✅ **Add `permissions` to Login Response**
   - Update LoginController/AuthenticationService
   - Update LoginResponse DTO
   - Test login endpoint
   - Deploy to staging → production

### Phase 2: Standardization (Trong sprint này)
2. ✅ **Update Overtime Permissions**
   - Update SQL seed data
   - Update AuthoritiesConstants.java
   - Update all @PreAuthorize annotations
   - Run migration script
   - Test overtime features
   
3. ✅ **Update Leave Type Permissions**
   - Update SQL seed data
   - Update AuthoritiesConstants.java
   - Update controllers
   - Run migration script
   - Test leave type management

### Phase 3: Enhancement (Sprint tiếp theo)
4. ✅ **Add Analytics Permissions**
   - Define permission group
   - Add to seed data
   - Update role assignments

5. ✅ **Full TIMEOFF → LEAVE Migration**
   - Create migration script
   - Update all references
   - Test thoroughly

---

## ✅ CHECKLIST CHO BACKEND

### Critical (Phải hoàn thành trước khi FE có thể hoạt động)
- [ ] Thêm `permissions` array vào LoginResponse
- [ ] Implement logic get all permissions for user
- [ ] Test login endpoint trả về đầy đủ permissions
- [ ] Verify permissions trong JWT token (optional)

### Medium Priority (Chuẩn hóa)
- [ ] Cập nhật Overtime permissions (VIEW_OT → VIEW_OVERTIME)
- [ ] Cập nhật Leave Type permissions (VIEW_TIMEOFF_TYPE → VIEW_LEAVE_TYPE)
- [ ] Run migration scripts
- [ ] Update AuthoritiesConstants.java
- [ ] Update tất cả @PreAuthorize annotations
- [ ] Test tất cả endpoints có permission checks

### Low Priority (Cải thiện)
- [ ] Thêm Analytics permission group
- [ ] Chuẩn hóa hoàn toàn TIMEOFF → LEAVE
- [ ] Add permission description/documentation
- [ ] Setup permission audit logging

---

## 📝 SQL MIGRATION SCRIPTS

### Script 1: Rename Overtime Permissions
```sql
-- Backup current data
CREATE TABLE permission_backup_20251222 AS SELECT * FROM permission;

-- Update Overtime permissions
UPDATE permission SET name = 'VIEW_OVERTIME_ALL', code = 'VIEW_OVERTIME_ALL' WHERE code = 'VIEW_OT_ALL';
UPDATE permission SET name = 'VIEW_OVERTIME_OWN', code = 'VIEW_OVERTIME_OWN' WHERE code = 'VIEW_OT_OWN';
UPDATE permission SET name = 'CREATE_OVERTIME', code = 'CREATE_OVERTIME' WHERE code = 'CREATE_OT';
UPDATE permission SET name = 'APPROVE_OVERTIME', code = 'APPROVE_OVERTIME' WHERE code = 'APPROVE_OT';
UPDATE permission SET name = 'REJECT_OVERTIME', code = 'REJECT_OVERTIME' WHERE code = 'REJECT_OT';
UPDATE permission SET name = 'CANCEL_OVERTIME_OWN', code = 'CANCEL_OVERTIME_OWN' WHERE code = 'CANCEL_OT_OWN';
UPDATE permission SET name = 'CANCEL_OVERTIME_PENDING', code = 'CANCEL_OVERTIME_PENDING' WHERE code = 'CANCEL_OT_PENDING';

-- Update parent references
UPDATE permission SET parent_code = 'VIEW_OVERTIME_ALL' WHERE parent_code = 'VIEW_OT_ALL';

-- Update role_permissions junction table
UPDATE role_permission SET permission_code = 'VIEW_OVERTIME_ALL' WHERE permission_code = 'VIEW_OT_ALL';
UPDATE role_permission SET permission_code = 'VIEW_OVERTIME_OWN' WHERE permission_code = 'VIEW_OT_OWN';
UPDATE role_permission SET permission_code = 'CREATE_OVERTIME' WHERE permission_code = 'CREATE_OT';
UPDATE role_permission SET permission_code = 'APPROVE_OVERTIME' WHERE permission_code = 'APPROVE_OT';
UPDATE role_permission SET permission_code = 'REJECT_OVERTIME' WHERE permission_code = 'REJECT_OT';
UPDATE role_permission SET permission_code = 'CANCEL_OVERTIME_OWN' WHERE permission_code = 'CANCEL_OT_OWN';
UPDATE role_permission SET permission_code = 'CANCEL_OVERTIME_PENDING' WHERE permission_code = 'CANCEL_OT_PENDING';

-- Verify
SELECT code, name, permission_group FROM permission WHERE permission_group = 'LEAVE_MANAGEMENT' AND code LIKE '%OVERTIME%';
```

### Script 2: Consolidate Leave Type Permissions
```sql
-- Option 1: Consolidate to MANAGE_LEAVE_TYPE (RECOMMENDED)
-- Update VIEW permission
UPDATE permission SET name = 'VIEW_LEAVE_TYPE', code = 'VIEW_LEAVE_TYPE' 
WHERE code = 'VIEW_TIMEOFF_TYPE_ALL';

-- Add new MANAGE permission
INSERT INTO permission (name, code, permission_group, description, display_order, active, created_at)
VALUES ('MANAGE_LEAVE_TYPE', 'MANAGE_LEAVE_TYPE', 'LEAVE_MANAGEMENT', 'Quản lý loại nghỉ phép (tạo/sửa/xóa)', 145, TRUE, NOW());

-- Migrate role assignments (users with CREATE, UPDATE, or DELETE get MANAGE)
INSERT INTO role_permission (role_id, permission_code, created_at)
SELECT DISTINCT rp.role_id, 'MANAGE_LEAVE_TYPE', NOW()
FROM role_permission rp
WHERE rp.permission_code IN ('CREATE_TIMEOFF_TYPE', 'UPDATE_TIMEOFF_TYPE', 'DELETE_TIMEOFF_TYPE')
AND NOT EXISTS (
    SELECT 1 FROM role_permission rp2 
    WHERE rp2.role_id = rp.role_id AND rp2.permission_code = 'MANAGE_LEAVE_TYPE'
);

-- Mark old permissions as inactive (keep for audit)
UPDATE permission SET active = FALSE, description = CONCAT(description, ' [DEPRECATED - use MANAGE_LEAVE_TYPE]')
WHERE code IN ('CREATE_TIMEOFF_TYPE', 'UPDATE_TIMEOFF_TYPE', 'DELETE_TIMEOFF_TYPE');

-- Update role_permission mappings
UPDATE role_permission SET permission_code = 'VIEW_LEAVE_TYPE' WHERE permission_code = 'VIEW_TIMEOFF_TYPE_ALL';

-- Verify
SELECT code, name, active FROM permission WHERE permission_group = 'LEAVE_MANAGEMENT' AND (code LIKE '%LEAVE_TYPE%' OR code LIKE '%TIMEOFF_TYPE%');
```

---

## 🧪 TESTING CHECKLIST

### Backend Tests
- [ ] Unit test: UserService.getAllPermissionsForUser()
- [ ] Unit test: UserService.getGroupedPermissionsForUser()
- [ ] Integration test: /auth/login returns permissions array
- [ ] Integration test: Overtime endpoints với permissions mới
- [ ] Integration test: Leave Type endpoints với permissions mới

### Manual Testing (Postman/curl)
- [ ] Login as admin → verify ~125 permissions returned
- [ ] Login as employee → verify correct permissions for role
- [ ] Login as patient → verify basic permissions
- [ ] Test overtime approval với APPROVE_OVERTIME permission
- [ ] Test leave type management với MANAGE_LEAVE_TYPE permission

### Frontend Integration Testing
- [ ] Login successful và permissions được lưu
- [ ] Sidebar hiển thị đúng menu items theo permissions
- [ ] Protected routes allow/block access correctly
- [ ] Buttons enable/disable theo permissions

---

## 📞 LIÊN HỆ

Nếu có thắc mắc về yêu cầu này, vui lòng liên hệ:
- Frontend Team Lead
- hoặc tạo issue trong project tracking system

---

**END OF DOCUMENT**
