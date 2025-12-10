# API 8.9: Get Patient Tooth Status (Odontogram)

## Overview

Retrieve all abnormal tooth conditions for a patient to display in the Odontogram (dental chart). Only teeth with recorded conditions are returned - teeth not in the response are considered HEALTHY.

This API is designed for visualizing the patient's dental chart, showing which teeth have conditions such as caries, fillings, crowns, implants, etc.

## Endpoint

```
GET /api/v1/patients/{patientId}/tooth-status
```

## Authorization

Required Permissions (OR logic):

- `ROLE_ADMIN` - Full access to all patient records
- `VIEW_PATIENT` - View patient tooth status (Doctor, Nurse, Receptionist)

### RBAC Rules

1. **Admin**: Can access all patient tooth status records
2. **VIEW_PATIENT** (Doctor/Nurse/Receptionist): Can view tooth status for any patient
3. **Dentist**: Can view tooth status for patients they are treating

## Request

### Path Parameters

| Parameter | Type    | Required | Description    |
| --------- | ------- | -------- | -------------- |
| patientId | Integer | Yes      | The patient ID |

### Example Requests

```bash
# As Doctor - View patient tooth status
curl -X GET "http://localhost:8080/api/v1/patients/1/tooth-status" \
  -H "Authorization: Bearer {{doctor_token}}"

# As Admin - View patient tooth status
curl -X GET "http://localhost:8080/api/v1/patients/1/tooth-status" \
  -H "Authorization: Bearer {{admin_token}}"
```

## Response

### Success Response (200 OK)

```json
[
  {
    "toothStatusId": 1,
    "patientId": 1,
    "toothNumber": "18",
    "status": "MISSING",
    "notes": "Rang khon da nhổ năm 2023",
    "recordedAt": "2025-12-02T03:17:35",
    "updatedAt": "2025-12-02T03:18:28"
  },
  {
    "toothStatusId": 2,
    "patientId": 1,
    "toothNumber": "36",
    "status": "CROWN",
    "notes": "Boc su kim loai",
    "recordedAt": "2025-12-02T03:17:35",
    "updatedAt": null
  },
  {
    "toothStatusId": 3,
    "patientId": 1,
    "toothNumber": "46",
    "status": "CARIES",
    "notes": "Sau rang sau, can dieu tri",
    "recordedAt": "2025-12-02T03:17:35",
    "updatedAt": null
  },
  {
    "toothStatusId": 4,
    "patientId": 1,
    "toothNumber": "21",
    "status": "IMPLANT",
    "notes": "Cay ghep Implant thanh cong",
    "recordedAt": "2025-12-02T03:17:35",
    "updatedAt": null
  }
]
```

### Response Fields

| Field         | Type     | Description                                    |
| ------------- | -------- | ---------------------------------------------- |
| toothStatusId | Integer  | Unique ID of the tooth status record           |
| patientId     | Integer  | Patient ID                                     |
| toothNumber   | String   | Tooth number (FDI notation: 11-18, 21-28, etc) |
| status        | Enum     | Tooth condition (see Tooth Condition Enum)     |
| notes         | String   | Additional notes about the condition           |
| recordedAt    | DateTime | When the condition was first recorded          |
| updatedAt     | DateTime | When the condition was last updated (nullable) |

### Tooth Condition Enum

| Value      | Description                       |
| ---------- | --------------------------------- |
| HEALTHY    | Rang khoe manh (default)          |
| CARIES     | Sau rang (cavity)                 |
| FILLED     | Da tram rang                      |
| CROWN      | Boc rang su (crowned)             |
| MISSING    | Mat rang / Da nhổ                 |
| IMPLANT    | Cay ghep Implant                  |
| ROOT_CANAL | Dieu tri tuy rang                 |
| FRACTURED  | Rang bi gay                       |
| IMPACTED   | Rang khon moc lech (wisdom tooth) |

### Error Responses

#### 400 Bad Request - Patient Not Found

```json
{
  "statusCode": 400,
  "error": "error.bad_request",
  "message": "Patient not found with ID: 999",
  "data": null
}
```

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "error": "error.unauthorized",
  "message": "Full authentication is required to access this resource",
  "data": null
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "error": "error.access_denied",
  "message": "Access is denied",
  "data": null
}
```

## Test Scenarios

### Scenario 1: Get Tooth Status for Patient with Multiple Conditions

**Setup:**

- Patient ID: 1
- Has 4 teeth with abnormal conditions

**Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/patients/1/tooth-status" \
  -H "Authorization: Bearer {{doctor_token}}"
```

**Expected Result:**

- Status Code: 200 OK
- Response contains 4 tooth status records
- Tooth 18: MISSING
- Tooth 36: CROWN
- Tooth 46: CARIES
- Tooth 21: IMPLANT

### Scenario 2: Get Tooth Status for Patient with One Condition

**Setup:**

- Patient ID: 2
- Has 1 tooth with filled condition

**Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/patients/2/tooth-status" \
  -H "Authorization: Bearer {{doctor_token}}"
```

**Expected Result:**

- Status Code: 200 OK
- Response contains 1 tooth status record
- Tooth 36: FILLED

### Scenario 3: Get Tooth Status for Non-Existent Patient

**Setup:**

- Patient ID: 999 (does not exist)

**Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/patients/999/tooth-status" \
  -H "Authorization: Bearer {{doctor_token}}"
```

**Expected Result:**

- Status Code: 400 Bad Request
- Error message: "Patient not found with ID: 999"

### Scenario 4: Access Without Authentication

**Setup:**

- No authentication token provided

**Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/patients/1/tooth-status"
```

**Expected Result:**

- Status Code: 401 Unauthorized
- Error message: "Full authentication is required to access this resource"

### Scenario 5: Access Without VIEW_PATIENT Permission

**Setup:**

- User without VIEW_PATIENT permission

**Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/patients/1/tooth-status" \
  -H "Authorization: Bearer {{limited_user_token}}"
```

**Expected Result:**

- Status Code: 403 Forbidden
- Error message: "Access is denied"

## Integration with Odontogram

### FDI Tooth Numbering System

This API uses the FDI (Federation Dentaire Internationale) two-digit notation:

**Adult Teeth (Permanent Dentition):**

- Upper Right: 11-18
- Upper Left: 21-28
- Lower Left: 31-38
- Lower Right: 41-48

**Example Mapping:**

- 11 = Upper right central incisor
- 18 = Upper right wisdom tooth
- 21 = Upper left central incisor
- 36 = Lower left first molar
- 46 = Lower right first molar

### Frontend Implementation Notes

1. **Missing Teeth = HEALTHY**: If a tooth number is not in the response, consider it HEALTHY
2. **Visual Representation**: Map each status to appropriate colors/icons:

   - HEALTHY: Green or no marking
   - CARIES: Red (needs treatment)
   - FILLED: Blue (already treated)
   - CROWN: Purple (prosthetic)
   - MISSING: Gray/crossed out
   - IMPLANT: Orange (prosthetic)
   - ROOT_CANAL: Yellow (treated)
   - FRACTURED: Dark red (urgent)
   - IMPACTED: Brown (may need extraction)

3. **Interactive Odontogram**: Click on tooth to view details or update status (see API 8.10)

## Business Rules

1. **Default State**: All teeth are assumed HEALTHY unless explicitly recorded
2. **Read-Only**: This API only retrieves data. Use API 8.10 to update tooth status
3. **History Tracking**: All status changes are tracked in history table (see patient_tooth_status_history)
4. **Patient Verification**: Patient must exist in the system
5. **Authorization**: Only users with VIEW_PATIENT permission can access this data

## Database Schema

### patient_tooth_status Table

```sql
CREATE TABLE patient_tooth_status (
    tooth_status_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id),
    tooth_number VARCHAR(10) NOT NULL,
    status tooth_condition_enum NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    UNIQUE(patient_id, tooth_number)
);
```

### tooth_condition_enum Type

```sql
CREATE TYPE tooth_condition_enum AS ENUM (
    'HEALTHY',
    'CARIES',
    'FILLED',
    'CROWN',
    'MISSING',
    'IMPLANT',
    'ROOT_CANAL',
    'FRACTURED',
    'IMPACTED'
);
```

## Related APIs

- **API 8.10**: Update Tooth Status - Create or update tooth condition with history tracking
- **API 8.1**: Get Clinical Record - View appointment details including dental procedures
- **API 9.1**: Create Treatment Plan - Plan future dental treatments based on tooth conditions

## Notes

- This API is specifically designed for the Odontogram feature
- Only abnormal teeth are returned to minimize data transfer
- All teeth not in response should be displayed as HEALTHY
- updatedAt is null if the tooth status has never been updated (only initial record exists)
- Use API 8.10 to create or update tooth statuses
