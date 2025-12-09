/**
 * Patient Image Folder View Component
 * Hiển thị folder structure giống Cloudinary cho hình ảnh bệnh nhân
 * Format: patients/patient_{patientId}/{imageType}/
 */

"use client";

import React, { useState, useEffect } from "react";
import { Folder, FolderOpen, Image as ImageIcon, ChevronRight, ChevronDown, Loader2, X, Download, ZoomIn } from "lucide-react";
import { patientImageService } from "@/services/patientImageService";
import { patientService } from "@/services/patientService";
import { PatientImageType, PATIENT_IMAGE_TYPE_LABELS, PatientImageResponse } from "@/types/patientImage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PatientImageFolderViewProps {
  patientId?: number | string;
  patientCode?: string;
}

interface FolderData {
  type: PatientImageType;
  label: string;
  count: number;
  images: PatientImageResponse[];
  isOpen: boolean;
}

export default function PatientImageFolderView({
  patientId: propPatientId,
  patientCode,
}: PatientImageFolderViewProps) {
  const [patientId, setPatientId] = useState<number | null>(
    propPatientId ? (typeof propPatientId === 'string' ? parseInt(propPatientId, 10) : propPatientId) : null
  );
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<PatientImageType>>(new Set());
  const [selectedImage, setSelectedImage] = useState<PatientImageResponse | null>(null);

  // Fetch patientId from patientCode if not provided
  useEffect(() => {
    const fetchPatientId = async () => {
      if (propPatientId) {
        const id = typeof propPatientId === 'string' 
          ? parseInt(propPatientId, 10) 
          : propPatientId;
        if (!isNaN(id)) {
          setPatientId(id);
        }
        return;
      }

      if (patientCode && !propPatientId) {
        try {
          const patient = await patientService.getPatientByCode(patientCode);
          if (patient.patientId) {
            const id = typeof patient.patientId === 'string' 
              ? parseInt(patient.patientId, 10) 
              : patient.patientId;
            if (!isNaN(id)) {
              setPatientId(id);
            }
          }
        } catch (err: any) {
          console.error('Error fetching patient by code:', err);
          setError('Không thể tải thông tin bệnh nhân');
        }
      }
    };

    fetchPatientId();
  }, [propPatientId, patientCode]);

  // Initialize folders với tất cả image types
  useEffect(() => {
    const initialFolders: FolderData[] = Object.values(PatientImageType).map((type) => ({
      type,
      label: PATIENT_IMAGE_TYPE_LABELS[type],
      count: 0,
      images: [],
      isOpen: false,
    }));
    setFolders(initialFolders);
  }, []);

  // Load tất cả images ngay khi component mount
  useEffect(() => {
    const loadAllImages = async () => {
      if (!patientId || patientId === null) return;

      setLoading(true);
      setError(null);

      try {
        // Load tất cả images
        const response = await patientImageService.getPatientImages({
          patientId,
          page: 0,
          size: 1000, // Load nhiều để hiển thị tất cả
        });

        // Group images by type
        const imagesByType = new Map<PatientImageType, PatientImageResponse[]>();
        Object.values(PatientImageType).forEach((type) => {
          imagesByType.set(type, []);
        });

        response.images.forEach((image) => {
          const existing = imagesByType.get(image.imageType) || [];
          existing.push(image);
          imagesByType.set(image.imageType, existing);
        });

        // Update folders với images (load luôn, không cần expand)
        setFolders((prev) => {
          const foldersWithImages = prev.map((folder) => {
            const images = imagesByType.get(folder.type) || [];
            return {
              ...folder,
              count: images.length,
              images: images, // Load luôn tất cả images
            };
          });

          // Tự động expand tất cả folders có images
          const foldersToExpand = new Set<PatientImageType>();
          foldersWithImages.forEach((folder) => {
            if (folder.count > 0) {
              foldersToExpand.add(folder.type);
            }
          });
          setExpandedFolders(foldersToExpand);

          return foldersWithImages;
        });
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin folder");
      } finally {
        setLoading(false);
      }
    };

    loadAllImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Toggle folder expand/collapse (chỉ để show/hide, không cần load lại)
  const toggleFolder = (type: PatientImageType) => {
    const isExpanded = expandedFolders.has(type);
    const newExpanded = new Set(expandedFolders);

    if (isExpanded) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedFolders(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Hình Ảnh Bệnh Nhân
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Folders */}
            <div className="space-y-1">
              {folders.map((folder) => (
                <div key={folder.type} className="select-none">
                  {/* Folder Header */}
                  <div
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => toggleFolder(folder.type)}
                  >
                    {expandedFolders.has(folder.type) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {expandedFolders.has(folder.type) ? (
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Folder className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="flex-1 text-sm font-medium">
                      {folder.label}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        ({folder.count} {folder.count === 1 ? "file" : "files"})
                      </span>
                    </span>
                  </div>

                  {/* Folder Content (Images) - Hiển thị thumbnails */}
                  {expandedFolders.has(folder.type) && folder.images.length > 0 && (
                    <div className="ml-8 mt-2 border-l-2 border-muted pl-3">
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {folder.images.map((image) => (
                          <div
                            key={image.imageId}
                            className="group relative rounded-lg overflow-hidden border border-muted hover:border-primary/50 cursor-pointer transition-all duration-200 hover:shadow-md bg-white"
                            style={{ width: '100%', maxWidth: '200px', aspectRatio: '3/2' }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedImage(image);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Mở image trong tab mới khi chuột phải
                              window.open(image.imageUrl, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <img
                              src={image.imageUrl}
                              alt={image.description || `Image ${image.imageId}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                              draggable="false"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.png';
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedImage(image);
                              }}
                            />
                            {/* Overlay on hover với options - Style giống browser tabs */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-all duration-200 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-end gap-2 p-2.5">
                              {/* Image name */}
                              <div className="text-white text-xs font-medium text-center px-2.5 py-1.5 bg-black/60 rounded-md backdrop-blur-sm max-w-full shadow-sm">
                                <p className="truncate">
                                  {image.description || `Hình ảnh ${image.imageId}`}
                                </p>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2.5 text-xs bg-white hover:bg-gray-50 text-gray-900 shadow-md hover:shadow-lg transition-all"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedImage(image);
                                  }}
                                >
                                  <ZoomIn className="h-3.5 w-3.5 mr-1" />
                                  Xem
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2.5 text-xs bg-white hover:bg-gray-50 text-gray-900 shadow-md hover:shadow-lg transition-all"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Download image
                                    const link = document.createElement('a');
                                    link.href = image.imageUrl;
                                    link.download = `patient_${patientId}_${image.imageId}.${image.imageUrl.split('.').pop()?.split('?')[0] || 'jpg'}`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                  Tải
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty folder message */}
                  {expandedFolders.has(folder.type) && folder.images.length === 0 && (
                    <div className="ml-8 mt-1 text-sm text-muted-foreground italic pl-3">
                      Folder trống
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total count */}
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              Tổng: {folders.reduce((sum, f) => sum + f.count, 0)} hình ảnh
            </div>
          </div>
        )}
      </CardContent>

      {/* Image Lightbox Dialog - Render outside Card to ensure proper z-index */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedImage.description || `Hình ảnh ${selectedImage.imageId}`}
              </DialogTitle>
            </DialogHeader>
            <div className="relative flex items-center justify-center bg-muted/50 rounded-lg p-4">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.description || `Image ${selectedImage.imageId}`}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  console.error('Error loading image:', selectedImage.imageUrl);
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
              <div>
                <span className="font-medium">{PATIENT_IMAGE_TYPE_LABELS[selectedImage.imageType]}</span>
                {selectedImage.capturedDate && (
                  <span className="ml-2">• {formatDate(selectedImage.capturedDate)}</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

