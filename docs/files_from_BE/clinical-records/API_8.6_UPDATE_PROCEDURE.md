# API 8.6: Update Procedure in Clinical Record

## Overview

**Purpose**: Update details of an existing procedure recorded during an appointment

**Endpoint**: `PUT /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}`

**Authorization**: `WRITE_CLINICAL_RECORD` (Doctor, Admin)

**Module**: Clinical Records (#9)

**Created**: 2025-12-02

---

## Business Context

### Real-World Scenario

After recording a procedure, the doctor may need to:

- Correct procedure description or notes
- Update tooth number if initially recorded incorrectly
- Change service reference (e.g., wrong service selected)
- Link/unlink from treatment plan
- Add follow-up observations

This API allows editing clinical documentation while preserving audit trail (createdAt).

### Update Philosophy

- **All fields updatable** except `procedureId`, `clinicalRecordId`, `createdAt`
- **Audit trail preserved** - createdAt never changes, updatedAt tracks last modification
- **No status updates** - procedure status handled by appointment completion
- **Validation enforced** - service must be active, plan item must exist

---

## Request Specification

### HTTP Method

```
PUT /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}
```

### Path Parameters

| Parameter   | Type      | Required | Description            |
| ----------- | --------- | -------- | ---------------------- |
| recordId    | `Integer` | Yes      | Clinical record ID     |
| procedureId | `Integer` | Yes      | Procedure ID to update |

### Request Headers

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Request Body

```json
{
  "serviceId": 105,
  "patientPlanItemId": 99,
  "toothNumber": "36",
  "procedureDescription": "Tram xoang II mat O-D, rang 36, mau A3, lot MTA - Cap nhat: da hoan thien",
  "notes": "Benh nhan khong dau, hen tai kham sau 1 tuan"
}
```

### Field Specifications

| Field                | Type     | Required | Constraints                | Description                                       |
| -------------------- | -------- | -------- | -------------------------- | ------------------------------------------------- |
| serviceId            | `Long`   | No       | Must exist, must be active | Service ID from catalog (services table)          |
| patientPlanItemId    | `Long`   | No       | Must exist if provided     | Treatment plan item ID (set to null to unlink)    |
| toothNumber          | `String` | No       | Max 10 chars               | Tooth identifier (e.g., "36", "21", "ALL")        |
| procedureDescription | `String` | **Yes**  | 3-1000 chars               | Detailed description of what was performed        |
| notes                | `String` | No       | Max 1000 chars             | Additional observations or follow-up instructions |

### Validation Rules

1. **Clinical Record Validation**

   - Must exist in `clinical_records` table
   - Error: `RECORD_NOT_FOUND` (404)

2. **Procedure Validation**

   - Must exist in `clinical_record_procedures` table
   - Must belong to specified clinical record
   - Error: `PROCEDURE_NOT_FOUND` (404)

3. **Service Validation** (if serviceId provided)

   - Must exist in `services` table
   - Must have `is_active = true`
   - Error: `SERVICE_NOT_FOUND` (404)

4. **Treatment Plan Item Validation** (if patientPlanItemId provided)

   - Must exist in `patient_plan_items` table
   - Error: `PLAN_ITEM_NOT_FOUND` (404)

5. **Procedure Description**
   - Required by database schema (`NOT NULL`)
   - Cannot be empty or whitespace-only

### Example Requests

#### Request 1: Update Procedure Description

```json
{
  "serviceId": 105,
  "toothNumber": "36",
  "procedureDescription": "Tram xoang II mat O-D, rang 36, Composite mau A3, lot MTA - DA HOAN THIEN",
  "notes": "Da keo 30 phut, benh nhan khong dau"
}
```

#### Request 2: Link Procedure to Treatment Plan

```json
{
  "serviceId": 105,
  "patientPlanItemId": 45,
  "toothNumber": "36",
  "procedureDescription": "Tram rang Composite xoang II mat O-D",
  "notes": "Lien ket voi ke hoach dieu tri"
}
```

#### Request 3: Unlink from Treatment Plan

```json
{
  "serviceId": 105,
  "patientPlanItemId": null,
  "toothNumber": "36",
  "procedureDescription": "Tram rang Composite xoang II mat O-D",
  "notes": "Huy lien ket ke hoach dieu tri"
}
```

#### Request 4: Change Service Reference

```json
{
  "serviceId": 110,
  "toothNumber": "36",
  "procedureDescription": "Sua lai: Tram rang Composite xoang III mat M-O-D (thay vi xoang II)",
  "notes": "Sua lai service sau khi phat hien xoang lon hon"
}
```

---

## Response Specification

### Success Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Procedure updated successfully",
  "data": {
    "procedureId": 7,
    "clinicalRecordId": 1,
    "serviceId": 105,
    "serviceName": "Tram rang Composite (Xoang II)",
    "serviceCode": "FILL_COMPOSITE_II",
    "patientPlanItemId": 99,
    "toothNumber": "36",
    "procedureDescription": "Tram xoang II mat O-D, rang 36, mau A3, lot MTA - DA HOAN THIEN",
    "notes": "Da keo 30 phut, benh nhan khong dau",
    "createdAt": "2025-12-02T10:20:00",
    "updatedAt": "2025-12-02T14:35:00"
  }
}
```

### Response Fields

| Field                | Type       | Description                                 |
| -------------------- | ---------- | ------------------------------------------- |
| procedureId          | `Integer`  | Procedure ID (unchanged)                    |
| clinicalRecordId     | `Integer`  | Parent clinical record ID (unchanged)       |
| serviceId            | `Long`     | Service ID from catalog                     |
| serviceName          | `String`   | Service name (joined from services table)   |
| serviceCode          | `String`   | Service code (joined from services table)   |
| patientPlanItemId    | `Long`     | Treatment plan item ID (null if not linked) |
| toothNumber          | `String`   | Tooth identifier                            |
| procedureDescription | `String`   | Detailed procedure description              |
| notes                | `String`   | Additional clinical notes                   |
| createdAt            | `DateTime` | Original creation timestamp (NEVER changes) |
| updatedAt            | `DateTime` | Last update timestamp (NEW after update)    |

---

## Error Responses

### 404 Record Not Found

**Scenario**: Clinical record doesn't exist

```json
{
  "statusCode": 404,
  "error": "RECORD_NOT_FOUND",
  "message": "Clinical record not found with ID: 1"
}
```

### 404 Procedure Not Found

**Scenario 1**: Procedure doesn't exist

```json
{
  "statusCode": 404,
  "error": "PROCEDURE_NOT_FOUND",
  "message": "Not Found"
}
```

**Scenario 2**: Procedure exists but belongs to different record

```json
{
  "statusCode": 404,
  "error": "PROCEDURE_NOT_FOUND",
  "message": "Procedure does not belong to this clinical record"
}
```

### 404 Service Not Found

**Scenario**: Service doesn't exist or is inactive

```json
{
  "statusCode": 404,
  "error": "SERVICE_NOT_FOUND",
  "message": "Not Found"
}
```

```json
{
  "statusCode": 404,
  "error": "SERVICE_NOT_FOUND",
  "message": "Service ID 105 is inactive"
}
```

### 404 Plan Item Not Found

**Scenario**: Treatment plan item doesn't exist (when patientPlanItemId provided)

```json
{
  "statusCode": 404,
  "error": "PLAN_ITEM_NOT_FOUND",
  "message": "Not Found"
}
```

### 400 Validation Error

**Scenario**: Missing required fields or invalid data

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Procedure description is required"
}
```

---

## Authorization & RBAC

### Required Permission

- `WRITE_CLINICAL_RECORD`

### Roles with Permission

| Role   | Permission            | Access Level                         |
| ------ | --------------------- | ------------------------------------ |
| Admin  | WRITE_CLINICAL_RECORD | Can update any procedure             |
| Doctor | WRITE_CLINICAL_RECORD | Can update procedures in own records |

### Authorization Logic

```java
@PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('WRITE_CLINICAL_RECORD')")
```

**Note**: No additional ownership validation. Permission check is sufficient.

---

## Database Impact

### Table: clinical_record_procedures

**Updated Fields**:

- `service_id` - Changed to new service
- `patient_plan_item_id` - Updated or set to NULL
- `tooth_number` - Updated value
- `procedure_description` - Updated description
- `notes` - Updated notes
- `updated_at` - Set to current timestamp (via @PreUpdate)

**Preserved Fields**:

- `procedure_id` - Never changes (primary key)
- `clinical_record_id` - Never changes (foreign key)
- `created_at` - Never changes (audit trail)

---

## Test Scenarios

### Setup Test Data

Use procedures created by API 8.5:

- **Clinical Record 1**: Appointment 1, Patient BN-1001, Doctor bacsi1
- **Procedure 7**: serviceId=1, toothNumber="16", description="Kham tong quat"
- **Procedure 8**: serviceId=5, planItemId=1, toothNumber="38"

### Test Case 1: Update Procedure Description

**Request**:

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -X PUT "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures/7" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "toothNumber": "16",
    "procedureDescription": "Kham tong quat rang mieng - DA CAP NHAT",
    "notes": "Rang khoe manh - them ghi chu"
  }'
```

**Expected**: 200 OK with updatedAt timestamp

### Test Case 2: Link Procedure to Treatment Plan

**Request**:

```bash
curl -X PUT "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures/7" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "patientPlanItemId": 1,
    "toothNumber": "16",
    "procedureDescription": "Kham tong quat - lien ket ke hoach"
  }'
```

**Expected**: 200 OK with patientPlanItemId=1 in response

### Test Case 3: Unlink from Treatment Plan

**Request**:

```bash
curl -X PUT "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures/8" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 5,
    "patientPlanItemId": null,
    "toothNumber": "38",
    "procedureDescription": "Nho rang khon - huy lien ket"
  }'
```

**Expected**: 200 OK with patientPlanItemId=null in response

### Test Case 4: Update with Invalid Service

**Request**:

```bash
curl -w "\nHTTP_CODE:%{http_code}\n" \
  -X PUT "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures/7" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 99999,
    "procedureDescription": "Test with invalid service"
  }'
```

**Expected**: 404 SERVICE_NOT_FOUND

### Test Case 5: Update Procedure Not Belonging to Record

**Request**:

```bash
curl -w "\nHTTP_CODE:%{http_code}\n" \
  -X PUT "http://localhost:8080/api/v1/appointments/clinical-records/999/procedures/7" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "procedureDescription": "Test wrong record"
  }'
```

**Expected**: 404 RECORD_NOT_FOUND or 404 PROCEDURE_NOT_FOUND

### Test Case 6: Missing Required Field

**Request**:

```bash
curl -w "\nHTTP_CODE:%{http_code}\n" \
  -X PUT "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures/7" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "toothNumber": "16"
  }'
```

**Expected**: 400 VALIDATION_ERROR (procedureDescription required)

---

## Implementation Notes

### Service Layer

**File**: `ClinicalRecordService.java`

```java
@Transactional
public UpdateProcedureResponse updateProcedure(Integer recordId, Integer procedureId,
                                               UpdateProcedureRequest request) {
    // 1. Validate clinical record exists
    ClinicalRecord record = clinicalRecordRepository.findById(recordId)
            .orElseThrow(() -> new NotFoundException("RECORD_NOT_FOUND"));

    // 2. Validate procedure exists and belongs to this record
    ClinicalRecordProcedure procedure = procedureRepository.findById(procedureId)
            .orElseThrow(() -> new NotFoundException("PROCEDURE_NOT_FOUND"));

    if (!procedure.getClinicalRecord().getClinicalRecordId().equals(recordId)) {
        throw new NotFoundException("PROCEDURE_NOT_FOUND",
                "Procedure does not belong to this clinical record");
    }

    // 3. Validate new service exists and is active
    DentalService service = dentalServiceRepository.findById(request.getServiceId())
            .orElseThrow(() -> new NotFoundException("SERVICE_NOT_FOUND"));

    if (!service.getIsActive()) {
        throw new NotFoundException("SERVICE_NOT_FOUND", "Service is inactive");
    }

    // 4. Validate plan item exists if provided
    PatientPlanItem planItem = null;
    if (request.getPatientPlanItemId() != null) {
        planItem = planItemRepository.findById(request.getPatientPlanItemId())
                .orElseThrow(() -> new NotFoundException("PLAN_ITEM_NOT_FOUND"));
    }

    // 5. Update procedure fields (createdAt NOT updated)
    procedure.setService(service);
    procedure.setPatientPlanItem(planItem);
    procedure.setToothNumber(request.getToothNumber());
    procedure.setProcedureDescription(request.getProcedureDescription());
    procedure.setNotes(request.getNotes());
    // updatedAt set automatically by @PreUpdate

    ClinicalRecordProcedure updated = procedureRepository.save(procedure);

    // 6. Build response with service info
    return UpdateProcedureResponse.builder()
            .procedureId(updated.getProcedureId())
            .clinicalRecordId(record.getClinicalRecordId())
            .serviceId(service.getServiceId())
            .serviceName(service.getServiceName())
            .serviceCode(service.getServiceCode())
            .patientPlanItemId(request.getPatientPlanItemId())
            .toothNumber(updated.getToothNumber())
            .procedureDescription(updated.getProcedureDescription())
            .notes(updated.getNotes())
            .createdAt(updated.getCreatedAt())
            .updatedAt(updated.getUpdatedAt())
            .build();
}
```

### Controller Layer

**File**: `ClinicalRecordController.java`

```java
@PutMapping("/clinical-records/{recordId}/procedures/{procedureId}")
@PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('WRITE_CLINICAL_RECORD')")
@ApiMessage("Procedure updated successfully")
public ResponseEntity<UpdateProcedureResponse> updateProcedure(
        @PathVariable Integer recordId,
        @PathVariable Integer procedureId,
        @Valid @RequestBody UpdateProcedureRequest request) {

    UpdateProcedureResponse response = clinicalRecordService.updateProcedure(
            recordId, procedureId, request);
    return ResponseEntity.ok(response);
}
```

### Key Design Decisions

1. **Audit trail preserved** - createdAt never changes, only updatedAt updates
2. **Ownership validation** - Procedure must belong to specified record
3. **Flexible linking** - Can link, unlink, or relink to treatment plan
4. **Service validation** - New service must exist and be active
5. **No status updates** - Procedure status handled by appointment completion

---

## Related APIs

### Prerequisites

- **API 8.5**: Add Procedure (must exist before updating)

### Related APIs

- **API 8.7**: Delete Procedure (remove unwanted procedures)
- **API 8.1**: Get Clinical Record (view procedures list)
- **API 8.4**: Get Procedures (retrieve all procedures for a record)

### Workflow Integration

```
1. Add Procedure (API 8.5) → Procedure created
2. Review Procedure List (API 8.4)
3. Update Procedure (API 8.6) → Correct mistakes or add details
4. Complete Appointment → Auto-update linked plan items
5. View Updated Treatment Plan (API 5.1)
```

---

## Changelog

| Date       | Version | Changes                          |
| ---------- | ------- | -------------------------------- |
| 2025-12-02 | 1.0     | Initial implementation           |
|            |         | - Update all fields except audit |
|            |         | - Link/unlink treatment plan     |
|            |         | - Ownership validation           |

---

**End of Document**
