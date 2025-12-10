# Patient Image Management - Frontend Guide

## Tổng quan

Hệ thống quản lý hình ảnh bệnh nhân cho phép nha sĩ upload, xem, quản lý hình ảnh của từng bệnh nhân. Mỗi bệnh nhân có folder riêng trên Cloudinary để tổ chức hình ảnh một cách khoa học.

## 🎯 Tính năng

- ✅ Upload hình ảnh với drag & drop
- ✅ Phân loại hình ảnh (X-quang, ảnh chụp, trước/sau điều trị, v.v.)
- ✅ Gallery với pagination và filters
- ✅ Xem full size (lightbox)
- ✅ Download hình ảnh
- ✅ Xóa hình ảnh
- ✅ Mỗi bệnh nhân có folder riêng trên Cloudinary
- ✅ Mỗi hình ảnh có URL riêng, có thể liên kết với clinical record

## 📁 Files Structure

```
src/
├── types/
│   └── patientImage.ts              # Types và enums
├── services/
│   └── patientImageService.ts       # API service
└── components/
    └── clinical-records/
        ├── PatientImageUpload.tsx   # Upload component
        ├── PatientImageGallery.tsx  # Gallery component
        └── PatientImageManager.tsx  # Combined component
```

## 🚀 Quick Start

### 1. Sử dụng PatientImageManager (Recommended)

Component tích hợp sẵn Upload + Gallery:

```tsx
import PatientImageManager from "@/components/clinical-records/PatientImageManager";

function ClinicalRecordPage() {
  const patientId = 123;
  const clinicalRecordId = 456; // Optional

  return (
    <PatientImageManager
      patientId={patientId}
      clinicalRecordId={clinicalRecordId}
      showFilters={true}
    />
  );
}
```

### 2. Sử dụng riêng lẻ components

#### Upload Component

```tsx
import PatientImageUpload from "@/components/clinical-records/PatientImageUpload";

function MyComponent() {
  const handleUploadSuccess = (image) => {
    console.log("Uploaded:", image);
    // Refresh gallery hoặc update state
  };

  const handleUploadError = (error) => {
    console.error("Upload failed:", error);
    // Show error notification
  };

  return (
    <PatientImageUpload
      patientId={123}
      clinicalRecordId={456} // Optional
      onUploadSuccess={handleUploadSuccess}
      onUploadError={handleUploadError}
      maxSizeMB={10}
      allowedTypes={["image/jpeg", "image/png", "image/webp"]}
    />
  );
}
```

#### Gallery Component

```tsx
import PatientImageGallery from "@/components/clinical-records/PatientImageGallery";

function MyComponent() {
  return (
    <PatientImageGallery
      patientId={123}
      clinicalRecordId={456} // Optional - filter by clinical record
      showFilters={true}
      pageSize={12}
    />
  );
}
```

## 📝 Types & Enums

### PatientImageType

**Simplified to 6 types (aligned with BE implementation):**

```typescript
enum PatientImageType {
  XRAY = "XRAY", // X-quang
  PHOTO = "PHOTO", // Ảnh chụp thông thường
  BEFORE_TREATMENT = "BEFORE_TREATMENT", // Trước điều trị
  AFTER_TREATMENT = "AFTER_TREATMENT", // Sau điều trị
  SCAN = "SCAN", // Scan tài liệu
  OTHER = "OTHER", // Khác
}
```

### PatientImageResponse

```typescript
interface PatientImageResponse {
  imageId: number;
  patientId: number;
  patientName: string; // Added by BE
  clinicalRecordId?: number;
  imageUrl: string; // Full URL trên Cloudinary
  cloudinaryPublicId: string; // Public ID để quản lý
  imageType: PatientImageType;
  description?: string;
  capturedDate?: string; // yyyy-MM-dd
  uploadedBy: number; // Employee ID
  uploaderName: string; // Added by BE
  createdAt: string; // ISO 8601 (BE uses createdAt, not uploadedAt)
  updatedAt: string; // ISO 8601
}
```

## 🔧 Service Methods

### patientImageService

```typescript
// Upload image
const image = await patientImageService.uploadImage(file, {
  patientId: 123,
  clinicalRecordId: 456, // optional
  imageType: PatientImageType.XRAY,
  description: "X-quang răng số 16",
  capturedDate: "2025-12-08",
});

// Get images with filters
const result = await patientImageService.getPatientImages({
  patientId: 123,
  imageType: PatientImageType.XRAY,
  fromDate: "2025-01-01",
  toDate: "2025-12-31",
  page: 0,
  size: 20,
});

// Get single image
const image = await patientImageService.getImageById(imageId);

// Update metadata
const updated = await patientImageService.updateImageMetadata(imageId, {
  imageType: PatientImageType.BEFORE_TREATMENT,
  description: "Updated description",
});

// Delete image (only deletes DB record)
await patientImageService.deleteImage(imageId);

// Get by clinical record
const images = await patientImageService.getImagesByClinicalRecord(
  clinicalRecordId
);
```

**Note:** Methods `deleteMultipleImages()` and `getImageStatistics()` không có trong BE implementation.

## 🎨 Component Props

### PatientImageUpload Props

```typescript
interface PatientImageUploadProps {
  patientId: number; // Required
  clinicalRecordId?: number; // Optional
  onUploadSuccess?: (image: PatientImageResponse) => void;
  onUploadError?: (error: string) => void;
  maxSizeMB?: number; // Default: 10
  allowedTypes?: string[]; // Default: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}
```

### PatientImageGallery Props

```typescript
interface PatientImageGalleryProps {
  patientId: number; // Required
  clinicalRecordId?: number; // Optional - filter by clinical record
  showFilters?: boolean; // Default: true
  pageSize?: number; // Default: 12
}
```

### PatientImageManager Props

```typescript
interface PatientImageManagerProps {
  patientId: number; // Required
  clinicalRecordId?: number; // Optional
  showFilters?: boolean; // Default: true
}
```

## 🌐 Cloudinary Folder Structure

Hệ thống tự động tổ chức hình ảnh theo cấu trúc sau trên Cloudinary:

```
patients/
├── patient_123/
│   ├── xray/
│   │   ├── patient_123_1733667890_abc123.jpg
│   │   └── patient_123_1733667891_def456.jpg
│   ├── photo/
│   │   └── patient_123_1733667892_ghi789.jpg
│   ├── before_treatment/
│   └── after_treatment/
├── patient_456/
│   └── ...
```

**Format:**

- Folder: `patients/patient_{patientId}/{imageType}/`
- Public ID: `patient_{patientId}_{timestamp}_{random}`

## 🔐 Security & Permissions

### Required Permissions

- **Upload:** `CLINICAL_RECORD_WRITE` hoặc `PATIENT_WRITE`
- **View:** `CLINICAL_RECORD_READ` hoặc `PATIENT_READ`
- **Update:** `CLINICAL_RECORD_WRITE`
- **Delete:** `CLINICAL_RECORD_WRITE`

### Access Control

- Backend sẽ verify quyền truy cập dựa trên JWT token
- Chỉ cho phép thao tác với hình ảnh của bệnh nhân mà user có quyền

## 📱 Integration Examples

### Example 1: Thêm vào Clinical Record Form

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientImageManager from "@/components/clinical-records/PatientImageManager";

function ClinicalRecordForm({ patientId, clinicalRecordId }) {
  return (
    <Tabs defaultValue="record">
      <TabsList>
        <TabsTrigger value="record">Hồ sơ</TabsTrigger>
        <TabsTrigger value="procedures">Thủ thuật</TabsTrigger>
        <TabsTrigger value="prescriptions">Đơn thuốc</TabsTrigger>
        <TabsTrigger value="images">Hình ảnh</TabsTrigger>
      </TabsList>

      <TabsContent value="record">{/* Form fields */}</TabsContent>

      <TabsContent value="procedures">{/* Procedures list */}</TabsContent>

      <TabsContent value="prescriptions">{/* Prescriptions */}</TabsContent>

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
import PatientImageManager from "@/components/clinical-records/PatientImageManager";

function PatientProfilePage({ patientId }) {
  return (
    <div className="space-y-6">
      <div>
        <h1>Thông tin bệnh nhân</h1>
        {/* Patient info */}
      </div>

      <div>
        <h2>Lịch sử khám</h2>
        {/* Clinical records list */}
      </div>

      <div>
        <h2>Hình ảnh</h2>
        <PatientImageManager patientId={patientId} showFilters={true} />
      </div>
    </div>
  );
}
```

### Example 3: Custom Upload Handler

```tsx
import PatientImageUpload from "@/components/clinical-records/PatientImageUpload";
import { toast } from "sonner";

function MyComponent() {
  const [images, setImages] = useState<PatientImageResponse[]>([]);

  const handleUploadSuccess = (newImage: PatientImageResponse) => {
    // Add to local state
    setImages((prev) => [newImage, ...prev]);

    // Show success notification
    toast.success("Upload thành công!");

    // Optional: Log analytics
    logEvent("patient_image_uploaded", {
      patientId: newImage.patientId,
      imageType: newImage.imageType,
    });
  };

  const handleUploadError = (error: string) => {
    toast.error(`Upload thất bại: ${error}`);
  };

  return (
    <div>
      <PatientImageUpload
        patientId={123}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />

      {/* Display images */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        {images.map((img) => (
          <img key={img.imageId} src={img.imageUrl} alt="" />
        ))}
      </div>
    </div>
  );
}
```

## 🐛 Troubleshooting

### Upload không thành công

1. **Kiểm tra Cloudinary config:**

   - Verify `.env.local` có đầy đủ credentials
   - Restart dev server sau khi thay đổi env vars

2. **File quá lớn:**

   - Default max size: 10MB
   - Có thể tăng qua prop `maxSizeMB`

3. **File type không được hỗ trợ:**
   - Default: `['image/jpeg', 'image/png', 'image/gif', 'image/webp']`
   - Customize qua prop `allowedTypes`

### Hình ảnh không hiển thị

1. **Kiểm tra URL:**

   - URL phải có format: `https://res.cloudinary.com/...`
   - Kiểm tra network tab xem có lỗi CORS không

2. **Permissions:**
   - User có quyền `PATIENT_READ` hoặc `CLINICAL_RECORD_READ`?

### Gallery load chậm

1. **Reduce page size:**

   ```tsx
   <PatientImageGallery pageSize={8} />
   ```

2. **Disable filters nếu không cần:**
   ```tsx
   <PatientImageGallery showFilters={false} />
   ```

## 📊 Performance Tips

1. **Lazy loading images:**

   - Gallery component đã implement lazy loading
   - Browser sẽ chỉ load images khi scroll đến

2. **Pagination:**

   - Default page size: 12 images
   - Adjust dựa trên use case

3. **Cloudinary optimization:**
   - URL tự động optimize (quality, format) nếu BE setup đúng
   - Có thể request specific size nếu cần

## 🔄 Backend Integration

✅ **Backend đã implement và sẵn sàng test!**

Xem chi tiết tại BE repo: `docs/api-guides/patient-images/`

### API Endpoints (6 endpoints)

```
POST   /api/v1/patient-images                          # Create image record
GET    /api/v1/patient-images/patient/{patientId}     # Get images (with filters & pagination)
GET    /api/v1/patient-images/{id}                     # Get single image
PUT    /api/v1/patient-images/{id}                     # Update metadata
DELETE /api/v1/patient-images/{id}                     # Delete image (DB only)
GET    /api/v1/patient-images/clinical-record/{id}    # Get by clinical record
```

### Key Differences from Initial Design

1. **Simplified Image Types**: 6 types thay vì 12
2. **Endpoint Format**: `/patient/{id}` thay vì query param
3. **Response Structure**: `{images: []}` thay vì `{content: []}`
4. **Additional Fields**: `patientName`, `uploaderName` trong response
5. **No Batch Operations**: Xóa từng ảnh một
6. **BE Only Deletes DB**: FE có thể xóa Cloudinary file riêng

## 📚 Related Documentation

- [Cloudinary Setup Guide](./CLOUDINARY_SETUP.md)
- [Cloudinary Troubleshooting](./CLOUDINARY_TROUBLESHOOTING.md)
- [Clinical Records Integration Plan](./CLINICAL_RECORDS_INTEGRATION_PLAN.md)

## ✨ Future Enhancements

- [ ] Bulk upload (multiple files at once)
- [ ] Image editing (crop, rotate, adjust)
- [ ] AI-powered image analysis
- [ ] Comparison view (before/after side-by-side)
- [ ] Export to PDF
- [ ] Share images with patients via secure link

## 💬 Support

Nếu gặp vấn đề, vui lòng:

1. Check troubleshooting section
2. Review API specification
3. Tạo issue trên GitHub với log details

---

Last updated: December 8, 2025
