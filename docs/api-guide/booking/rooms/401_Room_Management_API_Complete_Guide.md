# Room Management API - Complete Guide (Module BE-401)

## 📋 Table of Contents
1. [Overview](#overview)
2. [API Endpoints Summary](#api-endpoints-summary)
3. [P1.1 - Get All Rooms (Paginated)](#p11---get-all-rooms-paginated)
4. [P1.2 - Get Room by Code](#p12---get-room-by-code)
5. [P1.3 - Create New Room](#p13---create-new-room)
6. [P1.4 - Update Room](#p14---update-room)
7. [P1.5 - Get Room Services (NEW - V16)](#p15---get-room-services-new---v16)
8. [P1.6 - Update Room Services (NEW - V16)](#p16---update-room-services-new---v16)
9. [Data Models](#data-models)
10. [Error Handling](#error-handling)
11. [Postman Testing Guide](#postman-testing-guide)

---

## Overview

**Module**: Room Management (BE-401)  
**Purpose**: Manage dental clinic rooms/chairs and their service compatibility  
**Base URL**: `/api/v1/rooms`  
**Authentication**: Required (Bearer Token)  
**Version**: V16 (includes room-service compatibility feature)

### Business Context

Rooms (phòng/ghế nha khoa) are physical resources in the dental clinic:
- **Standard rooms** (P-01, P-02): General examinations, cleaning
- **Specialized rooms** (P-04 Implant): Implant surgery, bone grafting
- **X-Ray rooms** (P-XR): Imaging services

**V16 New Feature**: Room-Service Compatibility
- Receptionists can configure which services each room supports
- System validates room-service compatibility when booking appointments
- Example: Cannot book "Implant surgery" in a standard examination room

---

## API Endpoints Summary

| Method | Endpoint | Permission | Description | Version |
|--------|----------|------------|-------------|---------|
| GET | `/api/v1/rooms` | `VIEW_ROOM` | Get all rooms (paginated + filters) | V1 |
| GET | `/api/v1/rooms/active` | `VIEW_ROOM` | Get all active rooms (no pagination) | V1 |
| GET | `/api/v1/rooms/{roomCode}` | `VIEW_ROOM` | Get room by code | V1 |
| POST | `/api/v1/rooms` | `CREATE_ROOM` | Create new room | V1 |
| PUT | `/api/v1/rooms/{roomId}` | `UPDATE_ROOM` | Update room metadata | V1 |
| DELETE | `/api/v1/rooms/{roomId}` | `DELETE_ROOM` | Soft delete room | V1 |
| **GET** | `/api/v1/rooms/{roomCode}/services` | `VIEW_ROOM` | **Get services for a room** | **V16** |
| **PUT** | `/api/v1/rooms/{roomCode}/services` | `UPDATE_ROOM_SERVICES` | **Update room services** | **V16** |

---

## P1.1 - Get All Rooms (Paginated)

### Request

```http
GET /api/v1/rooms?page=0&size=10&sortBy=createdAt&sortDirection=DESC&isActive=true&roomType=STANDARD&keyword=P-01
Authorization: Bearer {access_token}
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 0 | Page number (0-indexed) |
| `size` | Integer | No | 10 | Page size (max 100) |
| `sortBy` | String | No | createdAt | Sort field: `roomCode`, `roomName`, `createdAt` |
| `sortDirection` | String | No | ASC | Sort direction: `ASC`, `DESC` |
| `isActive` | Boolean | No | null | Filter by status: `true`, `false`, `null` (all) |
| `roomType` | String | No | null | Filter by type: `STANDARD`, `SURGERY`, `XRAY` |
| `keyword` | String | No | null | Search in room code or name |

### Response (200 OK)

```json
{
  "content": [
    {
      "roomId": "RM2024110300001",
      "roomCode": "P-01",
      "roomName": "Phòng khám tổng quát 01",
      "roomType": "STANDARD",
      "isActive": true,
      "createdAt": "2024-11-03T10:30:00"
    },
    {
      "roomId": "RM2024110300002",
      "roomCode": "P-04",
      "roomName": "Phòng Implant",
      "roomType": "SURGERY",
      "isActive": true,
      "createdAt": "2024-11-03T11:00:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    }
  },
  "totalElements": 12,
  "totalPages": 2,
  "last": false,
  "first": true,
  "size": 10,
  "number": 0,
  "numberOfElements": 10,
  "empty": false
}
```

### Curl Example

```bash
curl -X GET "http://localhost:8080/api/v1/rooms?page=0&size=10&isActive=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## P1.2 - Get Room by Code

### Request

```http
GET /api/v1/rooms/P-01
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
  "roomId": "RM2024110300001",
  "roomCode": "P-01",
  "roomName": "Phòng khám tổng quát 01",
  "roomType": "STANDARD",
  "isActive": true,
  "createdAt": "2024-11-03T10:30:00"
}
```

### Error Responses

#### 404 Not Found - Room không tồn tại
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Room not found with code: P-99",
  "path": "/api/v1/rooms/P-99"
}
```

### Curl Example

```bash
curl -X GET "http://localhost:8080/api/v1/rooms/P-01" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## P1.3 - Create New Room

### Request

```http
POST /api/v1/rooms
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "roomCode": "P-05",
  "roomName": "Phòng chỉnh nha",
  "roomType": "ORTHODONTICS",
  "isActive": true
}
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roomCode` | String | Yes | Unique room code (max 20 chars) |
| `roomName` | String | Yes | Room display name (max 100 chars) |
| `roomType` | String | No | Room type: `STANDARD`, `SURGERY`, `XRAY`, `ORTHODONTICS` |
| `isActive` | Boolean | No | Default: true |

### Response (201 Created)

```json
{
  "roomId": "RM2024110300010",
  "roomCode": "P-05",
  "roomName": "Phòng chỉnh nha",
  "roomType": "ORTHODONTICS",
  "isActive": true,
  "createdAt": "2024-11-03T14:30:00"
}
```

### Error Responses

#### 400 Bad Request - Room code đã tồn tại
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Room code already exists: P-05",
  "path": "/api/v1/rooms"
}
```

#### 400 Bad Request - Validation errors
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": {
    "roomCode": "Room code cannot be blank",
    "roomName": "Room name cannot be blank"
  }
}
```

### Curl Example

```bash
curl -X POST "http://localhost:8080/api/v1/rooms" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "roomCode": "P-05",
    "roomName": "Phòng chỉnh nha",
    "roomType": "ORTHODONTICS"
  }'
```

---

## P1.4 - Update Room

### Request

```http
PUT /api/v1/rooms/RM2024110300001
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "roomCode": "P-01-NEW",
  "roomName": "Phòng khám tổng quát 01 (Updated)",
  "roomType": "STANDARD",
  "isActive": true
}
```

### Request Body (All fields optional)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roomCode` | String | No | New room code (must be unique) |
| `roomName` | String | No | New room name |
| `roomType` | String | No | New room type |
| `isActive` | Boolean | No | New active status |

### Response (200 OK)

```json
{
  "roomId": "RM2024110300001",
  "roomCode": "P-01-NEW",
  "roomName": "Phòng khám tổng quát 01 (Updated)",
  "roomType": "STANDARD",
  "isActive": true,
  "createdAt": "2024-11-03T10:30:00"
}
```

### Error Responses

#### 404 Not Found
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Room not found with ID: RM2024110399999",
  "path": "/api/v1/rooms/RM2024110399999"
}
```

#### 400 Bad Request - Room code conflict
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Room code already exists: P-02",
  "path": "/api/v1/rooms/RM2024110300001"
}
```

### Curl Example

```bash
curl -X PUT "http://localhost:8080/api/v1/rooms/RM2024110300001" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "Phòng khám tổng quát 01 (Updated)",
    "isActive": true
  }'
```

---

## P1.5 - Get Room Services (NEW - V16)

**Business Use Case**: Lễ tân xem danh sách dịch vụ mà phòng này hỗ trợ

### Request

```http
GET /api/v1/rooms/P-04/services
Authorization: Bearer {access_token}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `roomCode` | String | Room code (e.g., P-01, P-04) |

### Response (200 OK)

```json
{
  "roomId": "RM2024110300002",
  "roomCode": "P-04",
  "roomName": "Phòng Implant",
  "compatibleServices": [
    {
      "serviceId": 35,
      "serviceCode": "IMPL-001",
      "serviceName": "Cắm trụ Implant",
      "price": 15000000.00
    },
    {
      "serviceId": 36,
      "serviceCode": "IMPL-002",
      "serviceName": "Nâng xoang",
      "price": 8000000.00
    },
    {
      "serviceId": 37,
      "serviceCode": "IMPL-003",
      "serviceName": "Ghép xương",
      "price": 12000000.00
    }
  ]
}
```

### Response (200 OK) - Empty list when no services assigned

```json
{
  "roomId": "RM2024110300005",
  "roomCode": "P-NEW",
  "roomName": "Phòng mới chưa cấu hình",
  "compatibleServices": []
}
```

### Error Responses

#### 404 Not Found - Room không tồn tại
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Room not found with code: P-99",
  "path": "/api/v1/rooms/P-99/services"
}
```

### Curl Example

```bash
curl -X GET "http://localhost:8080/api/v1/rooms/P-04/services" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Frontend Integration Example

```typescript
// TypeScript/React example
interface CompatibleService {
  serviceId: number;
  serviceCode: string;
  serviceName: string;
  price: number;
}

interface RoomServicesResponse {
  roomId: string;
  roomCode: string;
  roomName: string;
  compatibleServices: CompatibleService[];
}

async function getRoomServices(roomCode: string): Promise<RoomServicesResponse> {
  const response = await fetch(`/api/v1/rooms/${roomCode}/services`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get room services: ${response.statusText}`);
  }
  
  return response.json();
}

// Usage
const roomServices = await getRoomServices('P-04');
console.log(`Phòng ${roomServices.roomName} hỗ trợ ${roomServices.compatibleServices.length} dịch vụ`);
```

---

## P1.6 - Update Room Services (NEW - V16)

**Business Use Case**: Quản lý/Admin cấu hình danh sách dịch vụ mà phòng này có thể thực hiện

**Important**: 
- API này **REPLACE** (thay thế hoàn toàn) danh sách services hiện tại
- Tất cả service cũ sẽ bị xóa, service mới sẽ được thêm vào
- Tất cả service phải tồn tại và đang active (is_active = true)

### Request

```http
PUT /api/v1/rooms/P-04/services
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "serviceCodes": [
    "IMPL-001",
    "IMPL-002",
    "IMPL-003"
  ]
}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `roomCode` | String | Room code (e.g., P-01, P-04) |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceCodes` | String[] | Yes | List of service codes to assign (cannot be empty) |

### Response (200 OK)

```json
{
  "roomId": "RM2024110300002",
  "roomCode": "P-04",
  "roomName": "Phòng Implant",
  "compatibleServices": [
    {
      "serviceId": 35,
      "serviceCode": "IMPL-001",
      "serviceName": "Cắm trụ Implant",
      "price": 15000000.00
    },
    {
      "serviceId": 36,
      "serviceCode": "IMPL-002",
      "serviceName": "Nâng xoang",
      "price": 8000000.00
    },
    {
      "serviceId": 37,
      "serviceCode": "IMPL-003",
      "serviceName": "Ghép xương",
      "price": 12000000.00
    }
  ]
}
```

### Error Responses

#### 404 Not Found - Room không tồn tại
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Room not found with code: P-99",
  "path": "/api/v1/rooms/P-99/services"
}
```

#### 404 Not Found - Service không tồn tại
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Service not found with codes: [INVALID-001, INVALID-002]",
  "path": "/api/v1/rooms/P-04/services"
}
```

#### 400 Bad Request - Service không active
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Cannot assign inactive services to room. Inactive services: [IMPL-999]",
  "path": "/api/v1/rooms/P-04/services"
}
```

#### 400 Bad Request - Service codes empty
```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": {
    "serviceCodes": "Danh sách mã dịch vụ không được rỗng"
  }
}
```

### Curl Example

```bash
curl -X PUT "http://localhost:8080/api/v1/rooms/P-04/services" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "serviceCodes": ["IMPL-001", "IMPL-002", "IMPL-003"]
  }'
```

### Frontend Integration Example

```typescript
// TypeScript/React example
interface UpdateRoomServicesRequest {
  serviceCodes: string[];
}

async function updateRoomServices(
  roomCode: string, 
  serviceCodes: string[]
): Promise<RoomServicesResponse> {
  const response = await fetch(`/api/v1/rooms/${roomCode}/services`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ serviceCodes })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}

// Usage - Replace all services for room P-04
const updated = await updateRoomServices('P-04', [
  'IMPL-001',
  'IMPL-002', 
  'IMPL-003'
]);

console.log(`Updated room ${updated.roomCode} with ${updated.compatibleServices.length} services`);
```

---

## Data Models

### RoomResponse

```typescript
interface RoomResponse {
  roomId: string;           // Generated ID (e.g., RM2024110300001)
  roomCode: string;         // Unique code (e.g., P-01)
  roomName: string;         // Display name
  roomType: string | null;  // STANDARD, SURGERY, XRAY, etc.
  isActive: boolean;        // Active status
  createdAt: string;        // ISO 8601 datetime
}
```

### RoomServicesResponse (V16)

```typescript
interface RoomServicesResponse {
  roomId: string;                           // Room ID
  roomCode: string;                         // Room code
  roomName: string;                         // Room name
  compatibleServices: CompatibleService[];  // List of services
}
```

### CompatibleServiceDTO (V16)

```typescript
interface CompatibleService {
  serviceId: number;        // Service ID
  serviceCode: string;      // Service code
  serviceName: string;      // Service name
  price: number;            // Service price (VND)
}
```

### UpdateRoomServicesRequest (V16)

```typescript
interface UpdateRoomServicesRequest {
  serviceCodes: string[];   // List of service codes (not empty)
}
```

---

## Error Handling

### Common HTTP Status Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 200 OK | Success | Request processed successfully |
| 201 Created | Resource created | Room created successfully |
| 400 Bad Request | Validation error | Missing required fields, invalid data |
| 401 Unauthorized | Authentication failed | Missing/invalid token |
| 403 Forbidden | Permission denied | User doesn't have required permission |
| 404 Not Found | Resource not found | Room/Service doesn't exist |
| 500 Internal Server Error | Server error | Database error, unexpected exception |

### Error Response Format

```json
{
  "timestamp": "2024-11-03T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Detailed error message",
  "path": "/api/v1/rooms/P-01/services",
  "errors": {
    "field1": "Field-specific error message",
    "field2": "Another error message"
  }
}
```

---

## Postman Testing Guide

### Setup

1. **Import Environment Variables**
   - `base_url`: `http://localhost:8080`
   - `access_token`: Your JWT access token

2. **Login First** (to get access token)
   ```
   POST {{base_url}}/api/v1/auth/login
   Body: {
     "username": "admin",
     "password": "password123"
   }
   ```
   Copy `accessToken` from response to `access_token` variable.

### Test Scenarios

#### Scenario 1: Complete Room-Service Configuration Flow

**Step 1**: Create a new room
```
POST {{base_url}}/api/v1/rooms
Authorization: Bearer {{access_token}}
Body: {
  "roomCode": "P-TEST",
  "roomName": "Phòng Test",
  "roomType": "STANDARD"
}
```
✅ Expected: 201 Created

**Step 2**: Get room services (should be empty)
```
GET {{base_url}}/api/v1/rooms/P-TEST/services
Authorization: Bearer {{access_token}}
```
✅ Expected: 200 OK with `compatibleServices: []`

**Step 3**: Assign services to room
```
PUT {{base_url}}/api/v1/rooms/P-TEST/services
Authorization: Bearer {{access_token}}
Body: {
  "serviceCodes": ["SV-001", "SV-002", "SV-003"]
}
```
✅ Expected: 200 OK with 3 services

**Step 4**: Get room services again (should show 3 services)
```
GET {{base_url}}/api/v1/rooms/P-TEST/services
Authorization: Bearer {{access_token}}
```
✅ Expected: 200 OK with 3 services

**Step 5**: Update services (replace with new list)
```
PUT {{base_url}}/api/v1/rooms/P-TEST/services
Authorization: Bearer {{access_token}}
Body: {
  "serviceCodes": ["SV-004", "SV-005"]
}
```
✅ Expected: 200 OK with 2 NEW services (old ones deleted)

#### Scenario 2: Error Handling Tests

**Test 1**: Assign services to non-existent room
```
PUT {{base_url}}/api/v1/rooms/INVALID-ROOM/services
Body: { "serviceCodes": ["SV-001"] }
```
❌ Expected: 404 Not Found

**Test 2**: Assign non-existent service
```
PUT {{base_url}}/api/v1/rooms/P-TEST/services
Body: { "serviceCodes": ["INVALID-SERVICE"] }
```
❌ Expected: 404 Not Found (service not found)

**Test 3**: Assign inactive service
```
PUT {{base_url}}/api/v1/rooms/P-TEST/services
Body: { "serviceCodes": ["INACTIVE-SV-001"] }
```
❌ Expected: 400 Bad Request (service not active)

**Test 4**: Empty service list
```
PUT {{base_url}}/api/v1/rooms/P-TEST/services
Body: { "serviceCodes": [] }
```
❌ Expected: 400 Bad Request (validation error)

**Test 5**: No authentication
```
GET {{base_url}}/api/v1/rooms/P-01/services
(no Authorization header)
```
❌ Expected: 401 Unauthorized

**Test 6**: Wrong permission
```
PUT {{base_url}}/api/v1/rooms/P-01/services
Authorization: Bearer {{doctor_token}}
Body: { "serviceCodes": ["SV-001"] }
```
❌ Expected: 403 Forbidden (doctor không có quyền UPDATE_ROOM_SERVICES)

#### Scenario 3: Pagination and Filtering

**Test 1**: Get all active rooms
```
GET {{base_url}}/api/v1/rooms?isActive=true&page=0&size=10
```

**Test 2**: Search by keyword
```
GET {{base_url}}/api/v1/rooms?keyword=Implant
```

**Test 3**: Filter by room type
```
GET {{base_url}}/api/v1/rooms?roomType=SURGERY
```

---

## Permission Matrix

| API Endpoint | Required Permission | Roles with Access |
|--------------|---------------------|-------------------|
| GET /api/v1/rooms | `VIEW_ROOM` | ADMIN, MANAGER, RECEPTIONIST |
| GET /api/v1/rooms/active | `VIEW_ROOM` | ADMIN, MANAGER, RECEPTIONIST |
| GET /api/v1/rooms/{code} | `VIEW_ROOM` | ADMIN, MANAGER, RECEPTIONIST |
| POST /api/v1/rooms | `CREATE_ROOM` | ADMIN, MANAGER |
| PUT /api/v1/rooms/{id} | `UPDATE_ROOM` | ADMIN, MANAGER |
| DELETE /api/v1/rooms/{id} | `DELETE_ROOM` | ADMIN, MANAGER |
| GET /api/v1/rooms/{code}/services | `VIEW_ROOM` | ADMIN, MANAGER, RECEPTIONIST |
| PUT /api/v1/rooms/{code}/services | `UPDATE_ROOM_SERVICES` | ADMIN, MANAGER |

---

## Database Schema (V16)

### rooms table
```sql
CREATE TABLE rooms (
    room_id VARCHAR(50) PRIMARY KEY,
    room_code VARCHAR(20) UNIQUE NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### room_services table (V16)
```sql
CREATE TABLE room_services (
    room_id VARCHAR(50) NOT NULL,
    service_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (room_id, service_id),
    
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

CREATE INDEX idx_room_services_service_id ON room_services(service_id);
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| V1 | 2024-11-01 | Initial Room Management APIs (P1.1 - P1.4) | BE Team |
| V16 | 2024-11-03 | Added Room-Service Compatibility (P1.5 - P1.6) | BE Team |

---

## Contact & Support

- **Backend Team**: backend@dentalclinic.com
- **API Issues**: Create issue in JIRA (Project: PDCMS)
- **Documentation**: https://docs.dentalclinic.com/api/rooms

---

**Last Updated**: November 3, 2024  
**Document Version**: 1.0 (V16)
