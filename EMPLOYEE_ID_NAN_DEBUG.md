# 🐛 DEBUG: employeeId = NaN Issue

## 🔴 CRITICAL ISSUE

**URL đang gọi:**
```
GET /api/v1/admin/employees/NaN/leave-balances?cycle_year=2025
                              ^^^
Status: 400 Bad Request
```

**Vấn đề:** `user.employeeId` đang là `NaN` khi gọi API leave balance

---

## 🔍 CÁCH DEBUG

### Bước 1: Kiểm tra User Object trong Console

Mở **Console** trong trình duyệt và chạy:

```javascript
// Check user object
console.log('User:', user);
console.log('EmployeeId:', user?.employeeId);
console.log('Type:', typeof user?.employeeId);
console.log('IsNaN:', isNaN(Number(user?.employeeId)));
```

### Bước 2: Kiểm tra JWT Token

```javascript
// Get token from localStorage
const token = localStorage.getItem('token');
console.log('Token:', token);

// Decode JWT manually
function decodeJWT(token) {
  const parts = token.split('.');
  const payload = parts[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

const decoded = decodeJWT(token);
console.log('Decoded JWT:', decoded);
console.log('JWT fields:', Object.keys(decoded));
```

### Bước 3: Kiểm tra Account Type

```javascript
// Check if user is Employee or Patient
console.log('Base Role:', user?.baseRole);
console.log('Roles:', user?.roles);

// Check if this is an employee account
const isEmployee = user?.roles?.includes('ROLE_EMPLOYEE') || 
                   user?.roles?.includes('ROLE_DOCTOR') ||
                   user?.roles?.includes('ROLE_RECEPTIONIST');
console.log('Is Employee?', isEmployee);
```

---

## 🎯 CÁC NGUYÊN NHÂN CÓ THỂ

### 1. ❌ User là Patient (không có employeeId)

**Dấu hiệu:**
- `user.baseRole = 'patient'`
- `user.roles = ['ROLE_PATIENT']`
- JWT token **KHÔNG có** `employeeId` field

**Giải pháp:**
- Patient accounts **KHÔNG NÊN** truy cập `/employee/time-off-requests`
- Cần redirect patient về `/patient` dashboard
- Hoặc ẩn menu "Time-Off Requests" cho patient accounts

### 2. ❌ JWT không chứa employeeId

**Dấu hiệu:**
- Decoded JWT **KHÔNG có** các field: `employeeId`, `employee_id`, `empId`
- Console log: `⚠️ No employeeId found in token payload`

**Backend cần fix:**
```java
// Backend JWT generation - PHẢI thêm employeeId vào claims
Claims claims = Jwts.claims().setSubject(username);
claims.put("employeeId", employee.getEmployeeId()); // ← QUAN TRỌNG!
claims.put("employeeCode", employee.getEmployeeCode());
// ... other claims
```

### 3. ❌ employeeId có giá trị nhưng không phải số

**Dấu hiệu:**
- `typeof user.employeeId === 'string'` nhưng không parse được thành số
- `Number(user.employeeId) === NaN`

**Ví dụ:**
```javascript
// BAD: employeeId = "null" (string literal)
Number("null") // → NaN

// BAD: employeeId = "undefined" (string literal)
Number("undefined") // → NaN

// BAD: employeeId = "" (empty string)
Number("") // → 0 (nhưng validation reject vì <= 0)

// GOOD: employeeId = "123" (numeric string)
Number("123") // → 123
```

### 4. ❌ Frontend AuthContext không extract đúng

**Dấu hiệu:**
- JWT có `employeeId` nhưng `user.employeeId = undefined`
- Console log: `⚠️ Cannot load leave balances: user.employeeId is missing`

**Kiểm tra:**
- File: `src/contexts/AuthContext.tsx`
- Function: `getEmployeeIdFromToken()`
- Check xem function có được gọi không
- Check xem return value có đúng không

---

## 🔧 CÁCH FIX

### Fix 1: Prevent Patient từ truy cập Employee pages

**File:** `src/middleware.ts` hoặc page component

```typescript
// In component
useEffect(() => {
  if (user && user.baseRole === 'patient') {
    router.push('/patient');
    return;
  }
}, [user, router]);
```

### Fix 2: Backend - Thêm employeeId vào JWT

**File:** `JwtTokenProvider.java` hoặc tương tự

```java
public String generateToken(Authentication authentication) {
    UserDetails userDetails = (UserDetails) authentication.getPrincipal();
    
    // Get employee from account
    Account account = accountRepository.findByUsername(userDetails.getUsername())
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    
    Claims claims = Jwts.claims().setSubject(userDetails.getUsername());
    
    // ✅ ADD EMPLOYEE ID IF EXISTS
    if (account.getEmployee() != null) {
        claims.put("employeeId", account.getEmployee().getEmployeeId());
        claims.put("employeeCode", account.getEmployee().getEmployeeCode());
    }
    
    // ... rest of token generation
}
```

### Fix 3: Frontend - Validate employeeId trước khi dùng

**File:** `src/app/employee/time-off-requests/page.tsx`

```typescript
// ✅ ĐÃ FIX - Validate before using
const loadLeaveBalances = async () => {
  if (!user?.employeeId) {
    console.warn('⚠️ Cannot load leave balances: user.employeeId is missing');
    return;
  }

  const employeeIdNum = Number(user.employeeId);
  if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
    console.error('❌ Invalid employeeId:', user.employeeId);
    return;
  }

  // Safe to call API now
  const balances = await LeaveBalanceService.getEmployeeBalances(employeeIdNum, year);
};
```

---

## 📋 CHECKLIST DEBUG

### Frontend Dev:
- [ ] Check console logs khi load `/employee/time-off-requests`
- [ ] Xem warning: `⚠️ Cannot load leave balances`
- [ ] Check `user` object trong React DevTools
- [ ] Check `localStorage.getItem('token')` có tồn tại không
- [ ] Decode JWT token xem có `employeeId` field không
- [ ] Check account type: Employee hay Patient?

### Backend Dev:
- [ ] Check JWT token generation code
- [ ] Verify `employeeId` được add vào claims chưa
- [ ] Check employee relationship: `account.getEmployee()` có null không?
- [ ] Test với employee account: Token có chứa `employeeId` không?
- [ ] Test với patient account: Token có chứa gì?

---

## 🎯 KẾT QUẢ MONG ĐỢI

### Token phải có employeeId
```json
{
  "sub": "employee001",
  "employeeId": 2,           // ← PHẢI CÓ
  "employeeCode": "EMP002",
  "roles": ["ROLE_EMPLOYEE"],
  "permissions": ["VIEW_TIMEOFF_OWN", "CREATE_TIMEOFF", ...],
  "iat": 1733097600,
  "exp": 1733184000
}
```

### User object phải đầy đủ
```typescript
{
  username: "employee001",
  employeeId: 2,              // ← PHẢI CÓ (number hoặc string parseable)
  employeeCode: "EMP002",
  baseRole: "employee",
  roles: ["ROLE_EMPLOYEE"],
  permissions: [...],
  // ... other fields
}
```

### API call phải đúng
```
GET /api/v1/admin/employees/2/leave-balances?cycle_year=2025
                              ^
                              Number, không phải NaN
```

---

## 🚨 QUAN TRỌNG

**Nếu user là Patient:**
- ❌ KHÔNG có `employeeId` trong JWT → **ĐÂY LÀ ĐÚNG**
- ❌ Patient **KHÔNG NÊN** truy cập `/employee/*` pages
- ✅ Cần check role trước khi render employee pages
- ✅ Redirect patient về `/patient` dashboard

**Nếu user là Employee:**
- ✅ PHẢI có `employeeId` trong JWT
- ✅ PHẢI có `employeeId` trong user object
- ✅ `employeeId` phải là số hợp lệ (> 0)

---

**Kết luận:** Check console logs và JWT token để xác định nguyên nhân chính xác! 🔍
