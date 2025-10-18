# Work Shift Management API Testing Guide

## Overview

This guide provides comprehensive instructions for frontend developers to test the Work Shift Management APIs. The APIs allow administrators to manage work shift templates for the dental clinic management system.

**Base URL:** `http://localhost:8080/api/v1/work-shifts`

**Authentication:** JWT Bearer token required with admin role

**Required Permissions:**
- `CREATE_WORK_SHIFTS` - Create new work shifts
- `VIEW_WORK_SHIFTS` - View work shifts
- `UPDATE_WORK_SHIFTS` - Update work shifts
- `DELETE_WORK_SHIFTS` - Delete/deactivate work shifts

---

## Prerequisites

### 1. Authentication Setup
```bash
# Get JWT token (replace with actual login endpoint)
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "12345"
}

# Use the token in Authorization header for all requests
Authorization: Bearer Token <your-jwt-token>
```

### 2. Required Headers for All Requests
```
Content-Type: application/json
Authorization: Bearer Token <your-jwt-token>
```

---

## API Endpoints Testing Guide

### 1. Create Work Shift

**Endpoint:** `POST /api/v1/work-shifts`

**Permission Required:** `CREATE_WORK_SHIFTS`

#### Valid Request Example
```bash
POST /api/v1/work-shifts
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "shiftName": "Ca sáng (4 tiếng)",
  "startTime": "08:00:00",
  "endTime": "12:00:00",
  "category": "NORMAL"
}
```

#### Expected Success Response (201 Created)
```json
{
  "workShiftId": "WKS_MORNING_01",
  "shiftName": "Ca sáng (4 tiếng)",
  "startTime": "08:00:00",
  "endTime": "12:00:00",
  "category": "NORMAL",
  "isActive": true,
  "durationHours": 4.0
}
```

#### Business Validation Test Cases

##### ✅ Valid Cases
1. **Normal morning shift (4 hours)**
   ```json
   {
     "shiftName": "Ca sáng",
     "startTime": "08:00:00",
     "endTime": "12:00:00",
     "category": "NORMAL"
   }
   ```

2. **Normal afternoon shift (6 hours)**
   ```json
   {
     "shiftName": "Ca chiều",
     "startTime": "13:00:00",
     "endTime": "19:00:00",
     "category": "NORMAL"
   }
   ```

3. **Night shift (starts after 18:00)**
   ```json
   {
     "shiftName": "Ca đêm",
     "startTime": "18:00:00",
     "endTime": "22:00:00",
     "category": "NIGHT"
   }
   ```

4. **Full day shift with lunch break (8 hours + 1 hour lunch break)**
   ```json
   {
     "shiftName": "Ca cả ngày",
     "startTime": "08:00:00",
     "endTime": "17:00:00",
     "category": "NORMAL"
   }
   ```
   **Note:** This shift from 8:00 AM to 5:00 PM (17:00) is valid even though it spans 9 hours, because it includes a mandatory 1-hour lunch break from 12:00 PM to 1:00 PM. The actual working time is 8 hours (08:00-12:00 = 4 hours, 13:00-17:00 = 4 hours).

##### ❌ Error Cases

1. **INVALID_TIME_RANGE - End time before start time**
   ```bash
   POST /api/v1/work-shifts
   ```
   ```json
   {
     "shiftName": "Invalid Shift",
     "startTime": "12:00:00",
     "endTime": "08:00:00",
     "category": "NORMAL"
   }
   ```
   **Expected:** `400 BAD_REQUEST` with error code `INVALID_TIME_RANGE`

2. **INVALID_DURATION - Shift too short (< 3 hours)**
   ```json
   {
     "shiftName": "Too Short",
     "startTime": "08:00:00",
     "endTime": "10:00:00",
     "category": "NORMAL"
   }
   ```
   **Expected:** `400 BAD_REQUEST` with error code `INVALID_DURATION`

3. **INVALID_DURATION - Shift too long (> 8 hours, without lunch break)**
   ```json
   {
     "shiftName": "Too Long",
     "startTime": "08:00:00",
     "endTime": "18:00:00",
     "category": "NORMAL"
   }
   ```
   **Expected:** `400 BAD_REQUEST` with error code `INVALID_DURATION`
   
   **Note:** Shifts longer than 8 hours are not allowed. The exception is the 08:00-17:00 shift (9 hours span) which is valid because it includes the mandatory 1-hour lunch break from 12:00-13:00, resulting in exactly 8 working hours.

4. **OUTSIDE_WORKING_HOURS - Starts before 8:00**
   ```json
   {
     "shiftName": "Too Early",
     "startTime": "06:00:00",
     "endTime": "10:00:00",
     "category": "NORMAL"
   }
   ```
   **Expected:** `400 BAD_REQUEST` with error code `OUTSIDE_WORKING_HOURS`

5. **OUTSIDE_WORKING_HOURS - Ends after 21:00**
   ```json
   {
     "shiftName": "Too Late",
     "startTime": "20:00:00",
     "endTime": "23:00:00",
     "category": "NORMAL"
   }
   ```
   **Expected:** `400 BAD_REQUEST` with error code `OUTSIDE_WORKING_HOURS`

6. **INVALID_CATEGORY - Night shift with wrong category**
   ```json
   {
     "shiftName": "Night Shift Wrong Category",
     "startTime": "18:00:00",
     "endTime": "22:00:00",
     "category": "NORMAL"
   }
   ```
   **Expected:** `400 BAD_REQUEST` with error code `INVALID_CATEGORY`

7. **DUPLICATE_SHIFT_CODE - Same shift code exists**
   ```json
   {
     "shiftName": "Duplicate Code",
     "startTime": "09:00:00",
     "endTime": "13:00:00",
     "category": "NORMAL"
   }
   ```
   **Expected:** `400 BAD_REQUEST` with error code `DUPLICATE_SHIFT_CODE`

8. **Validation Errors - Missing required fields**
   ```json
   {
     "shiftName": "",
     "startTime": null,
     "endTime": null,
     "category": null
   }
   ```
   **Expected:** `400 BAD_REQUEST` with validation error messages

---

### 2. Update Work Shift

**Endpoint:** `PATCH /api/v1/work-shifts/{work_shift_id}`

**Permission Required:** `UPDATE_WORK_SHIFTS`

#### Valid Update Request
```bash
PATCH /api/v1/work-shifts/WKS_MORNING_01
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "shiftName": "Ca sáng cập nhật",
  "startTime": "08:30:00",
  "endTime": "12:30:00",
  "category": "NORMAL"
}
```

#### Expected Success Response (200 OK)
```json
{
  "workShiftId": "WKS_MORNING_01",
  "shiftName": "Ca sáng cập nhật",
  "startTime": "08:30:00",
  "endTime": "12:30:00",
  "category": "NORMAL",
  "isActive": true,
  "durationHours": 4.0
}
```

#### Partial Update (only some fields)
```json
{
  "shiftName": "Ca sáng mới"
}
```

#### Error Cases

1. **404 NOT_FOUND - Work shift not found**
   ```bash
   PATCH /api/v1/work-shifts/NON_EXISTENT_ID
   ```
   **Expected:** `404 NOT_FOUND`

2. **403 FORBIDDEN - No permission**
   ```bash
   PATCH /api/v1/work-shifts/WKS_MORNING_01
   # Without UPDATE_WORK_SHIFTS permission
   ```
   **Expected:** `403 FORBIDDEN`

3. **Same validation errors as CREATE** - All business rules apply to updates

---

### 3. Delete Work Shift (Soft Delete)

**Endpoint:** `DELETE /api/v1/work-shifts/{work_shift_id}`

**Permission Required:** `DELETE_WORK_SHIFTS`

#### Valid Delete Request
```bash
DELETE /api/v1/work-shifts/WKS_MORNING_01
Authorization: Bearer <your-jwt-token>
```

**Expected Success Response:** `204 NO_CONTENT`

#### Error Cases

1. **404 NOT_FOUND - Work shift not found**
   ```bash
   DELETE /api/v1/work-shifts/NON_EXISTENT_ID
   ```
   **Expected:** `404 NOT_FOUND`

2. **409 CONFLICT - Shift in use**
   ```bash
   DELETE /api/v1/work-shifts/WKS_IN_USE_01
   # When shift is referenced in employee_shifts or employee_shift_registrations
   ```
   **Expected:** `409 CONFLICT` with error code `SHIFT_IN_USE`

3. **403 FORBIDDEN - No permission**
   ```bash
   DELETE /api/v1/work-shifts/WKS_MORNING_01
   # Without DELETE_WORK_SHIFTS permission
   ```
   **Expected:** `403 FORBIDDEN`

---

### 4. Get All Work Shifts

**Endpoint:** `GET /api/v1/work-shifts`

**Permission Required:** `VIEW_WORK_SHIFTS`

#### Get All Active Shifts
```bash
GET /api/v1/work-shifts?isActive=true
Authorization: Bearer <your-jwt-token>
```

#### Get All Inactive Shifts
```bash
GET /api/v1/work-shifts?isActive=false
Authorization: Bearer <your-jwt-token>
```

#### Get All Shifts (no filter)
```bash
GET /api/v1/work-shifts
Authorization: Bearer <your-jwt-token>
```

#### Expected Success Response (200 OK)
```json
[
  {
    "workShiftId": "WKS_MORNING_01",
    "shiftName": "Ca sáng (4 tiếng)",
    "startTime": "08:00:00",
    "endTime": "12:00:00",
    "category": "NORMAL",
    "isActive": true,
    "durationHours": 4.0
  },
  {
    "workShiftId": "WKS_AFTERNOON_01",
    "shiftName": "Ca chiều (6 tiếng)",
    "startTime": "13:00:00",
    "endTime": "19:00:00",
    "category": "NORMAL",
    "isActive": true,
    "durationHours": 6.0
  }
]
```

#### Error Cases

1. **403 FORBIDDEN - No permission**
   ```bash
   GET /api/v1/work-shifts
   # Without VIEW_WORK_SHIFTS permission
   ```
   **Expected:** `403 FORBIDDEN`

---

### 5. Get Work Shift by ID

**Endpoint:** `GET /api/v1/work-shifts/{work_shift_id}`

**Permission Required:** `VIEW_WORK_SHIFTS`

#### Valid Request
```bash
GET /api/v1/work-shifts/WKS_MORNING_01
Authorization: Bearer <your-jwt-token>
```

#### Expected Success Response (200 OK)
```json
{
  "workShiftId": "WKS_MORNING_01",
  "shiftName": "Ca sáng (4 tiếng)",
  "startTime": "08:00:00",
  "endTime": "12:00:00",
  "category": "NORMAL",
  "isActive": true,
  "durationHours": 4.0
}
```

#### Error Cases

1. **404 NOT_FOUND - Work shift not found**
   ```bash
   GET /api/v1/work-shifts/NON_EXISTENT_ID
   ```
   **Expected:** `404 NOT_FOUND`

2. **403 FORBIDDEN - No permission**
   ```bash
   GET /api/v1/work-shifts/WKS_MORNING_01
   # Without VIEW_WORK_SHIFTS permission
   ```
   **Expected:** `403 FORBIDDEN`

---

## Testing Workflow

### 1. Setup Phase
1. ✅ Authenticate and get JWT token
2. ✅ Verify admin permissions
3. ✅ Test GET endpoints to ensure they work

### 2. CRUD Testing Phase
1. ✅ **CREATE** - Test all validation scenarios
2. ✅ **READ** - Test both list and detail endpoints
3. ✅ **UPDATE** - Test partial and full updates with validation
4. ✅ **DELETE** - Test soft delete with constraint checking

### 3. Edge Cases & Error Handling
1. ✅ Test all business validation rules
2. ✅ Test permission-based access control
3. ✅ Test referential integrity constraints
4. ✅ Test malformed request handling

### 4. Integration Testing
1. ✅ Test with actual employee shift assignments
2. ✅ Test with employee shift registrations
3. ✅ Test deactivation when shifts are in use

---

## Common Issues & Troubleshooting

### Authentication Issues
- **Problem:** `401 UNAUTHORIZED`
- **Solution:** Check JWT token validity and format
- **Test:** Verify token with a simple GET request first

### Permission Issues
- **Problem:** `403 FORBIDDEN`
- **Solution:** Ensure user has required RBAC permissions
- **Test:** Check user roles and permissions in database

### Validation Issues
- **Problem:** `400 BAD_REQUEST` with validation errors
- **Solution:** Check request format and required fields
- **Test:** Use exact JSON structure from examples

### Database Issues
- **Problem:** Operations fail unexpectedly
- **Solution:** Check database connectivity and constraints
- **Test:** Verify database state before/after operations

---

## Sample Test Script (Postman/Insomnia)

```javascript
// Sample test flow for Postman pre-request scripts
const baseUrl = "http://localhost:8080/api/v1";

// 1. Login and get token
pm.sendRequest({
    url: baseUrl + "/auth/login",
    method: "POST",
    header: {
        "Content-Type": "application/json"
    },
    body: {
        mode: "raw",
        raw: JSON.stringify({
            username: "admin",
            password: "admin123"
        })
    }
}, function(err, response) {
    const token = response.json().token;
    pm.environment.set("jwt_token", token);
});

// 2. Create work shift
pm.sendRequest({
    url: baseUrl + "/work-shifts",
    method: "POST",
    header: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + pm.environment.get("jwt_token")
    },
    body: {
        mode: "raw",
        raw: JSON.stringify({
            shiftName: "Test Shift",
            startTime: "09:00:00",
            endTime: "13:00:00",
            category: "NORMAL"
        })
    }
});
```

---

## Notes for Frontend Implementation

1. **Duration Calculation:** The `durationHours` field is calculated server-side and included in all responses
2. **Time Format:** Use `HH:mm:ss` format for time fields
3. **Shift ID Generation:** Work shift IDs are auto-generated based on time of day
4. **Soft Delete:** Deleted shifts have `isActive: false` but remain in database
5. **Validation:** All business rules are enforced server-side - implement client-side validation for better UX
6. **Error Handling:** Check for specific error codes in response for user-friendly messages

---

*Last Updated: October 17, 2025*
*API Version: v1*
*Contact: Backend Development Team*