import { v2 as cloudinary } from 'cloudinary';

// ⚠️ WARNING: Fallback values chỉ dùng cho development/testing
// Trong production, PHẢI sử dụng biến môi trường từ .env.local
// KHÔNG commit file này với API keys thật vào git!

const CLOUDINARY_CONFIG = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
};

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.cloud_name,
  api_key: CLOUDINARY_CONFIG.api_key,
  api_secret: CLOUDINARY_CONFIG.api_secret,
  secure: true,
});

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

    let uploadResult;
    
    if (typeof file === 'string') {
      // Upload từ URL
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    } else if (file instanceof Buffer) {
      // Upload từ Buffer
      uploadResult = await cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) throw error;
          return result;
        }
      ).end(file);
    } else {
      // Upload từ File (cần convert sang base64 hoặc buffer)
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
    }

    return {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      url: uploadResult.url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
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

