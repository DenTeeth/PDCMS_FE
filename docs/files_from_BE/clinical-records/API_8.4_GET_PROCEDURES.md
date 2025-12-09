# API 8.4: Get Procedures for Clinical Record

## Overview

Retrieves all procedures/services performed during a specific clinical visit. This API is typically called immediately after loading clinical record detail to display the "Work Done" table in the UI.

**Endpoint**: `GET /api/v1/appointments/clinical-records/{recordId}/procedures`

**Authorization**: Requires `VIEW_APPOINTMENT_OWN` or `VIEW_APPOINTMENT_ALL` permission (Doctor, Assistant, Admin)

**Module**: Clinical Records Management (Module 9)

---

## Business Rules

### Authorization Logic (Same as API 8.1)

1. **ROLE_ADMIN**: Access all clinical records
2. **VIEW_APPOINTMENT_ALL**: Access all records (Receptionist, Manager)
3. **VIEW_APPOINTMENT_OWN**: Access only if:
   - **Doctor**: appointment.employee_id matches current user
   - **Patient**: appointment.patient_id matches current user
   - **Assistant/Observer**: User is appointment participant

### Data Processing

- Query `clinical_record_procedures` table filtered by `clinical_record_id`
- LEFT JOIN with `services` table to get service name and code
- Sort by `created_at DESC` (newest procedures first)
- Return empty array if no procedures added yet (not an error)

### Field Mapping

- **procedureDescription**: REQUIRED field from schema (describes what was done)
- **toothNumber**: Tooth identifier (e.g., "36", "46-47", "ALL" for full arch)
- **serviceId/serviceName**: Reference to service catalog (optional)
- **patientPlanItemId**: Link to treatment plan item if procedure was planned

---

## Request

### Headers

```
Authorization: Bearer {JWT_TOKEN}
```

### Path Parameters

| Parameter  | Type    | Required | Description                                |
| ---------- | ------- | -------- | ------------------------------------------ |
| `recordId` | Integer | Yes      | Clinical record ID (from API 8.1 response) |

### Example Request

```bash
GET /api/v1/appointments/clinical-records/1/procedures
Authorization: Bearer {JWT_TOKEN}
```

---

## Response

### Success Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Procedures retrieved successfully",
  "data": [
    {
      "procedureId": 1,
      "clinicalRecordId": 1,

      "serviceId": 2,
      "serviceName": "Tram rang Composite (Xoang I)",
      "serviceCode": "FILL_COMP_1",

      "patientPlanItemId": 5,

      "procedureDescription": "Tram rang 36 mat O, lot MTA, tram Composite mau A3, danh bong",
      "toothNumber": "36",
      "notes": "Benh nhan chiu dung tot, khong dau",

      "createdAt": "2025-11-04 10:15:00"
    },
    {
      "procedureId": 2,
      "clinicalRecordId": 1,

      "serviceId": 1,
      "serviceName": "Cao voi rang (Toan ham)",
      "serviceCode": "SCALE_FULL",

      "patientPlanItemId": null,

      "procedureDescription": "Cao voi rang toan ham, lam sach tui nha chu, danh bong",
      "toothNumber": "ALL",
      "notes": "Benh nhan chay mau nuou nhieu, huong dan danh rang dung cach",

      "createdAt": "2025-11-04 09:50:00"
    }
  ]
}
```

### Response Fields

| Field                  | Type    | Description                                                 |
| ---------------------- | ------- | ----------------------------------------------------------- |
| `procedureId`          | Integer | Unique procedure ID                                         |
| `clinicalRecordId`     | Integer | Parent clinical record ID                                   |
| `serviceId`            | Integer | Service catalog reference (null if custom procedure)        |
| `serviceName`          | String  | Service name from catalog                                   |
| `serviceCode`          | String  | Service code from catalog                                   |
| `patientPlanItemId`    | Integer | Link to treatment plan item (null if unplanned)             |
| `procedureDescription` | String  | REQUIRED - Detailed description of work done                |
| `toothNumber`          | String  | Tooth identifier (36, 46-47, ALL, etc.)                     |
| `notes`                | String  | Additional notes about procedure                            |
| `createdAt`            | String  | Timestamp when procedure was recorded (yyyy-MM-dd HH:mm:ss) |

---

### Empty List Response (200 OK)

**Scenario**: Clinical record exists but no procedures added yet

```json
{
  "statusCode": 200,
  "message": "Procedures retrieved successfully",
  "data": []
}
```

**Frontend Action**: Display "No procedures recorded yet" message with "Add Procedure" button

---

## Error Responses

### 404 Not Found - Record Not Found

**Scenario**: Invalid clinical record ID

```json
{
  "statusCode": 404,
  "error": "RECORD_NOT_FOUND",
  "message": "Clinical record not found with ID: 999"
}
```

**Frontend Action**: Show error message, redirect to clinical records list

---

### 403 Forbidden - Unauthorized Access

**Scenario**: User doesn't have permission to view this clinical record

```json
{
  "statusCode": 403,
  "error": "UNAUTHORIZED_ACCESS",
  "message": "You do not have permission to access this clinical record"
}
```

**Test Cases**:

- Doctor trying to view another doctor's patient record
- Patient trying to view other patient's records
- Receptionist without VIEW_APPOINTMENT_ALL permission

---

## Test Scenarios

### Test Case 1: Get Procedures Successfully

**Given**:

- User has `VIEW_APPOINTMENT_OWN` permission
- Clinical record ID 1 exists and belongs to user's appointment
- Record has 2 procedures

**Request**:

```bash
curl -X GET http://localhost:8080/api/v1/appointments/clinical-records/1/procedures \
  -H "Authorization: Bearer {DOCTOR_TOKEN}"
```

**Expected**: 200 OK with array of 2 procedures, sorted by createdAt DESC

---

### Test Case 2: Empty Procedures List

**Given**:

- Clinical record ID 3 exists
- No procedures added yet

**Request**:

```bash
curl -X GET http://localhost:8080/api/v1/appointments/clinical-records/3/procedures \
  -H "Authorization: Bearer {DOCTOR_TOKEN}"
```

**Expected**: 200 OK with empty array `data: []`

---

### Test Case 3: Record Not Found (404)

**Given**: Clinical record ID 9999 doesn't exist

**Request**:

```bash
curl -X GET http://localhost:8080/api/v1/appointments/clinical-records/9999/procedures \
  -H "Authorization: Bearer {DOCTOR_TOKEN}"
```

**Expected**: 404 NOT_FOUND with error `RECORD_NOT_FOUND`

---

### Test Case 4: Unauthorized Access (403)

**Given**:

- Clinical record ID 2 belongs to doctor bacsi2
- User is bacsi1 (different doctor)

**Request**:

```bash
curl -X GET http://localhost:8080/api/v1/appointments/clinical-records/2/procedures \
  -H "Authorization: Bearer {BACSI1_TOKEN}"
```

**Expected**: 403 FORBIDDEN with error `UNAUTHORIZED_ACCESS`

---

### Test Case 5: Admin Access (200)

**Given**: Admin user can view all records

**Request**:

```bash
curl -X GET http://localhost:8080/api/v1/appointments/clinical-records/1/procedures \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

**Expected**: 200 OK regardless of which doctor's appointment

---

### Test Case 6: Patient Access (403)

**Given**: Patient trying to access API

**Request**:

```bash
curl -X GET http://localhost:8080/api/v1/appointments/clinical-records/1/procedures \
  -H "Authorization: Bearer {PATIENT_TOKEN}"
```

**Expected**: 403 FORBIDDEN (patients have VIEW_APPOINTMENT_OWN but this endpoint requires staff permission)

---

## Implementation Notes

### Schema Alignment

- Entity: `ClinicalRecordProcedure.java`
- Table: `clinical_record_procedures`
- Key fields: `procedure_description` (REQUIRED), `tooth_number`, `notes`
- NO `quantity` field (not in schema)
- NO `tooth_surface` field (not in schema) - surface info encoded in toothNumber or description

### Query Optimization

```sql
SELECT p.* FROM clinical_record_procedures p
LEFT JOIN services s ON p.service_id = s.service_id
WHERE p.clinical_record_id = ?
ORDER BY p.created_at DESC
```

Uses `LEFT JOIN FETCH` to avoid N+1 queries when loading service information.

### RBAC Implementation

Reuses `checkAccessPermission()` method from API 8.1:

1. Load clinical record (404 if not found)
2. Load associated appointment
3. Check user permission against appointment
4. Return procedures if authorized

---

## Related APIs

- **API 8.1**: GET clinical record (load parent record first)
- **API 9.5**: POST add procedure (create new procedure)
- **API 9.6**: PUT update procedure (edit existing procedure)
- **API 9.7**: DELETE procedure (remove procedure)
- **API 5.x**: Treatment plan APIs (link procedures to plan items)

---

## Seed Data for Testing

### Available Test Records

| Record ID | Appointment ID | Doctor          | Has Procedures | Test Scenario   |
| --------- | -------------- | --------------- | -------------- | --------------- |
| 1         | 1              | bacsi1 (EMP001) | Yes (2)        | Success test    |
| 2         | 2              | bacsi2 (EMP002) | Yes (1)        | RBAC test       |
| 3         | 3              | bacsi1 (EMP001) | No             | Empty list test |

### Test Credentials

```bash
# Doctor 1 (has VIEW_APPOINTMENT_OWN)
Username: bacsi1
Password: 123456

# Doctor 2 (has VIEW_APPOINTMENT_OWN)
Username: bacsi2
Password: 123456

# Admin (has ROLE_ADMIN)
Username: admin
Password: 123456

# Patient (NO staff permission)
Username: benhnhan1
Password: 123456
```

---

## Frontend Integration Guide

### Workflow: View Clinical Record with Procedures

```javascript
// Step 1: Load clinical record (API 8.1)
const record = await GET("/api/v1/appointments/1/clinical-record");
// Response includes: recordId, appointment, doctor, patient, etc.

// Step 2: Load procedures for this record (API 8.4)
const procedures = await GET(
  `/api/v1/appointments/clinical-records/${record.clinicalRecordId}/procedures`
);

// Step 3: Display procedures table
if (procedures.length === 0) {
  showEmptyState("No procedures recorded yet");
} else {
  renderProceduresTable(procedures);
}

// Step 4: Handle procedure actions
procedures.forEach((proc) => {
  if (proc.patientPlanItemId) {
    // Link to treatment plan
    showPlanBadge(proc.patientPlanItemId);
  }
  if (proc.serviceId) {
    // Show service pricing
    fetchServicePrice(proc.serviceId);
  }
});
```

### Best Practices

1. **Cache procedures**: Store in state after first load
2. **Auto-refresh**: Reload after adding/editing/deleting procedures
3. **Show service details**: Display serviceCode with serviceName for clarity
4. **Highlight planned procedures**: Different UI for procedures linked to treatment plan
5. **Group by tooth**: Optional - group procedures by toothNumber for better readability

---

## Changelog

| Version | Date       | Changes                   |
| ------- | ---------- | ------------------------- |
| 1.0     | 2025-12-01 | Initial API specification |
