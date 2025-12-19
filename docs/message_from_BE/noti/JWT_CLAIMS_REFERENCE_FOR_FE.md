# JWT Claims Reference for Frontend

## 📋 Tổng quan

Backend trả về JWT token với các claims sau đây. Frontend cần decode JWT để lấy thông tin user.

---

## 🔑 JWT Claims Structure

### Standard Claims (OAuth2/OIDC)

| Claim | Type   | Description                          | Example      |
| ----- | ------ | ------------------------------------ | ------------ |
| `sub` | string | Username (unique identifier)         | `"admin"`    |
| `iat` | number | Issued At timestamp (epoch seconds)  | `1702819200` |
| `exp` | number | Expiration timestamp (epoch seconds) | `1702822800` |

### Custom Claims (Application-Specific)

| Claim           | Type     | Description                                   | Example                 | Required    |
| --------------- | -------- | --------------------------------------------- | ----------------------- | ----------- |
| `account_id`    | number   | **Account ID** - Dùng cho Notification system | `123`                   | ✅ Yes      |
| `roles`         | string[] | User roles (với prefix `ROLE_`)               | `["ROLE_ADMIN"]`        | ✅ Yes      |
| `permissions`   | string[] | User permissions                              | `["VIEW_PATIENT", ...]` | ✅ Yes      |
| `patient_code`  | string   | Patient code (nếu user là bệnh nhân)          | `"BN001"`               | ❌ Optional |
| `employee_code` | string   | Employee code (nếu user là nhân viên)         | `"EMP001"`              | ❌ Optional |

---

## 🎯 Notification System: Sử dụng `account_id`

### Backend Implementation

Backend sử dụng `account_id` làm `userId` trong Notification system:

```java
// NotificationController.java
Integer userId = jwt.getClaim("account_id");

// Notification.java entity
@Column(name = "user_id")
private Integer userId; // = account_id from JWT
```

### Frontend Implementation

#### 1️⃣ Decode JWT để lấy `account_id`

```typescript
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string; // username
  account_id: number; // ⭐ USER ID for Notification system
  roles: string[];
  permissions: string[];
  patient_code?: string;
  employee_code?: string;
  iat: number;
  exp: number;
}

const token = localStorage.getItem("access_token");
const decoded = jwtDecode<JwtPayload>(token);

const userId = decoded.account_id; // ⭐ Dùng cho WebSocket subscription
```

#### 2️⃣ Subscribe WebSocket với `userId`

```typescript
// WebSocket connection
const socket = new SockJS(`${API_URL}/ws`);
const stompClient = Stomp.over(socket);

stompClient.connect({}, () => {
  // Subscribe to user-specific notification channel
  const userId = decoded.account_id; // ⭐ From JWT
  stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
    const notification = JSON.parse(message.body);
    console.log("New notification:", notification);
  });
});
```

#### 3️⃣ API Calls - Token tự động gửi trong Authorization header

```typescript
// Axios interceptor đã tự động thêm token vào header
// Backend sẽ tự extract account_id từ JWT
axios.get("/api/v1/notifications", {
  params: { page: 0, size: 20 },
});
// ✅ Backend tự động lấy userId từ JWT claim "account_id"
```

---

## 🔍 Debugging JWT Token

### Online Decoder

1. Copy JWT token từ browser localStorage/cookies
2. Dán vào https://jwt.io/
3. Kiểm tra payload section có `account_id` không

### Browser Console

```javascript
// Paste vào browser console
const token = localStorage.getItem("access_token");
const base64Url = token.split(".")[1];
const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
const jsonPayload = decodeURIComponent(
  atob(base64)
    .split("")
    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
    .join("")
);
console.log(JSON.parse(jsonPayload));
```

**Expected Output:**

```json
{
  "sub": "admin",
  "account_id": 123,
  "roles": ["ROLE_ADMIN"],
  "permissions": ["VIEW_NOTIFICATION", "DELETE_NOTIFICATION", ...],
  "employee_code": "EMP001",
  "iat": 1702819200,
  "exp": 1702822800
}
```

---

## ⚠️ Common Issues

### Issue 1: `account_id` is undefined

**Cause:** Backend chưa cập nhật SecurityUtil.createAccessToken()
**Fix:** Backend đã update tại commit `c4b1259`

### Issue 2: WebSocket không nhận được notification

**Cause:** Subscribe sai `userId`
**Fix:**

```typescript
// ❌ WRONG - Using username
stompClient.subscribe(`/topic/notifications/${decoded.sub}`, ...);

// ✅ CORRECT - Using account_id
stompClient.subscribe(`/topic/notifications/${decoded.account_id}`, ...);
```

### Issue 3: 403 Forbidden khi call notification APIs

**Cause:** User chưa có permissions `VIEW_NOTIFICATION`
**Fix:** Chạy SQL script `docs/troubleshooting/FIX_NOTIFICATION_403_ERROR.sql`

---

## 📚 Related Documents

- [NOTIFICATION_SYSTEM_FE_INTEGRATION_GUIDE.md](../NOTIFICATION_SYSTEM_FE_INTEGRATION_GUIDE.md) - Hướng dẫn tích hợp đầy đủ
- [NOTIFICATION_SYSTEM_API_DOCUMENTATION.md](../NOTIFICATION_SYSTEM_API_DOCUMENTATION.md) - API reference
- [FIX_NOTIFICATION_403_ERROR.sql](./FIX_NOTIFICATION_403_ERROR.sql) - SQL script fix permissions

---

## 🔄 Version History

- **2025-12-17**: Initial version
  - Documented `account_id` claim usage
  - Added WebSocket subscription guide
  - Added debugging instructions
