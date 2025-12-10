# API 8.15: Save Prescription (Create/Update)

## Overview

Save prescription for a clinical record using **Replace Strategy**. This API handles both creating new prescriptions and updating existing ones. When updating, it completely replaces all prescription items.

**Replace Strategy**:

- If prescription exists: Updates notes and replaces ALL items (old items are deleted)
- If prescription doesn't exist: Creates new prescription with items
- To delete prescription entirely: Use DELETE API (not this one)

## Endpoint

```
POST /api/v1/appointments/clinical-records/{recordId}/prescription
```

## Authorization

Required Permissions (OR logic):

- `ROLE_ADMIN` - Can save prescriptions for any clinical record
- `WRITE_CLINICAL_RECORD` - Can save prescriptions only for own appointments (Doctor, Assistant)

### RBAC Rules

1. **Admin**: Can save prescriptions for any clinical record
2. **WRITE_CLINICAL_RECORD** (Doctor/Assistant):
   - Can only save prescriptions for appointments where they are the primary doctor or participant
   - Cannot modify prescriptions for other doctors' appointments

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

### Request Body

| Field                      | Type    | Required | Description                                                   | Validation                           |
| -------------------------- | ------- | -------- | ------------------------------------------------------------- | ------------------------------------ |
| prescriptionNotes          | String  | No       | Doctor's notes about prescription                             | Max 2000 characters                  |
| items                      | Array   | Yes      | List of prescription items (medications)                      | Must contain at least 1              |
| items[].itemMasterId       | Integer | No       | Link to warehouse inventory (NULL if medication not in stock) | Must exist and be active if provided |
| items[].itemName           | String  | Yes      | Medication name                                               | Required, max 255 chars              |
| items[].quantity           | Integer | Yes      | Quantity prescribed                                           | Must be greater than 0               |
| items[].dosageInstructions | String  | No       | Full dosage instructions including duration                   | Max 1000 characters                  |

### Example Request - Create New Prescription (Warehouse Items)

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Kieng do chua cay, uong nhieu nuoc. Tai kham sau 5 ngay.",
    "items": [
      {
        "itemMasterId": 201,
        "itemName": "Amoxicillin 500mg",
        "quantity": 10,
        "dosageInstructions": "Sang 1 vien, Toi 1 vien - Dung du 5 ngay"
      },
      {
        "itemMasterId": 205,
        "itemName": "Paracetamol 500mg",
        "quantity": 6,
        "dosageInstructions": "Uong khi dau, cach nhau 4-6h, toi da 3 ngay"
      }
    ]
  }'
```

### Example Request - Update Existing Prescription (Mixed: Warehouse + Non-Warehouse)

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Cap nhat: Tang lieu thuoc khang sinh do benh nhan khong co cai thien",
    "items": [
      {
        "itemMasterId": 201,
        "itemName": "Amoxicillin 500mg",
        "quantity": 15,
        "dosageInstructions": "Sang 2 vien, Toi 2 vien - Dung du 5 ngay"
      },
      {
        "itemMasterId": null,
        "itemName": "Thuoc bo gan XYZ (tu mua ngoai)",
        "quantity": 1,
        "dosageInstructions": "Uong theo huong dan tren bao bi, 3 lan/ngay"
      }
    ]
  }'
```

## Response

### Success Response (200 OK)

Returns full prescription DTO with all saved items (same format as API 8.14 GET).

**Scenario 1: Create New Prescription**

```json
{
  "code": 1000,
  "message": "Prescription saved successfully",
  "result": {
    "prescriptionId": 3,
    "clinicalRecordId": 1,
    "prescriptionNotes": "Kieng do chua cay, uong nhieu nuoc. Tai kham sau 5 ngay.",
    "createdAt": "2025-12-02 10:35:00",
    "items": [
      {
        "prescriptionItemId": 10,
        "itemMasterId": 201,
        "itemCode": "MED-AMOX-500",
        "itemName": "Amoxicillin 500mg",
        "unitName": "Vien",
        "quantity": 10,
        "dosageInstructions": "Sang 1 vien, Toi 1 vien - Dung du 5 ngay"
      },
      {
        "prescriptionItemId": 11,
        "itemMasterId": 205,
        "itemCode": "MED-PARA-500",
        "itemName": "Paracetamol 500mg",
        "unitName": "Vien",
        "quantity": 6,
        "dosageInstructions": "Uong khi dau, cach nhau 4-6h, toi da 3 ngay"
      }
    ]
  }
}
```

**Scenario 2: Update Existing Prescription (Replace All Items)**

```json
{
  "code": 1000,
  "message": "Prescription saved successfully",
  "result": {
    "prescriptionId": 3,
    "clinicalRecordId": 1,
    "prescriptionNotes": "Cap nhat: Tang lieu thuoc khang sinh do benh nhan khong co cai thien",
    "createdAt": "2025-12-02 10:35:00",
    "items": [
      {
        "prescriptionItemId": 12,
        "itemMasterId": 201,
        "itemCode": "MED-AMOX-500",
        "itemName": "Amoxicillin 500mg",
        "unitName": "Vien",
        "quantity": 15,
        "dosageInstructions": "Sang 2 vien, Toi 2 vien - Dung du 5 ngay"
      },
      {
        "prescriptionItemId": 13,
        "itemMasterId": null,
        "itemCode": null,
        "itemName": "Thuoc bo gan XYZ (tu mua ngoai)",
        "unitName": null,
        "quantity": 1,
        "dosageInstructions": "Uong theo huong dan tren bao bi, 3 lan/ngay"
      }
    ]
  }
}
```

**Note**:

- `prescriptionId` stays the same when updating (header is updated, not recreated)
- `prescriptionItemId` changes because old items are deleted and new ones inserted
- `createdAt` is the original creation timestamp (doesn't change on update)

### Error Responses

#### 404 - Clinical Record Not Found

```json
{
  "statusCode": 404,
  "error": "RECORD_NOT_FOUND",
  "message": "Clinical record not found with ID: 9999"
}
```

#### 404 - Item Master Not Found

```json
{
  "statusCode": 404,
  "error": "ITEM_NOT_FOUND",
  "message": "Item Master ID 9999 does not exist"
}
```

#### 400 - Item Master Not Active

```json
{
  "statusCode": 400,
  "error": "ITEM_NOT_ACTIVE",
  "message": "Item Master ID 201 is not active"
}
```

#### 400 - Empty Items Array

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Prescription must contain at least one item. Use DELETE API to remove prescription."
}
```

#### 400 - Item Name Missing

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Item name is required for all prescription items"
}
```

#### 400 - Invalid Quantity

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Quantity must be greater than 0"
}
```

#### 403 - Forbidden (No permission to modify)

```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "You do not have permission to modify clinical records"
}
```

#### 401 - Unauthorized

```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

## Response Field Descriptions

### PrescriptionDTO

| Field             | Type    | Description                                       |
| ----------------- | ------- | ------------------------------------------------- |
| prescriptionId    | Integer | Prescription ID (stays same on update)            |
| clinicalRecordId  | Integer | Clinical record ID                                |
| prescriptionNotes | String  | Doctor's notes about prescription                 |
| createdAt         | String  | Original creation timestamp (yyyy-MM-dd HH:mm:ss) |
| items             | Array   | List of prescription items                        |

### PrescriptionItemDTO

| Field              | Type    | Description                                               |
| ------------------ | ------- | --------------------------------------------------------- |
| prescriptionItemId | Integer | Prescription item ID (changes on update/replace)          |
| itemMasterId       | Integer | Link to warehouse (NULL if not in inventory)              |
| itemCode           | String  | Warehouse item code (NULL if not in inventory)            |
| itemName           | String  | Medication name                                           |
| unitName           | String  | Unit of measure from warehouse (NULL if not in inventory) |
| quantity           | Integer | Quantity prescribed                                       |
| dosageInstructions | String  | Full dosage instructions including duration               |

## Business Rules

### Replace Strategy Behavior

1. **Create Case** (No prescription exists):

   - Creates new `clinical_prescriptions` row
   - Inserts all items into `clinical_prescription_items`

2. **Update Case** (Prescription exists):

   - Updates `prescription_notes` in header
   - **HARD DELETES** all existing items (CASCADE)
   - Inserts all new items from request

3. **Why Replace Instead of Merge?**
   - Simpler UX: Doctor sees full prescription, makes changes, saves
   - No complex diff logic: Frontend doesn't need to track which items added/removed/modified
   - Dental clinic use case: Prescriptions are small (2-5 items), not like hospital (50+ items)

### Item Master Validation

- `itemMasterId` is **optional** (NULL allowed)
- If `itemMasterId` provided:
  - Must exist in `item_masters` table
  - Must have `is_active = true`
  - If invalid: Returns 404 ITEM_NOT_FOUND or 400 ITEM_NOT_ACTIVE

### Item Name Requirement

- `itemName` is **always required** (even if `itemMasterId` is NULL)
- Reason: Medications may not be in warehouse inventory (buy from external pharmacy)
- Example: "Panadol Extra" (not in inventory but still valid prescription)

### Quantity Validation

- Must be greater than 0
- Frontend should validate before submission

### Dosage Instructions

- Optional but highly recommended
- Should include duration information
- Example: "Sang 1 vien, Toi 1 vien - Dung du 5 ngay"
- No separate `durationDays` field (avoid scope creep)

## Database Schema Reference

```sql
-- Prescription header (1-to-1 with clinical_records)
CREATE TABLE clinical_prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    clinical_record_id INTEGER NOT NULL REFERENCES clinical_records(clinical_record_id) ON DELETE CASCADE,
    prescription_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescription items (1-to-many with prescriptions)
CREATE TABLE clinical_prescription_items (
    prescription_item_id SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES clinical_prescriptions(prescription_id) ON DELETE CASCADE,
    item_master_id INTEGER REFERENCES item_masters(item_master_id),  -- Nullable
    item_name VARCHAR(255) NOT NULL,  -- Required even if not in inventory
    quantity INTEGER NOT NULL,
    dosage_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Points**:

- `item_master_id` is nullable (for medications not in inventory)
- `item_name` is NOT NULL (always required)
- CASCADE DELETE: When prescription deleted, all items auto-deleted

## Test Scenarios

### Scenario 1: Create New Prescription (Doctor, Warehouse Items)

**Setup**:

- Login as doctor (employee_id = 1)
- Get clinical record ID from seed data (record_id = 1)
- Verify no prescription exists yet (API 8.14 returns 404 PRESCRIPTION_NOT_FOUND)

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Kieng do chua cay. Tai kham sau 5 ngay.",
    "items": [
      {
        "itemMasterId": 201,
        "itemName": "Amoxicillin 500mg",
        "quantity": 10,
        "dosageInstructions": "Sang 1 vien, Toi 1 vien (5 ngay)"
      }
    ]
  }'
```

**Expected Result**:

- Status: 200 OK
- Response contains new `prescriptionId`
- Response contains 1 item with `itemMasterId=201`, `itemCode`, `unitName` from warehouse
- Verify with API 8.14 GET that prescription now exists

---

### Scenario 2: Update Existing Prescription (Replace Items)

**Setup**:

- Use same doctor and record from Scenario 1
- Prescription now exists (created in Scenario 1)

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Cap nhat: Tang lieu do benh nhan khong co cai thien",
    "items": [
      {
        "itemMasterId": 201,
        "itemName": "Amoxicillin 500mg",
        "quantity": 15,
        "dosageInstructions": "Sang 2 vien, Toi 2 vien (5 ngay)"
      },
      {
        "itemMasterId": 205,
        "itemName": "Paracetamol 500mg",
        "quantity": 6,
        "dosageInstructions": "Uong khi dau"
      }
    ]
  }'
```

**Expected Result**:

- Status: 200 OK
- Same `prescriptionId` as Scenario 1 (header updated, not recreated)
- Different `prescriptionItemId` (old item deleted, 2 new items inserted)
- `prescriptionNotes` updated
- Verify with API 8.14 GET that prescription has 2 items now

---

### Scenario 3: Create Prescription with Non-Warehouse Item

**Setup**:

- Login as doctor
- Use different clinical record (record_id = 2)

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/2/prescription" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Thuoc khong co trong kho, benh nhan tu mua ngoai",
    "items": [
      {
        "itemMasterId": null,
        "itemName": "Panadol Extra (tu mua ngoai)",
        "quantity": 1,
        "dosageInstructions": "Uong theo huong dan tren bao bi"
      }
    ]
  }'
```

**Expected Result**:

- Status: 200 OK
- Response contains item with `itemMasterId=null`, `itemCode=null`, `unitName=null`
- Only `itemName`, `quantity`, `dosageInstructions` populated

---

### Scenario 4: Admin Saves Prescription for Any Record

**Setup**:

- Login as admin (role = ROLE_ADMIN)
- Use any clinical record

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/3/prescription" \
  -H "Authorization: Bearer {{admin_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Admin override prescription",
    "items": [
      {
        "itemMasterId": 201,
        "itemName": "Amoxicillin 500mg",
        "quantity": 10,
        "dosageInstructions": "Standard dosage"
      }
    ]
  }'
```

**Expected Result**:

- Status: 200 OK
- Admin can save prescription for any clinical record

---

### Scenario 5: 404 - Clinical Record Not Found

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/9999/prescription" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Test",
    "items": [{"itemName": "Test", "quantity": 1}]
  }'
```

**Expected Result**:

- Status: 404 NOT FOUND
- Error: RECORD_NOT_FOUND

---

### Scenario 6: 404 - Item Master Not Found

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "itemMasterId": 9999,
        "itemName": "Invalid Item",
        "quantity": 1
      }
    ]
  }'
```

**Expected Result**:

- Status: 404 NOT FOUND
- Error: ITEM_NOT_FOUND
- Message: "Item Master ID 9999 does not exist"

---

### Scenario 7: 400 - Empty Items Array

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionNotes": "Test",
    "items": []
  }'
```

**Expected Result**:

- Status: 400 BAD REQUEST
- Error: VALIDATION_ERROR
- Message: "Prescription must contain at least one item. Use DELETE API to remove prescription."

---

### Scenario 8: 400 - Item Name Missing

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "itemMasterId": 201,
        "quantity": 10
      }
    ]
  }'
```

**Expected Result**:

- Status: 400 BAD REQUEST
- Error: VALIDATION_ERROR
- Message: "Item name is required for all prescription items"

---

### Scenario 9: 403 - Doctor Tries to Save Prescription for Other Doctor's Record

**Setup**:

- Login as doctor_2 (employee_id = 2)
- Try to save prescription for clinical record belonging to doctor_1

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/prescription" \
  -H "Authorization: Bearer {{doctor_2_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"itemName": "Test", "quantity": 1}]
  }'
```

**Expected Result**:

- Status: 403 FORBIDDEN
- Error: FORBIDDEN
- Message: "You do not have permission to modify clinical records"

---

## Related APIs

- **API 8.14**: GET Prescription - Retrieve existing prescription
- **API 8.1**: GET Clinical Record - Get full clinical record with prescription
- **API 8.2**: CREATE Clinical Record - Must create clinical record first before prescription
- **Warehouse APIs**: Search medications for `itemMasterId` dropdown

## Implementation Notes

### Frontend Workflow

1. **Create Prescription Flow**:

   - Doctor views clinical record (API 8.1)
   - Clicks "Create Prescription" button
   - Frontend shows prescription form
   - Search medications (Warehouse API) to get `itemMasterId` for dropdown
   - Doctor can also enter custom medication name (not in warehouse)
   - Submit to API 8.15

2. **Update Prescription Flow**:
   - Doctor views existing prescription (API 8.14)
   - Clicks "Edit Prescription" button
   - Frontend pre-fills form with existing items
   - Doctor makes changes (add/remove/modify items)
   - Submit to API 8.15 (replaces all items)

### Backend Architecture

- **Service Layer**: `ClinicalRecordService.savePrescription()`
- **RBAC**: Reuses `checkAccessPermission()` from API 8.1
- **Transaction**: @Transactional ensures atomicity (clear + insert happens together)
- **Cascade**: Old items auto-deleted via JPA cascade when `items.clear()` called

### Performance Considerations

- Replace strategy is efficient for small prescriptions (2-5 items typical in dental clinic)
- Single transaction ensures data consistency
- Cascade delete avoids orphaned records

### Data Integrity

- Clinical record must exist before creating prescription
- Item Master validation ensures valid inventory links
- Item name always required (supports non-inventory medications)
- Quantity validation prevents invalid data
