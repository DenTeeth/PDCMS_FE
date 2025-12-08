# Patient Image Management System

## 🎯 Tổng quan

Hệ thống quản lý hình ảnh bệnh nhân cho phép nha sĩ upload, lưu trữ và quản lý hình ảnh của từng bệnh nhân một cách có tổ chức. **Mỗi bệnh nhân có folder riêng trên Cloudinary** để dễ dàng quản lý và theo dõi.

## ✨ Tính năng chính

- ✅ **Upload hình ảnh** với drag & drop interface
- ✅ **Phân loại hình ảnh** (X-quang, ảnh chụp, trước/sau điều trị, v.v.)
- ✅ **Folder riêng cho từng bệnh nhân** trên Cloudinary: `patients/patient_{patientId}/`
- ✅ **Gallery view** với pagination và filters
- ✅ **Lightbox** để xem full size
- ✅ **Download & Delete** hình ảnh
- ✅ **Liên kết với Clinical Records** (optional)
- ✅ **Metadata management** (mô tả, ngày chụp, loại hình ảnh)

## 📁 Cấu trúc Files

```
src/
├── types/
│   └── patientImage.ts                    # Types, enums, interfaces
├── services/
│   └── patientImageService.ts             # API service layer
└── components/
    └── clinical-records/
        ├── PatientImageUpload.tsx         # Upload component
        ├── PatientImageGallery.tsx        # Gallery component
        └── PatientImageManager.tsx        # Combined component (Upload + Gallery)

docs/
├── PATIENT_IMAGES_API_SPEC.md             # API documentation cho Backend
└── PATIENT_IMAGES_FRONTEND_GUIDE.md       # Hướng dẫn sử dụng cho Frontend
```

## 🚀 Quick Start

### Cách 1: Sử dụng PatientImageManager (Recommended)

```tsx
import PatientImageManager from "@/components/clinical-records/PatientImageManager";

function MyPage() {
  return (
    <PatientImageManager
      patientId={123}
      clinicalRecordId={456} // Optional
      showFilters={true}
    />
  );
}
```

### Cách 2: Sử dụng riêng lẻ components

```tsx
import PatientImageUpload from "@/components/clinical-records/PatientImageUpload";
import PatientImageGallery from "@/components/clinical-records/PatientImageGallery";

function MyPage() {
  return (
    <div>
      <PatientImageUpload
        patientId={123}
        onUploadSuccess={(image) => console.log("Uploaded:", image)}
      />

      <PatientImageGallery patientId={123} showFilters={true} />
    </div>
  );
}
```

## 📚 Documentation

| Document                                                               | Description                                                     | Audience                |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------- |
| [PATIENT_IMAGES_API_SPEC.md](./PATIENT_IMAGES_API_SPEC.md)             | Chi tiết API endpoints, database schema, Cloudinary integration | **Backend Developers**  |
| [PATIENT_IMAGES_FRONTEND_GUIDE.md](./PATIENT_IMAGES_FRONTEND_GUIDE.md) | Hướng dẫn sử dụng components, types, service methods            | **Frontend Developers** |

## 🌐 Cloudinary Folder Structure

Hệ thống tự động organize hình ảnh trên Cloudinary theo cấu trúc sau:

```
patients/
├── patient_123/
│   ├── xray/
│   │   ├── patient_123_1733667890_abc123.jpg
│   │   └── patient_123_1733667891_def456.jpg
│   ├── photo/
│   ├── before_treatment/
│   ├── after_treatment/
│   └── panoramic/
├── patient_456/
│   └── ...
```

**Lợi ích:**

- ✅ Dễ dàng tìm kiếm và quản lý hình ảnh của từng bệnh nhân
- ✅ Phân loại rõ ràng theo loại hình ảnh
- ✅ Không bị conflict public_id giữa các bệnh nhân
- ✅ Có thể dễ dàng export toàn bộ hình ảnh của 1 bệnh nhân

## 🔧 Components Overview

### 1. PatientImageUpload

Component để upload hình ảnh với features:

- Drag & drop interface
- File validation (type, size)
- Image preview
- Metadata input (type, description, captured date)
- Progress indicator

**Props:**

```typescript
{
  patientId: number;              // Required
  clinicalRecordId?: number;      // Optional
  onUploadSuccess?: (image) => void;
  onUploadError?: (error) => void;
  maxSizeMB?: number;            // Default: 10
  allowedTypes?: string[];       // Default: JPEG, PNG, GIF, WebP
}
```

### 2. PatientImageGallery

Component hiển thị gallery với features:

- Grid layout responsive
- Pagination
- Filters (type, date range)
- Lightbox view
- Download & Delete
- Image info overlay

**Props:**

```typescript
{
  patientId: number;              // Required
  clinicalRecordId?: number;      // Optional - filter by clinical record
  showFilters?: boolean;          // Default: true
  pageSize?: number;              // Default: 12
}
```

### 3. PatientImageManager

Component tích hợp Upload + Gallery:

- Upload section với button ở header
- Gallery section bên dưới
- Auto-refresh gallery sau khi upload thành công

**Props:**

```typescript
{
  patientId: number;              // Required
  clinicalRecordId?: number;      // Optional
  showFilters?: boolean;          // Default: true
}
```

## 🎨 Image Types

Hệ thống hỗ trợ 6 loại hình ảnh (simplified cho đồ án):

| Type               | Vietnamese Label | Description                     |
| ------------------ | ---------------- | ------------------------------- |
| `XRAY`             | X-quang          | X-quang chung                   |
| `PHOTO`            | Ảnh chụp         | Ảnh chụp thông thường           |
| `BEFORE_TREATMENT` | Trước điều trị   | Ảnh trước khi điều trị          |
| `AFTER_TREATMENT`  | Sau điều trị     | Ảnh sau khi hoàn thành điều trị |
| `SCAN`             | Scan tài liệu    | Scan tài liệu giấy tờ           |
| `OTHER`            | Khác             | Loại khác                       |

## 🔐 Permissions

Backend đã implement 4 permissions:

| Action          | Permission             | Assigned to                  |
| --------------- | ---------------------- | ---------------------------- |
| Upload image    | `PATIENT_IMAGE_CREATE` | Dentist, Admin               |
| View images     | `PATIENT_IMAGE_READ`   | Dentist, Admin, Receptionist |
| Update metadata | `PATIENT_IMAGE_UPDATE` | Dentist, Admin               |
| Delete image    | `PATIENT_IMAGE_DELETE` | Dentist, Admin               |

## 🛠️ Backend Implementation

✅ Backend đã hoàn thành implementation với 6 API endpoints:

```
POST   /api/v1/patient-images                            # Create image record
GET    /api/v1/patient-images/patient/{patientId}       # Get images (with filters)
GET    /api/v1/patient-images/{id}                       # Get single image
PUT    /api/v1/patient-images/{id}                       # Update metadata
DELETE /api/v1/patient-images/{id}                       # Delete image
GET    /api/v1/patient-images/clinical-record/{id}      # Get by clinical record
```

**Note:** BE chỉ xóa record trong database. FE có thể xóa file trên Cloudinary riêng nếu cần.

Chi tiết xem tại: [PATIENT_IMAGES_API_SPEC.md](./PATIENT_IMAGES_API_SPEC.md)

### Database Schema

```sql
CREATE TABLE patient_images (
    image_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    clinical_record_id BIGINT NULL,
    image_url VARCHAR(500) NOT NULL,
    cloudinary_public_id VARCHAR(200) NOT NULL UNIQUE,
    image_type VARCHAR(50) NOT NULL,
    description TEXT NULL,
    captured_date DATE NULL,
    uploaded_by BIGINT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_patient FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_clinical_record FOREIGN KEY (clinical_record_id)
        REFERENCES clinical_records(clinical_record_id) ON DELETE SET NULL
);
```

### Cloudinary Configuration

**Note:** Backend KHÔNG cần Cloudinary config. FE tự handle upload lên Cloudinary, BE chỉ lưu metadata.## 🔄 Data Flow

### Upload Flow

```
1. User chọn file trong PatientImageUpload component
2. FE validate file (type, size)
3. FE upload lên Cloudinary qua API route /api/upload/cloudinary
   - Cloudinary lưu file vào folder: patients/patient_{id}/{type}/
   - Trả về: { public_id, secure_url, ... }
4. FE gọi BE API POST /api/v1/patient-images với:
   - imageUrl, cloudinaryPublicId từ Cloudinary
   - metadata: patientId, imageType, description, capturedDate
5. BE lưu record vào database
6. FE nhận response và update gallery
```

### Delete Flow

```
1. User click Delete trong gallery
2. FE gọi BE API DELETE /api/v1/patient-images/{id}
3. BE:
   - Lấy cloudinaryPublicId từ database
   - Gọi Cloudinary API để xóa file
   - Xóa record trong database
4. FE refresh gallery
```

## 📊 Integration Examples

### Example 1: Trong Clinical Record Form

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientImageManager from "@/components/clinical-records/PatientImageManager";

function ClinicalRecordForm({ patientId, clinicalRecordId }) {
  return (
    <Tabs defaultValue="record">
      <TabsList>
        <TabsTrigger value="record">Hồ sơ</TabsTrigger>
        <TabsTrigger value="images">Hình ảnh</TabsTrigger>
      </TabsList>

      <TabsContent value="images">
        <PatientImageManager
          patientId={patientId}
          clinicalRecordId={clinicalRecordId}
        />
      </TabsContent>
    </Tabs>
  );
}
```

### Example 2: Patient Profile Page

```tsx
function PatientProfile({ patientId }) {
  return (
    <div>
      <h1>Thông tin bệnh nhân</h1>
      {/* Patient info */}

      <h2>Hình ảnh</h2>
      <PatientImageManager patientId={patientId} />
    </div>
  );
}
```

## 🐛 Troubleshooting

### Upload thất bại?

1. Check Cloudinary credentials trong `.env.local`
2. Restart dev server sau khi thay đổi env vars
3. Verify file size < 10MB (hoặc maxSizeMB bạn đặt)
4. Check file type có trong allowedTypes không

### Hình ảnh không hiển thị?

1. Check network tab xem API response
2. Verify user có quyền `PATIENT_READ`
3. Check URL format: phải là `https://res.cloudinary.com/...`

### Performance issues?

1. Giảm `pageSize` trong gallery
2. Disable `showFilters` nếu không cần
3. Check Cloudinary optimization settings

## 📝 TODO / Future Enhancements

- [ ] Bulk upload (multiple files at once)
- [ ] Image editing (crop, rotate, brightness)
- [ ] AI-powered analysis (detect dental issues)
- [ ] Before/After comparison view
- [ ] Export to PDF
- [ ] Share images với bệnh nhân via secure link
- [ ] Image annotations (draw on image)
- [ ] Video support

## 🤝 Contributing

Khi thêm tính năng mới:

1. Update types trong `patientImage.ts`
2. Update service methods trong `patientImageService.ts`
3. Update components nếu cần UI changes
4. Update documentation (API spec & Frontend guide)
5. Test thoroughly với real images

## 📞 Support

Nếu gặp vấn đề:

1. Check documentation: [Frontend Guide](./PATIENT_IMAGES_FRONTEND_GUIDE.md) và [API Spec](./PATIENT_IMAGES_API_SPEC.md)
2. Check troubleshooting section
3. Tạo issue trên GitHub với:
   - Steps to reproduce
   - Expected vs actual behavior
   - Console logs & network requests
   - Screenshots nếu có

---

**Created:** December 8, 2025
**Last Updated:** December 8, 2025
**Version:** 1.0.0
