/**
 * Patient Image Service
 * Service để quản lý upload, xem, xóa hình ảnh của bệnh nhân
 * Mỗi bệnh nhân sẽ có folder riêng trên Cloudinary: patients/patient_{patientId}/
 */

import {
  uploadImageFromClient,
  CloudinaryUploadResponse,
} from "@/lib/cloudinary";
import { apiClient } from "@/lib/api";
import {
  PatientImageResponse,
  UploadPatientImageRequest,
  UpdatePatientImageRequest,
  PatientImageFilterOptions,
  PatientImagePageResponse,
  PatientImageType,
} from "@/types/patientImage";

// Get axios instance for API calls
const api = apiClient.getAxiosInstance();

/**
 * Generate folder path cho bệnh nhân trên Cloudinary
 * Format: patients/patient_{patientId}/{imageType}
 */
const getPatientCloudinaryFolder = (
  patientId: number,
  imageType?: PatientImageType
): string => {
  const baseFolder = `patients/patient_${patientId}`;
  if (imageType) {
    return `${baseFolder}/${imageType.toLowerCase()}`;
  }
  return baseFolder;
};

/**
 * Generate public_id cho hình ảnh
 * Format: patient_{patientId}_{timestamp}_{random}
 */
const generateImagePublicId = (patientId: number): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `patient_${patientId}_${timestamp}_${random}`;
};

class PatientImageService {
  private readonly BASE_URL = "/patient-images";

  /**
   * Upload hình ảnh lên Cloudinary và lưu metadata vào database
   * Bước 1: Upload lên Cloudinary với folder structure riêng
   * Bước 2: Gửi metadata + URL về BE để lưu vào database
   */
  async uploadImage(
    file: File,
    metadata: UploadPatientImageRequest
  ): Promise<PatientImageResponse> {
    try {
      // Bước 1: Upload lên Cloudinary
      const folder = getPatientCloudinaryFolder(
        metadata.patientId,
        metadata.imageType
      );
      const publicId = generateImagePublicId(metadata.patientId);

      console.log("Uploading image to Cloudinary:", {
        folder,
        publicId,
        fileName: file.name,
        fileSize: file.size,
      });

      const cloudinaryResult: CloudinaryUploadResponse =
        await uploadImageFromClient(file, {
          folder,
          publicId,
        });

      console.log("Cloudinary upload success:", {
        public_id: cloudinaryResult.public_id,
        secure_url: cloudinaryResult.secure_url,
      });

      // Bước 2: Lưu metadata vào database qua BE API
      const requestData = {
        patientId: metadata.patientId,
        clinicalRecordId: metadata.clinicalRecordId,
        imageUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        imageType: metadata.imageType,
        description: metadata.description,
        capturedDate: metadata.capturedDate,
        // BE sẽ tự động lấy uploadedBy từ JWT token
      };

      const response = await api.post<PatientImageResponse>(
        this.BASE_URL,
        requestData
      );
      return response.data;
    } catch (error: any) {
      console.error("Error uploading patient image:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload image"
      );
    }
  }

  /**
   * Lấy danh sách hình ảnh của bệnh nhân (có phân trang và filter)
   * BE Endpoint: GET /api/v1/patient-images/patient/{patientId}
   */
  async getPatientImages(
    options: PatientImageFilterOptions
  ): Promise<PatientImagePageResponse> {
    try {
      const params: any = {
        page: options.page || 0,
        size: options.size || 20,
      };

      if (options.clinicalRecordId) {
        params.clinicalRecordId = options.clinicalRecordId;
      }
      if (options.imageType) {
        params.imageType = options.imageType;
      }
      if (options.fromDate) {
        params.fromDate = options.fromDate;
      }
      if (options.toDate) {
        params.toDate = options.toDate;
      }
      if (options.uploadedBy) {
        params.uploadedBy = options.uploadedBy;
      }

      // BE API format: /patient-images/patient/{patientId}
      const response = await api.get<PatientImagePageResponse>(
        `${this.BASE_URL}/patient/${options.patientId}`,
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching patient images:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch images"
      );
    }
  }

  /**
   * Lấy thông tin chi tiết 1 hình ảnh
   */
  async getImageById(imageId: number): Promise<PatientImageResponse> {
    try {
      const response = await api.get<PatientImageResponse>(
        `${this.BASE_URL}/${imageId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching image details:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch image details"
      );
    }
  }

  /**
   * Cập nhật metadata của hình ảnh (không upload lại file)
   */
  async updateImageMetadata(
    imageId: number,
    updates: UpdatePatientImageRequest
  ): Promise<PatientImageResponse> {
    try {
      const response = await api.put<PatientImageResponse>(
        `${this.BASE_URL}/${imageId}`,
        updates
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating image metadata:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update image"
      );
    }
  }

  /**
   * Xóa hình ảnh trong database
   * Note: BE chỉ xóa record trong DB, FE có thể xóa file trên Cloudinary riêng nếu cần
   */
  async deleteImage(imageId: number): Promise<void> {
    try {
      await api.delete(`${this.BASE_URL}/${imageId}`);
    } catch (error: any) {
      console.error("Error deleting image:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete image"
      );
    }
  }

  /**
   * Lấy danh sách hình ảnh theo clinical record
   */
  async getImagesByClinicalRecord(
    clinicalRecordId: number
  ): Promise<PatientImageResponse[]> {
    try {
      const response = await api.get<PatientImageResponse[]>(
        `${this.BASE_URL}/clinical-record/${clinicalRecordId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching images by clinical record:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch images"
      );
    }
  }
}

// Export singleton instance
export const patientImageService = new PatientImageService();

// Export các helper functions
export { getPatientCloudinaryFolder, generateImagePublicId };
