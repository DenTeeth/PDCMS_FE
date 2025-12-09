# API 8.5: Add Procedure to Clinical Record

## Overview

**Purpose**: Record a procedure or service performed during an appointment visit

**Endpoint**: `POST /api/v1/appointments/clinical-records/{recordId}/procedures`

**Authorization**: `WRITE_CLINICAL_RECORD` (Doctor, Assistant, Admin)

**Module**: Clinical Records (#9)

**Created**: 2025-12-02

---

## Business Context

### Real-World Scenario

During a dental appointment, the doctor performs various procedures:

- Examination
- Cleaning/Scaling
- Filling
- Root canal treatment
- Tooth extraction

This API allows real-time documentation of these procedures, creating a permanent clinical record.

### Treatment Plan Integration

If the procedure is part of a treatment plan:

- API creates a **passive link** via `patientPlanItemId`
- Does **NOT** update treatment plan item status
- Status updates handled by:
  - **Appointment completion** → `AppointmentStatusService` auto-updates linked items
  - **Manual update** → API 5.6 `UpdateItemStatus`

**Rationale**: Separates clinical documentation from administrative workflow

---

## Request Specification

### HTTP Method

```
POST /api/v1/appointments/clinical-records/{recordId}/procedures
```

### Path Parameters

| Parameter | Type      | Required | Description        |
| --------- | --------- | -------- | ------------------ |
| recordId  | `Integer` | Yes      | Clinical record ID |

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
  "procedureDescription": "Tram xoang II mat O-D, rang 36, mau A3, lot MTA",
  "notes": "Benh nhan khong dau, hen tai kham sau 1 tuan"
}
```

### Field Specifications

| Field                | Type     | Required | Constraints                | Description                                       |
| -------------------- | -------- | -------- | -------------------------- | ------------------------------------------------- |
| serviceId            | `Long`   | **Yes**  | Must exist, must be active | Service ID from catalog (services table)          |
| patientPlanItemId    | `Long`   | No       | Must exist if provided     | Treatment plan item ID (creates passive link)     |
| toothNumber          | `String` | No       | Max 10 chars               | Tooth identifier (e.g., "36", "21", "ALL")        |
| procedureDescription | `String` | **Yes**  | 3-1000 chars               | Detailed description of what was performed        |
| notes                | `String` | No       | Max 1000 chars             | Additional observations or follow-up instructions |

### Validation Rules

1. **Service Validation**

   - Must exist in `services` table
   - Must have `is_active = true`
   - Error: `SERVICE_NOT_FOUND` (404)

2. **Clinical Record Validation**

   - Must exist in `clinical_records` table
   - Error: `RECORD_NOT_FOUND` (404)

3. **Treatment Plan Item Validation** (if provided)

   - Must exist in `patient_plan_items` table
   - No ownership validation (trust treatment plan module)
   - Error: `PLAN_ITEM_NOT_FOUND` (404)

4. **Procedure Description**
   - Required by database schema (`NOT NULL`)
   - Contains detailed clinical information
   - Cannot be empty or whitespace-only

### Example Requests

#### Request 1: Simple Procedure (No Plan Link)

```json
{
  "serviceId": 101,
  "toothNumber": "16",
  "procedureDescription": "Kham tong quat rang mieng",
  "notes": "Rang khoe manh, khong phat hien sau rang"
}
```

#### Request 2: Filling Linked to Treatment Plan

```json
{
  "serviceId": 105,
  "patientPlanItemId": 45,
  "toothNumber": "36",
  "procedureDescription": "Tram rang Composite xoang II mat O-D, mau A3, lot MTA",
  "notes": "Benh nhan khong dau, tai kham sau 1 tuan de kiem tra"
}
```

#### Request 3: Full Arch Procedure

```json
{
  "serviceId": 102,
  "toothNumber": "ALL",
  "procedureDescription": "Lay cao rang toan ham, sieu am cap 3",
  "notes": "Da lam sach toan bo cao rang va mang ban duoi loi"
}
```

---

## Response Specification

### Success Response (201 Created)

```json
{
  "statusCode": 201,
  "message": "Procedure added successfully",
  "data": {
    "procedureId": 805,
    "clinicalRecordId": 501,
    "serviceId": 105,
    "serviceName": "Tram rang Composite (Xoang I)",
    "serviceCode": "FILL_COMPOSITE_I",
    "patientPlanItemId": 99,
    "toothNumber": "36",
    "procedureDescription": "Tram xoang II mat O-D, rang 36, mau A3, lot MTA",
    "notes": "Benh nhan khong dau, hen tai kham sau 1 tuan",
    "createdAt": "2025-12-02T10:20:00"
  }
}
```

### Response Fields

| Field                | Type       | Description                                 |
| -------------------- | ---------- | ------------------------------------------- |
| procedureId          | `Integer`  | Generated procedure ID (primary key)        |
| clinicalRecordId     | `Integer`  | Parent clinical record ID                   |
| serviceId            | `Long`     | Service ID from catalog                     |
| serviceName          | `String`   | Service name (joined from services table)   |
| serviceCode          | `String`   | Service code (joined from services table)   |
| patientPlanItemId    | `Long`     | Treatment plan item ID (null if not linked) |
| toothNumber          | `String`   | Tooth identifier                            |
| procedureDescription | `String`   | Detailed procedure description              |
| notes                | `String`   | Additional clinical notes                   |
| createdAt            | `DateTime` | Timestamp when procedure was recorded       |

---

## Error Responses

### 404 Record Not Found

**Scenario**: Clinical record doesn't exist

```json
{
  "statusCode": 404,
  "error": "RECORD_NOT_FOUND",
  "message": "Clinical record not found with ID: 501"
}
```

### 404 Service Not Found

**Scenario**: Service doesn't exist or is inactive

```json
{
  "statusCode": 404,
  "error": "SERVICE_NOT_FOUND",
  "message": "Service not found with ID: 105"
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
  "message": "Treatment plan item not found with ID: 99"
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

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Service ID is required"
}
```

---

## Authorization & RBAC

### Required Permission

- `WRITE_CLINICAL_RECORD`

### Roles with Permission

| Role      | Permission            | Access Level                         |
| --------- | --------------------- | ------------------------------------ |
| Admin     | WRITE_CLINICAL_RECORD | Can add procedures to any record     |
| Doctor    | WRITE_CLINICAL_RECORD | Can add procedures to own records    |
| Assistant | WRITE_CLINICAL_RECORD | Can add procedures to assisted cases |

### Authorization Logic

```java
@PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('WRITE_CLINICAL_RECORD')")
```

**Note**: No additional ownership validation required. Permission check is sufficient.

---

## Database Schema

### Table: clinical_record_procedures

```sql
CREATE TABLE clinical_record_procedures (
    procedure_id SERIAL PRIMARY KEY,
    clinical_record_id INTEGER NOT NULL REFERENCES clinical_records(clinical_record_id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(service_id),
    patient_plan_item_id INTEGER REFERENCES patient_plan_items(patient_plan_item_id),
    tooth_number VARCHAR(10),
    procedure_description TEXT NOT NULL,  -- REQUIRED
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Constraints

- `clinical_record_id`: NOT NULL, CASCADE DELETE
- `procedure_description`: NOT NULL (must provide detailed description)
- `service_id`: Optional FK (allow free-text procedures)
- `patient_plan_item_id`: Optional FK (passive link only)

---

## Test Scenarios

### Setup Test Data

Use existing seed data:

- **Clinical Record 1**: Appointment 1, Patient BN-1001, Doctor bacsi1
- **Service 1**: "Dong chot tai tao cui rang" (Active)
- **Service 5**: "Nho rang khon muc 1" (Active)

### Test Case 1: Add Simple Procedure (No Plan Link)

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures" \
  -H "Authorization: Bearer {BACSI1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "toothNumber": "16",
    "procedureDescription": "Kham tong quat rang mieng",
    "notes": "Rang khoe manh"
  }'
```

**Expected**: 201 CREATED

```json
{
  "statusCode": 201,
  "message": "Procedure added successfully",
  "data": {
    "procedureId": 7,
    "clinicalRecordId": 1,
    "serviceId": 1,
    "serviceName": "Dong chot tai tao cui rang",
    "serviceCode": "ENDO_POST_CORE",
    "patientPlanItemId": null,
    "toothNumber": "16",
    "procedureDescription": "Kham tong quat rang mieng",
    "notes": "Rang khoe manh",
    "createdAt": "2025-12-02T..."
  }
}
```

### Test Case 2: Add Procedure with Plan Link

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures" \
  -H "Authorization: Bearer {BACSI1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 5,
    "patientPlanItemId": 1,
    "toothNumber": "38",
    "procedureDescription": "Nho rang khon ham duoi ben phai, keo 15 phut",
    "notes": "Benh nhan hoi phuc tot"
  }'
```

**Expected**: 201 CREATED (with patientPlanItemId in response)

### Test Case 3: Add Procedure - Record Not Found

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/9999/procedures" \
  -H "Authorization: Bearer {BACSI1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "procedureDescription": "Test procedure"
  }'
```

**Expected**: 404 RECORD_NOT_FOUND

### Test Case 4: Add Procedure - Service Not Found

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures" \
  -H "Authorization: Bearer {BACSI1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 99999,
    "procedureDescription": "Test procedure"
  }'
```

**Expected**: 404 SERVICE_NOT_FOUND

### Test Case 5: Add Procedure - Missing Required Field

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures" \
  -H "Authorization: Bearer {BACSI1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "toothNumber": "16"
  }'
```

**Expected**: 400 VALIDATION_ERROR (procedureDescription required)

### Test Case 6: Add Procedure - Plan Item Not Found

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures" \
  -H "Authorization: Bearer {BACSI1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "patientPlanItemId": 99999,
    "procedureDescription": "Test with invalid plan item"
  }'
```

**Expected**: 404 PLAN_ITEM_NOT_FOUND

### Test Case 7: Unauthorized Access (Patient Role)

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures" \
  -H "Authorization: Bearer {PATIENT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "procedureDescription": "Patient trying to add procedure"
  }'
```

**Expected**: 403 FORBIDDEN (patients don't have WRITE_CLINICAL_RECORD)

---

## Implementation Notes

### Service Layer

**File**: `ClinicalRecordService.java`

```java
@Transactional
public AddProcedureResponse addProcedure(Integer recordId, AddProcedureRequest request) {
    // 1. Validate clinical record exists
    ClinicalRecord record = clinicalRecordRepository.findById(recordId)
            .orElseThrow(() -> new NotFoundException("RECORD_NOT_FOUND"));

    // 2. Validate service exists and is active
    DentalService service = dentalServiceRepository.findById(request.getServiceId())
            .orElseThrow(() -> new NotFoundException("SERVICE_NOT_FOUND"));

    if (!service.getIsActive()) {
        throw new NotFoundException("SERVICE_NOT_FOUND", "Service is inactive");
    }

    // 3. Validate plan item exists (if provided)
    PatientPlanItem planItem = null;
    if (request.getPatientPlanItemId() != null) {
        planItem = planItemRepository.findById(request.getPatientPlanItemId())
                .orElseThrow(() -> new NotFoundException("PLAN_ITEM_NOT_FOUND"));
    }

    // 4. Create and save procedure
    ClinicalRecordProcedure procedure = ClinicalRecordProcedure.builder()
            .clinicalRecord(record)
            .service(service)
            .patientPlanItem(planItem)
            .toothNumber(request.getToothNumber())
            .procedureDescription(request.getProcedureDescription())
            .notes(request.getNotes())
            .build();

    ClinicalRecordProcedure saved = procedureRepository.save(procedure);

    // 5. Build response with service info
    return AddProcedureResponse.builder()
            .procedureId(saved.getProcedureId())
            .clinicalRecordId(record.getClinicalRecordId())
            .serviceId(service.getServiceId())
            .serviceName(service.getServiceName())
            .serviceCode(service.getServiceCode())
            .patientPlanItemId(request.getPatientPlanItemId())
            .toothNumber(saved.getToothNumber())
            .procedureDescription(saved.getProcedureDescription())
            .notes(saved.getNotes())
            .createdAt(saved.getCreatedAt())
            .build();
}
```

### Controller Layer

**File**: `ClinicalRecordController.java`

```java
@PostMapping("/clinical-records/{recordId}/procedures")
@PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('WRITE_CLINICAL_RECORD')")
@ApiMessage("Procedure added successfully")
public ResponseEntity<AddProcedureResponse> addProcedure(
        @PathVariable Integer recordId,
        @Valid @RequestBody AddProcedureRequest request) {

    AddProcedureResponse response = clinicalRecordService.addProcedure(recordId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

### Key Design Decisions

1. **No quantity field** - Each procedure is unique, create multiple records if needed
2. **No toothSurface field** - Include surface info in procedureDescription or toothNumber
3. **Passive plan link** - Does not update item status (separation of concerns)
4. **procedureDescription required** - Enforces detailed clinical documentation
5. **No ownership validation** - Trust permission system and treatment plan module

---

## Related APIs

### Prerequisites

- **API 9.2**: Create Clinical Record (must exist before adding procedures)
- **API 8.1**: Get Clinical Record (view procedures list)

### Related APIs

- **API 8.4**: Get Procedures (retrieve all procedures for a record)
- **API 5.6**: Update Item Status (manual treatment plan status update)
- **Appointment Completion**: Auto-updates linked plan items when appointment → COMPLETED

### Workflow Integration

```
1. Create Appointment
2. Create Clinical Record (API 9.2)
3. Add Procedures (API 8.5) → Record work done
4. Complete Appointment → Auto-update linked plan items
5. View Updated Treatment Plan (API 5.1)
```

---

## Changelog

| Date       | Version | Changes                          |
| ---------- | ------- | -------------------------------- |
| 2025-12-02 | 1.0     | Initial implementation           |
|            |         | - Removed quantity field         |
|            |         | - Removed toothSurface field     |
|            |         | - Added procedureDescription req |
|            |         | - Passive treatment plan linking |

---

## Dental Practice Notes

### Why procedureDescription is Required

In real dental practice:

- "Filling" is too vague
- Need to document: cavity size, material, technique, color match
- Example: "Tram xoang II mat O-D, rang 36, Composite mau A3, lot MTA, keo 20 phut"

### Treatment Plan Integration Philosophy

- **During visit**: Doctor focuses on clinical work
- **Documentation**: API 8.5 records what was done
- **Administrative**: Status updates happen at appointment completion
- **Separation**: Clinical records independent of billing/planning workflows

This design allows:

- Real-time clinical documentation
- Flexible workflow (complete appointment later)
- Audit trail (procedure recorded with timestamp)
- No risk of status update failures blocking clinical work

---

**End of Document**
