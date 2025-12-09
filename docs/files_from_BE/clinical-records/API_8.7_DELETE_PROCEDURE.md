# API 8.7: Delete Procedure from Clinical Record

## Overview

**Purpose**: Remove an incorrectly recorded or unwanted procedure from a clinical record

**Endpoint**: `DELETE /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}`

**Authorization**: `WRITE_CLINICAL_RECORD` (Doctor, Admin)

**Module**: Clinical Records (#9)

**Created**: 2025-12-02

---

## Business Context

### Real-World Scenario

A doctor may need to delete a procedure record when:

- **Duplicate entry** - Same procedure recorded twice by mistake
- **Wrong procedure** - Incorrect service selected, easier to delete and re-add
- **Data entry error** - Procedure recorded in wrong clinical record
- **Cancelled procedure** - Procedure planned but not actually performed

### Delete Philosophy

- **Hard delete** - Permanently removes from database (not soft delete)
- **No cascade** - Does NOT affect treatment plan items (passive link only)
- **Ownership validation** - Procedure must belong to specified record
- **Permission required** - Only authorized users (Doctor, Admin) can delete

---

## Request Specification

### HTTP Method

```
DELETE /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}
```

### Path Parameters

| Parameter   | Type      | Required | Description            |
| ----------- | --------- | -------- | ---------------------- |
| recordId    | `Integer` | Yes      | Clinical record ID     |
| procedureId | `Integer` | Yes      | Procedure ID to delete |

### Request Headers

```http
Authorization: Bearer {JWT_TOKEN}
```

### Request Body

**None** - DELETE operation uses path parameters only

---

## Response Specification

### Success Response (204 No Content)

**Status Code**: 204

**Body**: Empty (no content returned)

**Meaning**: Procedure deleted successfully

```
HTTP/1.1 204 No Content
```

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

### 403 Forbidden

**Scenario**: User doesn't have WRITE_CLINICAL_RECORD permission

```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Không tìm thấy tài nguyên hoặc bạn không có quyền truy cập."
}
```

---

## Authorization & RBAC

### Required Permission

- `WRITE_CLINICAL_RECORD`

### Roles with Permission

| Role   | Permission            | Access Level                         |
| ------ | --------------------- | ------------------------------------ |
| Admin  | WRITE_CLINICAL_RECORD | Can delete any procedure             |
| Doctor | WRITE_CLINICAL_RECORD | Can delete procedures in own records |

### Authorization Logic

```java
@PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('WRITE_CLINICAL_RECORD')")
```

**Note**: No additional ownership validation beyond permission check.

---

## Business Rules

### What Happens When Deleting

1. **Procedure record removed** - Hard delete from `clinical_record_procedures` table
2. **Foreign key cleared** - `patientPlanItemId` link removed (if existed)
3. **NO cascade to treatment plan** - Treatment plan item remains unchanged
4. **NO audit trail** - Record completely removed (not soft delete)

### What Does NOT Happen

- ❌ Treatment plan item status does NOT change
- ❌ Treatment plan item does NOT get deleted
- ❌ Appointment status does NOT change
- ❌ Clinical record does NOT get deleted (only the procedure)

### Idempotency

- **First DELETE**: 204 No Content (success)
- **Second DELETE**: 404 PROCEDURE_NOT_FOUND (already deleted)

---

## Database Impact

### Table: clinical_record_procedures

**Action**: `DELETE FROM clinical_record_procedures WHERE procedure_id = ?`

**Cascade Effects**: None (foreign keys use ON DELETE SET NULL or ON DELETE CASCADE as appropriate)

---

## Test Scenarios

### Setup Test Data

Use procedures created by API 8.5:

- **Clinical Record 1**: Appointment 1, Patient BN-1001, Doctor bacsi1
- **Procedure 7**: serviceId=1, toothNumber="16"
- **Procedure 8**: serviceId=5, planItemId=1, toothNumber="38"

### Test Case 1: Delete Procedure Successfully

**Request**:

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -w "\nHTTP_CODE:%{http_code}\n" \
  -X DELETE "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures/7" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:

- HTTP 204 No Content
- Empty response body

### Test Case 2: Delete Non-Existent Procedure

**Request**:

```bash
curl -w "\nHTTP_CODE:%{http_code}\n" \
  -X DELETE "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures/99999" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 404 PROCEDURE_NOT_FOUND

### Test Case 3: Delete Procedure from Wrong Record

**Request**:

```bash
curl -w "\nHTTP_CODE:%{http_code}\n" \
  -X DELETE "http://localhost:8080/api/v1/appointments/clinical-records/999/procedures/8" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 404 RECORD_NOT_FOUND or 404 PROCEDURE_NOT_FOUND

### Test Case 4: Unauthorized Delete (Patient Role)

**Request**:

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"benhnhan1","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -w "\nHTTP_CODE:%{http_code}\n" \
  -X DELETE "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures/8" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 403 FORBIDDEN

### Test Case 5: Verify Treatment Plan Item Unchanged

**Setup**: Procedure 8 has patientPlanItemId=1

**Request**:

```bash
# Delete procedure with plan link
curl -X DELETE "http://localhost:8080/api/v1/appointments/clinical-records/1/procedures/8" \
  -H "Authorization: Bearer $TOKEN"

# Verify plan item still exists
curl "http://localhost:8080/api/v1/treatment-plans/items/1" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:

- DELETE returns 204
- GET plan item returns 200 with item details (item still exists)

---

## Implementation Notes

### Service Layer

**File**: `ClinicalRecordService.java`

```java
@Transactional
public void deleteProcedure(Integer recordId, Integer procedureId) {
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

    // 3. Delete procedure (hard delete - no cascade to treatment plan)
    procedureRepository.delete(procedure);
}
```

### Controller Layer

**File**: `ClinicalRecordController.java`

```java
@DeleteMapping("/clinical-records/{recordId}/procedures/{procedureId}")
@PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('WRITE_CLINICAL_RECORD')")
@ApiMessage("Procedure deleted successfully")
public ResponseEntity<Void> deleteProcedure(
        @PathVariable Integer recordId,
        @PathVariable Integer procedureId) {

    clinicalRecordService.deleteProcedure(recordId, procedureId);
    return ResponseEntity.noContent().build();
}
```

### Key Design Decisions

1. **Hard delete** - Complete removal from database (not soft delete with flag)
2. **No cascade** - Treatment plan items remain unchanged (passive link)
3. **Ownership validation** - Procedure must belong to specified record
4. **204 No Content** - Standard REST practice for successful DELETE
5. **Idempotent** - Second delete returns 404 (already deleted)

---

## Related APIs

### Prerequisites

- **API 8.5**: Add Procedure (must exist before deleting)

### Related APIs

- **API 8.6**: Update Procedure (alternative to delete + re-add)
- **API 8.1**: Get Clinical Record (view procedures list)
- **API 8.4**: Get Procedures (verify deletion)

### Workflow Integration

```
1. Add Procedure (API 8.5) → Procedure created
2. Review Procedure List (API 8.4)
3. Identify incorrect procedure
4. Option A: Update Procedure (API 8.6) → Correct in place
5. Option B: Delete Procedure (API 8.7) → Remove + re-add
6. Verify with Get Clinical Record (API 8.1)
```

---

## Best Practices

### When to Delete vs Update

**Use DELETE when**:

- Procedure recorded in wrong clinical record
- Duplicate entry (same procedure twice)
- Procedure never actually performed
- Complete data entry error

**Use UPDATE when**:

- Wrong service selected (change serviceId)
- Incorrect tooth number
- Need to add/update description or notes
- Need to link/unlink treatment plan

### Safety Considerations

1. **Confirmation required** - Frontend should ask for confirmation before DELETE
2. **No undo** - Hard delete cannot be reversed (no soft delete implemented)
3. **Check dependencies** - Verify procedure not critical to clinical documentation
4. **Audit logging** - Consider logging deletions for compliance

### Alternative: Soft Delete

If regulatory requirements need audit trail, consider:

```sql
-- Add column to schema
ALTER TABLE clinical_record_procedures ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Service layer
procedure.setIsDeleted(true);
procedureRepository.save(procedure);
```

---

## Changelog

| Date       | Version | Changes                        |
| ---------- | ------- | ------------------------------ |
| 2025-12-02 | 1.0     | Initial implementation         |
|            |         | - Hard delete implementation   |
|            |         | - No cascade to treatment plan |
|            |         | - Ownership validation         |

---

**End of Document**
