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
import { Loader2, Save, X } from 'lucide-react';

interface ProcedureFormProps {
  recordId: number;
  procedure?: ProcedureDTO;
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
  onSuccess,
  onCancel,
}: ProcedureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

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
      } else {
        // Create new procedure
        const createRequest: AddProcedureRequest = {
          serviceId,
          procedureDescription: data.procedureDescription,
          toothNumber: data.toothNumber?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        };

        await clinicalRecordService.addProcedure(recordId, createRequest);
        toast.success('Đã thêm thủ thuật thành công');
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
                onValueChange={(value) => setValue('serviceId', value)}
              >
                <SelectTrigger id="serviceId" className={errors.serviceId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
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
              className={errors.procedureDescription ? 'border-destructive' : ''}
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
              className={errors.toothNumber ? 'border-destructive' : ''}
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
              className={errors.notes ? 'border-destructive' : ''}
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
      </DialogContent>
    </Dialog>
  );
}

