# API 8.10: Update Patient Tooth Status

## Overview

Create or update a tooth status for a patient with automatic history tracking. Every status change is recorded in the audit trail (patient_tooth_status_history) for complete tracking of dental condition changes over time.

This API is used by dentists to record or update tooth conditions discovered during examinations or treatments.

## Endpoint

```
PUT /api/v1/patients/{patientId}/tooth-status/{toothNumber}
```

## Authorization

Required Permissions (OR logic):

- `ROLE_ADMIN` - Full access to all patient records
- `VIEW_PATIENT` - Update patient tooth status (Doctor, Nurse)
- `UPDATE_PATIENT` - Update patient information

### RBAC Rules

1. **Admin**: Can update any patient's tooth status
2. **VIEW_PATIENT** or **UPDATE_PATIENT** (Doctor/Nurse): Can update tooth status for any patient
3. **Dentist**: Can update tooth status during treatment appointments

## Request

### Path Parameters

| Parameter   | Type    | Required | Description                                    |
| ----------- | ------- | -------- | ---------------------------------------------- |
| patientId   | Integer | Yes      | The patient ID                                 |
| toothNumber | String  | Yes      | Tooth number (FDI notation: 11-18, 21-28, etc) |

### Request Body

```json
{
  "status": "IMPLANT",
  "notes": "Cay ghep Implant moi thay the rang da nhổ",
  "reason": "Thay the rang mat bang implant"
}
```

### Request Fields

| Field  | Type   | Required | Description                                    |
| ------ | ------ | -------- | ---------------------------------------------- |
| status | Enum   | Yes      | New tooth condition (see Tooth Condition Enum) |
| notes  | String | No       | Additional notes about the condition           |
| reason | String | No       | Reason for the status change (for history)     |

### Tooth Condition Enum

| Value      | Description                       |
| ---------- | --------------------------------- |
| HEALTHY    | Rang khoe manh                    |
| CARIES     | Sau rang (cavity)                 |
| FILLED     | Da tram rang                      |
| CROWN      | Boc rang su (crowned)             |
| MISSING    | Mat rang / Da nhổ                 |
| IMPLANT    | Cay ghep Implant                  |
| ROOT_CANAL | Dieu tri tuy rang                 |
| FRACTURED  | Rang bi gay                       |
| IMPACTED   | Rang khon moc lech (wisdom tooth) |

### Example Requests

```bash
# Update existing tooth status (tooth 18 from MISSING to IMPLANT)
curl -X PUT "http://localhost:8080/api/v1/patients/1/tooth-status/18" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IMPLANT",
    "notes": "Cay ghep Implant moi thay the rang da nhổ",
    "reason": "Thay the rang mat bang implant"
  }'

# Create new tooth status (tooth doesn't exist yet)
curl -X PUT "http://localhost:8080/api/v1/patients/1/tooth-status/15" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ROOT_CANAL",
    "notes": "Dieu tri tuy rang thanh cong",
    "reason": "Rang bi sau, can dieu tri tuy"
  }'
```

## Response

### Success Response (200 OK)

```json
{
  "toothStatusId": 1,
  "patientId": 1,
  "toothNumber": "18",
  "status": "IMPLANT",
  "notes": "Cay ghep Implant moi thay the rang da nhổ",
  "recordedAt": "2025-12-02T03:17:35",
  "updatedAt": "2025-12-02T03:18:28",
  "message": "Tooth status updated successfully"
}
```

### Response Fields

| Field         | Type     | Description                           |
| ------------- | -------- | ------------------------------------- |
| toothStatusId | Integer  | Unique ID of the tooth status record  |
| patientId     | Integer  | Patient ID                            |
| toothNumber   | String   | Tooth number (FDI notation)           |
| status        | Enum     | Current tooth condition               |
| notes         | String   | Additional notes about the condition  |
| recordedAt    | DateTime | When the condition was first recorded |
| updatedAt     | DateTime | When the condition was last updated   |
| message       | String   | Success message                       |

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

#### 400 Bad Request - Validation Error (Missing Required Field)

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "status: Status is required",
  "data": {
    "missingFields": ["status"]
  }
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

### Scenario 1: Update Existing Tooth Status

**Setup:**

- Patient ID: 1
- Tooth 18 exists with status MISSING
- Change to IMPLANT

**Request:**

```bash
curl -X PUT "http://localhost:8080/api/v1/patients/1/tooth-status/18" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IMPLANT",
    "notes": "Cay ghep Implant moi thay the rang da nhổ",
    "reason": "Thay the rang mat bang implant"
  }'
```

**Expected Result:**

- Status Code: 200 OK
- Response contains updated tooth status
- History record created with oldStatus=MISSING, newStatus=IMPLANT
- updatedAt timestamp is set

### Scenario 2: Create New Tooth Status

**Setup:**

- Patient ID: 1
- Tooth 15 does not exist yet
- Create with status ROOT_CANAL

**Request:**

```bash
curl -X PUT "http://localhost:8080/api/v1/patients/1/tooth-status/15" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ROOT_CANAL",
    "notes": "Dieu tri tuy rang thanh cong",
    "reason": "Rang bi sau, can dieu tri tuy"
  }'
```

**Expected Result:**

- Status Code: 200 OK
- New tooth status created
- History record created with oldStatus=null, newStatus=ROOT_CANAL
- Both recordedAt and updatedAt are set to current time

### Scenario 3: Update for Non-Existent Patient

**Setup:**

- Patient ID: 999 (does not exist)

**Request:**

```bash
curl -X PUT "http://localhost:8080/api/v1/patients/999/tooth-status/18" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IMPLANT",
    "notes": "Test",
    "reason": "Test"
  }'
```

**Expected Result:**

- Status Code: 400 Bad Request
- Error message: "Patient not found with ID: 999"
- No history record created

### Scenario 4: Update Without Required Status Field

**Setup:**

- Patient ID: 1
- Missing required field: status

**Request:**

```bash
curl -X PUT "http://localhost:8080/api/v1/patients/1/tooth-status/18" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Test only"
  }'
```

**Expected Result:**

- Status Code: 400 Bad Request
- Error message: "status: Status is required"
- No history record created

### Scenario 5: Access Without Authentication

**Setup:**

- No authentication token provided

**Request:**

```bash
curl -X PUT "http://localhost:8080/api/v1/patients/1/tooth-status/18" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IMPLANT",
    "notes": "Test",
    "reason": "Test"
  }'
```

**Expected Result:**

- Status Code: 401 Unauthorized
- Error message: "Full authentication is required to access this resource"

### Scenario 6: Verify History Tracking

**Setup:**

- After updating tooth 18 from MISSING to IMPLANT (Scenario 1)
- Query the history table directly

**Verification:**

```sql
SELECT * FROM patient_tooth_status_history
WHERE patient_id = 1 AND tooth_number = '18'
ORDER BY changed_at DESC
LIMIT 1;
```

**Expected Result:**

- History record exists
- old_status = 'MISSING'
- new_status = 'IMPLANT'
- changed_by = current employee ID
- changed_at = current timestamp
- reason = 'Thay the rang mat bang implant'

## History Tracking

### Automatic History Creation

Every time a tooth status is created or updated, a history record is automatically created in the `patient_tooth_status_history` table with the following information:

- **Old Status**: Previous condition (null for new records)
- **New Status**: Current condition
- **Changed By**: Employee ID of the user making the change
- **Changed At**: Timestamp of the change
- **Reason**: Optional reason for the change

### Querying History

To view the complete history of a tooth:

```sql
SELECT
  history_id,
  tooth_number,
  old_status,
  new_status,
  changed_at,
  reason,
  e.full_name as changed_by_name
FROM patient_tooth_status_history h
LEFT JOIN employees e ON h.changed_by = e.employee_id
WHERE h.patient_id = 1 AND h.tooth_number = '18'
ORDER BY h.changed_at DESC;
```

Example output:

```
history_id | tooth_number | old_status | new_status | changed_at          | reason                          | changed_by_name
-----------|--------------|------------|------------|---------------------|--------------------------------|----------------
5          | 18           | MISSING    | IMPLANT    | 2025-12-02 03:18:28 | Thay the rang mat bang implant | Lê Anh Khoa
1          | 18           | HEALTHY    | MISSING    | 2023-05-15 10:00:00 | Rang khon bi sung, can nhổ     | Lê Anh Khoa
```

## Business Rules

1. **Upsert Logic**: If tooth status exists, update it. If not, create new record
2. **Automatic History**: Every change creates a history record automatically
3. **Employee Tracking**: Changed_by field tracks who made the change (currently hardcoded to employee ID 1, will be replaced with SecurityUtils.getCurrentUser())
4. **Timestamp Management**: recordedAt is set on creation, updatedAt is set on every update
5. **Patient Verification**: Patient must exist before creating/updating tooth status
6. **Unique Constraint**: Only one status record per patient-tooth combination

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

### patient_tooth_status_history Table

```sql
CREATE TABLE patient_tooth_status_history (
    history_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id),
    tooth_number VARCHAR(10) NOT NULL,
    old_status tooth_condition_enum,
    new_status tooth_condition_enum NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES employees(employee_id),
    changed_at TIMESTAMP DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX idx_tooth_status_history_patient ON patient_tooth_status_history(patient_id, tooth_number);
CREATE INDEX idx_tooth_status_history_changed_by ON patient_tooth_status_history(changed_by);
```

## Integration Notes

### Frontend Implementation

1. **Odontogram Interface**: Click on a tooth to open edit dialog
2. **Status Selector**: Dropdown with all tooth condition enums
3. **Notes Field**: Free text for additional information
4. **Reason Field**: Free text explaining why the status changed
5. **Confirmation**: Show confirmation dialog before updating
6. **History View**: Button to view complete history of status changes

### Backend Implementation

1. **Service Layer**: PatientService.updateToothStatus()
2. **Automatic History**: Service creates history record on every update
3. **Employee ID**: Retrieved from security context (currently hardcoded)
4. **Transaction**: Update and history creation in single transaction
5. **Validation**: Jakarta validation on request DTO

## Related APIs

- **API 8.9**: Get Tooth Status - Retrieve current tooth conditions for Odontogram
- **API 8.1**: Get Clinical Record - View complete appointment details
- **API 9.1**: Create Treatment Plan - Plan treatments based on tooth conditions

## Future Enhancements

1. **Get History API**: Create dedicated endpoint to retrieve tooth status history
2. **Bulk Update**: Support updating multiple teeth in single request
3. **Image Attachments**: Allow attaching X-ray or photos to tooth status
4. **Treatment Linking**: Link tooth status to treatment plan items
5. **Audit Trail Export**: Export complete history for patient records

## Notes

- This is a PUT endpoint (idempotent) - repeated calls with same data won't create duplicate history records if status hasn't changed
- The `reason` field is optional but recommended for audit purposes
- History records are immutable - they can never be updated or deleted
- Employee ID (changed_by) is currently hardcoded to 1 in PatientController - will be replaced with SecurityUtils.getCurrentUser() in production
- Use API 8.9 to retrieve current tooth status after updating
