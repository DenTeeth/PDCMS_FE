'use client';



import React, { useState, useEffect } from 'react';
import {
  ProcedureMaterialsResponse,
  ProcedureMaterialItem,
  UpdateProcedureMaterialsRequest,
  MaterialUpdateItem,
} from '@/types/clinicalRecord';
import { clinicalRecordService } from '@/services/clinicalRecordService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Package, Info } from 'lucide-react';

interface EditProcedureMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureId: number;
  procedureName?: string;
  onSuccess?: () => void;
}

export default function EditProcedureMaterialsDialog({
  open,
  onOpenChange,
  procedureId,
  procedureName,
  onSuccess,
}: EditProcedureMaterialsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<ProcedureMaterialsResponse | null>(null);
  const [updates, setUpdates] = useState<Record<number, MaterialUpdateItem>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Load materials when dialog opens
  useEffect(() => {
    if (open && procedureId) {
      loadMaterials();
    } else {
      // Reset state when dialog closes
      setMaterials(null);
      setUpdates({});
      setErrors({});
    }
  }, [open, procedureId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await clinicalRecordService.getProcedureMaterials(procedureId);
      
      // Only allow editing if materials have been deducted
      if (!data.materialsDeducted) {
        toast.error('Chỉ có thể chỉnh sửa số lượng thực tế sau khi vật tư đã được trừ kho');
        onOpenChange(false);
        return;
      }
      
      setMaterials(data);

      // Initialize updates with current actual quantities
      const initialUpdates: Record<number, MaterialUpdateItem> = {};
      data.materials.forEach((material) => {
        initialUpdates[material.usageId] = {
          usageId: material.usageId,
          actualQuantity: material.actualQuantity,
          varianceReason: material.varianceReason || undefined,
          notes: material.notes || undefined,
        };
      });
      setUpdates(initialUpdates);
    } catch (error: any) {
      console.error('Error loading materials:', error);
      toast.error('Không thể tải danh sách vật tư');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (usageId: number, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setErrors((prev) => ({
        ...prev,
        [usageId]: 'Số lượng phải là số dương',
      }));
      return;
    }

    const material = materials?.materials.find((m) => m.usageId === usageId);
    if (!material) return;

    // Clear error
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[usageId];
      return newErrors;
    });

    // Update quantity
    setUpdates((prev) => ({
      ...prev,
      [usageId]: {
        ...prev[usageId],
        actualQuantity: numValue,
        // Clear variance reason if actual equals quantity (not planned)
        varianceReason:
          numValue !== material.quantity
            ? prev[usageId]?.varianceReason
            : undefined,
      },
    }));
  };

  const handleVarianceReasonChange = (usageId: number, value: string) => {
    setUpdates((prev) => ({
      ...prev,
      [usageId]: {
        ...prev[usageId],
        varianceReason: value || undefined,
      },
    }));
  };

  const handleNotesChange = (usageId: number, value: string) => {
    setUpdates((prev) => ({
      ...prev,
      [usageId]: {
        ...prev[usageId],
        notes: value || undefined,
      },
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<number, string> = {};

    if (!materials) return false;

    materials.materials.forEach((material) => {
      const update = updates[material.usageId];
      if (!update) {
        newErrors[material.usageId] = 'Vui lòng nhập số lượng thực tế';
        return;
      }

      // Check if actual quantity is provided
      if (update.actualQuantity === undefined || update.actualQuantity < 0) {
        newErrors[material.usageId] = 'Số lượng thực tế phải là số dương';
        return;
      }

      // Check if variance reason is required (variance = actual - quantity, not actual - planned)
      if (
        update.actualQuantity !== material.quantity &&
        (!update.varianceReason || update.varianceReason.trim() === '')
      ) {
        newErrors[material.usageId] =
          'Vui lòng nhập lý do chênh lệch khi số lượng thực tế khác dự kiến';
        return;
      }

      // Warn if actual quantity exceeds available stock
      if (update.actualQuantity > material.currentStock) {
        // This is a warning, not an error - allow submission but show warning
        console.warn(
          `Actual quantity (${update.actualQuantity}) exceeds available stock (${material.currentStock}) for ${material.itemName}`
        );
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!materials || !validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      setSubmitting(true);

      const request: UpdateProcedureMaterialsRequest = {
        materials: materials.materials.map((material) => updates[material.usageId]),
      };

      const response = await clinicalRecordService.updateProcedureMaterials(
        procedureId,
        request
      );

      // Show success message with stock adjustments
      if (response.stockAdjustments && response.stockAdjustments.length > 0) {
        const adjustmentsText = response.stockAdjustments
          .map((adj) => `${adj.itemName}: ${adj.adjustment > 0 ? '+' : ''}${adj.adjustment}`)
          .join(', ');
        toast.success(`Đã cập nhật ${response.materialsUpdated} vật tư. Điều chỉnh kho: ${adjustmentsText}`);
      } else {
        toast.success(response.message || 'Đã cập nhật số lượng vật tư thành công');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating materials:', error);
      toast.error(error.message || 'Không thể cập nhật số lượng vật tư');
    } finally {
      setSubmitting(false);
    }
  };

  if (!materials) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật số lượng vật tư</DialogTitle>
          <DialogDescription>
            {procedureName && `Thủ thuật: ${procedureName}`}
            <br />
            Vui lòng nhập số lượng thực tế đã sử dụng. Nếu khác với dự kiến, vui lòng nhập lý do.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Đang tải...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {materials.materials.map((material) => {
              const update = updates[material.usageId];
              const error = errors[material.usageId];
              // Calculate if exceeds stock
              const actualQty = update?.actualQuantity ?? material.actualQuantity;
              const exceedsStock = actualQty > material.currentStock;

              return (
                <div key={material.usageId} className="border rounded-lg p-4 space-y-4">
                  {/* Material Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-base">{material.itemName}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {material.itemCode && (
                          <Badge variant="secondary" className="text-xs">
                            {material.itemCode}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            material.stockStatus === 'OUT_OF_STOCK'
                              ? 'destructive'
                              : material.stockStatus === 'LOW'
                              ? 'outline'
                              : 'outline'
                          }
                          className={
                            material.stockStatus === 'LOW'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : material.stockStatus === 'OUT_OF_STOCK'
                              ? ''
                              : 'bg-green-50 text-green-700 border-green-200'
                          }
                        >
                          {material.stockStatus === 'OUT_OF_STOCK'
                            ? 'Hết hàng'
                            : material.stockStatus === 'LOW'
                            ? 'Thấp'
                            : 'Đủ'}{' '}
                          ({material.currentStock} {material.unitName})
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Quantities */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-1">
                        Định mức 
                        <span title="Định mức là danh sách vật tư chuẩn được định nghĩa cho dịch vụ này">
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={material.plannedQuantity}
                          disabled
                          className="bg-muted"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {material.unitName}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Số lượng chuẩn từ dịch vụ
                      </p>
                      {material.quantity !== material.plannedQuantity && (
                        <p className="text-xs text-blue-600 mt-1">
                          Đã điều chỉnh thành {material.quantity} {material.unitName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`actual-${material.usageId}`}>
                        Thực tế sử dụng <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`actual-${material.usageId}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={update?.actualQuantity ?? material.actualQuantity}
                          onChange={(e) => handleQuantityChange(material.usageId, e.target.value)}
                          className={error ? 'border-destructive' : ''}
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {material.unitName}
                        </span>
                      </div>
                      {error && (
                        <p className="text-sm text-destructive mt-1">{error}</p>
                      )}
                      {exceedsStock && (
                        <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Vượt quá tồn kho hiện có ({material.currentStock} {material.unitName})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Variance Reason (required if actual ≠ quantity) */}
                  {update &&
                    update.actualQuantity !== material.quantity && (
                      <div>
                        <Label htmlFor={`reason-${material.usageId}`}>
                          Lý do chênh lệch <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id={`reason-${material.usageId}`}
                          value={update.varianceReason || ''}
                          onChange={(e) =>
                            handleVarianceReasonChange(material.usageId, e.target.value)
                          }
                          placeholder="Ví dụ: Bệnh nhân khó tê, cần thêm thuốc..."
                          className={error ? 'border-destructive' : ''}
                          rows={2}
                        />
                        {error && error.includes('lý do') && (
                          <p className="text-sm text-destructive mt-1">{error}</p>
                        )}
                      </div>
                    )}

                  {/* Notes (optional) */}
                  <div>
                    <Label htmlFor={`notes-${material.usageId}`}>Ghi chú (tùy chọn)</Label>
                    <Textarea
                      id={`notes-${material.usageId}`}
                      value={update?.notes || ''}
                      onChange={(e) => handleNotesChange(material.usageId, e.target.value)}
                      placeholder="Ghi chú thêm về việc sử dụng vật tư..."
                      rows={2}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              'Cập nhật'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




