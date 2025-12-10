# API 8.13: Delete Attachment

## Overview

**Purpose**: Delete a file attachment from clinical record

**Endpoint**: `DELETE /api/v1/attachments/{attachmentId}`

**Authorization**: `DELETE_ATTACHMENT` permission (Doctor, Admin)

---

## Business Rules

1. Attachment must exist (404 if not found)
2. Only Admin or uploader can delete (403 if not authorized)
3. File deleted from both database and filesystem
4. Deletion is permanent (no soft delete)
5. Returns 204 No Content on success (no response body)

---

## Request

### Path Parameters

| Parameter    | Type    | Required | Description   |
| ------------ | ------- | -------- | ------------- |
| attachmentId | Integer | Yes      | Attachment ID |

### Example Request (cURL)

```bash
# Delete attachment as uploader (Doctor)
curl -X DELETE "http://localhost:8080/api/v1/attachments/1" \
  -H "Authorization: Bearer {{doctor_token}}"

# Delete attachment as Admin
curl -X DELETE "http://localhost:8080/api/v1/attachments/1" \
  -H "Authorization: Bearer {{admin_token}}"
```

---

## Response

### Success Response (204 No Content)

```
HTTP/1.1 204 No Content
```

No response body. Status code 204 indicates successful deletion.

---

## Error Responses

### 404 Not Found - Attachment Not Found

```json
{
  "statusCode": 404,
  "message": "Attachment not found with ID: 999",
  "error": "ATTACHMENT_NOT_FOUND"
}
```

### 403 Forbidden - Not the Uploader

```json
{
  "statusCode": 403,
  "message": "You can only delete attachments that you uploaded",
  "error": "DELETE_DENIED"
}
```

---

## Authorization & RBAC

### Required Permission

- `DELETE_ATTACHMENT`

### Roles with Permission

| Role   | Permission        | Access Level                |
| ------ | ----------------- | --------------------------- |
| Admin  | DELETE_ATTACHMENT | Can delete any attachment   |
| Doctor | DELETE_ATTACHMENT | Can only delete own uploads |

### Business Logic

Delete is allowed if:

1. User is **Admin** (`ROLE_ADMIN`): Can delete any attachment
2. User is **uploader** (`uploaded_by = current_employee_id`): Can delete own uploads

**Important**: Unlike VIEW/UPLOAD APIs, DELETE does NOT check appointment ownership. It only checks uploader ownership.

---

## Test Scenarios

### Test Case 1: Delete Own Attachment as Doctor (Success)

**Pre-conditions**:

- Doctor `bacsi1` (employee_id: 1) logged in
- Attachment ID 1 exists with `uploaded_by = 1`

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"123456"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X DELETE "http://localhost:8080/api/v1/attachments/1" \
  -H "Authorization: Bearer $TOKEN" -v
```

**Expected Response**: `204 No Content`

**Verification**:

```bash
# Try to get attachments list again
curl -X GET "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" | jq
# Should show 1 less attachment
```

---

### Test Case 2: Delete Other Doctor's Attachment (Forbidden)

**Pre-conditions**:

- Doctor `bacsi2` (employee_id: 2) logged in
- Attachment ID 1 exists with `uploaded_by = 1` (different doctor)

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi2","password":"123456"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X DELETE "http://localhost:8080/api/v1/attachments/1" \
  -H "Authorization: Bearer $TOKEN" -v
```

**Expected Response**: `403 Forbidden` - `DELETE_DENIED`

---

### Test Case 3: Delete Attachment as Admin (Success)

**Pre-conditions**:

- Admin logged in
- Any attachment exists (any uploader)

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X DELETE "http://localhost:8080/api/v1/attachments/1" \
  -H "Authorization: Bearer $TOKEN" -v
```

**Expected Response**: `204 No Content`

---

### Test Case 4: Delete Non-Existent Attachment (Not Found)

**Pre-conditions**:

- Doctor logged in
- Attachment ID 999 does not exist

**Request**:

```bash
curl -X DELETE "http://localhost:8080/api/v1/attachments/999" \
  -H "Authorization: Bearer $TOKEN" -v
```

**Expected Response**: `404 Not Found` - `ATTACHMENT_NOT_FOUND`

---

### Test Case 5: Delete Without Permission (Forbidden)

**Pre-conditions**:

- Nurse `yta1` logged in (has VIEW_ATTACHMENT but NOT DELETE_ATTACHMENT)
- Attachment ID 1 exists

**Request**:

```bash
TOKEN=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"yta1","password":"123456"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X DELETE "http://localhost:8080/api/v1/attachments/1" \
  -H "Authorization: Bearer $TOKEN" -v
```

**Expected Response**: `403 Forbidden` (Spring Security @PreAuthorize check fails)

---

### Test Case 6: Re-upload After Delete (Success)

**Pre-conditions**:

- Doctor deleted attachment ID 1
- Same file needs to be re-uploaded

**Request**:

```bash
# Step 1: Delete
curl -X DELETE "http://localhost:8080/api/v1/attachments/1" \
  -H "Authorization: Bearer $TOKEN"

# Step 2: Re-upload same file
curl -X POST "http://localhost:8080/api/v1/clinical-records/1/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@xray_corrected.jpg" \
  -F "attachmentType=XRAY" \
  -F "description=Corrected X-ray image"
```

**Expected Response**:

- Step 1: `204 No Content`
- Step 2: `201 Created` with new attachment ID (e.g., ID 4)

---

## Implementation Notes

### Deletion Process

1. **Validate existence**: Check if attachment exists in database
2. **Check permission**: Verify user is Admin or uploader
3. **Delete file**: Remove file from filesystem using `FileStorageService.deleteFile()`
4. **Delete record**: Remove database row
5. **Return 204**: No content on success

### Error Handling

- If file deletion fails: Log error but continue with database deletion
- If database deletion fails: Transaction rollback (file remains on disk - manual cleanup needed)
- TODO: Add cleanup job for orphaned files

### Cascade Deletion

- If clinical record is deleted: All attachments automatically deleted (CASCADE)
- This triggers file cleanup via JPA `@PreRemove` hook (future enhancement)

### Security Considerations

1. **No cross-record deletion**: User cannot delete attachments from other doctors' records
2. **No patient deletion**: Patients cannot delete attachments (no DELETE_ATTACHMENT permission)
3. **Admin oversight**: Only Admin can delete any attachment for data correction

### Related APIs

- **API 8.11**: POST upload attachment (upload new file after deletion)
- **API 8.12**: GET attachments list (verify deletion worked)
- **Future API 8.14**: PUT update attachment description (instead of delete+re-upload)

---

## Seed Data for Testing

### Test Attachments (created via API 8.11)

| Attachment ID | Record ID | File Name        | Type         | Uploaded By | Created At          |
| ------------- | --------- | ---------------- | ------------ | ----------- | ------------------- |
| 1             | 1         | xray_initial.jpg | XRAY         | 1           | 2025-12-02 10:15:00 |
| 2             | 1         | consent_form.pdf | CONSENT_FORM | 1           | 2025-12-02 14:30:00 |
| 3             | 1         | xray_after.jpg   | PHOTO_AFTER  | 1           | 2025-12-02 15:45:00 |

### Test Users

| Username | Password | Role         | Employee ID | Has DELETE_ATTACHMENT |
| -------- | -------- | ------------ | ----------- | --------------------- |
| admin    | admin123 | ROLE_ADMIN   | NULL        | Yes                   |
| bacsi1   | 123456   | ROLE_DENTIST | 1           | Yes                   |
| bacsi2   | 123456   | ROLE_DENTIST | 2           | Yes                   |
| yta1     | 123456   | ROLE_NURSE   | 8           | No                    |

---

## Changelog

| Version | Date       | Author   | Changes                   |
| ------- | ---------- | -------- | ------------------------- |
| 1.0     | 2025-12-02 | AI Agent | Initial API specification |

---

## Frontend Integration Example

```typescript
// React component example
const AttachmentCard = ({ attachment, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${attachment.fileName}?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/v1/attachments/${attachment.attachmentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 204) {
        onDelete(attachment.attachmentId);
        toast.success("File deleted successfully");
      } else if (res.status === 403) {
        toast.error("You can only delete files you uploaded");
      }
    } catch (error) {
      toast.error("Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="attachment-card">
      <img src={attachment.filePath} alt={attachment.fileName} />
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="delete-btn"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
};
```

---

## TODO

- [ ] Add soft delete option (mark as deleted instead of hard delete)
- [ ] Add deletion audit log
- [ ] Add file restore functionality (undelete)
- [ ] Add bulk delete endpoint
- [ ] Add JPA @PreRemove hook for automatic file cleanup
