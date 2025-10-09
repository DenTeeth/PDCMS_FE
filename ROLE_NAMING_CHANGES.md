# 🔄 ROLE NAMING CHANGES - SUMMARY

**Date:** October 9, 2025  
**Change:** Database roles now use `ROLE_` prefix

---

## ✅ ĐÃ CẬP NHẬT

### 📋 **Role Name Mapping:**

| Old Name (Frontend) | New Name (Database) | Route | Description |
|---------------------|---------------------|-------|-------------|
| `ADMIN` | `ROLE_ADMIN` | `/admin` | Quản trị viên hệ thống - Toàn quyền |
| `DENTIST` | `ROLE_DOCTOR` | `/dentist` | Bác sĩ nha khoa - Khám và điều trị |
| `RECEPTIONIST` | `ROLE_RECEPTIONIST` | `/receptionist` | Tiếp đón và quản lý lịch hẹn |
| `ACCOUNTANT` | `ROLE_ACCOUNTANT` | `/accountant` | Quản lý tài chính và thanh toán |
| `MANAGER` | `ROLE_INVENTORY_MANAGER` | `/manager` | Quản lý kho - Y tá kiêm kho |
| `WAREHOUSE` | `ROLE_NURSE` | `/warehouse` | Y tá hỗ trợ điều trị |
| `USER` | `ROLE_PATIENT` | `/user` | Người bệnh - Xem hồ sơ cá nhân |

---

## 📁 **Files Updated:**

### 1. ✅ **Layout Files (Protected Routes):**

#### `src/app/admin/layout.tsx`
```tsx
// ❌ Before
<ProtectedRoute requiredRoles={['ADMIN']}>

// ✅ After
<ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
```

#### `src/app/accountant/layout.tsx`
```tsx
// ❌ Before
<ProtectedRoute requiredRoles={['ACCOUNTANT']}>

// ✅ After
<ProtectedRoute requiredRoles={['ROLE_ACCOUNTANT']}>
```

#### `src/app/dentist/layout.tsx`
```tsx
// ❌ Before
<ProtectedRoute requiredRoles={['DENTIST']}>

// ✅ After
<ProtectedRoute requiredRoles={['ROLE_DOCTOR']}>
```

#### `src/app/manager/layout.tsx`
```tsx
// ❌ Before
<ProtectedRoute requiredRoles={['MANAGER']}>

// ✅ After
<ProtectedRoute requiredRoles={['ROLE_INVENTORY_MANAGER']}>
```

#### `src/app/receptionist/layout.tsx`
```tsx
// ❌ Before
<ProtectedRoute requiredRoles={['RECEPTIONIST']}>

// ✅ After
<ProtectedRoute requiredRoles={['ROLE_RECEPTIONIST']}>
```

#### `src/app/user/layout.tsx`
```tsx
// ❌ Before
<ProtectedRoute requiredRoles={['USER']}>

// ✅ After
<ProtectedRoute requiredRoles={['ROLE_PATIENT']}>
```

#### `src/app/warehouse/layout.tsx`
```tsx
// ❌ Before
<ProtectedRoute requiredRoles={['WAREHOUSE']}>

// ✅ After
<ProtectedRoute requiredRoles={['ROLE_NURSE']}>
```

---

### 2. ✅ **AuthRedirect Component:**

#### `src/components/auth/AuthRedirect.tsx`
```tsx
// ❌ Before
if (user.roles.includes('ADMIN')) {
  router.push('/admin');
} else if (user.roles.includes('RECEPTIONIST')) {
  router.push('/receptionist');
} else if (user.roles.includes('DENTIST')) {
  router.push('/dentist');
} else if (user.roles.includes('MANAGER')) {
  router.push('/manager');
} else if (user.roles.includes('ACCOUNTANT')) {
  router.push('/accountant');
} else if (user.roles.includes('WAREHOUSE')) {
  router.push('/warehouse');
} else {
  router.push('/user');
}

// ✅ After
if (user.roles.includes('ROLE_ADMIN')) {
  router.push('/admin');
} else if (user.roles.includes('ROLE_RECEPTIONIST')) {
  router.push('/receptionist');
} else if (user.roles.includes('ROLE_DOCTOR')) {
  router.push('/dentist');
} else if (user.roles.includes('ROLE_INVENTORY_MANAGER')) {
  router.push('/manager');
} else if (user.roles.includes('ROLE_ACCOUNTANT')) {
  router.push('/accountant');
} else if (user.roles.includes('ROLE_NURSE')) {
  router.push('/warehouse');
} else if (user.roles.includes('ROLE_PATIENT')) {
  router.push('/user');
} else {
  router.push('/unauthorized');  // Fallback
}
```

---

## ⚠️ **BREAKING CHANGES:**

### **Các component check role cần update:**

```tsx
// ❌ CŨ
if (user.roles.includes('ADMIN')) {
  // Admin features
}

// ✅ MỚI
if (user.roles.includes('ROLE_ADMIN')) {
  // Admin features
}
```

---

## 🧪 **Testing:**

### **Test với credentials mới:**

```typescript
// Login credentials (từ API_DOCUMENTATION.md)
{
  username: "admin",
  password: "DentalClinic@2025"
}

// Expected response:
{
  accessToken: "...",
  user: {
    username: "admin",
    roles: ["ROLE_ADMIN"],  // ← Có prefix ROLE_
    permissions: [...]
  }
}
```

### **Test Cases:**

1. ✅ Login với admin → Redirect đến `/admin`
2. ✅ Login với bác sĩ → Redirect đến `/dentist`
3. ✅ Login với lễ tân → Redirect đến `/receptionist`
4. ✅ Login với kế toán → Redirect đến `/accountant`
5. ✅ Login với manager → Redirect đến `/manager`
6. ✅ Login với y tá → Redirect đến `/warehouse`
7. ✅ Login với bệnh nhân → Redirect đến `/user`
8. ✅ Try access `/admin` without ROLE_ADMIN → Redirect đến `/unauthorized`

---

## 📌 **NOTES:**

### **Về ProtectedRoute component:**

File `src/components/auth/ProtectedRoute.tsx` **KHÔNG CẦN SỬA** vì:
```tsx
// Component này chỉ check array.includes()
const hasRequiredRole = requiredRoles.some(role => 
  user.roles.includes(role)
);
// → Chỉ cần update requiredRoles prop khi gọi component
```

### **Về AuthContext:**

File `src/contexts/AuthContext.tsx` **KHÔNG CẦN SỬA** vì:
- Backend API trả về `user.roles` với format mới (`ROLE_*`)
- Frontend chỉ cần lưu và sử dụng như bình thường

---

## 🎯 **CHECKLIST:**

- [x] Update admin layout (`ADMIN` → `ROLE_ADMIN`)
- [x] Update accountant layout (`ACCOUNTANT` → `ROLE_ACCOUNTANT`)
- [x] Update dentist layout (`DENTIST` → `ROLE_DOCTOR`)
- [x] Update manager layout (`MANAGER` → `ROLE_INVENTORY_MANAGER`)
- [x] Update receptionist layout (`RECEPTIONIST` → `ROLE_RECEPTIONIST`)
- [x] Update user layout (`USER` → `ROLE_PATIENT`)
- [x] Update warehouse layout (`WAREHOUSE` → `ROLE_NURSE`)
- [x] Update AuthRedirect component (role routing logic)
- [ ] Test login flow với từng role
- [ ] Test protected routes với role mới
- [ ] Update mock data nếu có (trong `src/data/*.ts`)

---

## 🔍 **Files CẦN KIỂM TRA THÊM:**

Các file có thể đang hardcode role names:

```bash
# Search for old role names
grep -r "ADMIN" src/ --exclude-dir=node_modules
grep -r "DENTIST" src/ --exclude-dir=node_modules  
grep -r "MANAGER" src/ --exclude-dir=node_modules
grep -r "RECEPTIONIST" src/ --exclude-dir=node_modules
grep -r "ACCOUNTANT" src/ --exclude-dir=node_modules
grep -r "WAREHOUSE" src/ --exclude-dir=node_modules
```

**Có thể cần update:**
- Mock data trong `src/data/*.ts` (nếu có role hardcoded)
- Test files (nếu có)
- Documentation files

---

**Last Updated:** October 9, 2025
