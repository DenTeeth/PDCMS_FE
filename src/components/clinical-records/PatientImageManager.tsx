/**
 * Patient Image Manager Component
 * Component tích hợp Upload + Gallery để quản lý hình ảnh bệnh nhân
 */

"use client";

import React, { useState } from "react";
import PatientImageUpload from "./PatientImageUpload";
import PatientImageGallery from "./PatientImageGallery";
import { PatientImageResponse } from "@/types/patientImage";

interface PatientImageManagerProps {
  patientId: number;
  clinicalRecordId?: number;
  showFilters?: boolean;
}

export default function PatientImageManager({
  patientId,
  clinicalRecordId,
  showFilters = true,
}: PatientImageManagerProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = (image: PatientImageResponse) => {
    console.log("Image uploaded successfully:", image);
    // Trigger gallery reload by changing key
    setRefreshKey((prev) => prev + 1);
  };

  const handleUploadError = (error: string) => {
    console.error("Image upload failed:", error);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Quản lý hình ảnh</h2>
        <PatientImageUpload
          patientId={patientId}
          clinicalRecordId={clinicalRecordId}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </div>

      {/* Gallery Section */}
      <PatientImageGallery
        key={refreshKey}
        patientId={patientId}
        clinicalRecordId={clinicalRecordId}
        showFilters={showFilters}
      />
    </div>
  );
}
