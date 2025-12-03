'use client';

import { useEffect, useRef, useState } from 'react';
import { Niivue } from '@niivue/niivue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, 
  faX, 
  faImage, 
  faRotate,
  faCube,
  faCut,
  faInfoCircle,
  faEye,
  faLayerGroup
} from '@fortawesome/free-solid-svg-icons';

interface NiiViewerProps {
  title?: string;
  description?: string;
}

export default function NiiViewer({ 
  title = 'CBCT Viewer',
  description = 'Upload and view 3D medical images from .nii files'
}: NiiViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nvRef = useRef<Niivue | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volumeInfo, setVolumeInfo] = useState<any>(null);
  const [renderMode, setRenderMode] = useState(0); // 0: multiplanar, 1: render, 2: axial, 3: coronal

  useEffect(() => {
    if (canvasRef.current && !nvRef.current) {
      // Initialize Niivue - giống như code HTML
      const nv = new Niivue({
        show3Dcrosshair: true,
        backColor: [0.1, 0.1, 0.1, 1],
        clipPlaneColor: [0.3, 0.3, 0.3, 0.5],
        crosshairWidth: 2,
        isRadiologicalConvention: false,
        meshThicknessOn2D: 0.5,
        dragAndDropEnabled: true,
        isOrientCube: true,
        logLevel: 'info',
      });
      nv.attachToCanvas(canvasRef.current);
      nvRef.current = nv;
    }

    // Handle window resize
    const handleResize = () => {
      if (nvRef.current && canvasRef.current) {
        // Trigger a redraw on resize
        nvRef.current.drawScene();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (nvRef.current) {
        // Remove all volumes before cleanup
        try {
          const volumes = nvRef.current.volumes || [];
          volumes.forEach((vol, index) => {
            nvRef.current?.removeVolumeByIndex(index);
          });
        } catch (e) {
          console.error('Error closing volumes:', e);
        }
        nvRef.current = null;
      }
    };
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file exists and has name
    if (!selectedFile.name) {
      setError('File không hợp lệ: không có tên file');
      return;
    }

    // Validate file extension
    const validExtensions = ['.nii', '.nii.gz', '.nrrd'];
    const fileName = selectedFile.name || '';
    const isValid = validExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    
    if (!isValid) {
      setError('File không đúng định dạng. Chỉ chấp nhận .nii, .nii.gz hoặc .nrrd');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsLoading(true);
    setVolumeInfo(null);

    try {
      if (!nvRef.current || !canvasRef.current) {
        setError('Trình xem chưa sẵn sàng. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      // Remove any existing volumes first
      if (nvRef.current.volumes && nvRef.current.volumes.length > 0) {
        const volumes = [...nvRef.current.volumes];
        volumes.forEach((vol) => {
          nvRef.current?.removeVolume(vol);
        });
      }

      console.log('Loading file:', selectedFile.name, 'Size:', selectedFile.size);
      
      let loadSuccess = false;
      
      // Cách 1: Sử dụng Blob URL (cách này ổn định hơn)
      try {
        const blobUrl = URL.createObjectURL(selectedFile);
        console.log('Trying to load with Blob URL:', blobUrl);
        
        await nvRef.current.loadVolumes([{ 
          url: blobUrl,
          name: selectedFile.name 
        }]);
        
        // Don't revoke URL immediately - Niivue might need it
        // URL.revokeObjectURL(blobUrl);
        loadSuccess = true;
        console.log('Loaded using Blob URL');
      } catch (e1) {
        console.log('Method 1 (Blob URL) failed, trying method 2...', e1);
        
        // Cách 2: Thử load trực tiếp từ File object
        try {
          const volumeList = [{ 
            url: selectedFile.name || 'file.nii', 
            file: selectedFile 
          }];
          await nvRef.current.loadVolumes(volumeList);
          loadSuccess = true;
          console.log('Loaded using File object directly');
        } catch (e2) {
          console.log('Method 2 (File object) also failed, trying method 3...', e2);
          
          // Cách 3: Đọc ArrayBuffer và tạo Blob mới
          try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
            const blobUrl = URL.createObjectURL(blob);
            await nvRef.current.loadVolumes([{ 
              url: blobUrl,
              name: selectedFile.name 
            }]);
            loadSuccess = true;
            console.log('Loaded using ArrayBuffer -> Blob');
          } catch (e3) {
            console.error('All loading methods failed:', e3);
            throw new Error(`Không thể tải file: ${e3 instanceof Error ? e3.message : 'Lỗi không xác định'}`);
          }
        }
      }
      
      if (!loadSuccess) {
        throw new Error('Tất cả các phương thức load đều thất bại');
      }
      
      if (!nvRef.current.volumes || nvRef.current.volumes.length === 0) {
        throw new Error('Không thể tải volume từ file');
      }

      const vol = nvRef.current.volumes[0];
      setVolumeInfo(vol);
      
      console.log('Volume loaded successfully:', vol);
      
      // Thiết lập view mặc định (3D render) - giống code HTML
      setTimeout(() => {
        if (nvRef.current) {
          nvRef.current.setSliceType(nvRef.current.sliceTypeRender);
          nvRef.current.setRenderAzimuthElevation(120, 10);
          nvRef.current.drawScene();
          setRenderMode(1); // Set to render mode
          console.log('Switched to 3D render mode');
        }
      }, 200);
      
    } catch (err) {
      console.error('Error loading NII file:', err);
      setError(`Không thể tải file NII: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
      setFile(null);
      setVolumeInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (nvRef.current && nvRef.current.volumes) {
      // Remove all volumes
      const volumes = [...nvRef.current.volumes];
      volumes.forEach((vol) => {
        nvRef.current?.removeVolume(vol);
      });
      nvRef.current.drawScene();
    }
    setFile(null);
    setError(null);
    setVolumeInfo(null);
    setIsLoading(false);
    setRenderMode(0);
    // Reset file input
    const fileInput = document.getElementById('nii-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleResetView = () => {
    if (nvRef.current) {
      nvRef.current.setSliceType(nvRef.current.sliceTypeMultiplanar);
      nvRef.current.setRenderAzimuthElevation(120, 10);
      nvRef.current.drawScene();
      setRenderMode(0);
    }
  };

  const handleToggleRenderMode = () => {
    if (!nvRef.current || !nvRef.current.volumes || nvRef.current.volumes.length === 0) {
      return;
    }

    const newMode = (renderMode + 1) % 4;
    setRenderMode(newMode);

    switch(newMode) {
      case 0: // Multi-planar view
        nvRef.current.setSliceType(nvRef.current.sliceTypeMultiplanar);
        console.log('Mode: Multi-planar');
        break;
      case 1: // 3D render
        nvRef.current.setSliceType(nvRef.current.sliceTypeRender);
        console.log('Mode: 3D Render');
        break;
      case 2: // Axial view
        nvRef.current.setSliceType(nvRef.current.sliceTypeAxial);
        console.log('Mode: Axial');
        break;
      case 3: // Coronal view
        nvRef.current.setSliceType(nvRef.current.sliceTypeCoronal);
        console.log('Mode: Coronal');
        break;
    }
    nvRef.current.drawScene();
  };

  const handleToggleClip = () => {
    if (nvRef.current && nvRef.current.volumes && nvRef.current.volumes.length > 0) {
      // Toggle clip plane: [depth, azimuth, elevation]
      // depth > 2.0 disables clipping
      const currentClip = nvRef.current.scene.clipPlane || [2.1, 0, 0];
      const newClip = currentClip[0] > 2.0 ? [0.5, 0, 90] : [2.1, 0, 0];
      nvRef.current.setClipPlane(newClip);
      nvRef.current.drawScene();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faImage} className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Section */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label
                htmlFor="nii-file-input"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-accent/50 hover:bg-accent transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FontAwesomeIcon icon={faUpload} className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Nhấp để tải lên</span> hoặc kéo thả
                  </p>
                  <p className="text-xs text-muted-foreground">Chỉ file NII hoặc NII.GZ</p>
                </div>
                <input
                  id="nii-file-input"
                  type="file"
                  className="hidden"
                  accept=".nii,.nii.gz"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </label>
            </div>
            {file && (
              <Button
                variant="outline"
                onClick={handleClear}
                className="h-32"
              >
                <FontAwesomeIcon icon={faX} className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            )}
          </div>

          {/* File Info */}
          {file && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">File đã chọn:</p>
              <p className="text-sm text-muted-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Kích thước: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Đang tải hình ảnh...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle>Điều khiển</CardTitle>
            <CardDescription>
              Các tùy chọn xem và điều chỉnh mô hình 3D
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleResetView}
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faRotate} className="h-4 w-4" />
                Reset góc nhìn
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleRenderMode}
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCube} className="h-4 w-4" />
                Chuyển chế độ render
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleClip}
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCut} className="h-4 w-4" />
                Bật/tắt cắt lát
              </Button>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p><strong>Hướng dẫn:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Xoay: Giữ chuột trái và kéo</li>
                <li>Thu phóng: Cuộn chuột hoặc chạm hai ngón tay</li>
                <li>Di chuyển: Giữ chuột phải và kéo</li>
                <li>Cắt lát: Giữ Shift + chuột trái để thay đổi mặt cắt</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3D Viewer Canvas */}
      <Card>
        <CardHeader>
          <CardTitle>Trình xem CBCT</CardTitle>
          <CardDescription>
            Hình ảnh 3D của file NII
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef}
            className="relative w-full h-[600px] bg-background rounded-lg border border-border overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ display: 'block' }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Đang tải file...</p>
                </div>
              </div>
            )}
            {!file && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <FontAwesomeIcon icon={faImage} className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Tải lên file NII để xem mô hình 3D</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Volume Info */}
      {volumeInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5 text-primary" />
              Thông tin hình ảnh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Kích thước:</strong>{' '}
                {volumeInfo.dims?.[1]} x {volumeInfo.dims?.[2]} x {volumeInfo.dims?.[3]} voxels
              </p>
              {volumeInfo.pixDims && (
                <p>
                  <strong>Độ phân giải:</strong>{' '}
                  {volumeInfo.pixDims[1]?.toFixed(2)} x {volumeInfo.pixDims[2]?.toFixed(2)} x {volumeInfo.pixDims[3]?.toFixed(2)} mm
                </p>
              )}
              {volumeInfo.datatypeCode && (
                <p>
                  <strong>Kiểu dữ liệu:</strong> {volumeInfo.datatypeCode}
                </p>
              )}
              {(volumeInfo.cal_min !== undefined || volumeInfo.cal_max !== undefined) && (
                <p>
                  <strong>Min/Max:</strong>{' '}
                  {volumeInfo.cal_min?.toFixed(2) || 'N/A'} / {volumeInfo.cal_max?.toFixed(2) || 'N/A'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

