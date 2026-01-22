'use client';

import { useState } from 'react';
import { uploadImageFromClient, getCloudinaryImageUrl } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CloudinaryImageUploadProps {
  onUploadSuccess?: (result: {
    public_id: string;
    secure_url: string;
    url: string;
    width: number;
    height: number;
    format: string;
  }) => void;
  onUploadError?: (error: Error) => void;
  folder?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export default function CloudinaryImageUpload({
  onUploadSuccess,
  onUploadError,
  folder,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className,
}: CloudinaryImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    public_id: string;
    secure_url: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!acceptedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        folder,
      });

      const result = await uploadImageFromClient(file, {
        folder,
      });

      console.log('Upload result:', result);

      setUploadedImage({
        public_id: result.public_id,
        secure_url: result.secure_url,
      });

      onUploadSuccess?.(result);
    } catch (err: any) {
      console.error('Upload error:', err);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Không thể tải lên hình ảnh';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
        if (err.message) {
          errorMessage += `: ${err.message}`;
        }
      }

      setError(errorMessage);
      onUploadError?.(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setUploadedImage(null);
    setError(null);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="image-upload">Upload Image</Label>
          <Input
            id="image-upload"
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileChange}
            disabled={isUploading}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Max size: {maxSize}MB. Accepted types: {acceptedTypes.join(', ')}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {preview && (
          <div className="space-y-2">
            <div className="relative w-full h-48 border rounded-md overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
            {!uploadedImage && (
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Uploading...' : 'Upload to Cloudinary'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isUploading}
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
        )}

        {uploadedImage && (
          <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Upload successful!
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Public ID:</span>{' '}
                {uploadedImage.public_id}
              </p>
              <p>
                <span className="font-medium">URL:</span>{' '}
                <a
                  href={uploadedImage.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {uploadedImage.secure_url}
                </a>
              </p>
            </div>
            <Button variant="outline" onClick={handleReset} className="mt-2">
              Upload Another
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

