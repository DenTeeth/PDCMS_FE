# 📘 API DOCUMENTATION - DENTAL CLINIC MANAGEMENT SYSTEM

**Base URL:** `http://localhost:8080/api/v1`  
**Authentication:** Bearer Token (JWT)  
**Date:** October 8, 2025

---

## 📑 MỤC LỤC

1. [Authentication APIs](#1-authentication-apis)
2. [Employee Management APIs](#2-employee-management-apis)
3. [Patient Management APIs](#3-patient-management-apis)
4. [Role & Permission APIs](#4-role--permission-apis)
5. [Common Responses](#5-common-responses)
6. [Error Handling](#6-error-handling)

---

## 1. AUTHENTICATION APIs

### 🔐 1.1. Login (Đăng Nhập)

**Endpoint:** `POST /auth/login`  
**Public:** ✅ Không cần token  
**Description:** Đăng nhập để lấy access token và refresh token

**Request Body:**
```json
{
  "username": "admin",
  "password": "DentalClinic@2025"
}
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "accountId": "880e8400-e29b-41d4-a716-446655440001",
    "username": "admin",
    "email": "admin@dentalclinic.com",
    "roles": ["Admin"],
    "permissions": ["CREATE_EMPLOYEE", "VIEW_EMPLOYEE", ...]
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "type": "https://dentalclinic.com/problem/bad-credentials",
  "title": "Unauthorized",
  "status": 401,
  "message": "Invalid username or password"
}
```

---

### 🔄 1.2. Refresh Token

**Endpoint:** `POST /auth/refresh-token`  
**Public:** ✅ Không cần token  
**Description:** Làm mới access token khi hết hạn

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

---

### 🚪 1.3. Logout (Đăng Xuất)

**Endpoint:** `POST /auth/logout`  
**Authorization:** ✅ Required (Bearer Token)  
**Description:** Đăng xuất và vô hiệu hóa token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

---

## 2. EMPLOYEE MANAGEMENT APIs

### 👥 2.1. Lấy Danh Sách Nhân Viên

**Endpoint:** `GET /employees`  
**Authorization:** ✅ Required  
**Permission:** `VIEW_EMPLOYEE` hoặc `ROLE_ADMIN`  
**Description:** Lấy danh sách nhân viên với phân trang, sắp xếp, tìm kiếm

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | ❌ | 0 | Số trang (bắt đầu từ 0) |
| size | integer | ❌ | 10 | Số items mỗi trang (max: 100) |
| sortBy | string | ❌ | employeeCode | Trường sắp xếp: `employeeCode`, `firstName`, `lastName`, `createdAt` |
| sortDirection | string | ❌ | ASC | Hướng sắp xếp: `ASC`, `DESC` |
| search | string | ❌ | - | Tìm kiếm theo tên, mã, email |
| roleId | string | ❌ | - | Lọc theo role ID |
| isActive | boolean | ❌ | true | Lọc nhân viên active/inactive |

**Request Example:**
```http
GET /employees?page=0&size=10&sortBy=firstName&sortDirection=ASC&search=Nguyễn
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "content": [
    {
      "employeeId": "990e8400-e29b-41d4-a716-446655440002",
      "employeeCode": "EMP002",
      "fullName": "Nguyễn Văn A",
      "firstName": "Văn A",
      "lastName": "Nguyễn",
      "phone": "0901234567",
      "dateOfBirth": "1985-05-15",
      "address": "123 Nguyễn Huệ, Q1, TPHCM",
      "roleId": "550e8400-e29b-41d4-a716-446655440002",
      "roleName": "Bác sĩ",
      "isActive": true,
      "createdAt": "2025-10-08T10:00:00",
      "account": {
        "accountId": "880e8400-e29b-41d4-a716-446655440002",
        "username": "bs.nguyen.van.a",
        "email": "nguyen.van.a@dentalclinic.com",
        "status": "ACTIVE"
      },
      "specializations": [
        {
          "specializationId": "770e8400-e29b-41d4-a716-446655440001",
          "specializationCode": "SPEC001",
          "specializationName": "Chỉnh nha"
        }
      ]
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": { "sorted": true, "unsorted": false },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 25,
  "totalPages": 3,
  "last": false,
  "first": true,
  "size": 10,
  "number": 0,
  "numberOfElements": 10,
  "empty": false
}
```

---

### ➕ 2.2. Tạo Nhân Viên Mới

**Endpoint:** `POST /employees`  
**Authorization:** ✅ Required  
**Permission:** `CREATE_EMPLOYEE` hoặc `ROLE_ADMIN`  
**Description:** Tạo nhân viên mới và tự động tạo account

**Request Body:**
```json
{
  "username": "bs.pham.van.e",
  "email": "pham.van.e@dentalclinic.com",
  "password": "Doctor@2025",
  "roleId": "550e8400-e29b-41d4-a716-446655440002",
  "firstName": "Văn E",
  "lastName": "Phạm",
  "phone": "0905678901",
  "dateOfBirth": "1987-03-15",
  "address": "123 Võ Văn Tần, Q3, TPHCM",
  "specializationIds": [
    "770e8400-e29b-41d4-a716-446655440003",
    "770e8400-e29b-41d4-a716-446655440005"
  ]
}
```

**Field Validations:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| username | string | ✅ | 3-50 chars, unique |
| email | string | ✅ | Valid email format, unique |
| password | string | ✅ | Min 6 chars |
| roleId | string | ✅ | Must exist in roles table |
| firstName | string | ✅ | Max 50 chars |
| lastName | string | ✅ | Max 50 chars |
| phone | string | ❌ | 10-15 digits |
| dateOfBirth | date | ❌ | Must be in the past |
| address | string | ❌ | Max 500 chars |
| specializationIds | array | ❌ | Valid specialization IDs |

**Success Response (201 Created):**
```json
{
  "employeeId": "uuid-generated",
  "employeeCode": "EMP006",
  "fullName": "Phạm Văn E",
  "firstName": "Văn E",
  "lastName": "Phạm",
  "phone": "0905678901",
  "dateOfBirth": "1987-03-15",
  "address": "123 Võ Văn Tần, Q3, TPHCM",
  "roleId": "550e8400-e29b-41d4-a716-446655440002",
  "roleName": "Bác sĩ",
  "isActive": true,
  "createdAt": "2025-10-08T14:30:00",
  "account": {
    "accountId": "uuid-generated",
    "username": "bs.pham.van.e",
    "email": "pham.van.e@dentalclinic.com",
    "status": "ACTIVE"
  },
  "specializations": [
    {
      "specializationId": "770e8400-e29b-41d4-a716-446655440003",
      "specializationCode": "SPEC003",
      "specializationName": "Nha chu"
    },
    {
      "specializationId": "770e8400-e29b-41d4-a716-446655440005",
      "specializationCode": "SPEC005",
      "specializationName": "Phẫu thuật hàm mặt"
    }
  ]
}
```

**Error Response (400 Bad Request):**
```json
{
  "type": "https://dentalclinic.com/problem/username-exists",
  "title": "Bad Request",
  "status": 400,
  "message": "Username already exists"
}
```

---

### 🔍 2.3. Lấy Thông Tin Chi Tiết Nhân Viên

**Endpoint:** `GET /employees/{employeeCode}`  
**Authorization:** ✅ Required  
**Permission:** `VIEW_EMPLOYEE` hoặc `ROLE_ADMIN`

**Request Example:**
```http
GET /employees/EMP002
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "employeeId": "990e8400-e29b-41d4-a716-446655440002",
  "employeeCode": "EMP002",
  "fullName": "Nguyễn Văn A",
  "firstName": "Văn A",
  "lastName": "Nguyễn",
  "phone": "0901234567",
  "email": "nguyen.van.a@dentalclinic.com",
  "dateOfBirth": "1985-05-15",
  "address": "123 Nguyễn Huệ, Q1, TPHCM",
  "roleId": "550e8400-e29b-41d4-a716-446655440002",
  "roleName": "Bác sĩ",
  "isActive": true,
  "createdAt": "2025-10-08T10:00:00",
  "account": {
    "accountId": "880e8400-e29b-41d4-a716-446655440002",
    "username": "bs.nguyen.van.a",
    "email": "nguyen.van.a@dentalclinic.com",
    "status": "ACTIVE"
  },
  "specializations": [...]
}
```

---

### ✏️ 2.4. Cập Nhật Thông Tin Nhân Viên

**Endpoint:** `PATCH /employees/{employeeCode}`  
**Authorization:** ✅ Required  
**Permission:** `UPDATE_EMPLOYEE` hoặc `ROLE_ADMIN`  
**Description:** Cập nhật một phần thông tin (chỉ gửi fields cần update)

**Request Body:**
```json
{
  "firstName": "Văn A Updated",
  "phone": "0901111111",
  "address": "Địa chỉ mới",
  "specializationIds": ["770e8400-e29b-41d4-a716-446655440001"]
}
```

**Success Response (200 OK):**
```json
{
  "employeeId": "990e8400-e29b-41d4-a716-446655440002",
  "employeeCode": "EMP002",
  "fullName": "Nguyễn Văn A Updated",
  ...
}
```

---

### 🗑️ 2.5. Xóa Nhân Viên (Soft Delete)

**Endpoint:** `DELETE /employees/{employeeCode}`  
**Authorization:** ✅ Required  
**Permission:** `DELETE_EMPLOYEE` hoặc `ROLE_ADMIN`  
**Description:** Đánh dấu nhân viên là inactive (không xóa khỏi DB)

**Request Example:**
```http
DELETE /employees/EMP002
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "message": "Employee EMP002 has been deactivated successfully"
}
```

---

## 3. PATIENT MANAGEMENT APIs

### 👤 3.1. Lấy Danh Sách Bệnh Nhân

**Endpoint:** `GET /patients`  
**Authorization:** ✅ Required  
**Permission:** `VIEW_PATIENT`  
**Description:** Lấy danh sách bệnh nhân với phân trang, tìm kiếm

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | ❌ | 0 | Số trang (bắt đầu từ 0) |
| size | integer | ❌ | 10 | Số items mỗi trang (max: 100) |
| sortBy | string | ❌ | patientCode | Trường sắp xếp |
| sortDirection | string | ❌ | ASC | `ASC`, `DESC` |
| search | string | ❌ | - | Tìm kiếm theo tên, mã, phone |
| isActive | boolean | ❌ | true | Lọc active/inactive |

**Request Example:**
```http
GET /patients?page=0&size=10&search=Nguyễn
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "content": [
    {
      "patientId": "aa0e8400-e29b-41d4-a716-446655440101",
      "patientCode": "PT001",
      "fullName": "Nguyễn Văn Khang",
      "firstName": "Văn Khang",
      "lastName": "Nguyễn",
      "email": "khang.nguyen@email.com",
      "phone": "0911111111",
      "dateOfBirth": "1990-01-15",
      "address": "123 Lê Văn Việt, Q9, TPHCM",
      "gender": "MALE",
      "isActive": true,
      "createdAt": "2025-10-08T09:00:00",
      "hasAccount": true
    }
  ],
  "totalElements": 50,
  "totalPages": 5,
  "number": 0,
  "size": 10
}
```

---

### ➕ 3.2. Tạo Bệnh Nhân Mới (CÓ ACCOUNT)

**Endpoint:** `POST /patients`  
**Authorization:** ✅ Required  
**Permission:** `CREATE_PATIENT`  
**Description:** Tạo bệnh nhân với account để có thể đăng nhập

**Request Body:**
```json
{
  "username": "patient.le.thi.d",
  "password": "Patient@2025",
  "email": "le.thi.d@email.com",
  "firstName": "Thị D",
  "lastName": "Lê",
  "phone": "0944444444",
  "dateOfBirth": "1992-08-25",
  "address": "456 Nguyễn Thị Minh Khai, Q1, TPHCM",
  "gender": "FEMALE",
  "medicalHistory": "Không có bệnh nền",
  "allergies": "Không dị ứng",
  "emergencyContactName": "Lê Văn F",
  "emergencyContactPhone": "0955555555"
}
```

**Field Validations:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| username | string | ❌* | 3-50 chars (nếu muốn tạo account) |
| password | string | ❌* | Min 8 chars (nếu có username) |
| email | string | ❌** | Valid email, unique (required nếu có username) |
| firstName | string | ✅ | Max 50 chars |
| lastName | string | ✅ | Max 50 chars |
| phone | string | ❌ | 10-15 digits |
| dateOfBirth | date | ❌ | Must be in the past |
| gender | string | ❌ | `MALE`, `FEMALE`, `OTHER` |
| medicalHistory | string | ❌ | Max 1000 chars |
| allergies | string | ❌ | Max 500 chars |

***Note:** Nếu muốn patient có thể đăng nhập → phải cung cấp `username` + `password` + `email`

**Success Response (201 Created):**
```json
{
  "patientId": "uuid-generated",
  "patientCode": "PT004",
  "fullName": "Lê Thị D",
  "email": "le.thi.d@email.com",
  "phone": "0944444444",
  "dateOfBirth": "1992-08-25",
  "gender": "FEMALE",
  "hasAccount": true,
  "createdAt": "2025-10-08T15:00:00"
}
```

---

### ➕ 3.3. Tạo Bệnh Nhân Mới (KHÔNG ACCOUNT)

**Endpoint:** `POST /patients`  
**Authorization:** ✅ Required  
**Permission:** `CREATE_PATIENT`  
**Description:** Tạo bệnh nhân đơn giản (không thể đăng nhập)

**Request Body:**
```json
{
  "firstName": "Văn G",
  "lastName": "Hoàng",
  "email": "hoang.van.g@email.com",
  "phone": "0966666666",
  "dateOfBirth": "1998-12-01",
  "address": "789 Lê Văn Sỹ, Q3, TPHCM",
  "gender": "MALE"
}
```

**Success Response (201 Created):**
```json
{
  "patientId": "uuid-generated",
  "patientCode": "PT005",
  "fullName": "Hoàng Văn G",
  "email": "hoang.van.g@email.com",
  "phone": "0966666666",
  "hasAccount": false,
  "createdAt": "2025-10-08T15:30:00"
}
```

---

### 🔍 3.4. Lấy Thông Tin Chi Tiết Bệnh Nhân

**Endpoint:** `GET /patients/{patientCode}`  
**Authorization:** ✅ Required  
**Permission:** `VIEW_PATIENT`

**Request Example:**
```http
GET /patients/PT001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "patientId": "aa0e8400-e29b-41d4-a716-446655440101",
  "patientCode": "PT001",
  "fullName": "Nguyễn Văn Khang",
  "firstName": "Văn Khang",
  "lastName": "Nguyễn",
  "email": "khang.nguyen@email.com",
  "phone": "0911111111",
  "dateOfBirth": "1990-01-15",
  "address": "123 Lê Văn Việt, Q9, TPHCM",
  "gender": "MALE",
  "medicalHistory": "Không có bệnh nền",
  "allergies": "Không dị ứng",
  "emergencyContactName": "Nguyễn Văn H",
  "emergencyContactPhone": "0977777777",
  "isActive": true,
  "createdAt": "2025-10-08T09:00:00",
  "updatedAt": "2025-10-08T09:00:00",
  "hasAccount": true
}
```

---

### ✏️ 3.5. Cập Nhật Thông Tin Bệnh Nhân

**Endpoint:** `PATCH /patients/{patientCode}`  
**Authorization:** ✅ Required  
**Permission:** `UPDATE_PATIENT`

**Request Body:**
```json
{
  "phone": "0999999999",
  "address": "Địa chỉ mới",
  "medicalHistory": "Thêm tiền sử bệnh",
  "allergies": "Dị ứng penicillin"
}
```

**Success Response (200 OK):**
```json
{
  "patientId": "aa0e8400-e29b-41d4-a716-446655440101",
  "patientCode": "PT001",
  ...
}
```

---

## 4. ROLE & PERMISSION APIs

### 🎭 4.1. Lấy Danh Sách Roles

**Endpoint:** `GET /roles`  
**Authorization:** ✅ Required  
**Permission:** `VIEW_ROLE` hoặc `ROLE_ADMIN`

**Success Response (200 OK):**
```json
[
  {
    "roleId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Admin",
    "description": "Quản trị viên hệ thống - Toàn quyền",
    "isActive": true,
    "permissions": [
      {
        "permissionId": "660e8400-e29b-41d4-a716-446655440001",
        "resource": "ACCOUNT",
        "action": "CREATE",
        "description": "Tạo tài khoản mới"
      }
    ]
  },
  {
    "roleId": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Bác sĩ",
    "description": "Bác sĩ nha khoa - Khám và điều trị",
    "isActive": true
  }
]
```

---

### 🔑 4.2. Lấy Danh Sách Permissions

**Endpoint:** `GET /permissions`  
**Authorization:** ✅ Required  
**Permission:** `VIEW_PERMISSION` hoặc `ROLE_ADMIN`

**Success Response (200 OK):**
```json
[
  {
    "permissionId": "660e8400-e29b-41d4-a716-446655440001",
    "resource": "ACCOUNT",
    "action": "CREATE",
    "description": "Tạo tài khoản mới"
  },
  {
    "permissionId": "660e8400-e29b-41d4-a716-446655440011",
    "resource": "EMPLOYEE",
    "action": "CREATE",
    "description": "Tạo nhân viên mới"
  }
]
```

---

### 🏥 4.3. Lấy Danh Sách Specializations

**Endpoint:** `GET /specializations`  
**Authorization:** ✅ Required (hoặc Public tùy thiết kế)

**Success Response (200 OK):**
```json
[
  {
    "specializationId": "770e8400-e29b-41d4-a716-446655440001",
    "specializationCode": "SPEC001",
    "specializationName": "Chỉnh nha",
    "description": "Orthodontics - Niềng răng, chỉnh hình răng mặt",
    "isActive": true
  },
  {
    "specializationId": "770e8400-e29b-41d4-a716-446655440002",
    "specializationCode": "SPEC002",
    "specializationName": "Nội nha",
    "description": "Endodontics - Điều trị tủy, chữa răng sâu",
    "isActive": true
  }
]
```

---

## 5. COMMON RESPONSES

### ✅ Success Response Structure

```json
{
  "data": { ... },
  "message": "Success",
  "timestamp": "2025-10-08T15:00:00"
}
```

### ❌ Error Response Structure (RFC 7807)

```json
{
  "type": "https://dentalclinic.com/problem/error-type",
  "title": "Error Title",
  "status": 400,
  "message": "Detailed error message for i18n",
  "timestamp": "2025-10-08T15:00:00"
}
```

---

## 6. ERROR HANDLING

### Common Error Codes:

| Status Code | Type | Description |
|-------------|------|-------------|
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | No permission to access resource |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (username, email) |
| 500 | Internal Server Error | Server error |

### Error Examples:

**400 - Validation Error:**
```json
{
  "type": "https://dentalclinic.com/problem/validation-failed",
  "title": "Bad Request",
  "status": 400,
  "message": "Username must be between 3 and 50 characters"
}
```

**401 - Unauthorized:**
```json
{
  "type": "https://dentalclinic.com/problem/jwt-validation-failed",
  "title": "Unauthorized",
  "status": 401,
  "message": "Token has expired"
}
```

**403 - Forbidden:**
```json
{
  "type": "https://dentalclinic.com/problem/access-denied",
  "title": "Forbidden",
  "status": 403,
  "message": "You don't have permission to access this resource"
}
```

**404 - Not Found:**
```json
{
  "type": "https://dentalclinic.com/problem/employee-not-found",
  "title": "Not Found",
  "status": 404,
  "message": "Employee not found with code: EMP999"
}
```

**409 - Conflict:**
```json
{
  "type": "https://dentalclinic.com/problem/username-exists",
  "title": "Conflict",
  "status": 409,
  "message": "Username already exists"
}
```

---

## 📌 NOTES FOR FRONTEND DEVELOPERS

### 1. **Authentication Flow:**
```
Login → Get accessToken + refreshToken
→ Store in localStorage/sessionStorage
→ Add to headers: Authorization: Bearer {accessToken}
→ Auto refresh when token expires (before 15 minutes)
→ Logout → Clear tokens + call /auth/logout
```

### 2. **Token Refresh Strategy:**
```javascript
// Refresh token 30 seconds before expiration
setInterval(() => {
  if (tokenWillExpireIn30Seconds()) {
    refreshAccessToken();
  }
}, 10000); // Check every 10 seconds
```

### 3. **Pagination Pattern:**
```javascript
// All list endpoints use same pagination structure
const response = {
  content: [...],      // Array of items
  totalElements: 100,  // Total records in DB
  totalPages: 10,      // Total pages
  number: 0,           // Current page (0-indexed)
  size: 10,            // Items per page
  first: true,         // Is first page?
  last: false          // Is last page?
};
```

### 4. **Permission Checking:**
```javascript
// Check if user has permission
function hasPermission(permission) {
  return user.permissions.includes(permission);
}

// Example:
if (hasPermission('CREATE_EMPLOYEE')) {
  showCreateEmployeeButton();
}
```

### 5. **Role-Based UI:**
```javascript
// Hide/show features based on role
if (user.roles.includes('Admin')) {
  showAdminPanel();
}

if (user.roles.includes('Bác sĩ')) {
  showDoctorFeatures();
}
```

---

## 🎯 TESTING ACCOUNTS

### Default Credentials (from seed data):

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | DentalClinic@2025 | Admin | Quản trị viên |
| bs.nguyen.van.a | DentalClinic@2025 | Bác sĩ | Bác sĩ chỉnh nha |
| bs.tran.thi.b | DentalClinic@2025 | Bác sĩ | Bác sĩ nội nha |
| le.thi.c | DentalClinic@2025 | Lễ tân | Lễ tân |
| pham.van.d | DentalClinic@2025 | Kế toán | Kế toán |
| patient.nguyen.khang | DentalClinic@2025 | Bệnh nhân | Bệnh nhân |
| patient.tran.lan | DentalClinic@2025 | Bệnh nhân | Bệnh nhân |

---

## 📞 SUPPORT

**Issues?** Contact backend team or check application logs.

**API Changes?** Check this documentation for latest updates.

**Last Updated:** October 8, 2025
