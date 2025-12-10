# API 8.12: Get Attachments for Clinical Record

## Overview

**Purpose**: Retrieve list of all files attached to a clinical record

**Endpoint**: `GET /api/v1/clinical-records/{recordId}/attachments`

**Authorization**: `VIEW_ATTACHMENT` permission (Doctor, Nurse, Admin, Patient)

---

## Business Rules

1. Clinical record must exist (404 if not found)
2. User must have access to this record (RBAC check via appointment)
3. Returns empty array `[]` if no attachments yet (not 404)
4. Files sorted by upload time (newest first)
5. Response includes uploader information for audit trail

---

## Request

### Path Parameters

| Parameter | Type    | Required | Description        |
| --------- | ------- | -------- | ------------------ |
| recordId  | Integer | Yes      | Clinical record ID |

### Example Request (cURL)

```bash
# Get attachments as Doctor
curl -X GET "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer {{doctor_token}}"

# Get attachments as Patient (own record)
curl -X GET "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer {{patient_token}}"

# Get attachments as Admin
curl -X GET "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer {{admin_token}}"
```

---

## Response

### Success Response (200 OK) - With Files

```json
{
  "statusCode": 200,
  "message": "Attachments retrieved successfully",
  "data": [
    {
      "attachmentId": 3,
      "clinicalRecordId": 1,
      "fileName": "xray_after_treatment.jpg",
      "fileSize": 3145728,
      "mimeType": "image/jpeg",
      "attachmentType": "PHOTO_AFTER",
      "description": "Post-treatment X-ray showing successful root canal",
      "uploadedBy": 1,
      "uploadedByName": "Dr. Nguyen Van A",
      "uploadedAt": "2025-12-02 15:45:00"
    },
    {
      "attachmentId": 2,
      "clinicalRecordId": 1,
      "fileName": "consent_form_signed.pdf",
      "fileSize": 524288,
      "mimeType": "application/pdf",
      "attachmentType": "CONSENT_FORM",
      "description": "Patient consent for root canal procedure",
      "uploadedBy": 1,
      "uploadedByName": "Dr. Nguyen Van A",
      "uploadedAt": "2025-12-02 14:30:00"
    },
    {
      "attachmentId": 1,
      "clinicalRecordId": 1,
      "fileName": "panoramic_xray_initial.jpg",
      "fileSize": 2458624,
      "mimeType": "image/jpeg",
      "attachmentType": "XRAY",
      "description": "Pre-treatment panoramic X-ray",
      "uploadedBy": 1,
      "uploadedByName": "Dr. Nguyen Van A",
      "uploadedAt": "2025-12-02 10:15:00"
    }
  ]
}
```

### Success Response (200 OK) - No Attachments

```json
{
  "statusCode": 200,
  "message": "Attachments retrieved successfully",
  "data": []
}
```

### Response Fields

| Field              | Type               | Description                                 |
| ------------------ | ------------------ | ------------------------------------------- |
| `attachmentId`     | Integer            | Unique attachment ID                        |
| `clinicalRecordId` | Integer            | Associated clinical record                  |
| `fileName`         | String             | Original filename                           |
| `fileSize`         | Long               | File size in bytes                          |
| `mimeType`         | String             | Content type (image/jpeg, application/pdf)  |
| `attachmentType`   | AttachmentTypeEnum | File category (XRAY, PHOTO_BEFORE, etc.)    |
| `description`      | String             | Optional description (null if not provided) |
| `uploadedBy`       | Integer            | Employee ID who uploaded (null if system)   |
| `uploadedByName`   | String             | Full name of uploader                       |
| `uploadedAt`       | String             | Upload timestamp (yyyy-MM-dd HH:mm:ss)      |

---

## Error Responses

### 404 Not Found - Record Not Found

```json
{
  "statusCode": 404,
  "message": "Clinical record not found with ID: 999",
  "error": "RECORD_NOT_FOUND"
}
```

### 403 Forbidden - No Access Permission

```json
{
  "statusCode": 403,
  "message": "You do not have permission to access this clinical record",
  "error": "ACCESS_DENIED"
}
```

---

## Authorization & RBAC

### Required Permission

- `VIEW_ATTACHMENT`

### Roles with Permission

| Role    | Permission      | Access Level                                      |
| ------- | --------------- | ------------------------------------------------- |
| Admin   | VIEW_ATTACHMENT | Can view all attachments                          |
| Doctor  | VIEW_ATTACHMENT | Can view attachments of own appointments          |
| Nurse   | VIEW_ATTACHMENT | Can view attachments of participated appointments |
| Patient | VIEW_ATTACHMENT | Can view attachments of own records               |

### RBAC Logic (reuses API 8.1 logic)

View is allowed if user can view the clinical record:

1. **Admin** (`ROLE_ADMIN`): Full access to all records
2. **VIEW_APPOINTMENT_ALL**: Can view any record (Receptionist, Manager)
3. **VIEW_APPOINTMENT_OWN**: Can view only if:
   - Doctor: `appointment.employee_id` matches current user's `employee_id`
   - Participant: User is listed in `appointment_participants` (Observer/Nurse)
   - Patient: `appointment.patient_id` matches current user's `patient_id`

---

## Test Scenarios

### Test Case 1: Get Attachments as Doctor (Success)

**Pre-conditions**:

- Doctor `bacsi1` (employee_id: 1) logged in
- Clinical record ID 1 exists with 3 uploaded files
- Appointment doctor_id = 1

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"123456"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response**: `200 OK` with array of 3 attachments

---

### Test Case 2: Get Empty Attachments List (No Files Yet)

**Pre-conditions**:

- Doctor logged in
- Clinical record ID 2 exists but has no attachments

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/clinical-records/2/attachments" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response**: `200 OK` with empty array `[]`

---

### Test Case 3: Get Attachments as Patient (Own Record)

**Pre-conditions**:

- Patient `benhnhan1` (patient_id: 1) logged in
- Clinical record ID 1 belongs to appointment with patient_id = 1

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"benhnhan1","password":"123456"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response**: `200 OK` with attachments list

---

### Test Case 4: Get Attachments as Nurse (Participated Appointment)

**Pre-conditions**:

- Nurse `yta1` (employee_id: 8) logged in
- Nurse is participant in appointment for clinical record ID 1

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"yta1","password":"123456"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response**: `200 OK` with attachments list

---

### Test Case 5: Get Attachments for Non-Existent Record (Not Found)

**Pre-conditions**:

- Doctor logged in
- Clinical record ID 999 does not exist

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/clinical-records/999/attachments" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response**: `404 Not Found` - `RECORD_NOT_FOUND`

---

### Test Case 6: Get Attachments as Wrong Patient (Forbidden)

**Pre-conditions**:

- Patient `benhnhan2` (patient_id: 2) logged in
- Clinical record ID 1 belongs to patient_id = 1 (different patient)

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"benhnhan2","password":"123456"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response**: `403 Forbidden` - `ACCESS_DENIED`

---

### Test Case 7: Get Attachments as Admin (Full Access)

**Pre-conditions**:

- Admin logged in
- Any clinical record ID

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X GET "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response**: `200 OK` with attachments list

---

## Implementation Notes

### Query Performance

- Uses repository method: `findByClinicalRecord_ClinicalRecordId(recordId)`
- Orders by `uploaded_at DESC` (newest first)
- No pagination (assumes reasonable number of files per record)
- Future enhancement: Add pagination if needed

### Use Cases

1. **Frontend Gallery**: Display X-rays and photos in image viewer
2. **Audit Trail**: Show who uploaded which files and when
3. **Treatment Timeline**: Show before/after photos chronologically
4. **Document Verification**: View consent forms and lab results

### Related APIs

- **API 8.1**: GET clinical record (get record details before fetching attachments)
- **API 8.11**: POST upload attachment (upload new file)
- **API 8.13**: DELETE attachment (remove unwanted file)
- **Future API 8.14**: GET /attachments/{id}/download (download file)

---

## Seed Data for Testing

### Clinical Records (from seed-data.sql)

| Record ID | Appointment ID | Doctor ID | Patient ID | Has Attachments           |
| --------- | -------------- | --------- | ---------- | ------------------------- |
| 1         | 1              | 1         | 1          | Yes (after API 8.11 test) |
| 2         | 2              | 2         | 2          | No                        |

### Test Users

| Username  | Password | Role         | Employee ID | Patient ID | Notes                   |
| --------- | -------- | ------------ | ----------- | ---------- | ----------------------- |
| admin     | admin123 | ROLE_ADMIN   | NULL        | NULL       | Full access             |
| bacsi1    | 123456   | ROLE_DENTIST | 1           | NULL       | Doctor for record 1     |
| bacsi2    | 123456   | ROLE_DENTIST | 2           | NULL       | Doctor for record 2     |
| yta1      | 123456   | ROLE_NURSE   | 8           | NULL       | Can view as participant |
| benhnhan1 | 123456   | ROLE_PATIENT | NULL        | 1          | Patient of record 1     |
| benhnhan2 | 123456   | ROLE_PATIENT | NULL        | 2          | Patient of record 2     |

---

## Changelog

| Version | Date       | Author   | Changes                   |
| ------- | ---------- | -------- | ------------------------- |
| 1.0     | 2025-12-02 | AI Agent | Initial API specification |

---

## Frontend Integration Example

```typescript
// React component example
const ClinicalRecordAttachments = ({ recordId }) => {
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetch(`/api/v1/clinical-records/${recordId}/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAttachments(data.data));
  }, [recordId]);

  return (
    <div className="attachments-gallery">
      {attachments.length === 0 ? (
        <p>No attachments uploaded yet</p>
      ) : (
        attachments.map((att) => (
          <div key={att.attachmentId} className="attachment-card">
            <img src={`/uploads/${att.filePath}`} alt={att.fileName} />
            <p>
              {att.attachmentType}: {att.description}
            </p>
            <small>
              Uploaded by {att.uploadedByName} on {att.uploadedAt}
            </small>
          </div>
        ))
      )}
    </div>
  );
};
```

---

## TODO

- [ ] Add pagination for records with many files
- [ ] Add filtering by attachment type
- [ ] Add file download URLs to response
- [ ] Add thumbnail URLs for images
- [ ] Add total file size calculation
