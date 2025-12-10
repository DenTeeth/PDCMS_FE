/**
 * Client-side Cloudinary utilities
 * Sử dụng cho các thao tác upload từ client-side
 */

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: any[];
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

/**
 * Upload image từ client-side
 * Sử dụng API route để upload (bảo mật hơn)
 */
export const uploadImageFromClient = async (
  file: File,
  options?: UploadOptions
): Promise<CloudinaryUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options?.publicId) {
      formData.append('publicId', options.publicId);
    }

    const response = await fetch('/api/upload/cloudinary', {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Trả về thông báo lỗi chi tiết từ server
      const errorMessage = responseData.message || responseData.error || 'Failed to upload image';
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error: any) {
    console.error('Client upload error:', error);
    // Nếu error đã có message, giữ nguyên; nếu không, tạo message mới
    if (error.message) {
      throw error;
    }
    throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get optimized image URL từ public_id
 */
export const getCloudinaryImageUrl = (
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
  }
): string => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.warn('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
    return '';
  }

  const transformations: string[] = [];

  if (options?.width) {
    transformations.push(`w_${options.width}`);
  }

  if (options?.height) {
    transformations.push(`h_${options.height}`);
  }

  if (options?.crop) {
    transformations.push(`c_${options.crop}`);
  } else if (options?.width || options?.height) {
    transformations.push('c_limit');
  }

  if (options?.quality) {
    transformations.push(`q_${options.quality}`);
  }

  if (options?.format) {
    transformations.push(`f_${options.format}`);
  }

  const transformationString = transformations.length > 0 
    ? transformations.join(',') 
    : '';

  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const transformationPart = transformationString ? `${transformationString}/` : '';
  
  return `${baseUrl}/${transformationPart}${publicId}`;
};

