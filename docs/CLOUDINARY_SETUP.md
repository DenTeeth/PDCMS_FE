# Cloudinary Setup Guide

Hướng dẫn thiết lập và sử dụng Cloudinary trong dự án PDCMS.

## 📋 Mục lục

1. [Cài đặt](#cài-đặt)
2. [Cấu hình](#cấu-hình)
3. [Sử dụng](#sử-dụng)
4. [API Reference](#api-reference)

## 🚀 Cài đặt

### Bước 1: Tạo tài khoản Cloudinary

1. Truy cập [Cloudinary Dashboard](https://cloudinary.com/console)
2. Đăng ký/Đăng nhập tài khoản
3. Lấy các thông tin sau từ Dashboard:
   - **Cloud Name**: Tên cloud của bạn
   - **API Key**: Khóa API
   - **API Secret**: Secret key (giữ bí mật!)

### Bước 2: Cấu hình biến môi trường

Tạo file `.env.local` trong thư mục root của dự án và thêm:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Lưu ý:**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` được expose ra client-side
- `CLOUDINARY_API_KEY` và `CLOUDINARY_API_SECRET` chỉ dùng ở server-side
- Không commit file `.env.local` vào git!

## ⚙️ Cấu hình

Dự án đã được cấu hình sẵn với:

- ✅ Package `cloudinary` và `next-cloudinary` đã được cài đặt
- ✅ File cấu hình: `src/config/cloudinary.ts`
- ✅ Client utilities: `src/lib/cloudinary.ts`
- ✅ API route: `src/app/api/upload/cloudinary/route.ts`
- ✅ Next.js config đã hỗ trợ Cloudinary images

## 📖 Sử dụng

### 1. Upload ảnh từ Client-side (React Component)

```tsx
import CloudinaryImageUpload from '@/components/ui/CloudinaryImageUpload';

function MyComponent() {
  const handleUploadSuccess = (result) => {
    console.log('Uploaded:', result);
    // result.public_id - ID của ảnh trên Cloudinary
    // result.secure_url - URL của ảnh
  };

  return (
    <CloudinaryImageUpload
      folder="my-folder" // Optional: thư mục trên Cloudinary
      onUploadSuccess={handleUploadSuccess}
      maxSize={10} // MB
    />
  );
}
```

### 2. Upload ảnh từ Client-side (Manual)

```tsx
import { uploadImageFromClient } from '@/lib/cloudinary';

async function handleFileUpload(file: File) {
  try {
    const result = await uploadImageFromClient(file, {
      folder: 'my-folder',
    });
    
    console.log('Public ID:', result.public_id);
    console.log('URL:', result.secure_url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### 3. Upload ảnh từ Server-side

```tsx
import { uploadImage } from '@/config/cloudinary';

// Trong API route hoặc server component
async function uploadToCloudinary(file: File) {
  const result = await uploadImage(file, {
    folder: 'my-folder',
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' },
    ],
  });
  
  return result;
}
```

### 4. Lấy URL ảnh đã được optimize

```tsx
import { getCloudinaryImageUrl } from '@/lib/cloudinary';

// Lấy URL ảnh với kích thước tùy chỉnh
const imageUrl = getCloudinaryImageUrl('public_id_here', {
  width: 400,
  height: 300,
  crop: 'fill',
  quality: 80,
  format: 'webp',
});
```

### 5. Sử dụng với Next.js Image component

```tsx
import Image from 'next/image';
import { getCloudinaryImageUrl } from '@/lib/cloudinary';

function MyImage({ publicId }: { publicId: string }) {
  const imageUrl = getCloudinaryImageUrl(publicId, {
    width: 800,
    quality: 85,
  });

  return (
    <Image
      src={imageUrl}
      alt="Description"
      width={800}
      height={600}
    />
  );
}
```

### 6. Xóa ảnh

```tsx
// Client-side: Gọi API
async function deleteImage(publicId: string) {
  const response = await fetch(`/api/upload/cloudinary?publicId=${publicId}`, {
    method: 'DELETE',
  });
  
  if (response.ok) {
    console.log('Image deleted');
  }
}

// Server-side
import { deleteImage } from '@/config/cloudinary';
await deleteImage('public_id_here');
```

## 📚 API Reference

### Client-side Functions (`src/lib/cloudinary.ts`)

#### `uploadImageFromClient(file, options?)`

Upload ảnh từ client-side.

**Parameters:**
- `file: File` - File ảnh cần upload
- `options?: UploadOptions`
  - `folder?: string` - Thư mục trên Cloudinary
  - `publicId?: string` - Public ID tùy chỉnh
  - `transformation?: any[]` - Transformations
  - `resourceType?: 'image' | 'video' | 'raw' | 'auto'`

**Returns:** `Promise<CloudinaryUploadResponse>`

#### `getCloudinaryImageUrl(publicId, options?)`

Lấy URL ảnh đã được optimize.

**Parameters:**
- `publicId: string` - Public ID của ảnh
- `options?: { width?, height?, crop?, quality?, format? }`

**Returns:** `string` - URL của ảnh

### Server-side Functions (`src/config/cloudinary.ts`)

#### `uploadImage(file, options?)`

Upload ảnh từ server-side.

**Parameters:**
- `file: File | Buffer | string` - File, Buffer, hoặc URL
- `options?: { folder?, publicId?, transformation?, resourceType? }`

**Returns:** `Promise<UploadResult>`

#### `deleteImage(publicId)`

Xóa ảnh từ Cloudinary.

**Parameters:**
- `publicId: string` - Public ID của ảnh

**Returns:** `Promise<void>`

#### `getImageUrl(publicId, options?)`

Lấy URL ảnh với transformations.

**Parameters:**
- `publicId: string` - Public ID của ảnh
- `options?: { width?, height?, crop?, quality?, format? }`

**Returns:** `string` - URL của ảnh

### API Routes

#### `POST /api/upload/cloudinary`

Upload ảnh lên Cloudinary.

**Request:**
- `Content-Type: multipart/form-data`
- Body:
  - `file: File` (required)
  - `folder?: string` (optional)
  - `publicId?: string` (optional)

**Response:**
```json
{
  "public_id": "folder/image_id",
  "secure_url": "https://res.cloudinary.com/...",
  "url": "http://res.cloudinary.com/...",
  "width": 1920,
  "height": 1080,
  "format": "jpg"
}
```

#### `DELETE /api/upload/cloudinary?publicId=...`

Xóa ảnh từ Cloudinary.

**Response:**
```json
{
  "message": "Image deleted successfully"
}
```

## 🔒 Bảo mật

1. **Không expose API Secret**: Chỉ dùng `CLOUDINARY_API_SECRET` ở server-side
2. **Validate file types**: Chỉ cho phép upload các file ảnh hợp lệ
3. **Limit file size**: Giới hạn kích thước file (mặc định 10MB)
4. **Use signed URLs**: Có thể sử dụng signed URLs cho các ảnh nhạy cảm

## 🎨 Transformations

Cloudinary hỗ trợ nhiều transformations:

```tsx
// Resize
getCloudinaryImageUrl(publicId, { width: 400, height: 300 })

// Crop
getCloudinaryImageUrl(publicId, { width: 400, height: 300, crop: 'fill' })

// Quality
getCloudinaryImageUrl(publicId, { quality: 80 })

// Format
getCloudinaryImageUrl(publicId, { format: 'webp' })

// Combine
getCloudinaryImageUrl(publicId, {
  width: 800,
  height: 600,
  crop: 'limit',
  quality: 85,
  format: 'webp'
})
```

**Crop modes:**
- `fill` - Fill the dimensions
- `fit` - Fit within dimensions
- `limit` - Limit size (default)
- `scale` - Scale to fit
- `crop` - Crop to exact size

## 🐛 Troubleshooting

### Lỗi: "Cloudinary API keys are not configured"
- Kiểm tra file `.env.local` đã được tạo chưa
- Kiểm tra các biến môi trường đã được set đúng chưa
- Restart dev server sau khi thêm biến môi trường

### Lỗi: "Invalid file type"
- Chỉ upload các file ảnh: jpeg, png, gif, webp, svg
- Kiểm tra `acceptedTypes` prop nếu dùng component

### Lỗi: "File size exceeds limit"
- Giảm kích thước file hoặc tăng `maxSize` prop
- Mặc định giới hạn là 10MB

## 📝 Ví dụ đầy đủ

Xem file `src/components/ui/CloudinaryImageUpload.tsx` để xem ví dụ component hoàn chỉnh.

## 🔗 Tài liệu tham khảo

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration)


