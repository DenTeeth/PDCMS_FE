# Patient Images API Specification

## Tổng quan

API này cho phép quản lý hình ảnh của bệnh nhân trong hệ thống nha khoa. Mỗi bệnh nhân có thể có nhiều hình ảnh được phân loại theo các loại khác nhau (X-quang, ảnh chụp, trước/sau điều trị, v.v.).

### Cloudinary Folder Structure

Mỗi bệnh nhân sẽ có folder riêng trên Cloudinary theo cấu trúc:

```
patients/
  ├── patient_1/
  │   ├── xray/
  │   ├── photo/
  │   ├── before_treatment/
  │   ├── after_treatment/
  │   └── ...
  ├── patient_2/
  │   └── ...
```

Format: `patients/patient_{patientId}/{imageType}/`

### Tính năng chính

- ✅ Upload hình ảnh lên Cloudinary với folder structure riêng cho từng bệnh nhân
- ✅ Lưu metadata (URL, type, description, captured date) vào database
- ✅ Phân trang và filter hình ảnh
- ✅ Xóa hình ảnh (xóa cả trên Cloudinary và database)
- ✅ Cập nhật metadata của hình ảnh
- ✅ Liên kết hình ảnh với clinical records (optional)

---

## 📋 Table of Contents

1. [Database Schema](#database-schema)
2. [DTOs (Data Transfer Objects)](#dtos)
3. [API Endpoints](#api-endpoints)
4. [Cloudinary Integration](#cloudinary-integration)
5. [Security & Permissions](#security--permissions)

---

## 1. Database Schema

### Table: `patient_images`

```sql
CREATE TABLE patient_images (
    image_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    clinical_record_id BIGINT NULL, -- Optional: link to specific clinical record
    image_url VARCHAR(500) NOT NULL, -- Full URL from Cloudinary
    cloudinary_public_id VARCHAR(200) NOT NULL UNIQUE, -- Public ID để quản lý trên Cloudinary
    image_type VARCHAR(50) NOT NULL, -- ENUM: XRAY, PHOTO, SCAN, etc.
    description TEXT NULL,
    captured_date DATE NULL, -- Ngày chụp/thực hiện hình ảnh
    uploaded_by BIGINT NOT NULL, -- Employee ID (từ JWT token)
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_clinical_record FOREIGN KEY (clinical_record_id) REFERENCES clinical_records(clinical_record_id) ON DELETE SET NULL,
    CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES employees(employee_id),

    -- Indexes
    INDEX idx_patient_id (patient_id),
    INDEX idx_clinical_record_id (clinical_record_id),
    INDEX idx_image_type (image_type),
    INDEX idx_captured_date (captured_date),
    INDEX idx_uploaded_at (uploaded_at)
);

-- Trigger để update updated_at
CREATE TRIGGER update_patient_images_updated_at
BEFORE UPDATE ON patient_images
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### ENUM: `ImageType`

```java
public enum ImageType {
    XRAY,                   // X-quang chung
    PHOTO,                  // Ảnh chụp thông thường
    SCAN,                   // Scan tài liệu
    DENTAL_CONDITION,       // Tình trạng răng
    BEFORE_TREATMENT,       // Trước điều trị
    AFTER_TREATMENT,        // Sau điều trị
    PANORAMIC,              // X-quang toàn cảnh
    CEPHALOMETRIC,          // X-quang đầu mặt nghiêng
    PERIAPICAL,             // X-quang chóp răng
    INTRAORAL,              // Ảnh trong miệng
    EXTRAORAL,              // Ảnh ngoài miệng
    OTHER                   // Khác
}
```

---

## 2. DTOs (Data Transfer Objects)

### 2.1. PatientImageResponse

Response khi lấy thông tin 1 hình ảnh:

```java
public class PatientImageResponse {
    private Long imageId;
    private Long patientId;
    private Long clinicalRecordId; // nullable
    private String imageUrl;
    private String cloudinaryPublicId;
    private ImageType imageType;
    private String description; // nullable
    private LocalDate capturedDate; // nullable
    private Long uploadedBy;
    private LocalDateTime uploadedAt;
    private LocalDateTime updatedAt;

    // Optional: Thông tin người upload (nếu cần)
    private EmployeeBasicDTO uploader; // { employeeId, fullName, email }
}
```

### 2.2. CreatePatientImageRequest

Request để tạo record hình ảnh mới (sau khi đã upload lên Cloudinary):

```java
public class CreatePatientImageRequest {
    @NotNull
    private Long patientId;

    private Long clinicalRecordId; // nullable

    @NotBlank
    @Size(max = 500)
    private String imageUrl; // URL from Cloudinary

    @NotBlank
    @Size(max = 200)
    private String cloudinaryPublicId;

    @NotNull
    private ImageType imageType;

    @Size(max = 1000)
    private String description;

    private LocalDate capturedDate;
}
```

### 2.3. UpdatePatientImageRequest

Request để cập nhật metadata (không upload lại file):

```java
public class UpdatePatientImageRequest {
    private ImageType imageType;

    @Size(max = 1000)
    private String description;

    private LocalDate capturedDate;

    private Long clinicalRecordId;
}
```

### 2.4. PatientImagePageResponse

Response cho danh sách có phân trang:

```java
public class PatientImagePageResponse {
    private List<PatientImageResponse> content;
    private int totalPages;
    private long totalElements;
    private int currentPage;
    private int pageSize;
}
```

### 2.5. DeleteMultipleImagesRequest

Request để xóa nhiều hình ảnh:

```java
public class DeleteMultipleImagesRequest {
    @NotEmpty
    private List<Long> imageIds;
}
```

---

## 3. API Endpoints

Base URL: `/api/v1/patient-images`

### 3.1. Create Patient Image Record

**Endpoint:** `POST /api/v1/patient-images`

**Description:** Tạo record trong database sau khi đã upload file lên Cloudinary (FE đã upload và gửi URL về)

**Request Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "patientId": 123,
  "clinicalRecordId": 456,
  "imageUrl": "https://res.cloudinary.com/.../patients/patient_123/xray/image_xxx.jpg",
  "cloudinaryPublicId": "patients/patient_123/xray/patient_123_1234567890_abc123",
  "imageType": "XRAY",
  "description": "X-quang răng số 16",
  "capturedDate": "2025-12-08"
}
```

**Response:** `201 Created`

```json
{
  "imageId": 789,
  "patientId": 123,
  "clinicalRecordId": 456,
  "imageUrl": "https://res.cloudinary.com/.../patients/patient_123/xray/image_xxx.jpg",
  "cloudinaryPublicId": "patients/patient_123/xray/patient_123_1234567890_abc123",
  "imageType": "XRAY",
  "description": "X-quang răng số 16",
  "capturedDate": "2025-12-08",
  "uploadedBy": 10,
  "uploadedAt": "2025-12-08T10:30:00",
  "updatedAt": "2025-12-08T10:30:00"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Không có quyền upload cho bệnh nhân này
- `404 Not Found` - Patient không tồn tại

---

### 3.2. Get Patient Images (with Pagination & Filters)

**Endpoint:** `GET /api/v1/patient-images`

**Description:** Lấy danh sách hình ảnh của bệnh nhân với phân trang và filter

**Request Headers:**

```
Authorization: Bearer {accessToken}
```

**Query Parameters:**

```
patientId=123 (required)
clinicalRecordId=456 (optional)
imageType=XRAY (optional)
fromDate=2025-01-01 (optional)
toDate=2025-12-31 (optional)
uploadedBy=10 (optional)
page=0 (default: 0)
size=20 (default: 20)
sort=uploadedAt,desc (default: uploadedAt,desc)
```

**Example Request:**

```
GET /api/v1/patient-images?patientId=123&imageType=XRAY&page=0&size=12
```

**Response:** `200 OK`

```json
{
  "content": [
    {
      "imageId": 789,
      "patientId": 123,
      "clinicalRecordId": 456,
      "imageUrl": "https://res.cloudinary.com/.../image1.jpg",
      "cloudinaryPublicId": "patients/patient_123/xray/image1",
      "imageType": "XRAY",
      "description": "X-quang răng số 16",
      "capturedDate": "2025-12-08",
      "uploadedBy": 10,
      "uploadedAt": "2025-12-08T10:30:00",
      "updatedAt": "2025-12-08T10:30:00"
    }
  ],
  "totalPages": 5,
  "totalElements": 58,
  "currentPage": 0,
  "pageSize": 12
}
```

---

### 3.3. Get Image by ID

**Endpoint:** `GET /api/v1/patient-images/{imageId}`

**Description:** Lấy thông tin chi tiết 1 hình ảnh

**Response:** `200 OK`

```json
{
  "imageId": 789,
  "patientId": 123,
  "clinicalRecordId": 456,
  "imageUrl": "https://res.cloudinary.com/.../image1.jpg",
  "cloudinaryPublicId": "patients/patient_123/xray/image1",
  "imageType": "XRAY",
  "description": "X-quang răng số 16",
  "capturedDate": "2025-12-08",
  "uploadedBy": 10,
  "uploadedAt": "2025-12-08T10:30:00",
  "updatedAt": "2025-12-08T10:30:00"
}
```

**Error Responses:**

- `404 Not Found` - Image không tồn tại
- `403 Forbidden` - Không có quyền xem image này

---

### 3.4. Update Image Metadata

**Endpoint:** `PUT /api/v1/patient-images/{imageId}`

**Description:** Cập nhật metadata của hình ảnh (không upload lại file)

**Request Body:**

```json
{
  "imageType": "BEFORE_TREATMENT",
  "description": "Ảnh trước điều trị - răng số 16",
  "capturedDate": "2025-12-07",
  "clinicalRecordId": 456
}
```

**Response:** `200 OK`

```json
{
  "imageId": 789,
  "patientId": 123,
  "clinicalRecordId": 456,
  "imageUrl": "https://res.cloudinary.com/.../image1.jpg",
  "cloudinaryPublicId": "patients/patient_123/before_treatment/image1",
  "imageType": "BEFORE_TREATMENT",
  "description": "Ảnh trước điều trị - răng số 16",
  "capturedDate": "2025-12-07",
  "uploadedBy": 10,
  "uploadedAt": "2025-12-08T10:30:00",
  "updatedAt": "2025-12-08T11:45:00"
}
```

---

### 3.5. Delete Image

**Endpoint:** `DELETE /api/v1/patient-images/{imageId}`

**Description:** Xóa hình ảnh (xóa cả trên Cloudinary và database)

**Process:**

1. BE lấy `cloudinaryPublicId` từ database
2. Gọi Cloudinary API để xóa file: `cloudinary.uploader().destroy(publicId)`
3. Xóa record trong database

**Response:** `204 No Content`

**Error Responses:**

- `404 Not Found` - Image không tồn tại
- `403 Forbidden` - Không có quyền xóa
- `500 Internal Server Error` - Lỗi khi xóa file trên Cloudinary (nên log lại)

---

### 3.6. Delete Multiple Images

**Endpoint:** `POST /api/v1/patient-images/delete-multiple`

**Description:** Xóa nhiều hình ảnh cùng lúc

**Request Body:**

```json
{
  "imageIds": [789, 790, 791]
}
```

**Response:** `204 No Content`

**Note:** BE nên xử lý batch delete trên Cloudinary để tối ưu performance

---

### 3.7. Get Images by Clinical Record

**Endpoint:** `GET /api/v1/patient-images/clinical-record/{clinicalRecordId}`

**Description:** Lấy tất cả hình ảnh liên quan đến 1 clinical record

**Response:** `200 OK`

```json
[
  {
    "imageId": 789,
    "patientId": 123,
    "clinicalRecordId": 456,
    "imageUrl": "https://res.cloudinary.com/.../image1.jpg",
    "imageType": "XRAY",
    "description": "X-quang",
    "capturedDate": "2025-12-08",
    "uploadedBy": 10,
    "uploadedAt": "2025-12-08T10:30:00",
    "updatedAt": "2025-12-08T10:30:00"
  }
]
```

---

### 3.8. Get Image Statistics

**Endpoint:** `GET /api/v1/patient-images/statistics/{patientId}`

**Description:** Thống kê số lượng hình ảnh theo loại cho 1 bệnh nhân

**Response:** `200 OK`

```json
{
  "XRAY": 15,
  "PHOTO": 8,
  "BEFORE_TREATMENT": 5,
  "AFTER_TREATMENT": 3,
  "PANORAMIC": 2,
  "INTRAORAL": 10,
  "OTHER": 1
}
```

---

## 4. Cloudinary Integration

### 4.1. Backend Configuration

**application.yml:**

```yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME}
  api-key: ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}
```

**CloudinaryConfig.java:**

```java
@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret,
            "secure", true
        ));
    }
}
```

### 4.2. CloudinaryService.java

```java
@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Xóa file trên Cloudinary
     */
    public void deleteImage(String publicId) {
        try {
            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String status = (String) result.get("result");

            if (!"ok".equals(status)) {
                log.warn("Failed to delete image from Cloudinary: {}", publicId);
                throw new CloudinaryException("Failed to delete image");
            }

            log.info("Successfully deleted image from Cloudinary: {}", publicId);
        } catch (Exception e) {
            log.error("Error deleting image from Cloudinary: {}", publicId, e);
            throw new RuntimeException("Error deleting image from Cloudinary", e);
        }
    }

    /**
     * Xóa nhiều files cùng lúc (batch delete)
     */
    public void deleteMultipleImages(List<String> publicIds) {
        try {
            Map result = cloudinary.api().deleteResources(publicIds, ObjectUtils.emptyMap());
            log.info("Batch deleted {} images from Cloudinary", publicIds.size());
        } catch (Exception e) {
            log.error("Error batch deleting images from Cloudinary", e);
            throw new RuntimeException("Error batch deleting images", e);
        }
    }

    /**
     * Verify URL có phải từ Cloudinary không
     */
    public boolean isValidCloudinaryUrl(String url) {
        return url != null && url.contains("res.cloudinary.com") && url.contains(cloudName);
    }
}
```

---

## 5. Security & Permissions

### 5.1. Permission Rules

| Action          | Required Permission                          | Notes                               |
| --------------- | -------------------------------------------- | ----------------------------------- |
| Upload image    | `CLINICAL_RECORD_WRITE` hoặc `PATIENT_WRITE` | Chỉ Dentist/Admin                   |
| View images     | `CLINICAL_RECORD_READ` hoặc `PATIENT_READ`   | Dentist/Admin/Receptionist          |
| Update metadata | `CLINICAL_RECORD_WRITE`                      | Chỉ Dentist/Admin                   |
| Delete image    | `CLINICAL_RECORD_WRITE`                      | Chỉ Dentist/Admin hoặc người upload |

### 5.2. Security Considerations

1. **Validate file before saving metadata:**

   - Verify URL có phải từ Cloudinary account của hệ thống không
   - Verify `cloudinaryPublicId` format đúng

2. **Access control:**

   - Chỉ cho phép xem/sửa/xóa images của bệnh nhân mà user có quyền

3. **Cascading deletes:**

   - Khi xóa Patient → xóa tất cả images (xóa cả trên Cloudinary)
   - Khi xóa Clinical Record → set `clinical_record_id = NULL` cho images

4. **Cloudinary security:**
   - API keys phải được lưu trong environment variables, không commit vào code
   - Sử dụng signed URLs nếu cần bảo mật cao hơn

---

## 6. Implementation Steps (Backend)

### Step 1: Create Entity

```java
@Entity
@Table(name = "patient_images")
public class PatientImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    @Column(nullable = false)
    private Long patientId;

    @Column
    private Long clinicalRecordId;

    @Column(nullable = false, length = 500)
    private String imageUrl;

    @Column(nullable = false, unique = true, length = 200)
    private String cloudinaryPublicId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ImageType imageType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private LocalDate capturedDate;

    @Column(nullable = false)
    private Long uploadedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Relationships (if needed)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", insertable = false, updatable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_record_id", insertable = false, updatable = false)
    private ClinicalRecord clinicalRecord;

    // Getters, setters, @PrePersist, @PreUpdate
}
```

### Step 2: Create Repository

```java
@Repository
public interface PatientImageRepository extends JpaRepository<PatientImage, Long> {

    Page<PatientImage> findByPatientId(Long patientId, Pageable pageable);

    Page<PatientImage> findByPatientIdAndImageType(
        Long patientId,
        ImageType imageType,
        Pageable pageable
    );

    List<PatientImage> findByClinicalRecordId(Long clinicalRecordId);

    // Custom query với multiple filters
    @Query("SELECT pi FROM PatientImage pi WHERE " +
           "pi.patientId = :patientId " +
           "AND (:imageType IS NULL OR pi.imageType = :imageType) " +
           "AND (:fromDate IS NULL OR pi.capturedDate >= :fromDate) " +
           "AND (:toDate IS NULL OR pi.capturedDate <= :toDate)")
    Page<PatientImage> findWithFilters(
        @Param("patientId") Long patientId,
        @Param("imageType") ImageType imageType,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate,
        Pageable pageable
    );
}
```

### Step 3: Create Service

Implement `PatientImageService` với các methods tương ứng với API endpoints

### Step 4: Create Controller

Implement `PatientImageController` với tất cả endpoints đã định nghĩa ở trên

### Step 5: Testing

- Unit tests cho Service layer
- Integration tests cho API endpoints
- Test Cloudinary deletion

---

## 7. Frontend Integration Example

```typescript
// Example usage in Clinical Record Form
import PatientImageManager from "@/components/clinical-records/PatientImageManager";

function ClinicalRecordForm({ patientId, clinicalRecordId }) {
  return (
    <div>
      {/* Other form fields */}

      <PatientImageManager
        patientId={patientId}
        clinicalRecordId={clinicalRecordId}
      />
    </div>
  );
}
```

---

## 8. Notes & Best Practices

### Performance

- Sử dụng pagination cho danh sách images
- Cache thống kê số lượng images nếu cần
- Batch delete khi xóa nhiều images

### Error Handling

- Log lỗi khi không xóa được file trên Cloudinary
- Retry logic cho Cloudinary API calls
- Graceful degradation nếu Cloudinary down

### Data Integrity

- Sử dụng transactions khi xóa image (xóa Cloudinary + DB)
- Cleanup job định kỳ để xóa orphaned files trên Cloudinary

### Monitoring

- Track số lượng uploads/deletes
- Monitor Cloudinary storage usage
- Alert khi gần đạt giới hạn storage

---

## Contact

Nếu có thắc mắc về API spec này, vui lòng liên hệ Frontend team hoặc tạo issue trên GitHub.
