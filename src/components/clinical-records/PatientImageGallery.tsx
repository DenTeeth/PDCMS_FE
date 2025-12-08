/**
 * Patient Image Gallery Component
 * Hiển thị gallery hình ảnh của bệnh nhân với các tính năng:
 * - Grid view với pagination
 * - Filter theo loại hình ảnh, ngày tháng
 * - Xem full size (lightbox)
 * - Xóa hình ảnh
 * - Cập nhật metadata
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Trash2,
  Download,
  ZoomIn,
  Filter,
  Calendar,
  FileType,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { patientImageService } from "@/services/patientImageService";
import {
  PatientImageResponse,
  PatientImageType,
  PATIENT_IMAGE_TYPE_LABELS,
  PatientImageFilterOptions,
} from "@/types/patientImage";

interface PatientImageGalleryProps {
  patientId: number;
  clinicalRecordId?: number; // Optional - filter by clinical record
  showFilters?: boolean;
  pageSize?: number;
}

export default function PatientImageGallery({
  patientId,
  clinicalRecordId,
  showFilters = true,
  pageSize = 12,
}: PatientImageGalleryProps) {
  const [images, setImages] = useState<PatientImageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState<PatientImageType | "ALL">("ALL");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Lightbox
  const [lightboxImage, setLightboxImage] =
    useState<PatientImageResponse | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Delete confirmation
  const [deleteImage, setDeleteImage] = useState<PatientImageResponse | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Load images
  const loadImages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const options: PatientImageFilterOptions = {
        patientId,
        clinicalRecordId,
        page: currentPage,
        size: pageSize,
      };

      if (filterType !== "ALL") {
        options.imageType = filterType as PatientImageType;
      }
      if (filterFromDate) {
        options.fromDate = filterFromDate;
      }
      if (filterToDate) {
        options.toDate = filterToDate;
      }

      const response = await patientImageService.getPatientImages(options);
      setImages(response.images); // BE response dùng "images" field
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.currentPage);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách hình ảnh");
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount and when filters change
  useEffect(() => {
    loadImages();
  }, [
    patientId,
    clinicalRecordId,
    currentPage,
    filterType,
    filterFromDate,
    filterToDate,
  ]);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteImage) return;

    setIsDeleting(true);
    try {
      await patientImageService.deleteImage(deleteImage.imageId);
      setDeleteImage(null);
      // Reload images
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Không thể xóa hình ảnh");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle download
  const handleDownload = (image: PatientImageResponse) => {
    const link = document.createElement("a");
    link.href = image.imageUrl;
    link.download = `patient_${patientId}_${image.imageId}.${image.imageUrl
      .split(".")
      .pop()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lightbox navigation
  const openLightbox = (image: PatientImageResponse, index: number) => {
    setLightboxImage(image);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const nextImage = () => {
    if (lightboxIndex < images.length - 1) {
      const newIndex = lightboxIndex + 1;
      setLightboxIndex(newIndex);
      setLightboxImage(images[newIndex]);
    }
  };

  const prevImage = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1;
      setLightboxIndex(newIndex);
      setLightboxImage(images[newIndex]);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilterType("ALL");
    setFilterFromDate("");
    setFilterToDate("");
    setCurrentPage(0);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hình ảnh bệnh nhân</h3>
          <p className="text-sm text-gray-500">
            Tổng: {totalElements} hình ảnh
          </p>
        </div>
        {showFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Lọc
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="filterType">
                <FileType className="inline h-4 w-4 mr-1" />
                Loại hình ảnh
              </Label>
              <Select
                value={filterType}
                onValueChange={(value) =>
                  setFilterType(value as PatientImageType | "ALL")
                }
              >
                <SelectTrigger id="filterType">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {Object.values(PatientImageType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {PATIENT_IMAGE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* From Date */}
            <div className="space-y-2">
              <Label htmlFor="filterFromDate">
                <Calendar className="inline h-4 w-4 mr-1" />
                Từ ngày
              </Label>
              <Input
                id="filterFromDate"
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
              />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <Label htmlFor="filterToDate">
                <Calendar className="inline h-4 w-4 mr-1" />
                Đến ngày
              </Label>
              <Input
                id="filterToDate"
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && images.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Chưa có hình ảnh nào</p>
        </div>
      )}

      {/* Image Grid */}
      {!isLoading && !error && images.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.imageId}
                className="group relative bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div
                  className="aspect-square bg-gray-100 cursor-pointer"
                  onClick={() => openLightbox(image, index)}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.description || `Image ${image.imageId}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openLightbox(image, index)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(image)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteImage(image)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {PATIENT_IMAGE_TYPE_LABELS[image.imageType]}
                  </p>
                  {image.capturedDate && (
                    <p className="text-xs text-gray-500">
                      {formatDate(image.capturedDate)}
                    </p>
                  )}
                  {image.description && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {image.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Lightbox Dialog */}
      {lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => closeLightbox()}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {PATIENT_IMAGE_TYPE_LABELS[lightboxImage.imageType]}
              </DialogTitle>
              <DialogDescription>
                {lightboxImage.description && (
                  <span>{lightboxImage.description}</span>
                )}
                {lightboxImage.capturedDate && (
                  <span className="ml-2 text-gray-500">
                    • {formatDate(lightboxImage.capturedDate)}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Image */}
            <div className="relative">
              <img
                src={lightboxImage.imageUrl}
                alt={
                  lightboxImage.description || `Image ${lightboxImage.imageId}`
                }
                className="w-full h-auto max-h-[60vh] object-contain"
              />

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                    disabled={lightboxIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                    disabled={lightboxIndex >= images.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleDownload(lightboxImage)}
              >
                <Download className="h-4 w-4 mr-2" />
                Tải xuống
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteImage(lightboxImage)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteImage}
        onOpenChange={() => setDeleteImage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa hình ảnh</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa hình ảnh này không? Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
