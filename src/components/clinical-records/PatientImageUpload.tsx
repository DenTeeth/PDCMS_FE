/**
 * Patient Image Upload Component
 * Component để upload hình ảnh cho bệnh nhân
 * Hỗ trợ: drag & drop, preview, validation, và metadata
 */

"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Calendar,
  FileType,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { patientImageService } from "@/services/patientImageService";
import {
  PatientImageType,
  PATIENT_IMAGE_TYPE_LABELS,
  UploadPatientImageRequest,
  PatientImageResponse,
} from "@/types/patientImage";

interface PatientImageUploadProps {
  patientId: number;
  clinicalRecordId?: number; // Optional - nếu upload trong context của clinical record
  onUploadSuccess?: (image: PatientImageResponse) => void;
  onUploadError?: (error: string) => void;
  maxSizeMB?: number; // Default: 10MB
  allowedTypes?: string[]; // Default: common image types
}

export default function PatientImageUpload({
  patientId,
  clinicalRecordId,
  onUploadSuccess,
  onUploadError,
  maxSizeMB = 10,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
}: PatientImageUploadProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [imageType, setImageType] = useState<PatientImageType>(
    PatientImageType.PHOTO
  );
  const [description, setDescription] = useState("");
  const [capturedDate, setCapturedDate] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(
        ", "
      )}`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Kích thước file vượt quá ${maxSizeMB}MB. Kích thước hiện tại: ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle drag & drop
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn file để upload");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const metadata: UploadPatientImageRequest = {
        patientId,
        clinicalRecordId,
        imageType,
        description: description.trim() || undefined,
        capturedDate: capturedDate || undefined,
      };

      const result = await patientImageService.uploadImage(
        selectedFile,
        metadata
      );

      // Success
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // Reset form
      resetForm();
      setOpen(false);
    } catch (err: any) {
      const errorMessage = err.message || "Có lỗi xảy ra khi upload hình ảnh";
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageType(PatientImageType.PHOTO);
    setDescription("");
    setCapturedDate("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Upload className="h-4 w-4" />
        Upload hình ảnh
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload hình ảnh bệnh nhân</DialogTitle>
            <DialogDescription>
              Chọn và upload hình ảnh cho bệnh nhân. Hình ảnh sẽ được lưu trữ an
              toàn trên cloud.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>Chọn file</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${selectedFile ? "bg-green-50 border-green-500" : ""}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={allowedTypes.join(",")}
                  onChange={handleFileInputChange}
                />

                {!selectedFile ? (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Kéo thả file vào đây hoặc click để chọn
                    </p>
                    <p className="text-xs text-gray-500">
                      Định dạng: JPG, PNG, GIF, WebP. Tối đa {maxSizeMB}MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="h-12 w-12 mx-auto text-green-500" />
                    <p className="text-sm font-medium text-green-700">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-2">
                <Label>Xem trước</Label>
                <div className="relative border rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Image Type */}
            <div className="space-y-2">
              <Label htmlFor="imageType">
                <FileType className="inline h-4 w-4 mr-1" />
                Loại hình ảnh <span className="text-red-500">*</span>
              </Label>
              <Select
                value={imageType}
                onValueChange={(value) =>
                  setImageType(value as PatientImageType)
                }
              >
                <SelectTrigger id="imageType">
                  <SelectValue placeholder="Chọn loại hình ảnh" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PatientImageType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {PATIENT_IMAGE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Captured Date */}
            <div className="space-y-2">
              <Label htmlFor="capturedDate">
                <Calendar className="inline h-4 w-4 mr-1" />
                Ngày chụp (tùy chọn)
              </Label>
              <Input
                id="capturedDate"
                type="date"
                value={capturedDate}
                onChange={(e) => setCapturedDate(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả (tùy chọn)</Label>
              <Textarea
                id="description"
                placeholder="Nhập mô tả về hình ảnh..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {description.length}/500 ký tự
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang upload...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
