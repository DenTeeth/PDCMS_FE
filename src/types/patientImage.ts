/**
 * Patient Image Types
 * Các types cho hệ thống quản lý hình ảnh bệnh nhân
 */

// ============================================================================
// Patient Image Types
// ============================================================================

/**
 * Response từ BE khi lấy thông tin 1 hình ảnh
 */
export interface PatientImageResponse {
  imageId: number;
  patientId: number;
  patientName: string; // Tên bệnh nhân
  clinicalRecordId?: number; // Optional - có thể gắn với clinical record cụ thể
  imageUrl: string; // URL đầy đủ trên Cloudinary
  cloudinaryPublicId: string; // Public ID để quản lý trên Cloudinary
  imageType: PatientImageType;
  description?: string;
  capturedDate?: string; // ISO 8601 format
  uploadedBy: number; // Employee ID của người upload
  uploaderName: string; // Tên người upload
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

/**
 * Request để upload hình ảnh mới
 */
export interface UploadPatientImageRequest {
  patientId: number;
  clinicalRecordId?: number;
  imageType: PatientImageType;
  description?: string;
  capturedDate?: string; // yyyy-MM-dd format
}

/**
 * Request để cập nhật metadata của hình ảnh
 */
export interface UpdatePatientImageRequest {
  imageType?: PatientImageType;
  description?: string;
  capturedDate?: string; // yyyy-MM-dd format
  clinicalRecordId?: number;
}

/**
 * Loại hình ảnh (Simplified - chỉ 6 types theo BE implementation)
 */
export enum PatientImageType {
  XRAY = "XRAY", // X-quang
  PHOTO = "PHOTO", // Ảnh chụp thông thường
  BEFORE_TREATMENT = "BEFORE_TREATMENT", // Trước điều trị
  AFTER_TREATMENT = "AFTER_TREATMENT", // Sau điều trị
  SCAN = "SCAN", // Scan tài liệu
  OTHER = "OTHER", // Khác
}

/**
 * Patient Image Type labels (Vietnamese)
 */
export const PATIENT_IMAGE_TYPE_LABELS: Record<PatientImageType, string> = {
  [PatientImageType.XRAY]: "X-quang",
  [PatientImageType.PHOTO]: "Ảnh chụp",
  [PatientImageType.BEFORE_TREATMENT]: "Trước điều trị",
  [PatientImageType.AFTER_TREATMENT]: "Sau điều trị",
  [PatientImageType.SCAN]: "Scan tài liệu",
  [PatientImageType.OTHER]: "Khác",
};

/**
 * Filter options cho danh sách hình ảnh
 */
export interface PatientImageFilterOptions {
  patientId: number;
  clinicalRecordId?: number;
  imageType?: PatientImageType;
  fromDate?: string; // yyyy-MM-dd
  toDate?: string; // yyyy-MM-dd
  uploadedBy?: number;
  page?: number;
  size?: number;
}

/**
 * Paginated response cho danh sách hình ảnh (theo BE format)
 */
export interface PatientImagePageResponse {
  images: PatientImageResponse[]; // BE dùng "images" thay vì "content"
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

/**
 * Response khi upload thành công từ Cloudinary
 */
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
}

/**
 * Metadata cho việc organize folders trên Cloudinary
 */
export interface PatientImageCloudinaryMetadata {
  patientId: number;
  patientCode?: string;
  imageType: PatientImageType;
  uploadedBy: number;
  uploadedAt: string;
}

// ============================================================================
// Patient Image Comments Types
// ============================================================================

/**
 * Response từ BE khi lấy comment của hình ảnh
 */
export interface PatientImageComment {
  commentId: number;
  imageId: number;
  content: string; // 1-1000 chars
  createdBy: number; // Employee ID
  createdByName?: string; // Tên người tạo comment
  createdAt: string; // ISO 8601 format
  updatedAt?: string; // ISO 8601 format (nếu đã chỉnh sửa)
  deletedAt?: string; // ISO 8601 format (soft delete)
}

/**
 * Request để tạo comment mới
 */
export interface CreateImageCommentRequest {
  content: string; // 1-1000 chars, required
}

/**
 * Request để cập nhật comment
 */
export interface UpdateImageCommentRequest {
  content: string; // 1-1000 chars, required
}