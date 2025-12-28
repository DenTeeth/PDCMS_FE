'use client';

/**
 * Edit Material Quantity Dialog
 * 
 * Dialog to edit quantity field for a single material BEFORE warehouse deduction
 * Uses API 8.9: PATCH /api/v1/clinical-records/procedures/{procedureId}/materials/{usageId}/quantity
 * 
 * Features:
 * - Edit quantity field (before deduction only)
 * - Shows plannedQuantity (BOM reference) for comparison
 * - Validation: quantity must be > 0
 * - Shows stock status and warnings
 * - Auto-syncs actualQuantity after update
 */

import React, { useState } from 'react';
import { ProcedureMaterialItem } from '@/types/clinicalRecord';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface EditMaterialQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureId: number;
  material: ProcedureMaterialItem;
  onSuccess?: (updatedMaterial: ProcedureMaterialItem) => void;
}

export default function EditMaterialQuantityDialog({
  open,
  onOpenChange,
  procedureId,
  material,
  onSuccess,
}: EditMaterialQuantityDialogProps) {
  const [quantity, setQuantity] = useState<string>(material.quantity.toString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or material changes
  React.useEffect(() => {
    if (open && material) {
      setQuantity(material.quantity.toString());
      setError(null);
    }
  }, [open, material]);

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    setError(null);

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError('Số lượng phải lớn hơn 0');
      return;
    }

    // Check if exceeds stock
    if (numValue > material.currentStock) {
      // Warning, not error - allow but show warning
      console.warn(`Quantity (${numValue}) exceeds available stock (${material.currentStock})`);
    }
  };

  const validate = (): boolean => {
    const numValue = parseFloat(quantity);
    
    if (isNaN(numValue) || numValue <= 0) {
      setError('Số lượng phải lớn hơn 0');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    const numValue = parseFloat(quantity);
    
    // Check if value actually changed
    if (numValue === material.quantity) {
      toast.info('Số lượng không thay đổi');
      onOpenChange(false);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const updated = await clinicalRecordService.updateMaterialQuantity(
        procedureId,
        material.usageId,
        {
          usageId: material.usageId,
          quantity: numValue,
        }
      );

      toast.success('Đã cập nhật số lượng dự kiến thành công', {
        description: `Số lượng đã được cập nhật từ ${material.quantity} thành ${numValue} ${material.unitName}`,
      });

      onSuccess?.(updated);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating material quantity:', error);
      
      if (error.status === 400) {
        setError('Không thể cập nhật - vật tư đã được trừ kho hoặc số lượng không hợp lệ');
      } else if (error.status === 404) {
        setError('Không tìm thấy vật tư này');
      } else {
        setError(error.message || 'Không thể cập nhật số lượng');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const numQuantity = parseFloat(quantity);
  const isValidQuantity = !isNaN(numQuantity) && numQuantity > 0;
  const exceedsStock = isValidQuantity && numQuantity > material.currentStock;
  const isDifferent = isValidQuantity && numQuantity !== material.quantity;

  const getStockStatusBadge = () => {
    switch (material.stockStatus) {
      case 'OUT_OF_STOCK':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Hết hàng ({material.currentStock})
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Thấp ({material.currentStock})
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Đủ ({material.currentStock})
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa số lượng dự kiến</DialogTitle>
          <DialogDescription>
            Điều chỉnh số lượng vật tư dự kiến sử dụng trước khi trừ kho.
            Số lượng thực tế sẽ tự động đồng bộ với số lượng dự kiến.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Material Info */}
          <div className="border rounded-lg p-4 space-y-3">
            <div>
              <div className="font-medium text-base">{material.itemName}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {material.itemCode && (
                  <Badge variant="secondary" className="text-xs">
                    {material.itemCode}
                  </Badge>
                )}
                {material.categoryName && (
                  <Badge variant="outline" className="text-xs">
                    {material.categoryName}
                  </Badge>
                )}
                {getStockStatusBadge()}
              </div>
            </div>
          </div>

          <Separator />

          {/* Quantities */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  Định mức BOM (chỉ đọc)
                  <span title="BOM (Bill of Materials) là danh sách vật tư chuẩn được định nghĩa cho dịch vụ này">
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
                  Số lượng chuẩn từ BOM của dịch vụ
                </p>
              </div>
              <div>
                <Label htmlFor="quantity">
                  Số lượng dự kiến <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
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
                {isDifferent && material.quantity !== material.plannedQuantity && (
                  <p className="text-xs text-blue-600 mt-1">
                    Đã thay đổi từ {material.quantity} (ban đầu: {material.plannedQuantity}) {material.unitName}
                  </p>
                )}
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Lưu ý:</p>
                  <ul className="text-blue-800 space-y-1 list-disc list-inside">
                    <li>Số lượng thực tế sẽ tự động đồng bộ với số lượng dự kiến sau khi cập nhật</li>
                    <li>Chỉ có thể chỉnh sửa trước khi vật tư được trừ kho</li>
                    <li>Sau khi appointment hoàn thành, số lượng này sẽ được khóa</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !isValidQuantity || !isDifferent}
          >
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

