import { v2 as cloudinary } from 'cloudinary';

// ⚠️ WARNING: Fallback values chỉ dùng cho development/testing
// Trong production, PHẢI sử dụng biến môi trường từ .env.local
// KHÔNG commit file này với API keys thật vào git!

const CLOUDINARY_CONFIG = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
};

// Kiểm tra xem có đủ biến môi trường không
const hasValidConfig = 
  CLOUDINARY_CONFIG.cloud_name && 
  CLOUDINARY_CONFIG.api_key && 
  CLOUDINARY_CONFIG.api_secret;

// Chỉ cấu hình Cloudinary nếu có đủ biến môi trường
// Tránh lỗi ENVIRONMENT_FALLBACK khi deploy lên Vercel mà chưa set env vars
if (hasValidConfig) {
  try {
    cloudinary.config({
      cloud_name: CLOUDINARY_CONFIG.cloud_name,
      api_key: CLOUDINARY_CONFIG.api_key,
      api_secret: CLOUDINARY_CONFIG.api_secret,
      secure: true,
    });
  } catch (error) {
    console.error('Failed to configure Cloudinary:', error);
  }
} else {
  // Log warning trong development để dễ debug
  if (process.env.NODE_ENV === 'development') {
    console.warn('Cloudinary config is missing. Please set environment variables:', {
      cloud_name: !!CLOUDINARY_CONFIG.cloud_name,
      api_key: !!CLOUDINARY_CONFIG.api_key,
      api_secret: !!CLOUDINARY_CONFIG.api_secret,
    });
  }
}

// Log để debug (chỉ trong development)
if (process.env.NODE_ENV === 'development') {
  console.log('Cloudinary Config:', {
    cloud_name: CLOUDINARY_CONFIG.cloud_name,
    api_key: CLOUDINARY_CONFIG.api_key ? '***' + CLOUDINARY_CONFIG.api_key.slice(-4) : 'MISSING',
    api_secret: CLOUDINARY_CONFIG.api_secret ? '***' + CLOUDINARY_CONFIG.api_secret.slice(-4) : 'MISSING',
    usingEnv: {
      cloud_name: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET,
    },
  });
}

export default cloudinary;

// Export các helper functions
export const uploadImage = async (
  file: File | Buffer | string,
  options?: {
    folder?: string;
    publicId?: string;
    transformation?: any[];
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  }
): Promise<{
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
}> => {
  // Kiểm tra config trước khi upload
  if (!hasValidConfig) {
    throw new Error(
      'Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
    );
  }

  try {
    const uploadOptions: any = {
      resource_type: options?.resourceType || 'auto',
    };

    if (options?.folder) {
      uploadOptions.folder = options.folder;
    }

    if (options?.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    if (options?.transformation) {
      uploadOptions.transformation = options.transformation;
    }

    let uploadResult: any;
    
    if (typeof file === 'string') {
      // Upload từ URL
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    } else if (file instanceof Buffer) {
      // Upload từ Buffer
      uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file);
      });
    } else {
      // Upload từ File (cần convert sang base64 hoặc buffer)
      // Type guard để đảm bảo file là File object
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
      } else {
        throw new Error('Invalid file type. Expected File, Buffer, or string URL.');
      }
    }

    // Type assertion cho uploadResult
    const result = uploadResult as {
      public_id: string;
      secure_url: string;
      url: string;
      width: number;
      height: number;
      format: string;
    };

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  // Kiểm tra config trước khi delete
  if (!hasValidConfig) {
    throw new Error(
      'Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
    );
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

export const getImageUrl = (
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
  }
): string => {
  // Kiểm tra config trước khi tạo URL
  if (!hasValidConfig || !CLOUDINARY_CONFIG.cloud_name) {
    console.warn('Cloudinary cloud_name is not configured. Returning empty string.');
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
    transformations.push('c_limit'); // Default crop mode
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

  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformationString ? [{ raw_transformation: transformationString }] : undefined,
  });
};

