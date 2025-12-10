# API 9.2: Create Clinical Record

## Overview

Creates a new clinical record for an appointment. This is the first step when patient sits in the dental chair. System records chief complaint, vital signs and initial diagnosis.

**Endpoint**: `POST /api/v1/clinical-records`

**Authorization**: Requires `WRITE_CLINICAL_RECORD` permission (Doctor, Admin)

**Module**: Clinical Records Management (Module 9)

---

## Business Rules

### Validation Rules

1. **Appointment ID**: Must exist in database
2. **Appointment Status**: Must be `IN_PROGRESS` or `CHECKED_IN`
3. **Duplicate Check**: No existing clinical record for this appointment (returns 409 CONFLICT)
4. **Required Fields**:
   - `chiefComplaint`: 1-1000 characters
   - `examinationFindings`: 1-2000 characters
   - `diagnosis`: 1-500 characters
5. **Optional Fields**:
   - `treatmentNotes`: max 2000 characters
   - `vitalSigns`: Free-form JSONB object
   - `followUpDate`: Date format yyyy-MM-dd

### Data Processing

- `vitalSigns` stored as JSONB (no strict validation)
- Auto-generate `created_at` and `updated_at` timestamps
- Return `clinicalRecordId` for subsequent operations (upload images, add procedures)

---

## Request

### Headers

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Body Parameters

| Field                 | Type    | Required | Description                     | Validation                                |
| --------------------- | ------- | -------- | ------------------------------- | ----------------------------------------- |
| `appointmentId`       | Integer | Yes      | Appointment ID                  | Must exist, status IN_PROGRESS/CHECKED_IN |
| `chiefComplaint`      | String  | Yes      | Patient's main complaint        | 1-1000 chars                              |
| `examinationFindings` | String  | Yes      | Clinical examination results    | 1-2000 chars                              |
| `diagnosis`           | String  | Yes      | Medical diagnosis               | 1-500 chars                               |
| `treatmentNotes`      | String  | No       | Treatment plan notes            | Max 2000 chars                            |
| `followUpDate`        | String  | No       | Follow-up appointment date      | Format: yyyy-MM-dd                        |
| `vitalSigns`          | Object  | No       | Patient vital signs (free-form) | JSONB object                              |

### Example Request

```json
{
  "appointmentId": 1,
  "chiefComplaint": "Dau nhuc rang ham duoi, e buot khi an do nong",
  "examinationFindings": "Nuou sung do vung rang 36, co tui nha chu 3mm",
  "diagnosis": "Viem tuy cap",
  "treatmentNotes": "Benh nhan lo lang, can giai thich ky truoc khi lam",
  "followUpDate": "2025-12-08",
  "vitalSigns": {
    "bloodPressure": "110/70",
    "pulse": 80,
    "temperature": 36.5,
    "weight": 55
  }
}
```

---

## Response

### Success Response (201 Created)

```json
{
  "statusCode": 201,
  "message": "Clinical record created successfully",
  "data": {
    "clinicalRecordId": 1,
    "appointmentId": 1,
    "createdAt": "2025-12-01 10:05:00"
  }
}
```

### Response Fields

| Field              | Type    | Description                                                 |
| ------------------ | ------- | ----------------------------------------------------------- |
| `clinicalRecordId` | Integer | Generated record ID (use for upload images, add procedures) |
| `appointmentId`    | Integer | Associated appointment ID                                   |
| `createdAt`        | String  | Creation timestamp (yyyy-MM-dd HH:mm:ss)                    |

---

## Error Responses

### 409 Conflict - Record Already Exists

**Scenario**: Trying to create record for appointment that already has one

```json
{
  "statusCode": 409,
  "error": "RECORD_ALREADY_EXISTS",
  "message": "Clinical record already exists for appointment ID 1. Please use PUT to update."
}
```

**Frontend Action**: Redirect to UPDATE form or GET existing record

---

### 400 Bad Request - Invalid Appointment Status

**Scenario**: Appointment not checked in yet

```json
{
  "statusCode": 400,
  "error": "INVALID_STATUS",
  "message": "Cannot create clinical record. Appointment must be IN_PROGRESS or CHECKED_IN. Current status: SCHEDULED"
}
```

**Frontend Action**: Show "Patient must check-in first" message

---

### 400 Bad Request - Missing Required Fields

**Scenario**: Missing chiefComplaint, examinationFindings, or diagnosis

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Chief complaint is required"
}
```

---

### 404 Not Found - Appointment Not Found

**Scenario**: Invalid appointmentId

```json
{
  "statusCode": 404,
  "error": "APPOINTMENT_NOT_FOUND",
  "message": "Appointment not found with ID: 999"
}
```

---

### 403 Forbidden - No Permission

**Scenario**: User doesn't have WRITE_CLINICAL_RECORD permission

```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Access Denied"
}
```

---

## Test Scenarios

### Test Case 1: Create Clinical Record Successfully

**Given**:

- User has `WRITE_CLINICAL_RECORD` permission
- Appointment ID 1 exists with status `IN_PROGRESS`
- No existing clinical record for appointment 1

**Request**:

```bash
curl -X POST http://localhost:8080/api/v1/clinical-records \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "chiefComplaint": "Dau rang",
    "examinationFindings": "Nuou sung do",
    "diagnosis": "Viem tuy",
    "treatmentNotes": "Can dieu tri tuy",
    "vitalSigns": {"bp": "120/80"}
  }'
```

**Expected**: 201 CREATED with `clinicalRecordId`

---

### Test Case 2: Duplicate Record (409)

**Given**: Clinical record already exists for appointment 1

**Request**: Same as Test Case 1

**Expected**: 409 CONFLICT with error `RECORD_ALREADY_EXISTS`

---

### Test Case 3: Invalid Appointment Status (400)

**Given**: Appointment 5 has status `SCHEDULED` (not checked in)

**Request**:

```bash
curl -X POST http://localhost:8080/api/v1/clinical-records \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 5,
    "chiefComplaint": "Dau rang",
    "examinationFindings": "Nuou sung do",
    "diagnosis": "Viem tuy"
  }'
```

**Expected**: 400 BAD_REQUEST with error `INVALID_STATUS`

---

### Test Case 4: Missing Required Fields (400)

**Given**: Request missing `chiefComplaint`

**Request**:

```bash
curl -X POST http://localhost:8080/api/v1/clinical-records \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 4,
    "examinationFindings": "Nuou sung do",
    "diagnosis": "Viem tuy"
  }'
```

**Expected**: 400 BAD_REQUEST with validation error

---

### Test Case 5: Appointment Not Found (404)

**Given**: Appointment ID 9999 doesn't exist

**Request**:

```bash
curl -X POST http://localhost:8080/api/v1/clinical-records \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 9999,
    "chiefComplaint": "Dau rang",
    "examinationFindings": "Nuou sung do",
    "diagnosis": "Viem tuy"
  }'
```

**Expected**: 404 NOT_FOUND with error `APPOINTMENT_NOT_FOUND`

---

### Test Case 6: No Permission (403)

**Given**: User is ROLE_PATIENT (no WRITE_CLINICAL_RECORD)

**Request**: Same as Test Case 1 but with PATIENT token

**Expected**: 403 FORBIDDEN

---

## Implementation Notes

### Permission Requirements

- `WRITE_CLINICAL_RECORD` assigned to:
  - `ROLE_DENTIST`
  - `ROLE_ADMIN`
- NOT assigned to:
  - `ROLE_NURSE`
  - `ROLE_RECEPTIONIST`
  - `ROLE_PATIENT`

### Related APIs

- **API 8.1**: GET clinical record (check if exists before creating)
- **API 9.3**: UPDATE clinical record (use this for existing records)
- **Future**: Upload X-ray images, Add procedures, Add prescriptions

### Database Impact

- Inserts 1 row into `clinical_records` table
- No cascade inserts (procedures and prescriptions added separately)

---

## Seed Data for Testing

### Available Test Appointments

| Appointment ID | Status      | Has Clinical Record | Test Scenario             |
| -------------- | ----------- | ------------------- | ------------------------- |
| 1              | IN_PROGRESS | Yes                 | Duplicate test (409)      |
| 2              | IN_PROGRESS | Yes                 | Duplicate test (409)      |
| 3              | IN_PROGRESS | Yes                 | Duplicate test (409)      |
| 4              | IN_PROGRESS | No                  | Success test (201)        |
| 5              | SCHEDULED   | No                  | Invalid status test (400) |

### Test Credentials

```bash
# Doctor (has WRITE_CLINICAL_RECORD)
Username: bacsi1
Password: 123456
Token: {Use API 1.1 to get token}

# Admin (has WRITE_CLINICAL_RECORD)
Username: admin
Password: 123456

# Patient (NO permission)
Username: benhnhan1
Password: 123456
```

---

## Changelog

| Version | Date       | Changes                   |
| ------- | ---------- | ------------------------- |
| 1.0     | 2025-12-01 | Initial API specification |
