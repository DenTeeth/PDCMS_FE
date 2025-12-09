# API 8.16: Delete Prescription (Huy Don Thuoc)

**Version:** V1
**Date:** 2025-12-04
**Module:** Clinical Records (Benh An & Don Thuoc)

---

## Overview

API 8.16 allows deletion of an entire prescription and all prescription items for a clinical record. This operation is idempotent - if no prescription exists, it returns success.

**Future Enhancement:** When inventory integration is implemented, this API should restore inventory levels for items that were prescribed.

---

## API Specification

### Endpoint

```
DELETE /api/v1/appointments/clinical-records/{recordId}/prescription
```

### Method

`DELETE`

### Authorization

Required permissions:

- `ROLE_ADMIN`: Full access to all prescriptions
- `WRITE_CLINICAL_RECORD`: Doctors can delete prescriptions for their own appointments

### Path Parameters

| Parameter | Type    | Required | Description                      |
| --------- | ------- | -------- | -------------------------------- |
| recordId  | Integer | Yes      | Clinical record ID (primary key) |

### Request Headers

| Header        | Value            | Required | Description           |
| ------------- | ---------------- | -------- | --------------------- |
| Authorization | Bearer {token}   | Yes      | JWT access token      |
| Content-Type  | application/json | No       | Not needed for DELETE |

### Request Body

No request body required for DELETE operation.

---

## Response

### Success Response (204 No Content)

**HTTP Status:** `204 No Content`

**Response Body:** Empty (no content)

**Description:** Prescription and all items deleted successfully, or no prescription existed (idempotent).

---

## Business Logic

### Step-by-Step Process

**Step 1: Load Clinical Record**

- Query: `SELECT * FROM clinical_records WHERE clinical_record_id = {recordId}`
- If not found: Return `404 Not Found` with error code `RECORD_NOT_FOUND`

**Step 2: Check RBAC Authorization**

- Get appointment from clinical record
- Check if current user is:
  - `ROLE_ADMIN`: Allow
  - Doctor who created the appointment: Allow (via `checkAccessPermission()`)
  - Other users: Return `403 Forbidden` with error code `FORBIDDEN`

**Step 3: Find Prescription**

- Query: `SELECT * FROM clinical_prescriptions WHERE clinical_record_id = {recordId}`
- If not found: Log "No prescription found" and return success (idempotent)

**Step 4: Delete Prescription**

- Execute: `DELETE FROM clinical_prescriptions WHERE prescription_id = {prescriptionId}`
- CASCADE DELETE will automatically remove all items from `clinical_prescription_items`
- Log: Number of items deleted

**Step 5: Return Success**

- HTTP Status: `204 No Content`
- Empty response body

---

## Error Responses

### 404 Not Found - Clinical Record Not Found

```json
{
  "statusCode": 404,
  "error": "RECORD_NOT_FOUND",
  "message": "Clinical record not found with ID: {recordId}",
  "timestamp": "2025-12-04T10:30:00"
}
```

**Cause:** Clinical record with given ID does not exist.

---

### 403 Forbidden - Access Denied

```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Access denied: You can only modify clinical records from your own appointments",
  "timestamp": "2025-12-04T10:30:00"
}
```

**Cause:** User does not have permission to delete this prescription.

**Who Gets This Error:**

- Doctors trying to delete prescriptions from other doctors' appointments
- Nurses/Receptionists without `WRITE_CLINICAL_RECORD` permission

---

### 401 Unauthorized - Invalid Token

```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "JWT token is invalid or expired",
  "timestamp": "2025-12-04T10:30:00"
}
```

**Cause:** Missing or invalid JWT token in Authorization header.

---

## Database Schema

### Tables Affected

**1. clinical_prescriptions** (Parent table)

```sql
CREATE TABLE clinical_prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    clinical_record_id INTEGER REFERENCES clinical_records(clinical_record_id) ON DELETE CASCADE,
    prescription_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. clinical_prescription_items** (Child table - CASCADE DELETE)

```sql
CREATE TABLE clinical_prescription_items (
    prescription_item_id SERIAL PRIMARY KEY,
    prescription_id INTEGER REFERENCES clinical_prescriptions(prescription_id) ON DELETE CASCADE,
    item_master_id INTEGER REFERENCES item_masters(item_id),
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    dosage_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**CASCADE DELETE Behavior:**

- When prescription is deleted, all items are automatically deleted
- No orphaned records in `clinical_prescription_items`

---

## Testing Guide

### Prerequisites

1. **Database Setup:** Clinical record with prescription exists
2. **Test Account:** Login as Doctor with `WRITE_CLINICAL_RECORD` permission
3. **Test Data:**
   - Clinical Record ID: 1 (from seed data)
   - Appointment Code: APT-20251106-001

### Test Scenario 1: Delete Existing Prescription

**Step 1: Create prescription first (if not exists)**

```bash
curl -X POST http://localhost:8080/api/v1/appointments/clinical-records/1/prescription \
  -H "Authorization: Bearer {doctor_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Test prescription for deletion",
    "items": [
      {
        "itemMasterId": 1,
        "itemName": "Paracetamol 500mg",
        "quantity": 20,
        "dosageInstructions": "Take 1 tablet every 6 hours"
      }
    ]
  }'
```

**Expected Response:** `200 OK` with prescription details

**Step 2: Delete the prescription**

```bash
curl -X DELETE http://localhost:8080/api/v1/appointments/clinical-records/1/prescription \
  -H "Authorization: Bearer {doctor_token}"
```

**Expected Response:**

```
HTTP/1.1 204 No Content
Content-Length: 0
Date: Mon, 04 Dec 2025 10:30:00 GMT
```

**Step 3: Verify deletion in database**

```sql
-- Check prescription deleted
SELECT * FROM clinical_prescriptions WHERE clinical_record_id = 1;
-- Expected: 0 rows

-- Check items deleted (CASCADE)
SELECT * FROM clinical_prescription_items
WHERE prescription_id NOT IN (SELECT prescription_id FROM clinical_prescriptions);
-- Expected: 0 rows (no orphaned items)
```

**Step 4: Verify idempotent behavior (delete again)**

```bash
curl -X DELETE http://localhost:8080/api/v1/appointments/clinical-records/1/prescription \
  -H "Authorization: Bearer {doctor_token}"
```

**Expected Response:** `204 No Content` (success even though nothing to delete)

---

### Test Scenario 2: Delete Prescription with Multiple Items

**Step 1: Create prescription with 3 items**

```bash
curl -X POST http://localhost:8080/api/v1/appointments/clinical-records/1/prescription \
  -H "Authorization: Bearer {doctor_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Multi-item prescription",
    "items": [
      {"itemMasterId": 1, "itemName": "Paracetamol 500mg", "quantity": 20, "dosageInstructions": "Take 1 tablet every 6 hours"},
      {"itemMasterId": 2, "itemName": "Amoxicillin 500mg", "quantity": 14, "dosageInstructions": "Take 1 capsule twice daily"},
      {"itemMasterId": 3, "itemName": "Vitamin C 1000mg", "quantity": 30, "dosageInstructions": "Take 1 tablet daily"}
    ]
  }'
```

**Step 2: Verify 3 items created**

```sql
SELECT COUNT(*) FROM clinical_prescription_items
WHERE prescription_id = (SELECT prescription_id FROM clinical_prescriptions WHERE clinical_record_id = 1);
-- Expected: 3 rows
```

**Step 3: Delete prescription**

```bash
curl -X DELETE http://localhost:8080/api/v1/appointments/clinical-records/1/prescription \
  -H "Authorization: Bearer {doctor_token}"
```

**Expected Response:** `204 No Content`

**Step 4: Verify all items deleted**

```sql
-- Check prescription deleted
SELECT * FROM clinical_prescriptions WHERE clinical_record_id = 1;
-- Expected: 0 rows

-- Check all 3 items deleted
SELECT COUNT(*) FROM clinical_prescription_items
WHERE prescription_id NOT IN (SELECT prescription_id FROM clinical_prescriptions);
-- Expected: 0 rows
```

---

### Test Scenario 3: Delete Without Permission (403 Forbidden)

**Step 1: Login as different doctor**

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "bacsi2", "password": "123456"}'
```

**Step 2: Try to delete prescription from bacsi1's appointment**

```bash
curl -X DELETE http://localhost:8080/api/v1/appointments/clinical-records/1/prescription \
  -H "Authorization: Bearer {bacsi2_token}"
```

**Expected Response:**

```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Access denied: You can only modify clinical records from your own appointments"
}
```

---

### Test Scenario 4: Delete Non-Existent Record (404 Not Found)

```bash
curl -X DELETE http://localhost:8080/api/v1/appointments/clinical-records/99999/prescription \
  -H "Authorization: Bearer {doctor_token}"
```

**Expected Response:**

```json
{
  "statusCode": 404,
  "error": "RECORD_NOT_FOUND",
  "message": "Clinical record not found with ID: 99999"
}
```

---

### Test Scenario 5: Delete Prescription for Record Without Prescription (Idempotent)

**Step 1: Find clinical record without prescription**

```sql
SELECT cr.clinical_record_id
FROM clinical_records cr
LEFT JOIN clinical_prescriptions cp ON cr.clinical_record_id = cp.clinical_record_id
WHERE cp.prescription_id IS NULL
LIMIT 1;
-- Example result: clinical_record_id = 2
```

**Step 2: Try to delete (should succeed even though nothing exists)**

```bash
curl -X DELETE http://localhost:8080/api/v1/appointments/clinical-records/2/prescription \
  -H "Authorization: Bearer {doctor_token}"
```

**Expected Response:** `204 No Content`

**Backend Log:**

```
INFO: Deleting prescription for clinical record ID: 2
INFO: No prescription found for clinical record ID: 2
```

---

## API Workflow Comparison

### Complete Prescription CRUD Operations

| API      | Method | Endpoint                                    | Purpose                    |
| -------- | ------ | ------------------------------------------- | -------------------------- |
| API 8.14 | GET    | `/clinical-records/{recordId}/prescription` | View prescription          |
| API 8.15 | POST   | `/clinical-records/{recordId}/prescription` | Create/Update prescription |
| API 8.16 | DELETE | `/clinical-records/{recordId}/prescription` | Delete prescription        |

**Typical Flow:**

1. **Create:** Doctor saves prescription after appointment (API 8.15)
2. **View:** Doctor/Patient views prescription (API 8.14)
3. **Update:** Doctor modifies prescription (API 8.15 - same endpoint)
4. **Delete:** Doctor cancels prescription (API 8.16 - this API)

---

## Related APIs

- **API 8.1:** Get Clinical Record (includes prescription if exists)
- **API 8.14:** Get Prescription (view only)
- **API 8.15:** Save Prescription (create/update)

---

## Future Enhancements

### Inventory Integration (TODO)

When inventory management is fully integrated, this API should:

**Step 1: Calculate Inventory Restoration**

```java
for (ClinicalPrescriptionItem item : prescription.getItems()) {
    if (item.getItemMaster() != null) {
        // Restore stock
        inventoryService.restoreStock(
            item.getItemMaster().getItemId(),
            item.getQuantity(),
            "Prescription deleted for record " + recordId
        );
    }
}
```

**Step 2: Log Inventory Transaction**

```sql
INSERT INTO inventory_transactions (
    item_master_id,
    transaction_type,
    quantity,
    reference_type,
    reference_id,
    notes
) VALUES (
    {itemMasterId},
    'RETURN',
    {quantity},
    'PRESCRIPTION_DELETED',
    {prescriptionId},
    'Prescription deleted for clinical record {recordId}'
);
```

---

## Notes

1. **Idempotent Operation:** Calling DELETE multiple times returns success
2. **CASCADE DELETE:** All prescription items deleted automatically
3. **No Undo:** Once deleted, prescription cannot be recovered
4. **Audit Log:** Consider adding audit trail for deleted prescriptions
5. **Inventory:** Current version does not integrate with inventory (TODO)

---

## Security Considerations

1. **Authorization:** Only prescription owner (doctor) or admin can delete
2. **Data Validation:** Clinical record must exist
3. **Business Rules:** No restrictions on deletion timing (can delete anytime)
4. **Future:** May need to prevent deletion if prescription already dispensed

---

## Conclusion

API 8.16 completes the prescription management CRUD operations:

- **C**reate: API 8.15 (POST)
- **R**ead: API 8.14 (GET)
- **U**pdate: API 8.15 (POST - same as create)
- **D**elete: API 8.16 (DELETE - this API)

This provides full prescription lifecycle management for the dental clinic system.
