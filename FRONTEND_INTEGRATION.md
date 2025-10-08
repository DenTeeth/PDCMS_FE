# 🔐 **API Integration Guide for Next.js Frontend**

## **Dental Clinic Management System - Backend API Documentation**

**Version:** 1.0.0
**Last Updated:** October 7, 2025
**Backend URL:** `http://localhost:8080` (Development) | `https://api.yourdomain.com` (Production)

---

## 📋 **Table of Contents**

1. [Authentication Flow Overview](#1-authentication-flow-overview)
2. [API Endpoints](#2-api-endpoints)
3. [Next.js Implementation Guide](#3-nextjs-implementation-guide)
4. [Security Best Practices](#4-security-best-practices)
5. [Error Handling](#5-error-handling)
6. [Code Examples](#6-code-examples)

---

## 1️⃣ **Authentication Flow Overview**

### **Architecture:**

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Next.js   │◄───────►│  Spring Boot │◄───────►│    MySQL     │
│  Frontend   │  HTTPS  │   Backend    │         │   Database   │
└─────────────┘         └──────────────┘         └──────────────┘
     │                          │
     │  1. Login (POST)         │
     │─────────────────────────►│
     │                          │ Validate credentials
     │  2. Response:            │ Generate tokens
     │     - Access Token       │
     │     - Refresh Token      │
     │       (HTTP-Only Cookie) │
     │◄─────────────────────────│
     │                          │
     │  3. API Requests         │
     │     Header: Bearer Token │
     │─────────────────────────►│
     │                          │ Validate JWT
     │  4. Response: Data       │ Check permissions
     │◄─────────────────────────│
     │                          │
     │  5. Token Expired (401)  │
     │◄─────────────────────────│
     │                          │
     │  6. Auto Refresh (POST)  │
     │     Cookie: refresh_token│
     │─────────────────────────►│
     │                          │ Validate refresh token
     │  7. New Access Token     │ Generate new tokens
     │◄─────────────────────────│
```

### **Token Lifecycle:**

| Token Type        | Storage Location           | Expiration | Purpose            | Security                                        |
| ----------------- | -------------------------- | ---------- | ------------------ | ----------------------------------------------- |
| **Access Token**  | Client-side (Memory/State) | 15 minutes | API authentication | ⚠️ Store in React state, NOT localStorage       |
| **Refresh Token** | HTTP-Only Cookie           | 7 days     | Renew access token | ✅ Cannot be accessed by JavaScript (XSS-proof) |

---

## 2️⃣ **API Endpoints**

### **Base URL:**

```
Development: http://localhost:8080
Production:  https://api.yourdomain.com
```

---

### **A. Authentication Endpoints**

#### **1. Login**

```http
POST /api/v1/auth/login
Content-Type: application/json
```

**Request Body:**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGVzIjpbIlJPTEVfQURNSU4iXSwicGVybWlzc2lvbnMiOlsiVklFV19FTVBMT1lFRSIsIkNSRUFURV9FTVBMT1lFRSJdLCJpYXQiOjE3MjgyOTE2MDAsImV4cCI6MTcyODI5MjUwMH0...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzI4MjkxNjAwLCJleHAiOjE3Mjg4OTY0MDB9..."
}
```

**Response Headers:**

```http
Set-Cookie: refresh_token=eyJhbGc...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Error Responses:**

```json
// 400 Bad Request - Invalid credentials
{
  "timestamp": "2025-10-07T10:30:00.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid username or password",
  "path": "/api/v1/auth/login"
}

// 400 Bad Request - Account inactive
{
  "message": "Account is not active"
}
```

---

#### **2. Refresh Access Token**

```http
POST /api/v1/auth/refresh-token
Cookie: refresh_token=<refresh_token_from_cookie>
```

**No Request Body Required** (refresh token automatically sent via HTTP-Only Cookie)

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGc...(NEW_ACCESS_TOKEN)",
  "refreshToken": "eyJhbGc...(NEW_REFRESH_TOKEN)"
}
```

**Response Headers:**

```http
Set-Cookie: refresh_token=<NEW_REFRESH_TOKEN>; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Error Responses:**

```json
// 400 Bad Request - Missing refresh token
{
  "message": "Refresh token is missing"
}

// 400 Bad Request - Invalid/expired refresh token
{
  "message": "Invalid refresh token"
}

// 400 Bad Request - Revoked token
{
  "message": "Refresh token has been revoked"
}
```

---

#### **3. Logout**

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Cookie: refresh_token=<refresh_token>
```

**No Request Body Required**

**Response (200 OK):**

```http
HTTP/1.1 200 OK
Set-Cookie: refresh_token=; Path=/; HttpOnly; Secure; Max-Age=0
```

**Effect:**

- Access token → Blacklisted (cannot be used anymore)
- Refresh token → Revoked in database
- Cookie → Deleted

---

### **B. Protected API Endpoints (Require Authentication)**

#### **General Headers for All Protected Endpoints:**

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

#### **4. Get Current User Profile**

```http
GET /api/v1/account/profile
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "fullName": "Admin User",
  "phoneNumber": "+84123456789",
  "isActive": true,
  "roles": [
    {
      "name": "ADMIN",
      "description": "Administrator"
    }
  ],
  "permissions": [
    "VIEW_EMPLOYEE",
    "CREATE_EMPLOYEE",
    "UPDATE_EMPLOYEE",
    "DELETE_EMPLOYEE",
    "VIEW_PATIENT",
    "CREATE_PATIENT"
  ]
}
```

**Error Responses:**

```json
// 401 Unauthorized - Token expired
{
  "timestamp": "2025-10-07T10:30:00.000+00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Token has expired at 2025-10-07T10:15:00Z",
  "path": "/api/v1/account/profile"
}

// 401 Unauthorized - Token revoked (logged out)
{
  "error": "Token has been revoked"
}
```

---

#### **5. Get All Employees (Paginated)**

```http
GET /api/v1/employees?page=0&size=10&sort=employeeCode,asc
Authorization: Bearer <access_token>
```

**Required Permission:** `VIEW_EMPLOYEE`

**Query Parameters:**

- `page` (optional, default: 0) - Page number (0-indexed)
- `size` (optional, default: 10) - Items per page
- `sort` (optional, default: "employeeCode,asc") - Sort field and direction
- `search` (optional) - Search by name/email/phone/code

**Response (200 OK):**

```json
{
  "content": [
    {
      "employeeCode": "EMP001",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+84987654321",
      "position": "Dentist",
      "department": "Clinical",
      "isActive": true
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": { "sorted": true, "unsorted": false, "empty": false },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalPages": 5,
  "totalElements": 50,
  "last": false,
  "first": true,
  "size": 10,
  "number": 0,
  "numberOfElements": 10,
  "empty": false
}
```

**Error Responses:**

```json
// 403 Forbidden - Missing permission
{
  "timestamp": "2025-10-07T10:30:00.000+00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/v1/employees"
}
```

---

#### **6. Create Employee**

```http
POST /api/v1/employees
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Required Permission:** `CREATE_EMPLOYEE`

**Request Body:**

```json
{
  "fullName": "Jane Smith",
  "email": "jane.smith@example.com",
  "phoneNumber": "+84912345678",
  "position": "Nurse",
  "department": "Clinical",
  "dateOfBirth": "1995-05-15",
  "gender": "FEMALE",
  "address": "123 Main St, Hanoi"
}
```

**Response (201 Created):**

```json
{
  "employeeCode": "EMP051",
  "fullName": "Jane Smith",
  "email": "jane.smith@example.com",
  "phoneNumber": "+84912345678",
  "position": "Nurse",
  "department": "Clinical",
  "isActive": true
}
```

**Error Responses:**

```json
// 400 Bad Request - Validation error
{
  "timestamp": "2025-10-07T10:30:00.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Email already exists",
  "path": "/api/v1/employees"
}

// 403 Forbidden - Missing permission
{
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied"
}
```

---

#### **7. Get All Patients (Paginated)**

```http
GET /api/v1/patients?page=0&size=10
Authorization: Bearer <access_token>
```

**Required Permission:** `VIEW_PATIENT`

**Response:** (Similar structure to employees)

---

## 3️⃣ **Next.js Implementation Guide**

### **Project Structure:**

```
my-nextjs-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── employees/
│   │   │   └── page.tsx
│   │   ├── patients/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   └── api/
│       └── auth/
│           └── refresh/
│               └── route.ts
├── lib/
│   ├── api/
│   │   ├── client.ts          # Axios instance with interceptors
│   │   ├── auth.ts             # Authentication API calls
│   │   ├── employees.ts        # Employee API calls
│   │   └── patients.ts         # Patient API calls
│   ├── auth/
│   │   ├── AuthContext.tsx     # React Context for auth state
│   │   └── ProtectedRoute.tsx  # Route guard component
│   └── types/
│       └── api.ts              # TypeScript interfaces
├── middleware.ts               # Next.js middleware for auth
└── next.config.js
```

---

### **Step 1: Install Dependencies**

```bash
npm install axios js-cookie
npm install -D @types/js-cookie
```

---

### **Step 2: Create API Client (`lib/api/client.ts`)**

```typescript
// lib/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ⚠️ CRITICAL: Send cookies with requests
});

// Request interceptor: Add access token to headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from memory/context (NOT localStorage)
    const accessToken = getAccessToken(); // Implement this function

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true } // Send refresh token cookie
        );

        const { accessToken } = response.data;

        // Update access token in memory/context
        setAccessToken(accessToken); // Implement this function

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed → Redirect to login
        setAccessToken(null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper functions (implement based on your state management)
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
```

---

### **Step 3: Create Auth Context (`lib/auth/AuthContext.tsx`)**

```typescript
// lib/auth/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import apiClient, {
  setAccessToken as setGlobalAccessToken,
} from "@/lib/api/client";

interface User {
  username: string;
  email: string;
  fullName: string;
  roles: Array<{ name: string; description: string }>;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Sync access token with global API client
  useEffect(() => {
    setGlobalAccessToken(accessToken);
  }, [accessToken]);

  // Fetch user profile on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to refresh token on app load
        const response = await apiClient.post("/api/v1/auth/refresh-token");
        const { accessToken: newToken } = response.data;

        setAccessToken(newToken);

        // Fetch user profile
        const profileResponse = await apiClient.get("/api/v1/account/profile");
        setUser(profileResponse.data);
      } catch (error) {
        // No valid session → Stay logged out
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.post("/api/v1/auth/login", {
        username,
        password,
      });

      const { accessToken: newToken } = response.data;
      setAccessToken(newToken);

      // Fetch user profile
      const profileResponse = await apiClient.get("/api/v1/account/profile");
      setUser(profileResponse.data);

      router.push("/dashboard");
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch (error) {
      // Ignore logout errors
    } finally {
      setAccessToken(null);
      setUser(null);
      router.push("/login");
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.some((r) => r.name === role) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

---

### **Step 4: Create Login Page (`app/(auth)/login/page.tsx`)**

```typescript
// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign in</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### **Step 5: Create Protected Route (`lib/auth/ProtectedRoute.tsx`)**

```typescript
// lib/auth/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          Access Denied: Missing required permission
        </div>
      </div>
    );
  }

  // Check role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Access Denied: Missing required role</div>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

### **Step 6: Create Employees Page (`app/(dashboard)/employees/page.tsx`)**

```typescript
// app/(dashboard)/employees/page.tsx
"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/lib/auth/ProtectedRoute";
import apiClient from "@/lib/api/client";

interface Employee {
  employeeCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  isActive: boolean;
}

function EmployeesContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchEmployees();
  }, [page]);

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get("/api/v1/employees", {
        params: { page, size: 10 },
      });
      setEmployees(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Employees</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp.employeeCode}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {emp.employeeCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.position}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      emp.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {emp.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <ProtectedRoute requiredPermission="VIEW_EMPLOYEE">
      <EmployeesContent />
    </ProtectedRoute>
  );
}
```

---

### **Step 7: Root Layout with AuthProvider (`app/layout.tsx`)**

```typescript
// app/layout.tsx
import { AuthProvider } from "@/lib/auth/AuthContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

---

### **Step 8: Configure Environment Variables (`.env.local`)**

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Production:**

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 4️⃣ **Security Best Practices**

### ✅ **DO's:**

1. **Store Access Token in Memory (React State)**

   ```typescript
   // ✅ GOOD - In AuthContext (memory)
   const [accessToken, setAccessToken] = useState<string | null>(null);

   // ❌ BAD - Don't do this!
   localStorage.setItem("accessToken", token); // Vulnerable to XSS
   ```

2. **Always Use `withCredentials: true`**

   ```typescript
   // ✅ Required to send/receive cookies
   axios.create({
     withCredentials: true,
   });
   ```

3. **Handle Token Expiration Gracefully**

   ```typescript
   // ✅ Axios interceptor auto-refreshes on 401
   // User doesn't notice token expiration
   ```

4. **Check Permissions Before Rendering UI**

   ```typescript
   {
     hasPermission("CREATE_EMPLOYEE") && (
       <button onClick={createEmployee}>Create Employee</button>
     );
   }
   ```

5. **Logout on Refresh Failure**
   ```typescript
   // ✅ If refresh fails, redirect to login
   catch (refreshError) {
     setAccessToken(null);
     window.location.href = '/login';
   }
   ```

---

### ❌ **DON'Ts:**

1. **Never Store Access Token in localStorage/sessionStorage**

   ```typescript
   // ❌ VULNERABLE TO XSS ATTACKS
   localStorage.setItem("accessToken", token);
   ```

2. **Don't Expose Refresh Token to JavaScript**

   ```typescript
   // ❌ Refresh token should ONLY be in HTTP-Only Cookie
   // Backend handles this automatically
   ```

3. **Don't Skip HTTPS in Production**

   ```typescript
   // ❌ Cookies with Secure flag require HTTPS
   // Deploy with SSL certificate
   ```

4. **Don't Ignore CORS Errors**
   ```typescript
   // Backend must allow your frontend origin
   // Contact backend team to whitelist your domain
   ```

---

## 5️⃣ **Error Handling**

### **Common Errors & Solutions:**

| Error                    | Cause                  | Solution                                   |
| ------------------------ | ---------------------- | ------------------------------------------ |
| `401 Unauthorized`       | Access token expired   | Auto-refresh triggered by interceptor      |
| `403 Forbidden`          | Missing permission     | Check user permissions, show error message |
| `400 Bad Request`        | Invalid input          | Validate form data before submitting       |
| `Network Error`          | Backend offline / CORS | Check backend status, verify CORS config   |
| `Token has been revoked` | User logged out        | Redirect to login page                     |

### **Error Handling Pattern:**

```typescript
try {
  const response = await apiClient.post("/api/v1/employees", data);
  // Success
  toast.success("Employee created successfully");
} catch (error: any) {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;

    if (status === 400) {
      toast.error(data.message || "Invalid input");
    } else if (status === 403) {
      toast.error("You do not have permission to perform this action");
    } else if (status === 401) {
      // Handled by interceptor
    } else {
      toast.error("An error occurred. Please try again.");
    }
  } else if (error.request) {
    // Network error
    toast.error("Network error. Please check your connection.");
  } else {
    // Unknown error
    toast.error("An unexpected error occurred.");
  }
}
```

---

## 6️⃣ **Complete Code Examples**

### **Example 1: Create Employee Form**

```typescript
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import apiClient from "@/lib/api/client";

export default function CreateEmployeeForm() {
  const { hasPermission } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    position: "",
    department: "",
    dateOfBirth: "",
    gender: "MALE",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/api/v1/employees", formData);
      alert("Employee created: " + response.data.employeeCode);
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        position: "",
        department: "",
        dateOfBirth: "",
        gender: "MALE",
        address: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission("CREATE_EMPLOYEE")) {
    return <div>You do not have permission to create employees.</div>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded shadow"
    >
      <h2 className="text-2xl font-bold mb-6">Create Employee</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Position *</label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={3}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Employee"}
      </button>
    </form>
  );
}
```

---

### **Example 2: Logout Button Component**

```typescript
"use client";

import { useAuth } from "@/lib/auth/AuthContext";

export default function LogoutButton() {
  const { logout, user } = useAuth();

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">Welcome, {user?.fullName}</span>
      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
```

---

### **Example 3: Permission-Based Rendering**

```typescript
"use client";

import { useAuth } from "@/lib/auth/AuthContext";

export default function EmployeeActions({
  employeeCode,
}: {
  employeeCode: string;
}) {
  const { hasPermission } = useAuth();

  return (
    <div className="flex gap-2">
      {hasPermission("VIEW_EMPLOYEE") && (
        <button className="px-3 py-1 bg-blue-600 text-white rounded">
          View
        </button>
      )}

      {hasPermission("UPDATE_EMPLOYEE") && (
        <button className="px-3 py-1 bg-yellow-600 text-white rounded">
          Edit
        </button>
      )}

      {hasPermission("DELETE_EMPLOYEE") && (
        <button className="px-3 py-1 bg-red-600 text-white rounded">
          Delete
        </button>
      )}
    </div>
  );
}
```

---

## 📋 **Quick Reference Checklist**

### **Setup Checklist:**

- [ ] Install dependencies (`axios`, `js-cookie`)
- [ ] Create API client with interceptors
- [ ] Create AuthContext with login/logout/refresh
- [ ] Wrap app with AuthProvider in root layout
- [ ] Create ProtectedRoute component
- [ ] Set `NEXT_PUBLIC_API_URL` in `.env.local`
- [ ] Configure `withCredentials: true` in axios

### **Security Checklist:**

- [ ] Access token stored in React state (NOT localStorage)
- [ ] Refresh token in HTTP-Only Cookie (backend handles this)
- [ ] Axios interceptor handles 401 auto-refresh
- [ ] HTTPS enabled in production
- [ ] CORS configured correctly on backend
- [ ] Permissions checked before rendering UI
- [ ] Protected routes redirect unauthenticated users

### **Testing Checklist:**

- [ ] Login works and receives tokens
- [ ] Access token added to API requests
- [ ] Auto-refresh works when token expires
- [ ] Logout clears tokens and redirects
- [ ] Protected routes block unauthorized access
- [ ] Permission-based UI renders correctly
- [ ] Error handling displays user-friendly messages

---

## 🆘 **Troubleshooting**

### **Problem: CORS Error**

**Error:**

```
Access to XMLHttpRequest at 'http://localhost:8080/api/v1/auth/login' from origin 'http://localhost:3000'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check
```

**Solution:**
Contact backend team to add your frontend URL to CORS whitelist:

```java
// Backend needs this config
config.setAllowedOrigins(List.of("http://localhost:3000"));
config.setAllowCredentials(true);
```

---

### **Problem: Refresh Token Not Sent**

**Error:**

```
Refresh token is missing
```

**Solution:**
Ensure `withCredentials: true` in axios:

```typescript
axios.create({
  withCredentials: true, // ← Required!
});
```

---

### **Problem: 401 on Every Request**

**Cause:** Access token not being sent

**Solution:**
Check interceptor is adding token:

```typescript
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 📞 **Support**

**Backend Team Contact:**

- Email: backend@example.com
- Slack: #backend-support

**API Documentation (Swagger):**

- Development: http://localhost:8080/swagger-ui/index.html
- Production: https://api.yourdomain.com/swagger-ui/index.html

---

## 🎉 **You're All Set!**

Your Next.js app is now ready to integrate with the secure backend API. Follow the examples above and refer to the Swagger docs for detailed endpoint specifications.

**Happy Coding! 🚀**
