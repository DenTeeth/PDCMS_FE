# API 8.11: Upload Attachment to Clinical Record

## Overview

**Purpose**: Upload file (X-ray, photo, consent form) to clinical record

**Endpoint**: `POST /api/v1/clinical-records/{recordId}/attachments`

**Authorization**: `UPLOAD_ATTACHMENT` permission (Doctor, Admin)

---

## Business Rules

1. Clinical record must exist (404 if not found)
2. User must have access to this record (RBAC check via appointment)
3. File validation:
   - Max size: 10 MB
   - Allowed types: JPEG, PNG, GIF, PDF
4. File storage: Local filesystem (TODO: migrate to S3)
5. File naming: `{timestamp}_{originalFilename}`
6. Directory structure: `uploads/clinical-records/{recordId}/`

---

## Request

### Path Parameters

| Parameter | Type    | Required | Description        |
| --------- | ------- | -------- | ------------------ |
| recordId  | Integer | Yes      | Clinical record ID |

### Form Data Parameters (multipart/form-data)

| Field          | Type               | Required | Description                           |
| -------------- | ------------------ | -------- | ------------------------------------- |
| file           | MultipartFile      | Yes      | Binary file data                      |
| attachmentType | AttachmentTypeEnum | Yes      | File category (see enum values below) |
| description    | String             | No       | Optional notes about the file         |

### Attachment Type ENUM Values

| Value        | Description           | Use Case                |
| ------------ | --------------------- | ----------------------- |
| XRAY         | Phim X-quang          | Dental X-ray images     |
| PHOTO_BEFORE | Anh truoc dieu tri    | Before treatment photos |
| PHOTO_AFTER  | Anh sau dieu tri      | After treatment photos  |
| LAB_RESULT   | Ket qua xet nghiem    | Laboratory test results |
| CONSENT_FORM | Phieu dong y dieu tri | Signed consent forms    |
| OTHER        | Loai file khac        | Other documents         |

### Example Request (cURL)

```bash
# Upload X-ray image as Doctor
curl -X POST "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer {{doctor_token}}" \
  -F "file=@xray_image.jpg" \
  -F "attachmentType=XRAY" \
  -F "description=Panoramic X-ray before root canal"

# Upload consent form as Admin
curl -X POST "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer {{admin_token}}" \
  -F "file=@consent_signed.pdf" \
  -F "attachmentType=CONSENT_FORM" \
  -F "description=Patient consent for implant procedure"
```

### Example Request (Postman)

1. Select `POST` method
2. URL: `http://localhost:8080/api/v1/clinical-records/1/attachments`
3. Headers tab:
   - `Authorization`: `Bearer {{token}}`
4. Body tab:
   - Select `form-data`
   - Add key `file`, type `File`, select file from disk
   - Add key `attachmentType`, type `Text`, value `XRAY`
   - Add key `description`, type `Text`, value `Pre-treatment X-ray`

---

## Response

### Success Response (201 Created)

```json
{
  "statusCode": 201,
  "message": "File uploaded successfully",
  "data": {
    "attachmentId": 1,
    "clinicalRecordId": 1,
    "fileName": "xray_image.jpg",
    "fileSize": 2458624,
    "mimeType": "image/jpeg",
    "attachmentType": "XRAY",
    "description": "Panoramic X-ray before root canal",
    "uploadedAt": "2025-12-02 14:30:22",
    "message": "File uploaded successfully"
  }
}
```

### Response Fields

| Field              | Type               | Description                                |
| ------------------ | ------------------ | ------------------------------------------ |
| `attachmentId`     | Integer            | Generated attachment ID                    |
| `clinicalRecordId` | Integer            | Associated clinical record                 |
| `fileName`         | String             | Original filename                          |
| `fileSize`         | Long               | File size in bytes                         |
| `mimeType`         | String             | Content type (image/jpeg, application/pdf) |
| `attachmentType`   | AttachmentTypeEnum | File category                              |
| `description`      | String             | Optional description (nullable)            |
| `uploadedAt`       | String             | Upload timestamp (yyyy-MM-dd HH:mm:ss)     |

---

## Error Responses

### 400 Bad Request - Empty File

```json
{
  "statusCode": 400,
  "message": "File is empty or null",
  "error": "EMPTY_FILE"
}
```

### 400 Bad Request - File Too Large

```json
{
  "statusCode": 400,
  "message": "File size exceeds maximum limit of 10 MB",
  "error": "FILE_TOO_LARGE"
}
```

### 400 Bad Request - Invalid File Type

```json
{
  "statusCode": 400,
  "message": "Invalid file type. Allowed types: JPEG, PNG, GIF, PDF",
  "error": "INVALID_FILE_TYPE"
}
```

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

- `UPLOAD_ATTACHMENT`

### Roles with Permission

| Role   | Permission        | Access Level                      |
| ------ | ----------------- | --------------------------------- |
| Admin  | UPLOAD_ATTACHMENT | Can upload to any clinical record |
| Doctor | UPLOAD_ATTACHMENT | Can upload to own appointments    |

### RBAC Logic (reuses API 8.1 logic)

Upload is allowed if user can view the clinical record:

1. **Admin** (`ROLE_ADMIN`): Full access to all records
2. **VIEW_APPOINTMENT_ALL**: Can upload to any record (Receptionist, Manager)
3. **VIEW_APPOINTMENT_OWN**: Can upload only if:
   - Doctor: `appointment.employee_id` matches current user's `employee_id`
   - Participant: User is listed in `appointment_participants` (Observer/Nurse)
   - Patient: `appointment.patient_id` matches current user's `patient_id`

---

## Test Scenarios

### Test Case 1: Upload X-ray as Doctor (Success)

**Pre-conditions**:

- Doctor `bacsi1` (employee_id: 1) logged in
- Clinical record ID 1 exists for appointment with doctor_id = 1
- Valid JPEG file < 10 MB

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"123456"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X POST "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_xray.jpg" \
  -F "attachmentType=XRAY" \
  -F "description=Pre-treatment panoramic X-ray"
```

**Expected Response**: `201 Created` with attachment details

---

### Test Case 2: Upload File Too Large (Validation Error)

**Pre-conditions**:

- Doctor logged in
- File size > 10 MB

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@large_file_15mb.jpg" \
  -F "attachmentType=PHOTO_BEFORE"
```

**Expected Response**: `400 Bad Request` - `FILE_TOO_LARGE`

---

### Test Case 3: Upload Invalid File Type (Validation Error)

**Pre-conditions**:

- Doctor logged in
- File type is .exe or .zip (not allowed)

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@malware.exe" \
  -F "attachmentType=OTHER"
```

**Expected Response**: `400 Bad Request` - `INVALID_FILE_TYPE`

---

### Test Case 4: Upload to Non-Existent Record (Not Found)

**Pre-conditions**:

- Doctor logged in
- Clinical record ID 999 does not exist

**Request**:

```bash
curl -X POST "http://localhost:8080/api/v1/clinical-records/999/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg" \
  -F "attachmentType=XRAY"
```

**Expected Response**: `404 Not Found` - `RECORD_NOT_FOUND`

---

### Test Case 5: Upload to Other Doctor's Record (Forbidden)

**Pre-conditions**:

- Doctor `bacsi2` (employee_id: 2) logged in
- Clinical record ID 1 belongs to appointment with doctor_id = 1 (different doctor)

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi2","password":"123456"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X POST "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg" \
  -F "attachmentType=XRAY"
```

**Expected Response**: `403 Forbidden` - `ACCESS_DENIED`

---

### Test Case 6: Upload Consent Form as Admin (Success)

**Pre-conditions**:

- Admin logged in
- Valid PDF file < 10 MB

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X POST "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@consent_form.pdf" \
  -F "attachmentType=CONSENT_FORM" \
  -F "description=Signed consent for dental implant"
```

**Expected Response**: `201 Created` with attachment details

---

## Implementation Notes

### File Storage Strategy

**Current**: Local filesystem storage

- Directory: `uploads/clinical-records/{recordId}/`
- Filename format: `{yyyyMMdd_HHmmss}_{sanitized_original_name}`
- Example: `uploads/clinical-records/1/20251202_143022_xray_image.jpg`

**TODO**: Migrate to S3/Cloud storage in production

- Add environment variable `STORAGE_TYPE=s3`
- Add S3 configuration: bucket name, region, credentials
- Update `FileStorageService` to support both local and S3
- Store S3 URL in `file_path` column

### Security Considerations

1. **Path Traversal Prevention**: Filename sanitization removes `../` and special characters
2. **MIME Type Validation**: Checks `Content-Type` header
3. **File Size Limit**: 10 MB max (configurable via `application.yaml`)
4. **RBAC Check**: Same access control as viewing clinical records

### Related APIs

- **API 8.1**: GET clinical record (check if record exists before upload)
- **API 8.12**: GET attachments list (view uploaded files)
- **API 8.13**: DELETE attachment (remove if upload nhầm)

---

## Seed Data for Testing

### Clinical Records (from seed-data.sql)

| Record ID | Appointment ID | Doctor ID | Patient ID | Created At          |
| --------- | -------------- | --------- | ---------- | ------------------- |
| 1         | 1              | 1         | 1          | 2025-12-01 10:00:00 |
| 2         | 2              | 2         | 2          | 2025-12-01 14:00:00 |

### Test Users

| Username | Password | Role         | Employee ID | Notes                   |
| -------- | -------- | ------------ | ----------- | ----------------------- |
| admin    | admin123 | ROLE_ADMIN   | NULL        | Full access             |
| bacsi1   | 123456   | ROLE_DENTIST | 1           | Doctor for record 1     |
| bacsi2   | 123456   | ROLE_DENTIST | 2           | Doctor for record 2     |
| ytá1     | 123456   | ROLE_NURSE   | 8           | Can view, cannot upload |

---

## Changelog

| Version | Date       | Author   | Changes                   |
| ------- | ---------- | -------- | ------------------------- |
| 1.0     | 2025-12-02 | AI Agent | Initial API specification |

---

## TODO

- [ ] Implement S3 storage integration
- [ ] Add file download endpoint (API 8.14)
- [ ] Add thumbnail generation for images
- [ ] Add virus scanning for uploaded files
- [ ] Add file expiration policy (archive old files)
