# API 8.14: Get Prescription for Clinical Record

## Overview

Retrieve the prescription details for a specific clinical record. This API is used to display existing prescriptions for doctors to review, edit, or print for patients.

## Endpoint

```
GET /api/v1/appointments/clinical-records/{recordId}/prescription
```

## Authorization

Required Permissions (OR logic):

- `ROLE_ADMIN` - Full access to all prescriptions
- `VIEW_APPOINTMENT_ALL` - View all prescriptions (Receptionist, Manager)
- `VIEW_APPOINTMENT_OWN` - View only related prescriptions (Doctor, Patient, Observer)

### RBAC Rules

1. **Admin**: Can access all prescriptions
2. **VIEW_APPOINTMENT_ALL** (Receptionist/Manager): Can access all prescriptions
3. **VIEW_APPOINTMENT_OWN**:
   - **Doctor**: Can only view prescriptions for appointments where they are the primary doctor or participant
   - **Patient**: Can only view prescriptions for their own appointments
   - **Observer/Nurse**: Can view prescriptions for appointments where they are participants

## Request

### Path Parameters

| Parameter | Type    | Required | Description        |
| --------- | ------- | -------- | ------------------ |
| recordId  | Integer | Yes      | Clinical record ID |

### Request Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

### Example Request

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer {{doctor_token}}"
```

## Response

### Success Response (200 OK)

**Scenario: Prescription with items from warehouse**

```json
{
  "code": 1000,
  "message": "Prescription retrieved successfully",
  "result": {
    "prescriptionId": 1,
    "clinicalRecordId": 1,
    "prescriptionNotes": "Kieng an do qua cung, qua nong. Uong thuoc sau khi an no.",
    "createdAt": "2025-11-04 10:00:00",
    "items": [
      {
        "prescriptionItemId": 1,
        "itemMasterId": 201,
        "itemCode": "MED-AMOX-500",
        "itemName": "Amoxicillin 500mg",
        "unitName": "Vien",
        "quantity": 15,
        "dosageInstructions": "Sang 1 vien, Chieu 1 vien, Toi 1 vien (5 ngay)"
      },
      {
        "prescriptionItemId": 2,
        "itemMasterId": 205,
        "itemCode": "MED-PARA-500",
        "itemName": "Paracetamol 500mg",
        "unitName": "Vien",
        "quantity": 6,
        "dosageInstructions": "Uong 1 vien khi dau qua suc chiu dung, cach nhau toi thieu 4h (3 ngay)"
      }
    ]
  }
}
```

**Scenario: Prescription with item NOT in warehouse**

```json
{
  "code": 1000,
  "message": "Prescription retrieved successfully",
  "result": {
    "prescriptionId": 2,
    "clinicalRecordId": 2,
    "prescriptionNotes": "Uong thuoc theo chi dan tren bao bi",
    "createdAt": "2025-11-05 14:30:00",
    "items": [
      {
        "prescriptionItemId": 3,
        "itemMasterId": null,
        "itemCode": null,
        "itemName": "Thuoc bo XYZ (tu mua ngoai)",
        "unitName": null,
        "quantity": 1,
        "dosageInstructions": "Uong theo huong dan tren bao bi"
      }
    ]
  }
}
```

### Error Responses

#### 404 - Prescription Not Found (No prescription created yet)

**Important**: This error means the clinical record exists but no prescription has been created yet. Frontend should display a "Create Prescription" button.

```json
{
  "statusCode": 404,
  "error": "PRESCRIPTION_NOT_FOUND",
  "message": "No prescription found for clinical record ID 1"
}
```

#### 404 - Clinical Record Not Found

```json
{
  "statusCode": 404,
  "error": "RECORD_NOT_FOUND",
  "message": "Clinical record not found with ID: 9999"
}
```

#### 403 - Forbidden (No permission to view)

```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "You do not have permission to view clinical records"
}
```

#### 401 - Unauthorized

```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Full authentication is required to access this resource"
}
```

## Response Fields

### PrescriptionDTO

| Field             | Type                      | Description                                |
| ----------------- | ------------------------- | ------------------------------------------ |
| prescriptionId    | Integer                   | Prescription ID                            |
| clinicalRecordId  | Integer                   | Clinical record ID                         |
| prescriptionNotes | String                    | General notes (e.g., dietary restrictions) |
| createdAt         | String                    | Creation timestamp (yyyy-MM-dd HH:mm:ss)   |
| items             | List<PrescriptionItemDTO> | List of prescribed medications             |

### PrescriptionItemDTO

| Field              | Type    | Description                                               |
| ------------------ | ------- | --------------------------------------------------------- |
| prescriptionItemId | Integer | Prescription item ID                                      |
| itemMasterId       | Integer | Item master ID (NULL if not in warehouse)                 |
| itemCode           | String  | Item code from warehouse (NULL if not in warehouse)       |
| itemName           | String  | Medication name (always present)                          |
| unitName           | String  | Unit name from warehouse (NULL if not in warehouse)       |
| quantity           | Integer | Quantity prescribed                                       |
| dosageInstructions | String  | Dosage instructions (e.g., "Take 1 tablet 3 times daily") |

## Business Rules

1. **Prescription Existence**:

   - If `404 PRESCRIPTION_NOT_FOUND`: Clinical record exists but prescription not created yet
   - Frontend should show "Create Prescription" button
   - If `404 RECORD_NOT_FOUND`: Clinical record ID is invalid

2. **Warehouse Integration**:

   - If `itemMasterId` is NOT NULL: Medication is in inventory
     - `itemCode`, `unitName` populated from warehouse
   - If `itemMasterId` is NULL: Medication NOT in inventory
     - `itemCode`, `unitName` will be NULL
     - `itemName` is manually entered by doctor

3. **RBAC**:

   - Reuses same authorization logic as API 8.1 (Get Clinical Record)
   - Doctor can only view prescriptions for their own appointments
   - Patient can only view prescriptions for their own appointments
   - Admin and VIEW_APPOINTMENT_ALL can view all prescriptions

4. **Data Relationships**:
   - `clinical_prescriptions` 1-to-1 with `clinical_records`
   - `clinical_prescription_items` Many-to-1 with `clinical_prescriptions`
   - `clinical_prescription_items` Many-to-1 (optional) with `item_masters`

## Test Scenarios

### Scenario 1: Doctor Views Own Prescription

**Setup**:

- Clinical record ID 1 belongs to appointment of doctor bacsi1
- Prescription exists with 2 items

**Steps**:

1. Login as doctor bacsi1
2. GET `/api/v1/appointments/clinical-records/1/prescription`

**Expected Result**:

- Status: 200 OK
- Response contains prescriptionId, clinicalRecordId, prescriptionNotes, createdAt
- Items array contains 2 medication items with warehouse data

**Test Command**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"123456"}' 2>/dev/null | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null
```

---

### Scenario 2: Patient Views Own Prescription

**Setup**:

- Clinical record ID 1 belongs to patient benhnhan1
- Prescription exists with items

**Steps**:

1. Login as patient benhnhan1
2. GET `/api/v1/appointments/clinical-records/1/prescription`

**Expected Result**:

- Status: 200 OK
- Response contains full prescription details
- Patient can see medications prescribed for their own appointment

**Test Command**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"benhnhan1","password":"123456"}' 2>/dev/null | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null
```

---

### Scenario 3: Admin Views Any Prescription

**Setup**:

- Clinical record ID 2 exists with prescription
- Admin should have full access

**Steps**:

1. Login as admin
2. GET `/api/v1/appointments/clinical-records/2/prescription`

**Expected Result**:

- Status: 200 OK
- Response contains full prescription details
- Admin can view any prescription regardless of ownership

**Test Command**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' 2>/dev/null | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/appointments/clinical-records/2/prescription" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null
```

---

### Scenario 4: No Prescription Created Yet (404)

**Setup**:

- Clinical record ID 3 exists
- No prescription has been created for this record

**Steps**:

1. Login as doctor
2. GET `/api/v1/appointments/clinical-records/3/prescription`

**Expected Result**:

- Status: 404 NOT FOUND
- Error code: PRESCRIPTION_NOT_FOUND
- Message: "No prescription found for clinical record ID 3"

**Test Command**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"123456"}' 2>/dev/null | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/appointments/clinical-records/3/prescription" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null
```

---

### Scenario 5: Clinical Record Not Found (404)

**Setup**:

- Clinical record ID 99999 does not exist

**Steps**:

1. Login as doctor
2. GET `/api/v1/appointments/clinical-records/99999/prescription`

**Expected Result**:

- Status: 404 NOT FOUND
- Error code: RECORD_NOT_FOUND
- Message: "Clinical record not found with ID: 99999"

**Test Command**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"123456"}' 2>/dev/null | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/appointments/clinical-records/99999/prescription" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null
```

---

### Scenario 6: Doctor Tries to View Other Doctor's Prescription (403)

**Setup**:

- Clinical record ID 2 belongs to doctor bacsi2
- Login as doctor bacsi1 (different doctor)

**Steps**:

1. Login as doctor bacsi1
2. GET `/api/v1/appointments/clinical-records/2/prescription`

**Expected Result**:

- Status: 403 FORBIDDEN
- Error code: FORBIDDEN
- Message: "You do not have permission to view clinical records"

**Test Command**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"123456"}' 2>/dev/null | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/appointments/clinical-records/2/prescription" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null
```

---

### Scenario 7: Patient Tries to View Other Patient's Prescription (403)

**Setup**:

- Clinical record ID 2 belongs to patient benhnhan2
- Login as patient benhnhan1 (different patient)

**Steps**:

1. Login as patient benhnhan1
2. GET `/api/v1/appointments/clinical-records/2/prescription`

**Expected Result**:

- Status: 403 FORBIDDEN
- Error code: FORBIDDEN
- Message: "You can only view clinical records for your own appointments"

**Test Command**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"benhnhan1","password":"123456"}' 2>/dev/null | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/appointments/clinical-records/2/prescription" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null
```

---

## Database Schema Reference

### clinical_prescriptions

```sql
CREATE TABLE clinical_prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    clinical_record_id INTEGER NOT NULL REFERENCES clinical_records(clinical_record_id) ON DELETE CASCADE,
    prescription_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### clinical_prescription_items

```sql
CREATE TABLE clinical_prescription_items (
    prescription_item_id SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES clinical_prescriptions(prescription_id) ON DELETE CASCADE,
    item_master_id INTEGER REFERENCES item_masters(item_master_id),
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    dosage_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Related APIs

- **API 8.1**: Get Clinical Record (includes prescription summary)
- **API 8.2**: Create Clinical Record (may create prescription)
- **API 8.3**: Update Clinical Record (may update prescription)
- **API 6.x**: Warehouse APIs (item_masters for medication lookup)

## Notes

1. **Prescription vs Clinical Record**:

   - Clinical record can exist without prescription (patient didn't need medication)
   - 404 PRESCRIPTION_NOT_FOUND is NOT an error, it's a valid state

2. **Warehouse Integration**:

   - If medication is in warehouse: `itemMasterId`, `itemCode`, `unitName` populated
   - If medication NOT in warehouse: Doctor manually enters `itemName`, other fields NULL

3. **Frontend Handling**:

   - On 404 PRESCRIPTION_NOT_FOUND: Show "Create Prescription" button
   - On 404 RECORD_NOT_FOUND: Show error "Invalid clinical record"
   - On 403: Show "You don't have permission to view this prescription"

4. **Performance**:
   - Uses LAZY loading for prescription items (loaded only when accessed)
   - JOIN with warehouse tables only if `item_master_id` is NOT NULL
   - Indexed on `clinical_record_id` for fast lookup

---

**Last Updated**: 2025-12-02
**API Version**: 1.0
**Status**: Production Ready
