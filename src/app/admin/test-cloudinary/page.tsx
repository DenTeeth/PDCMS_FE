'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CloudinaryImageUpload from '@/components/ui/CloudinaryImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCloudinaryImageUrl } from '@/lib/cloudinary';
import Image from 'next/image';
import { toast } from 'sonner';

export default function TestCloudinaryPage() {
  const [uploadedImage, setUploadedImage] = useState<{
    public_id: string;
    secure_url: string;
  } | null>(null);
  const [testPublicId, setTestPublicId] = useState('');
  const [testImageUrl, setTestImageUrl] = useState('');

  const handleUploadSuccess = (result: any) => {
    setUploadedImage({
      public_id: result.public_id,
      secure_url: result.secure_url,
    });
    toast.success('Upload thành công!');
    console.log('Upload result:', result);
  };

  const handleUploadError = (error: Error) => {
    toast.error(`Lỗi upload: ${error.message}`);
    console.error('Upload error:', error);
  };

  const handleTestUrl = () => {
    if (!testPublicId.trim()) {
      toast.error('Vui lòng nhập Public ID');
      return;
    }

    const url = getCloudinaryImageUrl(testPublicId, {
      width: 800,
      quality: 85,
      format: 'webp',
    });

    setTestImageUrl(url);
    toast.success('Đã tạo URL!');
  };

  const checkConfig = () => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const hasApiKey = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      toast.error('Chưa cấu hình NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
      return false;
    }

    toast.success(`Cloud Name: ${cloudName}`);
    return true;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Test Cloudinary</h1>
        <p className="text-muted-foreground">
          Trang test để kiểm tra cấu hình và upload ảnh lên Cloudinary
        </p>
      </div>

      {/* Config Check */}
      <Card>
        <CardHeader>
          <CardTitle>Kiểm tra cấu hình</CardTitle>
          <CardDescription>
            Kiểm tra xem các biến môi trường đã được cấu hình đúng chưa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Cloud Name:</span>
              <span className="text-muted-foreground">
                {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '❌ Chưa cấu hình'}
              </span>
            </div>
            <Button onClick={checkConfig} variant="outline">
              Kiểm tra cấu hình
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Test */}
      <Card>
        <CardHeader>
          <CardTitle>Upload ảnh test</CardTitle>
          <CardDescription>
            Upload một ảnh để test chức năng upload lên Cloudinary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CloudinaryImageUpload
            folder="test-uploads"
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            maxSize={10}
          />
        </CardContent>
      </Card>

      {/* Uploaded Image Display */}
      {uploadedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Ảnh đã upload</CardTitle>
            <CardDescription>Thông tin về ảnh vừa upload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <Label>Public ID:</Label>
                <Input value={uploadedImage.public_id} readOnly className="mt-1" />
              </div>
              <div>
                <Label>Secure URL:</Label>
                <Input value={uploadedImage.secure_url} readOnly className="mt-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preview:</Label>
              <div className="relative w-full h-64 border rounded-md overflow-hidden">
                <Image
                  src={uploadedImage.secure_url}
                  alt="Uploaded"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Optimized URLs:</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Thumbnail (200x200):</Label>
                  <div className="relative w-32 h-32 border rounded-md overflow-hidden mt-1">
                    <Image
                      src={getCloudinaryImageUrl(uploadedImage.public_id, {
                        width: 200,
                        height: 200,
                        crop: 'fill',
                        quality: 80,
                      })}
                      alt="Thumbnail"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Medium (800x600):</Label>
                  <div className="relative w-full h-48 border rounded-md overflow-hidden mt-1">
                    <Image
                      src={getCloudinaryImageUrl(uploadedImage.public_id, {
                        width: 800,
                        height: 600,
                        crop: 'limit',
                        quality: 85,
                      })}
                      alt="Medium"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test URL Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Test tạo URL từ Public ID</CardTitle>
          <CardDescription>
            Nhập Public ID để tạo URL ảnh đã được optimize
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="public-id">Public ID:</Label>
            <Input
              id="public-id"
              value={testPublicId}
              onChange={(e) => setTestPublicId(e.target.value)}
              placeholder="vd: test-uploads/abc123"
            />
          </div>
          <Button onClick={handleTestUrl}>Tạo URL</Button>

          {testImageUrl && (
            <div className="space-y-2">
              <Label>Generated URL:</Label>
              <Input value={testImageUrl} readOnly className="mt-1" />
              <div className="relative w-full h-64 border rounded-md overflow-hidden mt-2">
                <Image
                  src={testImageUrl}
                  alt="Test"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-1">
            <li>Kiểm tra cấu hình: Đảm bảo các biến môi trường đã được set đúng</li>
            <li>Upload ảnh: Chọn một ảnh và upload để test</li>
            <li>Kiểm tra kết quả: Xem Public ID và URL của ảnh đã upload</li>
            <li>Test URL generation: Thử tạo URL từ Public ID khác</li>
          </ol>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="font-medium mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>File .env.local phải có đầy đủ 3 biến: CLOUD_NAME, API_KEY, API_SECRET</li>
              <li>Restart dev server sau khi thêm/sửa biến môi trường</li>
              <li>API_KEY và API_SECRET chỉ dùng ở server-side</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


