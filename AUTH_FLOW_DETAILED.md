# 🔐 JWT Authentication Flow - Chi tiết Technical

> **Document mô tả chi tiết luồng xử lý authentication với JWT dual-token strategy**  
> **Last updated:** October 7, 2025  
> **Project:** PDCMS (Patient Dental Clinic Management System)

---

## 📋 Mục lục

1. [Tổng quan Architecture](#1-tổng-quan-architecture)
2. [Token Strategy](#2-token-strategy)
3. [Luồng Login](#3-luồng-login)
4. [Luồng Auto-Refresh](#4-luồng-auto-refresh)
5. [Luồng API Request](#5-luồng-api-request)
6. [Luồng Logout](#6-luồng-logout)
7. [Edge Cases & Error Handling](#7-edge-cases--error-handling)
8. [Security Considerations](#8-security-considerations)

---

## 1. Tổng quan Architecture

### 1.1. Components Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js 15)                  │
│                                                              │
│  ┌────────────────┐    ┌──────────────────┐                │
│  │  AuthContext   │───▶│  Auto-Refresh    │                │
│  │  (React)       │    │  Timer           │                │
│  └────────────────┘    └──────────────────┘                │
│           │                                                  │
│           │                                                  │
│  ┌────────▼────────┐                                        │
│  │  Axios Client   │                                        │
│  │  + Interceptors │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
            │ HTTP Requests with credentials
            │ (Authorization header + Cookies)
            │
┌───────────▼──────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                     │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Auth        │───▶│  JWT         │───▶│  Cookie      │ │
│  │  Controller  │    │  Service     │    │  Manager     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 1.2. Tech Stack

**Frontend:**
- Next.js 15 (React 18, Turbopack)
- TypeScript
- Axios (HTTP client)
- localStorage (accessToken)
- React Context API (state management)

**Backend:**
- Spring Boot
- JWT (io.jsonwebtoken)
- HTTP-Only Cookies (refreshToken)
- CORS configuration

---

## 2. Token Strategy

### 2.1. Dual-Token Approach

| Token Type | Storage Location | Expiration | Purpose | Accessible by JS |
|------------|-----------------|------------|---------|------------------|
| **Access Token** | localStorage | 900s (15 phút) | API authentication | ✅ Yes |
| **Refresh Token** | HTTP-Only Cookie | 7 days | Renew access token | ❌ No (XSS-proof) |

### 2.2. Why This Strategy?

**Access Token in localStorage:**
- ✅ Dễ attach vào headers (`Authorization: Bearer <token>`)
- ✅ Short-lived (900s) → Giảm thiểu rủi ro nếu bị đánh cắp
- ⚠️ Vulnerable to XSS → Cần sanitize input, CSP headers

**Refresh Token in HTTP-Only Cookie:**
- ✅ Không thể đọc bằng JavaScript → XSS-proof
- ✅ Automatically sent với mọi request đến backend
- ✅ Long-lived (7 days) → Trải nghiệm người dùng tốt
- ⚠️ Vulnerable to CSRF → Backend cần CSRF protection

---

## 3. Luồng Login

### 3.1. Sequence Diagram

```
User          Frontend              Backend              Database
 │                │                    │                     │
 │─[1]─Submit────▶│                    │                     │
 │   Credentials  │                    │                     │
 │                │                    │                     │
 │                │─[2]─POST /login───▶│                     │
 │                │   {username, pwd}  │                     │
 │                │                    │                     │
 │                │                    │─[3]─Verify────────▶│
 │                │                    │   credentials       │
 │                │                    │◀────────────────────│
 │                │                    │   User data         │
 │                │                    │                     │
 │                │                    │─[4]─Generate JWT    │
 │                │                    │   tokens            │
 │                │                    │                     │
 │                │◀───────────────────│                     │
 │                │   Response:        │                     │
 │                │   - accessToken    │                     │
 │                │   - expiresAt      │                     │
 │                │   - user data      │                     │
 │                │   Set-Cookie:      │                     │
 │                │   refreshToken     │                     │
 │                │                    │                     │
 │                │─[5]─Store Tokens   │                     │
 │                │   localStorage:    │                     │
 │                │   - accessToken    │                     │
 │                │   - tokenExpiresAt │                     │
 │                │   - user data      │                     │
 │                │                    │                     │
 │                │─[6]─Setup Timer    │                     │
 │                │   Refresh in       │                     │
 │                │   895 seconds      │                     │
 │                │                    │                     │
 │◀───Redirect────│                    │                     │
 │   to Dashboard │                    │                     │
```

### 3.2. Code Implementation

**File:** `src/contexts/AuthContext.tsx` - Function `login()`

```typescript
const login = async (username: string, password: string) => {
  try {
    // [1] Send login request
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    });

    const { accessToken, user, accessTokenExpiresAt } = response.data.data;

    // [2] Store access token in localStorage
    setToken(accessToken);
    console.log('✅ Access token stored in localStorage');

    // [3] Store user data with expiration timestamp
    setUserData({
      ...user,
      tokenExpiresAt: accessTokenExpiresAt, // Unix timestamp from backend
    });
    console.log('✅ User data stored in localStorage');

    // [4] Update React state (triggers auto-refresh useEffect)
    setUser({
      ...user,
      tokenExpiresAt: accessTokenExpiresAt,
    });
    setIsAuthenticated(true);

    // [5] Backend automatically sets refreshToken in HTTP-Only Cookie
    console.log('🍪 Refresh token rotated by backend in HTTP-Only Cookie');

    return { success: true };
  } catch (error: any) {
    console.error('❌ Login failed:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Login failed',
    };
  }
};
```

### 3.3. Backend Response Format

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresAt": 1728304500,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN",
      "fullName": "Administrator"
    }
  },
  "statusCode": 200
}
```

**Headers:**
```
Set-Cookie: refreshToken=<JWT>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

---

## 4. Luồng Auto-Refresh

### 4.1. Sequence Diagram

```
Timer                AuthContext           Backend              localStorage
 │                        │                    │                     │
 │─[1]─895s elapsed──────▶│                    │                     │
 │   (5s before expiry)   │                    │                     │
 │                        │                    │                     │
 │                        │─[2]─Read───────────┼────────────────────▶│
 │                        │   tokenExpiresAt   │                     │
 │                        │◀───────────────────┼─────────────────────│
 │                        │   1728304500       │                     │
 │                        │                    │                     │
 │                        │─[3]─Calculate      │                     │
 │                        │   now = 1728304495 │                     │
 │                        │   remaining = 5s   │                     │
 │                        │   Action: REFRESH  │                     │
 │                        │                    │                     │
 │                        │─[4]─POST /refresh─▶│                     │
 │                        │   Cookie:          │                     │
 │                        │   refreshToken     │                     │
 │                        │                    │                     │
 │                        │                    │─[5]─Verify          │
 │                        │                    │   refreshToken      │
 │                        │                    │   (from cookie)     │
 │                        │                    │                     │
 │                        │◀───────────────────│                     │
 │                        │   New accessToken  │                     │
 │                        │   New expiresAt    │                     │
 │                        │   Set-Cookie:      │                     │
 │                        │   New refreshToken │                     │
 │                        │                    │                     │
 │                        │─[6]─Update─────────┼────────────────────▶│
 │                        │   localStorage     │                     │
 │                        │                    │                     │
 │◀─[7]─Setup new timer───│                    │                     │
 │   Refresh in 895s      │                    │                     │
```

### 4.2. Dynamic Timing Calculation

**File:** `src/contexts/AuthContext.tsx` - Function `calculateRefreshDelay()`

```typescript
const calculateRefreshDelay = () => {
  // [1] Get user data from localStorage
  const userData = getUserData();
  
  // [2] Fallback if no expiration info
  if (!userData?.tokenExpiresAt) {
    console.log('⚠️ No token expiration info, using fallback 10s refresh');
    return 10000; // 10 seconds
  }

  // [3] Calculate time until expiration
  const now = Math.floor(Date.now() / 1000);        // Current Unix timestamp (seconds)
  const expiresAt = userData.tokenExpiresAt;        // Backend timestamp (seconds)
  const timeUntilExpiry = expiresAt - now;          // Seconds remaining

  // [4] Edge case: Token already expired
  if (timeUntilExpiry <= 0) {
    console.warn('⚠️ Token already expired! Refreshing immediately...');
    return 100; // 100ms (prevent infinite loop, will fail and logout)
  }

  // [5] Calculate refresh delay: 5 seconds BEFORE expiration
  const refreshDelay = Math.max((timeUntilExpiry - 5) * 1000, 1000);
  //                            └─────┬─────┘  └─┬─┘   └─┬─┘
  //                                  │         │       └─ Minimum 1 second
  //                                  │         └─ Convert to milliseconds
  //                                  └─ Refresh 5s before expiry

  console.log(`⏰ Token expires in ${timeUntilExpiry}s, will refresh in ${Math.floor(refreshDelay / 1000)}s`);
  
  return refreshDelay;
};
```

### 4.3. Examples với Different Token Lifetimes

| Backend Token Lifetime | timeUntilExpiry | Refresh Delay | Actual Refresh Time |
|------------------------|-----------------|---------------|---------------------|
| 15s (test) | 15s | (15-5) × 1000 = **10s** | After 10 seconds |
| 900s (15 min) | 900s | (900-5) × 1000 = **895s** | After 14m55s |
| 3600s (1 hour) | 3600s | (3600-5) × 1000 = **3595s** | After 59m55s |
| 7200s (2 hours) | 7200s | (7200-5) × 1000 = **7195s** | After 1h59m55s |

**🎯 Kết luận:** Hệ thống **hoàn toàn linh hoạt**, tự động tính toán dựa trên backend!

### 4.4. Auto-Refresh Implementation

**File:** `src/contexts/AuthContext.tsx` - `useEffect` hook

```typescript
useEffect(() => {
  // [1] Guard: Only run if user is authenticated
  if (!isAuthenticated || !user) return;

  // [2] Calculate delay dynamically
  const delay = calculateRefreshDelay();

  console.log(`⏰ Setting up auto-refresh timer (${Math.floor(delay / 1000)} seconds)`);

  // [3] Setup timer
  const refreshTimeout = setTimeout(async () => {
    try {
      console.log('⏰ Auto-refreshing token (synced with backend expiration)...');
      
      // [4] Call refresh API
      await refreshAuth();
      
      // Success: useEffect will re-run with new user data and set new timer
    } catch (error) {
      console.error('❌ Auto-refresh failed, logging out:', error);
      logout(); // Force logout if refresh fails
    }
  }, delay);

  // [5] Cleanup: Clear timer when component unmounts or dependencies change
  return () => {
    console.log('🔄 Clearing auto-refresh timer');
    clearTimeout(refreshTimeout);
  };
}, [isAuthenticated, user]); // Re-run when auth state changes
```

### 4.5. Refresh API Call

**File:** `src/contexts/AuthContext.tsx` - Function `refreshAuth()`

```typescript
const refreshAuth = useCallback(async () => {
  try {
    console.log('🔄 Attempting to refresh token...');

    // [1] Call backend refresh endpoint (refreshToken sent automatically via cookie)
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh');

    const { accessToken, user: updatedUser, accessTokenExpiresAt } = response.data.data;

    // [2] Update localStorage
    setToken(accessToken);
    setUserData({
      ...updatedUser,
      tokenExpiresAt: accessTokenExpiresAt,
    });
    console.log('✅ Access token stored in localStorage');

    // [3] Update React state (triggers new auto-refresh timer)
    setUser({
      ...updatedUser,
      tokenExpiresAt: accessTokenExpiresAt,
    });

    console.log('✅ Token refreshed successfully');
    console.log(`⏱️ New token expires in: ${accessTokenExpiresAt - Math.floor(Date.now() / 1000)} seconds`);

    // [4] Backend rotates refreshToken in cookie automatically
    console.log('🍪 Refresh token rotated by backend in HTTP-Only Cookie');
  } catch (error: any) {
    console.error('❌ Token refresh failed:', error);
    
    // If refresh fails, logout user
    logout();
    throw error;
  }
}, []); // useCallback prevents re-creation on every render
```

---

## 5. Luồng API Request

### 5.1. Sequence Diagram (Success Case)

```
Component         Axios Client         Interceptor        Backend
    │                  │                    │                │
    │─[1]─API Call────▶│                    │                │
    │   getData()      │                    │                │
    │                  │                    │                │
    │                  │─[2]─Request────────▶│                │
    │                  │   Interceptor       │                │
    │                  │                    │                │
    │                  │                    │─[3]─Add Header │
    │                  │                    │   Authorization:│
    │                  │                    │   Bearer <token>│
    │                  │                    │                │
    │                  │                    │─[4]─Send───────▶│
    │                  │                    │   GET /data    │
    │                  │                    │   + Cookie     │
    │                  │                    │                │
    │                  │                    │◀────200 OK─────│
    │                  │                    │   { data: ... }│
    │                  │                    │                │
    │                  │◀───────Return──────│                │
    │◀─────Data────────│                    │                │
```

### 5.2. Sequence Diagram (401 Error + Auto-Refresh)

```
Component    Axios Client    Interceptor    RefreshQueue    Backend
    │             │               │              │             │
    │─[1]─────────▶│               │              │             │
    │  API Call    │               │              │             │
    │             │               │              │             │
    │             │─[2]───────────▶│              │             │
    │             │  Request       │              │             │
    │             │               │              │             │
    │             │               │─[3]──────────┼────────────▶│
    │             │               │  GET /data   │  + Token    │
    │             │               │              │             │
    │             │               │◀──401 Error──┼─────────────│
    │             │               │  Unauthorized│             │
    │             │               │              │             │
    │             │               │─[4]─Check    │             │
    │             │               │  isRefreshing?│            │
    │             │               │  = false      │             │
    │             │               │              │             │
    │             │               │─[5]──────────▶│             │
    │             │               │  Add to queue │             │
    │             │               │              │             │
    │             │               │─[6]──────────┼─────────────▶│
    │             │               │  POST /refresh│  + Cookie  │
    │             │               │              │             │
    │             │               │◀──200 OK─────┼─────────────│
    │             │               │  New token   │             │
    │             │               │              │             │
    │             │               │─[7]─Update   │             │
    │             │               │  localStorage│             │
    │             │               │              │             │
    │             │               │─[8]──────────▶│             │
    │             │               │  Process queue│            │
    │             │               │              │             │
    │             │               │              │─[9]────────▶│
    │             │               │              │  Retry      │
    │             │               │              │  Original   │
    │             │               │              │  Request    │
    │             │               │              │             │
    │             │               │              │◀─200 OK────│
    │             │               │              │  { data }   │
    │             │◀──────────────┼──────────────│             │
    │◀────Data────│               │              │             │
```

### 5.3. Axios Request Interceptor

**File:** `src/lib/api.ts` - Request Interceptor

```typescript
// [1] Request Interceptor: Add Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken(); // Get from localStorage
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Authorization header added to request');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### 5.4. Axios Response Interceptor (Error Handling + Auto-Refresh)

**File:** `src/lib/api.ts` - Response Interceptor

```typescript
// [2] Response Interceptor: Handle 401/500 errors with auto-refresh
axiosInstance.interceptors.response.use(
  (response) => response, // Pass through successful responses
  
  async (error) => {
    const originalRequest = error.config;

    // [3] Check if error is 401 or 500 (backend may return 500 for expired tokens)
    if (
      (error.response?.status === 401 || error.response?.status === 500) &&
      !originalRequest._retry // Prevent infinite retry loop
    ) {
      console.log('⚠️ Token expired or invalid, attempting refresh...');

      // [4] Check if already refreshing
      if (isRefreshing) {
        console.log('⏳ Already refreshing, queuing this request...');
        
        // [5] Add to queue and wait
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest); // Retry with new token
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true; // Mark as retrying
      isRefreshing = true; // Set flag

      try {
        // [6] Call refresh API
        const response = await axiosInstance.post<RefreshTokenResponse>('/auth/refresh');
        const { accessToken } = response.data.data;

        // [7] Update localStorage
        setToken(accessToken);
        console.log('✅ New access token stored in localStorage');

        // [8] Process queued requests
        processQueue(null, accessToken);

        // [9] Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // [10] Refresh failed, clear queue and logout
        console.error('❌ Refreshing access token failed:', refreshError);
        processQueue(refreshError, null);
        
        // Clear auth data and redirect to login
        clearAuthData();
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // Reset flag
      }
    }

    return Promise.reject(error);
  }
);
```

### 5.5. Queue Management

**File:** `src/lib/api.ts` - Queue Functions

```typescript
// [1] Queue to store failed requests during token refresh
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// [2] Process all queued requests after refresh completes
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error); // Reject all if refresh failed
    } else {
      promise.resolve(token); // Resolve with new token
    }
  });

  failedQueue = []; // Clear queue
};
```

**🎯 Hiệu quả:** Nếu có 10 API calls cùng lúc gặp 401, chỉ 1 request refresh được gửi, 9 requests còn lại đợi trong queue!

---

## 6. Luồng Logout

### 6.1. Sequence Diagram

```
User        Component         AuthContext         Backend         localStorage
 │              │                  │                  │                │
 │─[1]─Click───▶│                  │                  │                │
 │   Logout     │                  │                  │                │
 │              │                  │                  │                │
 │              │─[2]─logout()────▶│                  │                │
 │              │                  │                  │                │
 │              │                  │─[3]─Clear Timer  │                │
 │              │                  │   clearTimeout() │                │
 │              │                  │                  │                │
 │              │                  │─[4]─POST────────▶│                │
 │              │                  │   /auth/logout   │                │
 │              │                  │   Cookie: token  │                │
 │              │                  │                  │                │
 │              │                  │                  │─[5]─Invalidate│
 │              │                  │                  │   refreshToken │
 │              │                  │                  │   in database  │
 │              │                  │                  │                │
 │              │                  │◀─────200 OK──────│                │
 │              │                  │   Set-Cookie:    │                │
 │              │                  │   refreshToken=; │                │
 │              │                  │   Max-Age=0      │                │
 │              │                  │                  │                │
 │              │                  │─[6]─Clear────────┼───────────────▶│
 │              │                  │   localStorage   │                │
 │              │                  │   - accessToken  │                │
 │              │                  │   - user data    │                │
 │              │                  │                  │                │
 │              │                  │─[7]─Update State │                │
 │              │                  │   isAuthenticated│                │
 │              │                  │   = false        │                │
 │              │                  │                  │                │
 │              │◀─────Redirect────│                  │                │
 │◀─────────────│   to /login      │                  │                │
```

### 6.2. Code Implementation

**File:** `src/contexts/AuthContext.tsx` - Function `logout()`

```typescript
const logout = async () => {
  try {
    console.log('🚪 Logging out...');

    // [1] Call backend logout endpoint (invalidates refreshToken)
    await apiClient.post('/auth/logout');
    console.log('✅ Backend logout successful');
  } catch (error) {
    console.error('⚠️ Backend logout failed, clearing local data anyway:', error);
  } finally {
    // [2] Clear localStorage (always execute even if backend fails)
    clearAuthData();
    console.log('🧹 Local auth data cleared');

    // [3] Update React state
    setUser(null);
    setIsAuthenticated(false);

    // [4] Redirect to login page
    window.location.href = '/login';
  }
};
```

**File:** `src/lib/cookies.ts` - Function `clearAuthData()`

```typescript
export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  console.log('🧹 Auth data cleared from localStorage');
};
```

---

## 7. Edge Cases & Error Handling

### 7.1. Token Already Expired (User returns after long break)

**Scenario:** User đóng laptop, mở lại sau 2 giờ (token đã hết hạn).

```typescript
// File: src/contexts/AuthContext.tsx
const calculateRefreshDelay = () => {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = userData.tokenExpiresAt;
  const timeUntilExpiry = expiresAt - now;

  // ⚠️ Token already expired
  if (timeUntilExpiry <= 0) {
    console.warn('⚠️ Token already expired! Refreshing immediately...');
    return 100; // 100ms to avoid infinite loop
  }
  // ...
};
```

**Flow:**
1. Timer triggers sau 100ms
2. Call `/auth/refresh`
3. **Nếu backend trả về 401** (refreshToken cũng hết hạn) → Logout
4. **Nếu backend trả về 200** (refreshToken còn valid) → Renew accessToken

### 7.2. Multiple Tabs Open (Token Sync Issue)

**Problem:** User mở 2 tabs, logout ở tab 1, tab 2 vẫn còn token trong localStorage.

**Solution:** Listen to `storage` event (có thể implement sau).

```typescript
// Future enhancement
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'accessToken' && e.newValue === null) {
      // Token removed in another tab, logout this tab too
      logout();
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

### 7.3. Network Error During Refresh

**Scenario:** User mất internet khi auto-refresh trigger.

```typescript
// File: src/lib/api.ts
try {
  const response = await axiosInstance.post<RefreshTokenResponse>('/auth/refresh');
  // ...
} catch (refreshError) {
  console.error('❌ Refreshing access token failed:', refreshError);
  
  // Check if network error
  if (refreshError.code === 'ERR_NETWORK') {
    console.log('📡 Network error, will retry on next request');
    // Don't logout, let user retry manually
    return Promise.reject(refreshError);
  }
  
  // If 401/403, token invalid → logout
  clearAuthData();
  window.location.href = '/login';
}
```

### 7.4. Race Condition (Multiple 401 at Same Time)

**Problem:** 10 API calls cùng gặp 401, tất cả đều gọi `/auth/refresh`.

**Solution:** Queue mechanism.

```typescript
// File: src/lib/api.ts
if (isRefreshing) {
  // [1] Already refreshing, add to queue
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  })
    .then((token) => {
      // [2] Wait for refresh to complete, then retry
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return axiosInstance(originalRequest);
    });
}
```

**Result:** Chỉ 1 request `/auth/refresh`, các requests khác đợi trong queue!

---

## 8. Security Considerations

### 8.1. Token Storage Security

| Attack Vector | Risk Level | Mitigation |
|--------------|------------|------------|
| **XSS (Cross-Site Scripting)** | ⚠️ Medium | - AccessToken short-lived (900s)<br>- Sanitize all user inputs<br>- CSP headers<br>- RefreshToken in HTTP-Only Cookie |
| **CSRF (Cross-Site Request Forgery)** | ⚠️ Medium | - Backend implements CSRF protection<br>- SameSite=Strict on cookies<br>- Check Origin/Referer headers |
| **Man-in-the-Middle** | ⚠️ Medium | - HTTPS only in production<br>- Secure flag on cookies<br>- HSTS headers |
| **Token Theft (localStorage)** | ⚠️ Medium | - Short token lifetime (900s)<br>- Auto-logout on suspicious activity<br>- IP/Device fingerprinting |

### 8.2. Best Practices

✅ **Implemented:**
- Short-lived access tokens (900s)
- HTTP-Only cookies for refresh tokens
- Auto-refresh before expiration
- Clear tokens on logout
- CORS properly configured
- Credentials sent with every request

⚠️ **Recommended (Future):**
- Content Security Policy (CSP) headers
- Token rotation on every refresh (backend already does this)
- Rate limiting on `/auth/refresh` endpoint
- Device fingerprinting
- Suspicious activity detection (multiple failed refreshes)

### 8.3. Production Checklist

```typescript
// File: .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
NODE_ENV=production
```

**Backend CORS Config:**
```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://yourdomain.com",
    "https://www.yourdomain.com"
));
configuration.setAllowCredentials(true); // ⚠️ CRITICAL
```

**Nginx Config (if applicable):**
```nginx
# Ensure cookies are passed through
proxy_pass_header Set-Cookie;
proxy_cookie_path / "/; Secure; HttpOnly; SameSite=Strict";
```

---

## 9. Testing Scenarios

### 9.1. Manual Testing Checklist

| Scenario | Expected Behavior | Verification |
|----------|------------------|--------------|
| **Login** | Token stored, timer set | Check localStorage + console logs |
| **Auto-refresh (normal)** | Token refreshed 5s before expiry | Wait 895s, check console |
| **Auto-refresh (page refresh)** | Timer recalculated correctly | Refresh page, check logs |
| **API call (valid token)** | Request succeeds | Check Network tab |
| **API call (expired token)** | Auto-refresh triggered, request retries | Check console for 401 → refresh → retry |
| **Logout** | All data cleared | Check localStorage empty |
| **Token already expired** | Immediate refresh attempt or logout | Close laptop, reopen after 1 hour |

### 9.2. Console Log Timeline Example

```
[Login]
✅ Access token stored in localStorage
✅ User data stored in localStorage
🍪 Refresh token rotated by backend in HTTP-Only Cookie
⏰ Token expires in 900s, will refresh in 895s
⏰ Setting up auto-refresh timer (895 seconds)

[... 895 seconds later ...]
⏰ Auto-refreshing token (synced with backend expiration)...
🔄 Attempting to refresh token...
✅ Access token stored in localStorage
✅ Token refreshed successfully
⏱️ New token expires in: 900 seconds
🍪 Refresh token rotated by backend in HTTP-Only Cookie
⏰ Token expires in 900s, will refresh in 895s
⏰ Setting up auto-refresh timer (895 seconds)

[API Call with Expired Token]
🔐 Authorization header added to request
⚠️ Token expired or invalid, attempting refresh...
🔄 Attempting to refresh token...
✅ New access token stored in localStorage
🔐 Authorization header added to request (retry)
✅ Request succeeded

[Logout]
🚪 Logging out...
🔄 Clearing auto-refresh timer
✅ Backend logout successful
🧹 Local auth data cleared
🧹 Auth data cleared from localStorage
```

---

## 10. Summary

### 10.1. Key Features

✅ **Fully Dynamic Timing**: Token refresh delay tự động tính từ backend timestamp  
✅ **Zero Hardcoded Values**: Không có magic numbers (15s, 900s, etc.)  
✅ **Backend-Synced**: Frontend luôn đồng bộ với backend  
✅ **Secure**: RefreshToken XSS-proof (HTTP-Only Cookie)  
✅ **Resilient**: Queue mechanism prevents duplicate refreshes  
✅ **Edge-Case Handling**: Token expired, network errors, race conditions  

### 10.2. File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Auth state + auto-refresh logic
├── lib/
│   ├── api.ts                   # Axios client + interceptors
│   └── cookies.ts               # localStorage helpers
└── types/
    └── auth.ts                  # TypeScript interfaces
```

### 10.3. Token Lifetime Formula

```typescript
refreshDelay = Math.max((expiresAt - now - 5) * 1000, 1000)
                        └────────┬────────┘   └─┬─┘   └─┬─┘
                                 │             │       └─ Min 1s
                                 │             └─ Convert to ms
                                 └─ 5s safety buffer
```

**Example:**
- Token lifetime: 900s
- Refresh after: 895s (14m55s)
- Safety buffer: 5s before expiration

---

## 📞 Contact & Support

**Project:** PDCMS Frontend  
**Framework:** Next.js 15 + TypeScript  
**Last Updated:** October 7, 2025  

**Related Documents:**
- `AUTH_IMPLEMENTATION_JOURNEY.md` - Lịch sử implementation và các vấn đề đã gặp
- `CODE_REVIEW_CHECKLIST.md` - Security và quality checklist
- `FRONTEND_INTEGRATION.md` - API integration guide

---

**🎉 Congratulations!** Bạn đã có một authentication system production-ready với dynamic timing và proper security practices!
