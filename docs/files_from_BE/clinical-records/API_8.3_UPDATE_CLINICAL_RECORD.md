# API 9.3: Update Clinical Record

## Overview

Updates an existing clinical record. This API supports partial updates - only send fields that need to be changed.

**Endpoint**: `PUT /api/v1/clinical-records/{recordId}`

**Authorization**: Requires `WRITE_CLINICAL_RECORD` permission (Doctor, Admin)

**Module**: Clinical Records Management (Module 9)

---

## Business Rules

### Update Behavior

- **Partial Update**: Only provided fields are updated
- **Null/Missing Fields**: Ignored (original values retained)
- **Immutable Fields**: Cannot update `appointmentId`, `chiefComplaint`, `diagnosis`
- **Updatable Fields**: `examinationFindings`, `treatmentNotes`, `vitalSigns`, `followUpDate`

### Validation Rules

1. **Record ID**: Must exist in database
2. **Field Validations**:
   - `examinationFindings`: max 2000 characters
   - `treatmentNotes`: max 2000 characters
   - `followUpDate`: Date format yyyy-MM-dd
   - `vitalSigns`: Free-form JSONB object

### Data Processing

- Auto-update `updated_at` timestamp via @PreUpdate
- Return updated values for confirmation
- No cascading updates (procedures/prescriptions updated separately)

---

## Request

### Headers

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Path Parameters

| Parameter  | Type    | Required | Description                                |
| ---------- | ------- | -------- | ------------------------------------------ |
| `recordId` | Integer | Yes      | Clinical record ID (from API 9.2 response) |

### Body Parameters

| Field                 | Type   | Required | Description                     | Validation         |
| --------------------- | ------ | -------- | ------------------------------- | ------------------ |
| `examinationFindings` | String | No       | Updated examination results     | Max 2000 chars     |
| `treatmentNotes`      | String | No       | Updated treatment notes         | Max 2000 chars     |
| `followUpDate`        | String | No       | Updated follow-up date          | Format: yyyy-MM-dd |
| `vitalSigns`          | Object | No       | Updated vital signs (free-form) | JSONB object       |

### Example Request - Update All Fields

```json
{
  "examinationFindings": "Nuou sung do vung rang 36, co tui nha chu 5mm, tang tu 3mm",
  "treatmentNotes": "Benh nhan co tien trien tot sau 3 ngay dung thuoc, giam dau. Tiep tuc dieu tri tuy.",
  "followUpDate": "2025-12-10",
  "vitalSigns": {
    "bloodPressure": "115/75",
    "pulse": 78,
    "temperature": 36.6,
    "weight": 55
  }
}
```

### Example Request - Partial Update (Treatment Notes Only)

```json
{
  "treatmentNotes": "Benh nhan yeu cau lam ca toi nay, da dong y lam ngoai gio"
}
```

---

## Response

### Success Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Clinical record updated successfully",
  "data": {
    "clinicalRecordId": 1,
    "updatedAt": "2025-12-01 15:30:00",
    "examinationFindings": "Nuou sung do vung rang 36, co tui nha chu 5mm, tang tu 3mm",
    "treatmentNotes": "Benh nhan co tien trien tot sau 3 ngay dung thuoc",
    "followUpDate": "2025-12-10"
  }
}
```

### Response Fields

| Field                 | Type    | Description                            |
| --------------------- | ------- | -------------------------------------- |
| `clinicalRecordId`    | Integer | Updated record ID                      |
| `updatedAt`           | String  | Update timestamp (yyyy-MM-dd HH:mm:ss) |
| `examinationFindings` | String  | Updated value (if provided)            |
| `treatmentNotes`      | String  | Updated value (if provided)            |
| `followUpDate`        | String  | Updated value (if provided)            |

**Note**: Response only includes fields that were updated

---

## Error Responses

### 404 Not Found - Record Not Found

**Scenario**: Invalid recordId

```json
{
  "statusCode": 404,
  "error": "RECORD_NOT_FOUND",
  "message": "Clinical record not found with ID: 999"
}
```

**Frontend Action**: Show "Record not found" message, redirect to list

---

### 400 Bad Request - Validation Error

**Scenario**: Field exceeds max length

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Examination findings must not exceed 2000 characters"
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

### Test Case 1: Update All Fields Successfully

**Given**:

- User has `WRITE_CLINICAL_RECORD` permission
- Clinical record ID 1 exists

**Request**:

```bash
curl -X PUT http://localhost:8080/api/v1/clinical-records/1 \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "examinationFindings": "Tien trien tot, sung giam",
    "treatmentNotes": "Tiep tuc dieu tri",
    "followUpDate": "2025-12-15",
    "vitalSigns": {"bp": "120/80"}
  }'
```

**Expected**: 200 OK with all updated fields in response

---

### Test Case 2: Partial Update (Treatment Notes Only)

**Given**: Clinical record ID 1 exists

**Request**:

```bash
curl -X PUT http://localhost:8080/api/v1/clinical-records/1 \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "treatmentNotes": "Bo sung: Benh nhan co di ung Amoxicilin"
  }'
```

**Expected**: 200 OK, only `treatmentNotes` updated, other fields unchanged

---

### Test Case 3: Update Vital Signs Only

**Given**: Clinical record ID 2 exists

**Request**:

```bash
curl -X PUT http://localhost:8080/api/v1/clinical-records/2 \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "vitalSigns": {
      "bloodPressure": "130/85",
      "pulse": 85,
      "temperature": 37.0,
      "note": "Benh nhan hoi hoi huyet ap cao"
    }
  }'
```

**Expected**: 200 OK with updated vitalSigns

---

### Test Case 4: Record Not Found (404)

**Given**: Clinical record ID 9999 doesn't exist

**Request**:

```bash
curl -X PUT http://localhost:8080/api/v1/clinical-records/9999 \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "treatmentNotes": "Update"
  }'
```

**Expected**: 404 NOT_FOUND with error `RECORD_NOT_FOUND`

---

### Test Case 5: Validation Error - Field Too Long (400)

**Given**: examinationFindings exceeds 2000 characters

**Request**:

```bash
curl -X PUT http://localhost:8080/api/v1/clinical-records/1 \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "examinationFindings": "{2001_CHARACTER_STRING}"
  }'
```

**Expected**: 400 BAD_REQUEST with validation error

---

### Test Case 6: No Permission (403)

**Given**: User is ROLE_PATIENT (no WRITE_CLINICAL_RECORD)

**Request**: Same as Test Case 1 but with PATIENT token

**Expected**: 403 FORBIDDEN

---

### Test Case 7: Empty Request Body

**Given**: Request body is `{}`

**Request**:

```bash
curl -X PUT http://localhost:8080/api/v1/clinical-records/1 \
  -H "Authorization: Bearer {DOCTOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: 200 OK, no fields updated (all original values retained)

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

### Immutable Fields

These fields CANNOT be updated via this API:

- `appointmentId` - Record is permanently linked to original appointment
- `chiefComplaint` - Initial patient complaint should not change
- `diagnosis` - Diagnosis should not change (create new record if needed)
- `createdAt` - System-generated timestamp
- `updated_at` - Auto-updated by @PreUpdate

**Rationale**: Chief complaint and diagnosis are historical records. If they need to change, it indicates a new appointment/visit.

### Related APIs

- **API 8.1**: GET clinical record (retrieve before updating)
- **API 9.2**: CREATE clinical record (use for new appointments)
- **Future**: API 9.4 Add Procedures, API 9.5 Add Prescriptions

### Database Impact

- Updates 1 row in `clinical_records` table
- No cascade updates to related tables
- Auto-updates `updated_at` column via Hibernate @PreUpdate

---

## Comparison: CREATE vs UPDATE

| Aspect                 | API 9.2 (CREATE)                                              | API 9.3 (UPDATE)                                              |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| **Method**             | POST                                                          | PUT                                                           |
| **Endpoint**           | /api/v1/clinical-records                                      | /api/v1/clinical-records/{id}                                 |
| **Required Fields**    | appointmentId, chiefComplaint, examinationFindings, diagnosis | None (all optional)                                           |
| **Updatable Fields**   | All fields                                                    | examinationFindings, treatmentNotes, followUpDate, vitalSigns |
| **Duplicate Handling** | 409 CONFLICT if exists                                        | Overwrites existing values                                    |
| **Status Check**       | Must be IN_PROGRESS/CHECKED_IN                                | No status check                                               |
| **Response Code**      | 201 CREATED                                                   | 200 OK                                                        |

---

## Seed Data for Testing

### Available Test Records

| Record ID | Appointment ID | Has Data | Test Scenario        |
| --------- | -------------- | -------- | -------------------- |
| 1         | 1              | Yes      | Update success (200) |
| 2         | 2              | Yes      | Update success (200) |
| 3         | 3              | Yes      | Update success (200) |
| 999       | N/A            | No       | Not found test (404) |

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

## Frontend Integration Guide

### Workflow: Edit Clinical Record

```javascript
// Step 1: GET existing record (API 8.1)
GET /api/v1/clinical-records/appointment/1

// Step 2: Display form with current values
// User edits examinationFindings and treatmentNotes

// Step 3: PUT only changed fields (API 9.3)
PUT /api/v1/clinical-records/1
{
  "examinationFindings": "Updated findings",
  "treatmentNotes": "Updated notes"
  // Don't send unchanged fields
}

// Step 4: Handle response
if (200 OK) {
  // Show success message with updatedAt timestamp
  // Refresh record display
} else if (404) {
  // Redirect to list
} else if (403) {
  // Show "No permission" message
}
```

### Best Practices

1. **Pre-fetch**: Always GET record before showing edit form
2. **Partial Update**: Only send fields user changed (better performance)
3. **Optimistic Lock**: Check `updatedAt` to detect concurrent edits
4. **Validation**: Show max length warnings (2000 chars for findings/notes)

---

## Changelog

| Version | Date       | Changes                   |
| ------- | ---------- | ------------------------- |
| 1.0     | 2025-12-01 | Initial API specification |
