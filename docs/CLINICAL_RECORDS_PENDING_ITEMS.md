# Clinical Records - Pending Items & Backend Requirements

## 📋 Tổng Quan

Tài liệu này ghi chú các items còn pending trong module Clinical Records, cần làm rõ với Backend team về APIs và requirements.

---

## 🔴 Pending Item #1: Prescription Management (Kê Đơn Thuốc)

### Vấn Đề Hiện Tại

**Frontend Status:**
- ✅ `PrescriptionList` component đã được tạo (read-only)
- ✅ Hiển thị prescriptions từ API 8.1 response
- ❌ **Chưa có form để tạo/sửa prescriptions**
- ❌ **Chưa có API service methods cho prescriptions**

**User Question:**
> "Làm sao để có thể kê đơn thuốc?"

### APIs Cần Làm Rõ Với Backend

#### 1. **API để Tạo Prescription (Kê Đơn Thuốc)**

**Cần xác nhận:**
- Endpoint: `POST /api/v1/appointments/clinical-records/{recordId}/prescriptions`?
- Hoặc: `POST /api/v1/clinical-records/{recordId}/prescriptions`?
- Request body structure?
- Authorization: `WRITE_CLINICAL_RECORD`?

**Expected Request:**
```typescript
interface CreatePrescriptionRequest {
  prescriptionNotes?: string; // Ghi chú đơn thuốc
  items: CreatePrescriptionItemRequest[]; // Danh sách thuốc
}

interface CreatePrescriptionItemRequest {
  itemId: number; // ID của item master từ warehouse
  quantity: number; // Số lượng
  dosageInstructions?: string; // Hướng dẫn sử dụng
}
```

**Expected Response:**
```typescript
interface CreatePrescriptionResponse {
  prescriptionId: number;
  clinicalRecordId: number;
  prescriptionNotes?: string;
  items: PrescriptionItemDTO[];
  createdAt: string;
}
```

#### 2. **API để Cập Nhật Prescription**

**Cần xác nhận:**
- Endpoint: `PUT /api/v1/appointments/clinical-records/{recordId}/prescriptions/{prescriptionId}`?
- Có thể update items không? (thêm/sửa/xóa items)
- Hoặc chỉ update `prescriptionNotes`?

#### 3. **API để Xóa Prescription**

**Cần xác nhận:**
- Endpoint: `DELETE /api/v1/appointments/clinical-records/{recordId}/prescriptions/{prescriptionId}`?
- Soft delete hay hard delete?
- Có thể xóa items riêng lẻ không?

#### 4. **API để Lấy Prescriptions (nếu cần riêng)**

**Note:** Hiện tại API 8.1 đã trả về `prescriptions[]` trong response, nhưng nếu cần:
- Endpoint: `GET /api/v1/appointments/clinical-records/{recordId}/prescriptions`?

### Business Rules Cần Xác Nhận

1. **Item Selection:**
   - Prescription items có phải lấy từ `warehouse/item-masters` không?
   - Có cần check stock availability không?
   - Có cần link với treatment plan items không?

2. **Validation:**
   - `quantity` có minimum/maximum không?
   - `dosageInstructions` có format/validation gì không?
   - Có thể tạo prescription rỗng (không có items) không?

3. **Permissions:**
   - Ai có thể kê đơn thuốc? (Doctor, Admin?)
   - Patient có thể xem nhưng không edit?

### Frontend Implementation Plan (Sau khi có API)

1. **Tạo `PrescriptionForm` component:**
   - Form để tạo/sửa prescription
   - Item selection từ warehouse
   - Quantity và dosage instructions input
   - Add/remove items dynamically

2. **Update `PrescriptionList` component:**
   - Thêm Edit/Delete buttons (nếu có quyền)
   - Integrate với `PrescriptionForm`

3. **Update `clinicalRecordService.ts`:**
   - `createPrescription(recordId, request)`
   - `updatePrescription(recordId, prescriptionId, request)`
   - `deletePrescription(recordId, prescriptionId)`

---

## 🔴 Pending Item #2: Attachment Management (File Đính Kèm)

### Vấn Đề Hiện Tại

**Frontend Status:**
- ❌ `AttachmentList` component chưa được tạo
- ❌ Chưa có UI để upload/view/delete attachments

**APIs Đã Được Document:**
- ✅ API 8.11: `POST /api/v1/clinical-records/{recordId}/attachments` - Upload file
- ✅ API 8.12: `GET /api/v1/clinical-records/{recordId}/attachments` - Lấy danh sách attachments
- ✅ API 8.13: `DELETE /api/v1/attachments/{attachmentId}` - Xóa attachment

### APIs Cần Làm Rõ Với Backend

#### 1. **Upload File API (API 8.11)**

**Cần xác nhận:**
- Request format: `multipart/form-data`?
- Field names: `file`, `attachmentType`, `description`?
- File size limits?
- Allowed file types? (images, PDF, etc.)
- Response structure?

**Expected Request:**
```typescript
FormData {
  file: File;
  attachmentType: 'XRAY' | 'PHOTO' | 'DOCUMENT' | 'OTHER';
  description?: string;
}
```

**Expected Response:**
```typescript
interface UploadAttachmentResponse {
  attachmentId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string; // URL để download/view
  attachmentType: AttachmentType;
  uploadedAt: string;
}
```

#### 2. **Get Attachments API (API 8.12)**

**Cần xác nhận:**
- Response structure?
- Có pagination không?
- `fileUrl` có phải là full URL hay relative path?

#### 3. **Delete Attachment API (API 8.13)**

**Cần xác nhận:**
- Authorization: `DELETE_ATTACHMENT` permission?
- Soft delete hay hard delete?
- Có thể restore không?

### Business Rules Cần Xác Nhận

1. **File Storage:**
   - Files được lưu ở đâu? (Local storage, S3, etc.)
   - `fileUrl` format như thế nào?
   - Có cần authentication để access files không?

2. **File Types:**
   - XRAY: Chỉ images? (DICOM, JPG, PNG?)
   - PHOTO: JPG, PNG?
   - DOCUMENT: PDF, DOCX?
   - File size limits cho từng type?

3. **Permissions:**
   - Ai có thể upload? (`UPLOAD_ATTACHMENT` permission?)
   - Ai có thể xem? (Same as Clinical Record view permissions?)
   - Ai có thể xóa? (`DELETE_ATTACHMENT` permission?)

### Frontend Implementation Plan

1. **Tạo `AttachmentList` component:**
   - Hiển thị danh sách attachments với preview
   - Upload button (nếu có quyền)
   - View/Download buttons
   - Delete button (nếu có quyền)

2. **Tạo `AttachmentUpload` component:**
   - File picker
   - Attachment type selector
   - Description input
   - Progress indicator

3. **Tạo `attachmentService.ts`:**
   - `uploadAttachment(recordId, formData)`
   - `getAttachments(recordId)`
   - `deleteAttachment(attachmentId)`
   - `getAttachmentUrl(attachmentId)` - helper để get download URL

4. **Integrate vào `ClinicalRecordView`:**
   - Thêm section "File Đính Kèm"
   - Lazy load attachments khi tab active

---

## 🔴 Pending Item #3: Standalone Clinical Records Page

### Vấn Đề Hiện Tại

**Frontend Status:**
- ✅ Clinical Records đã tích hợp vào Appointment Detail (tab)
- ❌ Chưa có standalone page để xem lịch sử Clinical Records

**Use Cases:**
1. Patient xem tất cả bệnh án của mình trong một danh sách
2. Doctor/Admin xem lịch sử Clinical Records của một patient
3. Search/filter Clinical Records across multiple appointments

### APIs Cần Với Backend

#### 1. **API để List Clinical Records**

**Cần xác nhận:**
- Endpoint: `GET /api/v1/patients/{patientId}/clinical-records`?
- Hoặc: `GET /api/v1/clinical-records?patientId={patientId}`?
- Có pagination không?
- Có search/filter không?

**Expected Request:**
```typescript
interface GetClinicalRecordsRequest {
  patientId?: number;
  patientCode?: string;
  doctorId?: number;
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
  diagnosis?: string; // search term
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
```

**Expected Response:**
```typescript
interface ClinicalRecordSummaryDTO {
  clinicalRecordId: number;
  appointmentId: number;
  appointmentCode: string;
  appointmentDate: string;
  diagnosis: string;
  doctorName: string;
  patientName: string;
  createdAt: string;
  // Summary info only, not full details
}

interface ClinicalRecordsListResponse {
  content: ClinicalRecordSummaryDTO[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
```

#### 2. **Search/Filter Capabilities**

**Cần xác nhận:**
- Có thể search theo diagnosis không?
- Có thể filter theo date range không?
- Có thể filter theo doctor không?
- Có thể filter theo procedures/prescriptions không?

### Business Rules Cần Xác Nhận

1. **Permissions:**
   - Patient: Chỉ xem records của mình?
   - Doctor: Xem records của patients mình đã khám?
   - Admin: Xem tất cả records?

2. **Data Privacy:**
   - Có cần consent để xem historical records không?
   - Có audit log cho việc access records không?

3. **Performance:**
   - List API có nên return summary only (không include procedures/prescriptions) không?
   - Detail API vẫn dùng API 8.1?

### Frontend Implementation Plan (Sau khi có API)

1. **Tạo `/patient/clinical-records` page:**
   - List view với pagination
   - Search/filter UI
   - Click vào record → navigate to appointment detail

2. **Tạo `/admin/patients/[patientCode]/clinical-records` page:**
   - Similar to patient page but for admin view
   - Additional filters (doctor, date range)

3. **Update navigation:**
   - Add link từ Patient Profile
   - Add link từ Appointment List

---

## 📝 Summary - Questions for Backend Team

### Prescription Management
1. ✅ Có API để tạo prescription không? Endpoint và request format?
2. ✅ Có API để update/delete prescription không?
3. ✅ Prescription items lấy từ warehouse không?
4. ✅ Business rules và validation rules?

### Attachment Management
1. ✅ Upload API request format (multipart/form-data)?
2. ✅ File size limits và allowed types?
3. ✅ File storage location và URL format?
4. ✅ Permissions cho upload/delete?

### Standalone Page
1. ✅ Có API để list Clinical Records theo patient không?
2. ✅ Có search/filter capabilities không?
3. ✅ Response structure và pagination?

---

## 🎯 Priority

1. **High Priority:**
   - Prescription Management APIs (user cần kê đơn thuốc)
   - Attachment Management APIs (cần upload X-ray, images)

2. **Medium Priority:**
   - Standalone Clinical Records List API (nice to have, có thể làm sau)

---

**Last Updated:** 2025-12-03
**Status:** Pending Backend Confirmation

