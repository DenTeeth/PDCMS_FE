'use client';

import NiiViewer from '@/components/nii-viewer/NiiViewer';

export default function PatientNiiViewerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CBCT Viewer</h1>
        <p className="text-muted-foreground mt-2">
          Tải lên và xem hình ảnh y tế 3D từ file .nii
        </p>
      </div>
      <NiiViewer 
        title="Trình xem hình ảnh cắt lớp"
        description="Tải lên và xem hình ảnh y tế 3D từ file .nii"
      />
    </div>
  );
}

