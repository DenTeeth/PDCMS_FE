'use client';

/**
 * Procedure Form Component
 * 
 * Form to add or edit a procedure
 * Optimized UX: Dialog form, minimal fields
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ProcedureDTO, AddProcedureRequest, UpdateProcedureRequest } from '@/types/clinicalRecord';
import { clinicalRecordService } from '@/services/clinicalRecordService';
import { ServiceService } from '@/services/serviceService';
import { Service } from '@/types/service';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Save, X, Package, Info, AlertTriangle, CheckCircle2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ServiceBOMView from './ServiceBOMView';
import { serviceConsumableService } from '@/services/serviceConsumableService';
import { ServiceConsumablesResponse } from '@/types/serviceConsumable';
import { ProcedureMaterialsResponse, ProcedureMaterialItem } from '@/types/clinicalRecord';
import EditMaterialQuantityDialog from './EditMaterialQuantityDialog';

interface ProcedureFormProps {
  recordId: number;
  procedure?: ProcedureDTO;
  appointmentStatus?: string; // To determine if materials can be edited
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  serviceId: string; // Will be converted to number
  procedureDescription: string;
  toothNumber?: string;
  notes?: string;
}

export default function ProcedureForm({
  recordId,
  procedure,
  appointmentStatus,
  onSuccess,
  onCancel,
}: ProcedureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [showBOMView, setShowBOMView] = useState(false);
  const [bom, setBom] = useState<ServiceConsumablesResponse | null>(null);
  const [loadingBOM, setLoadingBOM] = useState(false);
  const [bomError, setBomError] = useState<string | null>(null);
  // Materials for editing procedure
  const [procedureMaterials, setProcedureMaterials] = useState<ProcedureMaterialsResponse | null>(null);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [editingMaterialQuantity, setEditingMaterialQuantity] = useState<ProcedureMaterialItem | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      serviceId: procedure?.serviceCode ? '' : '', // Will be set from serviceId lookup
      procedureDescription: procedure?.procedureDescription || '',
      toothNumber: procedure?.toothNumber || '',
      notes: procedure?.notes || '',
    },
  });

  const selectedServiceId = watch('serviceId');
  const selectedService = services.find(s => String(s.serviceId) === selectedServiceId);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const response = await ServiceService.getServices({
          isActive: 'true', // Only active services
          page: 0,
          size: 100, // Load first 100 services
        });
        setServices(response.content);
      } catch (error: any) {
        console.error('Error loading services:', error);
        toast.error('Không thể tải danh sách dịch vụ');
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  // Set initial serviceId if editing
  useEffect(() => {
    if (procedure && services.length > 0) {
      // Find service by code or name
      const service = services.find(
        (s) => s.serviceCode === procedure.serviceCode || s.serviceName === procedure.serviceName
      );
      if (service) {
        setValue('serviceId', String(service.serviceId));
      }
    }
  }, [procedure, services, setValue]);

  // Auto-load BOM when service is selected
  useEffect(() => {
    const loadBOM = async () => {
      if (!selectedServiceId) {
        setBom(null);
        setBomError(null);
        return;
      }

      const serviceIdNum = Number(selectedServiceId);
      if (isNaN(serviceIdNum)) {
        console.warn('Invalid serviceId:', selectedServiceId);
        return;
      }

      try {
        setLoadingBOM(true);
        setBomError(null);
        console.log('[ProcedureForm] Loading BOM for serviceId:', serviceIdNum);
        const data = await serviceConsumableService.getServiceConsumables(serviceIdNum);
        console.log('[ProcedureForm] BOM loaded:', data);
        setBom(data);
      } catch (error: any) {
        console.error('[ProcedureForm] Error loading service BOM:', {
          error,
          status: error.status || error.response?.status,
          message: error.message,
          serviceId: serviceIdNum,
        });
        setBom(null);
        // 404 means service has no BOM (doesn't consume materials) - this is OK
        const status = error.status || error.response?.status;
        if (status === 404) {
          console.log('[ProcedureForm] Service has no BOM (404) - this is OK');
          setBomError('NO_BOM'); // Special flag for "no consumables"
        } else {
          console.error('[ProcedureForm] BOM load error:', error);
          setBomError(error.message || error.response?.data?.message || 'Không thể tải danh sách vật tư');
        }
      } finally {
        setLoadingBOM(false);
      }
    };

    loadBOM();
  }, [selectedServiceId]);

  // Load procedure materials when editing and appointment status allows
  useEffect(() => {
    const canViewMaterials = appointmentStatus === 'IN_PROGRESS' || appointmentStatus === 'COMPLETED';
    console.log('[ProcedureForm] Materials load effect:', {
      isEditMode,
      procedureId: procedure?.procedureId,
      appointmentStatus,
      canViewMaterials,
    });
    if (!procedure?.procedureId || !canViewMaterials) {
      console.log('[ProcedureForm] Skipping materials load:', {
        hasProcedureId: !!procedure?.procedureId,
        canViewMaterials,
      });
      setProcedureMaterials(null);
      return;
    }

    const loadMaterials = async () => {
      try {
        setLoadingMaterials(true);
        const materials = await clinicalRecordService.getProcedureMaterials(procedure.procedureId);
        console.log('[ProcedureForm] Materials loaded:', {
          hasConsumables: materials.hasConsumables,
          materialsCount: materials.materials?.length || 0,
          materialsDeducted: materials.materialsDeducted,
        });
        setProcedureMaterials(materials);
      } catch (error: any) {
        console.error('[ProcedureForm] Error loading procedure materials:', error);
        // Don't show error if 404 (no materials yet) or hasConsumables === false
        if (error.status !== 404 && error.response?.status !== 404) {
          // Only show error if it's not a "no consumables" case
          if (error.status !== 400) {
            console.warn('[ProcedureForm] Could not load materials:', error);
          }
        }
        setProcedureMaterials(null);
      } finally {
        setLoadingMaterials(false);
      }
    };

    loadMaterials();
  }, [procedure?.procedureId, appointmentStatus]);

  const handleMaterialQuantityUpdated = (updatedMaterial: ProcedureMaterialItem) => {
    if (!procedureMaterials) return;
    
    // Update the material in the list
    const updatedMaterials = procedureMaterials.materials.map((m) =>
      m.usageId === updatedMaterial.usageId ? updatedMaterial : m
    );
    
    setProcedureMaterials({
      ...procedureMaterials,
      materials: updatedMaterials,
    });
    
    toast.success('Đã cập nhật số lượng vật tư thành công');
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const serviceId = parseInt(data.serviceId);
      if (isNaN(serviceId)) {
        toast.error('Vui lòng chọn dịch vụ');
        setIsSubmitting(false);
        return;
      }

      if (procedure) {
        // Update existing procedure
        const updateRequest: UpdateProcedureRequest = {
          serviceId,
          procedureDescription: data.procedureDescription,
          toothNumber: data.toothNumber?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        };

        await clinicalRecordService.updateProcedure(
          recordId,
          procedure.procedureId,
          updateRequest
        );
        toast.success('Đã cập nhật thủ thuật thành công');
        
        // Reload materials after update (BE may create materials if service changed)
        if (procedure.procedureId && (appointmentStatus === 'IN_PROGRESS' || appointmentStatus === 'COMPLETED')) {
          try {
            const materials = await clinicalRecordService.getProcedureMaterials(procedure.procedureId);
            setProcedureMaterials(materials);
          } catch (error: any) {
            console.warn('[ProcedureForm] Could not reload materials after update:', error);
          }
        }
      } else {
        // Create new procedure
        const createRequest: AddProcedureRequest = {
          serviceId,
          procedureDescription: data.procedureDescription,
          toothNumber: data.toothNumber?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        };

        const response = await clinicalRecordService.addProcedure(recordId, createRequest);
        toast.success('Đã thêm thủ thuật thành công');
        
        // Reload materials after create (BE automatically creates materials from BOM)
        // Note: We need to wait a bit for BE to create materials
        if (response.procedureId && (appointmentStatus === 'IN_PROGRESS' || appointmentStatus === 'COMPLETED')) {
          setTimeout(async () => {
            try {
              const materials = await clinicalRecordService.getProcedureMaterials(response.procedureId);
              setProcedureMaterials(materials);
            } catch (error: any) {
              console.warn('[ProcedureForm] Could not load materials after create:', error);
            }
          }, 500); // Wait 500ms for BE to create materials
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving procedure:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi lưu thủ thuật');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!procedure;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Chỉnh sửa thủ thuật' : 'Thêm thủ thuật mới'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Cập nhật thông tin thủ thuật đã thực hiện'
              : 'Ghi nhận thủ thuật đã thực hiện cho bệnh nhân'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="serviceId" className="text-sm font-semibold">
              Dịch Vụ <span className="text-destructive">*</span>
            </Label>
            {loadingServices ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách dịch vụ...
              </div>
            ) : (
              <Select
                value={selectedServiceId}
                onValueChange={(value) => {
                  setValue('serviceId', value);
                  console.log('Service selected:', value); // Debug log
                }}
              >
                <SelectTrigger id="serviceId" className={`w-full ${errors.serviceId ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent 
                  align="start"
                  className="max-h-[400px]" 
                  position="popper"
                  style={{ width: 'var(--radix-select-trigger-width)' }}
                >
                  {services.map((service) => (
                    <SelectItem 
                      key={service.serviceId} 
                      value={String(service.serviceId)}
                      className="py-3"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{service.serviceName}</span>
                          {service.serviceCode && (
                            <span className="text-xs text-muted-foreground font-mono">
                              ({service.serviceCode})
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {service.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.serviceId && (
              <p className="text-sm text-destructive">{errors.serviceId.message}</p>
            )}
            {!selectedServiceId && !loadingServices && (
              <p className="text-sm text-destructive">Vui lòng chọn dịch vụ</p>
            )}
            {/* Auto-display BOM when service is selected */}
            {selectedServiceId && (
              <div className="mt-3 space-y-2">
                {loadingBOM ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tải vật tư...</span>
                  </div>
                ) : bomError === 'NO_BOM' ? (
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4 opacity-50" />
                      <span>Thủ thuật này không tiêu hao vật tư</span>
                    </div>
                  </div>
                ) : bomError ? (
                  <div className="border rounded-lg p-3 bg-destructive/10 border-destructive/20">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{bomError}</span>
                    </div>
                  </div>
                ) : bom && bom.consumables && bom.consumables.length > 0 ? (
                  <div className="border rounded-lg p-3 bg-blue-50/50 border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">
                          Vật tư dự kiến từ BOM ({bom.consumables.length} loại)
                        </span>
                        <span title="Đây là vật tư từ BOM của service. Để chỉnh sửa số lượng, vui lòng xem phần 'Vật tư đã ghi nhận' bên dưới.">
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </span>
                      </div>
                      {bom.hasInsufficientStock && (
                        <span className="text-xs text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Có vật tư thiếu
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {bom.consumables.map((item, index) => (
                        <div key={index} className="text-xs flex items-center justify-between py-1">
                          <span className="text-blue-800">
                            {item.itemName}
                            {item.itemCode && (
                              <span className="text-muted-foreground ml-1">({item.itemCode})</span>
                            )}
                          </span>
                          <span className="text-blue-900 font-medium">
                            {item.quantity} {item.unitName}
                            {item.stockStatus === 'OUT_OF_STOCK' && (
                              <span className="text-destructive ml-1">(Hết hàng)</span>
                            )}
                            {item.stockStatus === 'LOW' && (
                              <span className="text-orange-600 ml-1">(Thấp)</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBOMView(true)}
                        className="flex-1 text-xs h-7"
                      >
                        Xem chi tiết
                      </Button>
                      {isEditMode && procedure?.procedureId && (appointmentStatus === 'IN_PROGRESS' || appointmentStatus === 'COMPLETED') && !loadingMaterials && procedureMaterials && procedureMaterials.hasConsumables && procedureMaterials.materials && procedureMaterials.materials.length > 0 && !procedureMaterials.materialsDeducted && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Show first material for editing quantity
                            const firstMaterial = procedureMaterials.materials[0];
                            if (firstMaterial) {
                              setEditingMaterialQuantity(firstMaterial);
                            }
                          }}
                          className="flex-1 text-xs h-7"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Chỉnh sửa số lượng
                        </Button>
                      )}
                    </div>
                    {/* Show procedure materials if available and in edit mode */}
                    {isEditMode && procedure?.procedureId && (appointmentStatus === 'IN_PROGRESS' || appointmentStatus === 'COMPLETED') && (
                      loadingMaterials ? (
                        <div className="mt-3 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                          Đang tải vật tư đã ghi nhận...
                        </div>
                      ) : procedureMaterials && procedureMaterials.hasConsumables && procedureMaterials.materials && procedureMaterials.materials.length > 0 ? (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          <div className="text-xs font-semibold text-blue-900 mb-2">
                            Vật tư đã ghi nhận ({procedureMaterials.materials.length} loại)
                            {procedureMaterials.materialsDeducted && (
                              <span className="text-xs text-muted-foreground ml-2">(Đã trừ kho)</span>
                            )}
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {procedureMaterials.materials.map((material) => (
                              <div
                                key={material.usageId}
                                className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 text-xs"
                              >
                                <span className="text-blue-800">
                                  {material.itemName}
                                  {material.itemCode && (
                                    <span className="text-muted-foreground ml-1">({material.itemCode})</span>
                                  )}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-900 font-medium">
                                    {material.quantity} {material.unitName}
                                  </span>
                                  {!procedureMaterials.materialsDeducted && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingMaterialQuantity(material)}
                                      className="h-6 w-6 p-0"
                                      title="Chỉnh sửa số lượng dự kiến"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : procedureMaterials && !procedureMaterials.hasConsumables ? (
                        <div className="mt-3 text-xs text-muted-foreground italic">
                          Thủ thuật này không tiêu hao vật tư
                        </div>
                      ) : procedureMaterials && procedureMaterials.hasConsumables && (!procedureMaterials.materials || procedureMaterials.materials.length === 0) ? (
                        <div className="mt-3 text-xs text-orange-600">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Vật tư chưa được tạo. Vui lòng đợi vài giây hoặc refresh trang.
                        </div>
                      ) : null
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>


          {/* Procedure Description */}
          <div className="space-y-2">
            <Label htmlFor="procedureDescription" className="text-sm font-semibold">
              Mô Tả Thủ Thuật <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="procedureDescription"
              {...register('procedureDescription', {
                required: 'Vui lòng nhập mô tả thủ thuật',
                minLength: { value: 3, message: 'Mô tả phải có ít nhất 3 ký tự' },
                maxLength: { value: 1000, message: 'Mô tả không được vượt quá 1000 ký tự' },
              })}
              placeholder="Mô tả chi tiết thủ thuật đã thực hiện..."
              rows={4}
              className={`w-full ${errors.procedureDescription ? 'border-destructive' : ''}`}
            />
            {errors.procedureDescription && (
              <p className="text-sm text-destructive">{errors.procedureDescription.message}</p>
            )}
          </div>

          {/* Tooth Number */}
          <div className="space-y-2">
            <Label htmlFor="toothNumber" className="text-sm font-semibold">
              Số Răng (FDI)
            </Label>
            <Input
              id="toothNumber"
              {...register('toothNumber', {
                maxLength: { value: 10, message: 'Số răng không được vượt quá 10 ký tự' },
                pattern: {
                  value: /^[0-9]{1,2}$/,
                  message: 'Số răng phải là số từ 1-2 chữ số (FDI notation: 11-48)',
                },
              })}
              placeholder="VD: 11, 18, 36, 46..."
              maxLength={10}
              className={`w-full ${errors.toothNumber ? 'border-destructive' : ''}`}
            />
            {errors.toothNumber && (
              <p className="text-sm text-destructive">{errors.toothNumber.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Nhập số răng theo hệ thống FDI (11-18, 21-28, 31-38, 41-48)
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold">
              Ghi Chú
            </Label>
            <Textarea
              id="notes"
              {...register('notes', {
                maxLength: { value: 1000, message: 'Ghi chú không được vượt quá 1000 ký tự' },
              })}
              placeholder="Thêm ghi chú về thủ thuật (nếu có)..."
              rows={3}
              className={`w-full ${errors.notes ? 'border-destructive' : ''}`}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>


          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedServiceId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Cập nhật' : 'Thêm'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        {/* Service BOM View Dialog */}
        {selectedServiceId && (
          <ServiceBOMView
            serviceId={parseInt(selectedServiceId)}
            serviceName={selectedService?.serviceName}
            open={showBOMView}
            onOpenChange={setShowBOMView}
          />
        )}

        {/* Edit Material Quantity Dialog */}
        {editingMaterialQuantity && procedure?.procedureId && (
          <EditMaterialQuantityDialog
            open={!!editingMaterialQuantity}
            onOpenChange={(open) => !open && setEditingMaterialQuantity(null)}
            procedureId={procedure.procedureId}
            material={editingMaterialQuantity}
            onSuccess={handleMaterialQuantityUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

