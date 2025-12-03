# Kế Hoạch Tích Hợp Module Clinical Records (Bệnh Án)

## 📋 Tổng Quan

Module Clinical Records cho phép quản lý bệnh án của bệnh nhân trong mỗi lần khám. Module này bao gồm:
- **Clinical Record**: Thông tin chính của bệnh án (chẩn đoán, triệu chứng, dấu hiệu sinh tồn)
- **Procedures**: Các thủ thuật/dịch vụ đã thực hiện
- **Prescriptions**: Đơn thuốc đã kê
- **Tooth Status**: Trạng thái răng (Odontogram)
- **Attachments**: File đính kèm (X-ray, hình ảnh)

---

## 🎯 Mục Tiêu

1. Tích hợp Clinical Records vào Appointment Detail pages
2. Cho phép bác sĩ tạo/sửa bệnh án trong quá trình khám
3. Hiển thị lịch sử bệnh án cho bệnh nhân
4. Quản lý procedures, prescriptions, và attachments
5. Hiển thị Odontogram (sơ đồ răng) với trạng thái răng

---

## 📚 APIs Có Sẵn

### Core Clinical Records
- **API 8.1**: `GET /api/v1/appointments/{appointmentId}/clinical-record` - Lấy bệnh án theo appointment
- **API 8.2**: `POST /api/v1/clinical-records` - Tạo bệnh án mới
- **API 8.3**: `PUT /api/v1/clinical-records/{recordId}` - Cập nhật bệnh án

### Procedures
- **API 8.4**: `GET /api/v1/appointments/clinical-records/{recordId}/procedures` - Lấy danh sách procedures
- **API 8.5**: `POST /api/v1/appointments/clinical-records/{recordId}/procedures` - Thêm procedure
- **API 8.6**: `PUT /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}` - Sửa procedure
- **API 8.7**: `DELETE /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}` - Xóa procedure

### Tooth Status (Odontogram)
- **API 8.9**: `GET /api/v1/patients/{patientId}/tooth-status` - Lấy trạng thái răng
- **API 8.10**: `PUT /api/v1/patients/{patientId}/tooth-status` - Cập nhật trạng thái răng

### Attachments
- **API 8.11**: `POST /api/v1/clinical-records/{recordId}/attachments` - Upload file
- **API 8.12**: `GET /api/v1/clinical-records/{recordId}/attachments` - Lấy danh sách attachments
- **API 8.13**: `DELETE /api/v1/attachments/{attachmentId}` - Xóa attachment

---

## 🔐 RBAC & Permissions

### View Permissions
- `ROLE_ADMIN`: Xem tất cả bệnh án
- `VIEW_APPOINTMENT_ALL`: Xem tất cả bệnh án (Receptionist, Manager)
- `VIEW_APPOINTMENT_OWN`: Xem bệnh án liên quan (Doctor xem của mình, Patient xem của mình)

### Write Permissions
- `WRITE_CLINICAL_RECORD`: Tạo/sửa bệnh án (Doctor, Admin)
- `UPLOAD_ATTACHMENT`: Upload file (Doctor, Admin)
- `DELETE_ATTACHMENT`: Xóa file (Doctor, Admin)

---

## 📁 Cấu Trúc Files Cần Tạo

```
src/
├── types/
│   └── clinicalRecord.ts          # TypeScript interfaces
├── services/
│   ├── clinicalRecordService.ts   # API service cho clinical records
│   ├── toothStatusService.ts      # API service cho tooth status
│   └── attachmentService.ts       # API service cho attachments
├── components/
│   └── clinical-records/
│       ├── ClinicalRecordView.tsx        # Component hiển thị bệnh án (read-only)
│       ├── ClinicalRecordForm.tsx        # Form tạo/sửa bệnh án
│       ├── ProcedureList.tsx              # Danh sách procedures
│       ├── ProcedureForm.tsx              # Form thêm/sửa procedure
│       ├── PrescriptionList.tsx           # Danh sách đơn thuốc
│       ├── Odontogram.tsx                 # Sơ đồ răng (tooth chart)
│       ├── ToothStatusForm.tsx            # Form cập nhật trạng thái răng
│       ├── AttachmentList.tsx             # Danh sách attachments
│       └── VitalSignsForm.tsx             # Form nhập dấu hiệu sinh tồn
└── app/
    ├── admin/
    │   └── booking/
    │       └── appointments/
    │           └── [appointmentCode]/
    │               └── page.tsx           # Thêm tab "Bệnh Án"
    ├── employee/
    │   └── booking/
    │       └── appointments/
    │           └── [appointmentCode]/
    │               └── page.tsx           # Thêm tab "Bệnh Án"
    └── patient/
        └── appointments/
            └── [appointmentCode]/
                └── page.tsx               # Thêm tab "Bệnh Án" (read-only)
```

---

## 🗂️ Phase 1: TypeScript Types & Services

### 1.1 Types (`src/types/clinicalRecord.ts`)

```typescript
// Clinical Record Types
export interface ClinicalRecordResponse {
  clinicalRecordId: number;
  diagnosis: string;
  vitalSigns?: Record<string, any>; // JSONB - flexible structure
  chiefComplaint: string;
  examinationFindings: string;
  treatmentNotes?: string;
  createdAt: string;
  updatedAt: string;
  appointment: AppointmentDTO;
  doctor: DoctorDTO;
  patient: PatientDTO;
  procedures: ProcedureDTO[];
  prescriptions: PrescriptionDTO[];
}

export interface CreateClinicalRecordRequest {
  appointmentId: number;
  chiefComplaint: string; // 1-1000 chars
  examinationFindings: string; // 1-2000 chars
  diagnosis: string; // 1-500 chars
  treatmentNotes?: string; // max 2000 chars
  followUpDate?: string; // yyyy-MM-dd
  vitalSigns?: Record<string, any>;
}

export interface UpdateClinicalRecordRequest {
  examinationFindings?: string; // max 2000 chars
  treatmentNotes?: string; // max 2000 chars
  followUpDate?: string; // yyyy-MM-dd
  vitalSigns?: Record<string, any>;
}

// Procedure Types
export interface ProcedureDTO {
  procedureId: number;
  serviceCode?: string;
  serviceName?: string;
  patientPlanItemId?: number;
  toothNumber?: string;
  procedureDescription: string;
  notes?: string;
  createdAt: string;
}

export interface AddProcedureRequest {
  serviceId: number; // Required
  patientPlanItemId?: number;
  toothNumber?: string; // max 10 chars
  procedureDescription: string; // 3-1000 chars
  notes?: string; // max 1000 chars
}

export interface UpdateProcedureRequest {
  serviceId?: number;
  toothNumber?: string;
  procedureDescription?: string;
  notes?: string;
}

// Prescription Types
export interface PrescriptionDTO {
  prescriptionId: number;
  prescriptionNotes?: string;
  createdAt: string;
  items: PrescriptionItemDTO[];
}

export interface PrescriptionItemDTO {
  prescriptionItemId: number;
  itemCode?: string;
  itemName: string;
  quantity: number;
  dosageInstructions?: string;
  createdAt: string;
}

// Tooth Status Types
export interface ToothStatusResponse {
  toothStatusId: number;
  patientId: number;
  toothNumber: string; // FDI notation: "11", "18", "36", etc.
  status: ToothCondition;
  notes?: string;
  recordedAt: string;
  updatedAt?: string;
}

export type ToothCondition =
  | 'HEALTHY'
  | 'CARIES'
  | 'FILLING'
  | 'CROWN'
  | 'ROOT_CANAL'
  | 'EXTRACTED'
  | 'MISSING'
  | 'IMPLANT'
  | 'BRIDGE'
  | 'ORTHODONTIC';

export interface UpdateToothStatusRequest {
  toothNumber: string;
  status: ToothCondition;
  notes?: string;
}

// Attachment Types
export interface AttachmentResponse {
  attachmentId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  attachmentType: AttachmentType;
  uploadedAt: string;
}

export type AttachmentType = 'XRAY' | 'PHOTO' | 'DOCUMENT' | 'OTHER';
```

### 1.2 Services

#### `src/services/clinicalRecordService.ts`
- `getClinicalRecord(appointmentId: number)`
- `createClinicalRecord(request: CreateClinicalRecordRequest)`
- `updateClinicalRecord(recordId: number, request: UpdateClinicalRecordRequest)`
- `getProcedures(recordId: number)`
- `addProcedure(recordId: number, request: AddProcedureRequest)`
- `updateProcedure(recordId: number, procedureId: number, request: UpdateProcedureRequest)`
- `deleteProcedure(recordId: number, procedureId: number)`

#### `src/services/toothStatusService.ts`
- `getToothStatus(patientId: number)`
- `updateToothStatus(patientId: number, request: UpdateToothStatusRequest)`

#### `src/services/attachmentService.ts`
- `uploadAttachment(recordId: number, file: File, type: AttachmentType)`
- `getAttachments(recordId: number)`
- `deleteAttachment(attachmentId: number)`

---

## 🎨 Phase 2: UI Components

### 2.1 ClinicalRecordView Component
**Purpose**: Hiển thị bệnh án (read-only)
**Features**:
- Hiển thị thông tin appointment, doctor, patient
- Hiển thị chief complaint, diagnosis, examination findings
- Hiển thị vital signs (blood pressure, pulse, temperature, etc.)
- Hiển thị treatment notes
- Hiển thị procedures list (link to ProcedureList component)
- Hiển thị prescriptions list (link to PrescriptionList component)
- Hiển thị attachments (link to AttachmentList component)
- Button "Chỉnh sửa" (nếu có permission `WRITE_CLINICAL_RECORD`)

### 2.2 ClinicalRecordForm Component
**Purpose**: Form tạo/sửa bệnh án
**Fields**:
- `chiefComplaint` (Textarea, required, 1-1000 chars)
- `examinationFindings` (Textarea, required, 1-2000 chars)
- `diagnosis` (Textarea, required, 1-500 chars)
- `treatmentNotes` (Textarea, optional, max 2000 chars)
- `followUpDate` (Date picker, optional)
- `vitalSigns` (Dynamic form - blood pressure, pulse, temperature, weight, etc.)

**Validation**:
- Client-side validation matching BE constraints
- Show character count for text fields
- Validate date format

### 2.3 ProcedureList Component
**Purpose**: Hiển thị danh sách procedures đã thực hiện
**Features**:
- Table với columns: Service Name, Tooth Number, Description, Notes, Created At
- Button "Thêm Procedure" (nếu có permission)
- Button "Sửa" và "Xóa" cho mỗi procedure (nếu có permission)
- Link đến treatment plan item (nếu có `patientPlanItemId`)

### 2.4 ProcedureForm Component
**Purpose**: Form thêm/sửa procedure
**Fields**:
- `serviceId` (Select dropdown - load từ service catalog, required)
- `patientPlanItemId` (Select dropdown - load từ treatment plan items, optional)
- `toothNumber` (Input, optional, max 10 chars)
- `procedureDescription` (Textarea, required, 3-1000 chars)
- `notes` (Textarea, optional, max 1000 chars)

**Validation**:
- Service must exist and be active
- If `patientPlanItemId` provided, must exist
- Character limits

### 2.5 PrescriptionList Component
**Purpose**: Hiển thị danh sách đơn thuốc
**Features**:
- List of prescriptions with items
- Display: Item Name, Quantity, Dosage Instructions
- Read-only (prescriptions managed separately - future API)

### 2.6 Odontogram Component
**Purpose**: Hiển thị sơ đồ răng (dental chart)
**Features**:
- Visual representation of 32 teeth (FDI notation)
- Color coding based on tooth condition:
  - HEALTHY: Green/White
  - CARIES: Red
  - FILLING: Blue
  - CROWN: Yellow
  - EXTRACTED/MISSING: Gray
  - IMPLANT: Purple
  - etc.
- Click on tooth to view/edit status
- Tooltip showing tooth number and status
- Button "Cập nhật trạng thái răng" (nếu có permission)

### 2.7 ToothStatusForm Component
**Purpose**: Form cập nhật trạng thái răng
**Fields**:
- `toothNumber` (Select dropdown - 32 teeth)
- `status` (Select dropdown - ToothCondition enum)
- `notes` (Textarea, optional)

### 2.8 AttachmentList Component
**Purpose**: Hiển thị và quản lý file đính kèm
**Features**:
- Grid/list of attachments
- Display: File name, type, size, upload date
- Preview for images (X-ray, photos)
- Download button
- Delete button (nếu có permission)
- Upload button (nếu có permission)

---

## 🔗 Phase 3: Integration vào Appointment Pages

### 3.1 Admin Appointment Detail Page
**File**: `src/app/admin/booking/appointments/[appointmentCode]/page.tsx`
**Changes**:
- Thêm tab "Bệnh Án" vào TabsList
- TabsContent cho "Bệnh Án":
  - Load clinical record khi tab được chọn
  - Hiển thị ClinicalRecordView nếu có record
  - Hiển thị button "Tạo Bệnh Án" nếu chưa có record (và có permission)
  - Hiển thị Odontogram (load từ patientId)

### 3.2 Employee Appointment Detail Page
**File**: `src/app/employee/booking/appointments/[appointmentCode]/page.tsx`
**Changes**:
- Tương tự Admin page
- RBAC: Chỉ doctor của appointment mới có thể tạo/sửa

### 3.3 Patient Appointment Detail Page
**File**: `src/app/patient/appointments/[appointmentCode]/page.tsx`
**Changes**:
- Thêm tab "Bệnh Án" (read-only)
- Hiển thị ClinicalRecordView (không có button edit)
- Hiển thị Odontogram (read-only)

---

## 📝 Phase 4: Error Handling & Edge Cases

### 4.1 Error Scenarios
- **404 RECORD_NOT_FOUND**: Hiển thị button "Tạo Bệnh Án"
- **404 APPOINTMENT_NOT_FOUND**: Hiển thị error message
- **403 FORBIDDEN**: Hiển thị "Bạn không có quyền xem/sửa bệnh án này"
- **409 CONFLICT**: Record already exists - redirect to update form
- **400 VALIDATION_ERROR**: Hiển thị validation errors

### 4.2 Loading States
- Skeleton loaders cho clinical record
- Loading spinner khi upload attachment
- Optimistic updates cho procedures (add/delete)

### 4.3 Empty States
- "Chưa có bệnh án" khi appointment chưa có record
- "Chưa có procedure nào" trong ProcedureList
- "Chưa có file đính kèm" trong AttachmentList

---

## 🧪 Phase 5: Testing

### 5.1 Unit Tests
- Service methods với mock API responses
- Component rendering với different states
- Form validation logic

### 5.2 Integration Tests
- Test API calls với real backend
- Test RBAC permissions
- Test error handling

### 5.3 E2E Tests (Optional)
- Flow: Create appointment → Create clinical record → Add procedure → Upload attachment

---

## 📋 Implementation Checklist

### Phase 1: Foundation
- [ ] Tạo `src/types/clinicalRecord.ts` với tất cả interfaces
- [ ] Tạo `src/services/clinicalRecordService.ts`
- [ ] Tạo `src/services/toothStatusService.ts`
- [ ] Tạo `src/services/attachmentService.ts`
- [ ] Test services với backend API

### Phase 2: Core Components
- [ ] ClinicalRecordView component
- [ ] ClinicalRecordForm component
- [ ] ProcedureList component
- [ ] ProcedureForm component
- [ ] PrescriptionList component (read-only)
- [ ] VitalSignsForm component

### Phase 3: Advanced Components
- [ ] Odontogram component (tooth chart visualization)
- [ ] ToothStatusForm component
- [ ] AttachmentList component
- [ ] File upload component

### Phase 4: Integration
- [ ] Tích hợp vào Admin Appointment Detail page
- [ ] Tích hợp vào Employee Appointment Detail page
- [ ] Tích hợp vào Patient Appointment Detail page
- [ ] RBAC checks và permission handling

### Phase 5: Polish
- [ ] Error handling và user feedback
- [ ] Loading states và skeletons
- [ ] Empty states
- [ ] Responsive design
- [ ] Accessibility (ARIA labels, keyboard navigation)

---

## 🎨 UI/UX Guidelines

### Design System
- Sử dụng Shadcn UI components (Card, Button, Badge, Tabs, etc.)
- Follow existing theme colors và typography
- Consistent spacing và layout với các pages khác

### Vietnamese Labels
- "Bệnh Án" (Clinical Record)
- "Triệu Chứng Chính" (Chief Complaint)
- "Kết Quả Khám" (Examination Findings)
- "Chẩn Đoán" (Diagnosis)
- "Ghi Chú Điều Trị" (Treatment Notes)
- "Dấu Hiệu Sinh Tồn" (Vital Signs)
- "Thủ Thuật" (Procedures)
- "Đơn Thuốc" (Prescriptions)
- "Sơ Đồ Răng" (Odontogram)
- "File Đính Kèm" (Attachments)

### Color Coding (Odontogram)
- HEALTHY: `#10b981` (green)
- CARIES: `#ef4444` (red)
- FILLING: `#3b82f6` (blue)
- CROWN: `#f59e0b` (yellow)
- EXTRACTED/MISSING: `#6b7280` (gray)
- IMPLANT: `#8b5cf6` (purple)
- ROOT_CANAL: `#ec4899` (pink)
- BRIDGE: `#14b8a6` (teal)
- ORTHODONTIC: `#6366f1` (indigo)

---

## 📚 References

- API Documentation: `docs/api-guide/clinical-records/`
- Backend Files: `files_from_BE/clinical_records/`
- Existing Appointment Pages: `src/app/*/booking/appointments/[appointmentCode]/page.tsx`

---

## 🚀 Next Steps

1. **Start with Phase 1**: Tạo types và services
2. **Build Core Components**: ClinicalRecordView và ClinicalRecordForm
3. **Integrate into Appointment Pages**: Thêm tab "Bệnh Án"
4. **Add Advanced Features**: Odontogram, Attachments
5. **Polish & Test**: Error handling, loading states, responsive design

---

**Created**: 2025-12-02
**Last Updated**: 2025-12-02

