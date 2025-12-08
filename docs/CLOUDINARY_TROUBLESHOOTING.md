# Cloudinary Troubleshooting Guide

## Vấn đề: "Chưa cấu hình" hoặc "Failed to upload image"

### Bước 1: Kiểm tra file .env.local

Đảm bảo file `.env.local` ở thư mục root của dự án (cùng cấp với `package.json`) và có format đúng:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Lưu ý quan trọng:**
- Không có khoảng trắng trước/sau dấu `=`
- Không có dấu ngoặc kép `"` hoặc `'` bao quanh giá trị
- Không có comment `#` trên cùng dòng với biến
- Mỗi biến trên một dòng riêng

**Ví dụ ĐÚNG:**
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=my-cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

**Ví dụ SAI:**
```env
# SAI: Có khoảng trắng
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = my-cloud

# SAI: Có dấu ngoặc kép
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="my-cloud"

# SAI: Comment trên cùng dòng
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=my-cloud # my cloud name
```

### Bước 2: Restart Dev Server

**QUAN TRỌNG:** Sau khi thêm/sửa file `.env.local`, bạn **PHẢI** restart dev server:

1. Dừng server hiện tại: Nhấn `Ctrl+C` trong terminal
2. Chạy lại: `npm run dev`

Next.js chỉ load biến môi trường khi khởi động, không tự động reload khi file thay đổi.

### Bước 3: Kiểm tra Console Logs

Mở Developer Tools (F12) và kiểm tra:
- **Console tab**: Xem có lỗi gì không
- **Network tab**: Kiểm tra request đến `/api/upload/cloudinary` và xem response

### Bước 4: Kiểm tra Server Logs

Trong terminal chạy `npm run dev`, xem có log:
- `Cloudinary Config Check:` - Hiển thị trạng thái các biến môi trường
- `Starting upload:` - Khi bắt đầu upload
- `Upload successful:` - Khi upload thành công
- `Cloudinary upload API error:` - Khi có lỗi

### Bước 5: Kiểm tra Cloudinary Dashboard

1. Đăng nhập vào [Cloudinary Dashboard](https://cloudinary.com/console)
2. Kiểm tra xem:
   - Cloud Name có đúng không
   - API Key và API Secret có đúng không
   - Account có đang active không

### Bước 6: Test API Keys

Tạo file test để kiểm tra:

```typescript
// test-cloudinary-config.ts
import cloudinary from '@/config/cloudinary';

console.log('Cloud Name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
console.log('API Key exists:', !!process.env.CLOUDINARY_API_KEY);
console.log('API Secret exists:', !!process.env.CLOUDINARY_API_SECRET);

// Test upload một ảnh nhỏ
cloudinary.uploader.upload('https://via.placeholder.com/100', {
  folder: 'test'
}).then(result => {
  console.log('Test upload successful:', result.public_id);
}).catch(error => {
  console.error('Test upload failed:', error);
});
```

## Các lỗi thường gặp

### Lỗi: "Cloudinary Cloud Name is not configured"

**Nguyên nhân:**
- Biến `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` chưa được set
- Dev server chưa được restart
- File `.env.local` không ở đúng vị trí

**Giải pháp:**
1. Kiểm tra file `.env.local` có biến này không
2. Restart dev server
3. Kiểm tra file có ở thư mục root không

### Lỗi: "Cloudinary API keys are not configured"

**Nguyên nhân:**
- `CLOUDINARY_API_KEY` hoặc `CLOUDINARY_API_SECRET` chưa được set
- Dev server chưa được restart

**Giải pháp:**
1. Kiểm tra file `.env.local` có đầy đủ 2 biến này không
2. Restart dev server
3. Lưu ý: Không có prefix `NEXT_PUBLIC_` cho 2 biến này

### Lỗi: "Invalid API key or secret"

**Nguyên nhân:**
- API Key hoặc API Secret không đúng
- Copy/paste có thể có khoảng trắng thừa

**Giải pháp:**
1. Kiểm tra lại trong Cloudinary Dashboard
2. Copy lại và đảm bảo không có khoảng trắng
3. Restart dev server

### Lỗi: "Upload preset is invalid"

**Nguyên nhân:**
- Nếu sử dụng upload preset, preset không tồn tại hoặc không đúng

**Giải pháp:**
1. Kiểm tra upload preset trong Cloudinary Dashboard
2. Hoặc không sử dụng preset (để trống)

## Debug Checklist

- [ ] File `.env.local` tồn tại ở thư mục root
- [ ] File `.env.local` có đúng 3 biến: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] Không có khoảng trắng thừa trong file `.env.local`
- [ ] Dev server đã được restart sau khi thêm/sửa `.env.local`
- [ ] Cloud Name, API Key, API Secret đúng trong Cloudinary Dashboard
- [ ] Kiểm tra console logs trong browser và terminal
- [ ] Kiểm tra Network tab xem request có được gửi không

## Liên hệ

Nếu vẫn gặp vấn đề, cung cấp:
1. Error message đầy đủ từ console
2. Response từ Network tab
3. Server logs từ terminal
4. Nội dung file `.env.local` (ẩn các giá trị nhạy cảm)


