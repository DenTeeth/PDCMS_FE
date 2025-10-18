# Postman Testing Guide - Appointment Management APIs (6-12)

This guide provides step-by-step instructions for testing all appointment management APIs using Postman.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Authentication Setup](#authentication-setup)
3. [Test Data Setup](#test-data-setup)
4. [API Testing Instructions](#api-testing-instructions)
5. [Complete Test Flows](#complete-test-flows)
6. [Error Test Cases](#error-test-cases)
7. [SQL Verification Queries](#sql-verification-queries)
8. [Postman Collection Structure](#postman-collection-structure)

---

## Prerequisites

### Environment Setup
- Application running on: `http://localhost:8080`
- Database: MySQL with schema initialized
- Test users available in database
- Postman installed and configured

### Postman Variables (Optional)
Create a Postman environment with these variables:
```
base_url = http://localhost:8080/api/v1
token = {{jwt_token}}
appointment_id = {{appointment_id}}
doctor_id = {{doctor_id}}
patient_id = {{patient_id}}
```

---

## Authentication Setup

### Step 1: Login to Get JWT Token

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "username": "admin",
  "roles": ["ROLE_ADMIN"]
}
```

**Action:** Copy the token value and add to all subsequent requests:
- Header: `Authorization: Bearer {token}`

---

## Test Data Setup

### Step 2: Create/Verify Test Doctor

**Check existing doctors:**
```
GET http://localhost:8080/api/v1/employees?role=DOCTOR
```

**Note down a doctor's employeeId** (e.g., `EMP20250101001`)

### Step 3: Create Doctor Work Schedule

**Endpoint:** `POST /api/v1/dentist-schedules`

**Request:**
```json
{
  "employeeCode": "EMP20250101001",
  "workDate": "2025-10-16",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "notes": "Regular working hours"
}
```

**Expected Response:** `200 OK`
```json
{
  "id": 1,
  "employeeCode": "EMP20250101001",
  "workDate": "2025-10-16",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "status": "SCHEDULED",
  "notes": "Regular working hours"
}
```

### Step 4: Create/Verify Test Patient

**Check existing patients:**
```
GET http://localhost:8080/api/v1/patients
```

**Note down a patient's id** (e.g., `1`)

### Step 5: Create Initial Test Appointment

**Endpoint:** `POST /api/v1/appointments`

**Request:**
```json
{
  "patientId": 1,
  "doctorId": "EMP20250101001",
  "appointmentDate": "2025-10-16",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "type": "EXAMINATION",
  "notes": "Initial consultation"
}
```

**Expected Response:** `201 Created`
```json
{
  "appointmentId": "APT202510160001",
  "appointmentCode": "APT2510161",
  "patientId": 1,
  "doctorId": "EMP20250101001",
  "appointmentDate": "2025-10-16",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "type": "EXAMINATION",
  "status": "SCHEDULED",
  "notes": "Initial consultation",
  "createdBy": "admin",
  "createdAt": "2025-10-13T14:30:00"
}
```

**Action:** Save the `appointmentId` for subsequent tests

---

## API Testing Instructions

### API 6: Get Available Slots

**Endpoint:** `GET /api/v1/appointments/available-slots`

**Test Case 1: Basic Available Slots Query**

**Request:**
```
GET http://localhost:8080/api/v1/appointments/available-slots?doctorId=EMP20250101001&date=2025-10-16
```

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:** `200 OK`
```json
{
  "date": "2025-10-16",
  "doctorId": "EMP20250101001",
  "availableSlots": [
    {
      "startTime": "09:00:00",
      "endTime": "09:30:00",
      "available": true
    },
    {
      "startTime": "09:30:00",
      "endTime": "10:00:00",
      "available": true
    },
    {
      "startTime": "10:00:00",
      "endTime": "10:30:00",
      "available": false
    },
    // ... more slots until 17:00:00
  ]
}
```

**Validation:**
- Slots are in 30-minute intervals
- 09:00-17:00 working hours respected
- Booked slot (10:00-10:30) shows `available: false`
- All other slots show `available: true`

**Test Case 2: No Doctor Schedule**

**Request:**
```
GET http://localhost:8080/api/v1/appointments/available-slots?doctorId=EMP20250101001&date=2025-10-20
```

**Expected Response:** `200 OK`
```json
{
  "date": "2025-10-20",
  "doctorId": "EMP20250101001",
  "availableSlots": []
}
```

---

### API 7: Reschedule Appointment

**Endpoint:** `PUT /api/v1/appointments/{id}/reschedule`

**Test Case 1: Valid Reschedule (Happy Path)**

**Request:**
```
PUT http://localhost:8080/api/v1/appointments/APT202510160001/reschedule
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "appointmentDate": "2025-10-16",
  "startTime": "14:00:00",
  "endTime": "14:30:00",
  "notes": "Rescheduled per patient request"
}
```

**Expected Response:** `200 OK`
```json
{
  "appointmentId": "APT202510160001",
  "appointmentCode": "APT2510161",
  "patientId": 1,
  "doctorId": "EMP20250101001",
  "appointmentDate": "2025-10-16",
  "startTime": "14:00:00",
  "endTime": "14:30:00",
  "type": "EXAMINATION",
  "status": "SCHEDULED",
  "notes": "Rescheduled per patient request",
  "updatedBy": "admin",
  "updatedAt": "2025-10-13T14:35:00"
}
```

**Validation:**
- Status reset to `SCHEDULED`
- New time reflected: 14:00-14:30
- `updatedBy` and `updatedAt` populated
- Old appointment details logged (check logs/audit table)

**Test Case 2: Reschedule CONFIRMED Appointment**

**First, confirm the appointment:**
```
PUT http://localhost:8080/api/v1/appointments/APT202510160001/confirm
```

**Then reschedule:**
```
PUT http://localhost:8080/api/v1/appointments/APT202510160001/reschedule
```
**Body:**
```json
{
  "appointmentDate": "2025-10-16",
  "startTime": "15:00:00",
  "endTime": "15:30:00",
  "notes": "Emergency reschedule"
}
```

**Expected Response:** `200 OK` with status reset to `SCHEDULED`

---

### API 8: Cancel Appointment

**Endpoint:** `PUT /api/v1/appointments/{id}/cancel`

**Test Case 1: Cancel SCHEDULED Appointment**

**Request:**
```
PUT http://localhost:8080/api/v1/appointments/APT202510160001/cancel
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "cancellationReason": "Patient requested cancellation due to conflict"
}
```

**Expected Response:** `200 OK`
```json
{
  "appointmentId": "APT202510160001",
  "status": "CANCELLED",
  "cancellationReason": "Patient requested cancellation due to conflict",
  "cancelledAt": "2025-10-13T14:40:00",
  "cancelledBy": "admin"
}
```

**Validation:**
- Status changed to `CANCELLED`
- `cancellationReason` saved
- `cancelledAt` timestamp set
- `cancelledBy` populated

**Test Case 2: Cancel CONFIRMED Appointment**

**Create new appointment, confirm it, then cancel:**
```
POST /api/v1/appointments (create new)
PUT /api/v1/appointments/{id}/confirm
PUT /api/v1/appointments/{id}/cancel
```

**Body:**
```json
{
  "cancellationReason": "Doctor emergency"
}
```

**Expected Response:** `200 OK` with `CANCELLED` status

---

### API 9: Mark No-Show

**Endpoint:** `PUT /api/v1/appointments/{id}/no-show`

**Test Case 1: No-Show from CONFIRMED Status**

**Setup: Create and confirm appointment**
```
POST /api/v1/appointments
PUT /api/v1/appointments/{id}/confirm
```

**Request:**
```
PUT http://localhost:8080/api/v1/appointments/APT202510160002/no-show
```

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:** `200 OK`
```json
{
  "appointmentId": "APT202510160002",
  "status": "NO_SHOW",
  "updatedBy": "admin",
  "updatedAt": "2025-10-13T15:00:00"
}
```

**Validation:**
- Status changed from `CONFIRMED` to `NO_SHOW`
- No `cancelledAt` or `completedAt` timestamp (only `updatedAt`)

---

### API 10: Confirm Appointment

**Endpoint:** `PUT /api/v1/appointments/{id}/confirm`

**Test Case 1: Confirm SCHEDULED Appointment**

**Setup: Create appointment**
```
POST /api/v1/appointments
```

**Request:**
```
PUT http://localhost:8080/api/v1/appointments/APT202510160003/confirm
```

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:** `200 OK`
```json
{
  "appointmentId": "APT202510160003",
  "status": "CONFIRMED",
  "confirmedAt": "2025-10-13T15:10:00",
  "confirmedBy": "admin"
}
```

**Validation:**
- Status changed from `SCHEDULED` to `CONFIRMED`
- `confirmedAt` timestamp set
- `confirmedBy` populated

**Test Case 2: Cannot Confirm COMPLETED Appointment**

**Request:**
```
PUT http://localhost:8080/api/v1/appointments/APT202510160003/confirm
```
(After completing it)

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Invalid status transition",
  "message": "Cannot confirm appointment in COMPLETED status"
}
```

---

### API 11: Complete Appointment

**Endpoint:** `PUT /api/v1/appointments/{id}/complete`

**Test Case 1: Complete CONFIRMED Appointment**

**Setup: Create and confirm appointment**
```
POST /api/v1/appointments
PUT /api/v1/appointments/{id}/confirm
```

**Request:**
```
PUT http://localhost:8080/api/v1/appointments/APT202510160004/complete
```

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:** `200 OK`
```json
{
  "appointmentId": "APT202510160004",
  "status": "COMPLETED",
  "completedAt": "2025-10-13T15:30:00",
  "completedBy": "admin"
}
```

**Validation:**
- Status changed from `CONFIRMED` to `COMPLETED`
- `completedAt` timestamp set
- `completedBy` populated
- If type is `EXAMINATION`, check if treatment plan created (verify in treatment_plans table)

**Test Case 2: Complete EXAMINATION Type (Triggers Treatment Plan)**

**Request:**
```
PUT http://localhost:8080/api/v1/appointments/APT202510160005/complete
```

**Validation:**
- Appointment status = `COMPLETED`
- New treatment plan created for patient (check treatment_plans table)

---

### API 12: Get Doctor Schedule

**Endpoint:** `GET /api/v1/dentist-schedules`

**Test Case 1: Get Schedule by Employee Code**

**Request:**
```
GET http://localhost:8080/api/v1/dentist-schedules?employeeCode=EMP20250101001
```

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "employeeCode": "EMP20250101001",
      "workDate": "2025-10-16",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "status": "SCHEDULED",
      "notes": "Regular working hours",
      "createdBy": "admin",
      "createdAt": "2025-10-13T14:00:00"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "pageNumber": 0,
  "pageSize": 20
}
```

**Test Case 2: Get Schedule with Date Range**

**Request:**
```
GET http://localhost:8080/api/v1/dentist-schedules?employeeCode=EMP20250101001&startDate=2025-10-16&endDate=2025-10-20
```

**Expected Response:** `200 OK` with schedules within date range

**Test Case 3: Get Schedule by Status**

**Request:**
```
GET http://localhost:8080/api/v1/dentist-schedules?employeeCode=EMP20250101001&status=SCHEDULED
```

**Expected Response:** `200 OK` with only SCHEDULED schedules

---

## Complete Test Flows

### Flow 1: Happy Path - Complete Appointment Lifecycle

1. **Login**
   ```
   POST /api/v1/auth/login
   ```

2. **Create doctor schedule**
   ```
   POST /api/v1/dentist-schedules
   ```

3. **Check available slots**
   ```
   GET /api/v1/appointments/available-slots?doctorId=EMP20250101001&date=2025-10-16
   ```

4. **Create appointment**
   ```
   POST /api/v1/appointments
   ```

5. **Confirm appointment**
   ```
   PUT /api/v1/appointments/{id}/confirm
   ```

6. **Complete appointment**
   ```
   PUT /api/v1/appointments/{id}/complete
   ```

7. **Verify in database**
   ```sql
   SELECT * FROM appointments WHERE appointment_id = 'APT202510160001';
   ```

### Flow 2: Reschedule Flow

1. **Create appointment** (SCHEDULED)
   ```
   POST /api/v1/appointments
   ```

2. **Confirm appointment** (CONFIRMED)
   ```
   PUT /api/v1/appointments/{id}/confirm
   ```

3. **Reschedule appointment** (back to SCHEDULED)
   ```
   PUT /api/v1/appointments/{id}/reschedule
   ```

4. **Re-confirm appointment** (CONFIRMED)
   ```
   PUT /api/v1/appointments/{id}/confirm
   ```

5. **Complete appointment** (COMPLETED)
   ```
   PUT /api/v1/appointments/{id}/complete
   ```

### Flow 3: Cancellation Flow

1. **Create appointment**
   ```
   POST /api/v1/appointments
   ```

2. **Cancel appointment**
   ```
   PUT /api/v1/appointments/{id}/cancel
   ```

3. **Verify cancellation reason stored**
   ```sql
   SELECT cancellation_reason, cancelled_at, cancelled_by 
   FROM appointments WHERE appointment_id = 'APT202510160001';
   ```

### Flow 4: No-Show Flow

1. **Create appointment**
   ```
   POST /api/v1/appointments
   ```

2. **Confirm appointment**
   ```
   PUT /api/v1/appointments/{id}/confirm
   ```

3. **Mark no-show**
   ```
   PUT /api/v1/appointments/{id}/no-show
   ```

---

## Error Test Cases

### API 6 Error Cases

**Missing Required Parameter:**
```
GET /api/v1/appointments/available-slots?doctorId=EMP20250101001
(missing date)
```
**Expected:** `400 Bad Request` - "date parameter is required"

**Invalid Doctor ID:**
```
GET /api/v1/appointments/available-slots?doctorId=INVALID&date=2025-10-16
```
**Expected:** `404 Not Found` - "Doctor not found"

---

### API 7 Error Cases

**Reschedule Outside Working Hours:**
```json
{
  "appointmentDate": "2025-10-16",
  "startTime": "18:00:00",
  "endTime": "18:30:00"
}
```
**Expected:** `400 Bad Request` - "Appointment time is outside doctor's working hours"

**Reschedule to Date Without Doctor Schedule:**
```json
{
  "appointmentDate": "2025-10-25",
  "startTime": "10:00:00",
  "endTime": "10:30:00"
}
```
**Expected:** `400 Bad Request` - "Doctor is not available on this date"

**Reschedule Time Conflict:**
```json
{
  "appointmentDate": "2025-10-16",
  "startTime": "10:00:00",
  "endTime": "10:30:00"
}
```
(When another appointment exists at this time)
**Expected:** `409 Conflict` - "Appointment time conflicts with existing appointment"

**Reschedule COMPLETED Appointment:**
```
PUT /api/v1/appointments/{completed_id}/reschedule
```
**Expected:** `400 Bad Request` - "Cannot reschedule completed appointment"

---

### API 8 Error Cases

**Cancel Without Reason:**
```json
{
  "cancellationReason": ""
}
```
**Expected:** `400 Bad Request` - "Cancellation reason is required"

**Cancel Already Completed:**
```
PUT /api/v1/appointments/{completed_id}/cancel
```
**Expected:** `400 Bad Request` - "Cannot cancel completed appointment"

**Cancel Already Cancelled:**
```
PUT /api/v1/appointments/{cancelled_id}/cancel
```
**Expected:** `400 Bad Request` - "Appointment is already cancelled"

---

### API 9 Error Cases

**No-Show from SCHEDULED Status:**
```
PUT /api/v1/appointments/{scheduled_id}/no-show
```
**Expected:** `400 Bad Request` - "Can only mark no-show for confirmed appointments"

**No-Show Already Completed:**
```
PUT /api/v1/appointments/{completed_id}/no-show
```
**Expected:** `400 Bad Request` - "Invalid status transition"

---

### API 10 Error Cases

**Confirm Non-existent Appointment:**
```
PUT /api/v1/appointments/INVALID_ID/confirm
```
**Expected:** `404 Not Found` - "Appointment not found"

**Confirm CANCELLED Appointment:**
```
PUT /api/v1/appointments/{cancelled_id}/confirm
```
**Expected:** `400 Bad Request` - "Cannot confirm cancelled appointment"

---

### API 11 Error Cases

**Complete SCHEDULED Appointment:**
```
PUT /api/v1/appointments/{scheduled_id}/complete
```
**Expected:** `400 Bad Request` - "Can only complete confirmed appointments"

**Complete CANCELLED Appointment:**
```
PUT /api/v1/appointments/{cancelled_id}/complete
```
**Expected:** `400 Bad Request` - "Cannot complete cancelled appointment"

---

### API 12 Error Cases

**Invalid Employee Code:**
```
GET /api/v1/dentist-schedules?employeeCode=INVALID
```
**Expected:** `200 OK` with empty content array

**Invalid Date Format:**
```
GET /api/v1/dentist-schedules?employeeCode=EMP20250101001&startDate=invalid-date
```
**Expected:** `400 Bad Request` - "Invalid date format"

---

## SQL Verification Queries

### Verify Appointment Creation
```sql
SELECT 
  appointment_id,
  appointment_code,
  patient_id,
  doctor_id,
  appointment_date,
  start_time,
  end_time,
  type,
  status,
  created_by,
  created_at
FROM appointments 
WHERE appointment_id = 'APT202510160001';
```

### Verify Status Transitions
```sql
SELECT 
  appointment_id,
  status,
  confirmed_at,
  confirmed_by,
  completed_at,
  completed_by,
  cancelled_at,
  cancelled_by,
  cancellation_reason
FROM appointments 
WHERE appointment_id = 'APT202510160001';
```

### Verify Reschedule Logs
```sql
-- Check if your system has an audit/history table
SELECT * FROM appointment_history 
WHERE appointment_id = 'APT202510160001'
ORDER BY changed_at DESC;
```

### Verify Doctor Schedule
```sql
SELECT 
  id,
  employee_code,
  work_date,
  start_time,
  end_time,
  status,
  notes
FROM dentist_work_schedules
WHERE employee_code = 'EMP20250101001'
ORDER BY work_date;
```

### Verify Available Slots Calculation
```sql
-- Check booked appointments for a date
SELECT 
  appointment_id,
  start_time,
  end_time,
  status
FROM appointments
WHERE doctor_id = 'EMP20250101001'
  AND appointment_date = '2025-10-16'
  AND status IN ('SCHEDULED', 'CONFIRMED')
ORDER BY start_time;
```

### Verify Treatment Plan Creation
```sql
-- After completing EXAMINATION type appointment
SELECT 
  tp.*
FROM treatment_plans tp
JOIN appointments a ON tp.appointment_id = a.appointment_id
WHERE a.appointment_id = 'APT202510160001'
  AND a.type = 'EXAMINATION';
```

### Verify Field Immutability
```sql
-- Check that patient_id and doctor_id remain unchanged after creation
SELECT 
  appointment_id,
  patient_id,
  doctor_id,
  status,
  updated_at
FROM appointments
WHERE appointment_id = 'APT202510160001';
```

---

## Postman Collection Structure

### Recommended Folder Organization

```
📁 Dental Clinic - Appointment Management
├── 📁 Authentication
│   └── POST Login
│
├── 📁 Test Data Setup
│   ├── POST Create Doctor Schedule
│   ├── GET List Doctors
│   └── GET List Patients
│
├── 📁 API 6 - Available Slots
│   ├── GET Available Slots (Happy Path)
│   ├── GET Available Slots (No Schedule)
│   └── GET Available Slots (Missing Param - Error)
│
├── 📁 API 7 - Reschedule
│   ├── PUT Reschedule SCHEDULED (Happy Path)
│   ├── PUT Reschedule CONFIRMED
│   ├── PUT Reschedule - Outside Hours (Error)
│   ├── PUT Reschedule - No Schedule (Error)
│   └── PUT Reschedule - Conflict (Error)
│
├── 📁 API 8 - Cancel
│   ├── PUT Cancel SCHEDULED (Happy Path)
│   ├── PUT Cancel CONFIRMED
│   ├── PUT Cancel - No Reason (Error)
│   └── PUT Cancel COMPLETED (Error)
│
├── 📁 API 9 - No-Show
│   ├── PUT No-Show CONFIRMED (Happy Path)
│   ├── PUT No-Show SCHEDULED (Error)
│   └── PUT No-Show COMPLETED (Error)
│
├── 📁 API 10 - Confirm
│   ├── PUT Confirm SCHEDULED (Happy Path)
│   ├── PUT Confirm - Not Found (Error)
│   └── PUT Confirm CANCELLED (Error)
│
├── 📁 API 11 - Complete
│   ├── PUT Complete CONFIRMED (Happy Path)
│   ├── PUT Complete EXAMINATION (Treatment Plan)
│   ├── PUT Complete SCHEDULED (Error)
│   └── PUT Complete CANCELLED (Error)
│
├── 📁 API 12 - Doctor Schedule
│   ├── GET Schedule by Employee Code
│   ├── GET Schedule with Date Range
│   ├── GET Schedule by Status
│   └── GET Schedule - Invalid Code (Error)
│
└── 📁 Complete Flows
    ├── Flow 1 - Happy Path Lifecycle
    ├── Flow 2 - Reschedule Flow
    ├── Flow 3 - Cancellation Flow
    └── Flow 4 - No-Show Flow
```

### Environment Variables Setup

Create environment: **Dental Clinic - Local**

```json
{
  "base_url": "http://localhost:8080/api/v1",
  "token": "",
  "appointment_id": "",
  "doctor_id": "EMP20250101001",
  "patient_id": "1",
  "test_date": "2025-10-16"
}
```

### Collection-Level Scripts

**Pre-request Script (Collection Level):**
```javascript
// Automatically add Bearer token to all requests
if (pm.environment.get("token")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.environment.get("token")
    });
}
```

**Tests Script (Login Request):**
```javascript
// Save token after login
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    console.log("Token saved:", jsonData.token);
}
```

**Tests Script (Create Appointment):**
```javascript
// Save appointment ID for subsequent tests
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("appointment_id", jsonData.appointmentId);
    console.log("Appointment ID saved:", jsonData.appointmentId);
}
```

---

## Testing Checklist

### Before Testing
- [ ] Application is running on localhost:8080
- [ ] Database is initialized with schema
- [ ] Test users exist (admin/123456)
- [ ] Postman environment configured
- [ ] JWT token obtained

### API 6 Testing
- [ ] Get available slots with valid doctor and date
- [ ] Verify 30-minute slot intervals
- [ ] Verify booked slots show unavailable
- [ ] Test with date without doctor schedule
- [ ] Test error cases (missing params, invalid doctor)

### API 7 Testing
- [ ] Reschedule SCHEDULED appointment
- [ ] Reschedule CONFIRMED appointment (resets to SCHEDULED)
- [ ] Verify doctor schedule validation
- [ ] Verify working hours validation
- [ ] Verify time conflict check
- [ ] Test reschedule COMPLETED (should fail)

### API 8 Testing
- [ ] Cancel with valid reason
- [ ] Verify cancellation reason stored
- [ ] Verify cancelled_at timestamp
- [ ] Test cancel without reason (should fail)
- [ ] Test cancel COMPLETED (should fail)

### API 9 Testing
- [ ] No-show from CONFIRMED status
- [ ] Verify status change to NO_SHOW
- [ ] Test no-show from SCHEDULED (should fail)
- [ ] Test no-show from COMPLETED (should fail)

### API 10 Testing
- [ ] Confirm SCHEDULED appointment
- [ ] Verify confirmed_at timestamp
- [ ] Test confirm non-existent appointment
- [ ] Test confirm CANCELLED (should fail)

### API 11 Testing
- [ ] Complete CONFIRMED appointment
- [ ] Verify completed_at timestamp
- [ ] Complete EXAMINATION (verify treatment plan created)
- [ ] Test complete SCHEDULED (should fail)
- [ ] Test complete CANCELLED (should fail)

### API 12 Testing
- [ ] Get schedule by employee code
- [ ] Get schedule with date range filter
- [ ] Get schedule by status filter
- [ ] Test with invalid employee code

### Integration Testing
- [ ] Run complete happy path flow
- [ ] Run reschedule flow
- [ ] Run cancellation flow
- [ ] Run no-show flow
- [ ] Verify all SQL queries return expected data

---

## Tips for Efficient Testing

1. **Use Postman Runner**
   - Create test suites for automated testing
   - Run complete flows with one click

2. **Use Collection Variables**
   - Store IDs dynamically between requests
   - Avoid hardcoding values

3. **Add Assertions**
   - Validate response codes
   - Check response body fields
   - Verify status transitions

4. **Keep Test Data Clean**
   - Reset database between test runs if needed
   - Use unique dates for each test session

5. **Document Bugs**
   - Screenshot unexpected responses
   - Note the exact request/response
   - Include SQL verification results

---

## Next Steps

1. ✅ Complete manual Postman testing
2. Export Postman collection for QA team
3. Write automated integration tests
4. Update API documentation
5. Open Pull Request

---

**Happy Testing! 🚀**
