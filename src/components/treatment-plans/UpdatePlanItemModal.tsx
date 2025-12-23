'use client';

/**
 * Update Plan Item Modal Component
 * Phase 3.5: API 5.10 - Update item details (name, price, estimated time)
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { ItemDetailDTO, UpdatePlanItemRequest } from '@/types/treatmentPlan';
import { useAuth } from '@/contexts/AuthContext';

interface UpdatePlanItemModalProps {
  open: boolean;
  onClose: () => void;
  item: ItemDetailDTO | null;
  onSuccess: () => void; // Callback to refresh item/plan data
}

export default function UpdatePlanItemModal({
  open,
  onClose,
  item,
  onSuccess,
}: UpdatePlanItemModalProps) {
  const { user } = useAuth();
  const canUpdate = user?.permissions?.includes('MANAGE_TREATMENT_PLAN') || false; // ✅ BE: MANAGE_TREATMENT_PLAN covers create/update/delete

  // Form state
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState(0);
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState(0);
  const [loading, setLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when item changes
  useEffect(() => {
    if (item && open) {
      setItemName(item.itemName || '');
      setPrice(item.price || 0);
      setEstimatedTimeMinutes(item.estimatedTimeMinutes || 0);
      setErrors({});
    }
  }, [item, open]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // At least one field must be changed
    if (
      itemName === item?.itemName &&
      price === item?.price &&
      estimatedTimeMinutes === item?.estimatedTimeMinutes
    ) {
      newErrors.general = 'Vui lòng thay đổi ít nhất một trường';
    }

    if (itemName.trim().length === 0 && itemName !== item?.itemName) {
      newErrors.itemName = 'Tên hạng mục không được để trống';
    }

    if (price < 0) {
      newErrors.price = 'Giá không được âm';
    }

    if (estimatedTimeMinutes < 0) {
      newErrors.estimatedTimeMinutes = 'Thời gian ước tính không được âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!item || !canUpdate) return;

    // Validate
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    // Build request (only include changed fields)
    const request: UpdatePlanItemRequest = {};
    if (itemName !== item.itemName) {
      request.itemName = itemName.trim();
    }
    if (price !== item.price) {
      request.price = price;
    }
    if (estimatedTimeMinutes !== item.estimatedTimeMinutes) {
      request.estimatedTimeMinutes = estimatedTimeMinutes;
    }

    // Confirm dialog
    const confirmed = window.confirm(
      'Bạn có chắc muốn cập nhật thông tin hạng mục này?\n' +
        'Chi phí lộ trình có thể thay đổi.'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await TreatmentPlanService.updatePlanItem(item.itemId, request);

      // Show success toast with financial impact
      toast.success('Cập nhật hạng mục thành công', {
        description: response.financialImpact
          ? `Chi phí lộ trình đã ${response.financialImpact.priceChange >= 0 ? 'tăng' : 'giảm'} ${Math.abs(response.financialImpact.priceChange).toLocaleString('vi-VN')} VND`
          : 'Thông tin hạng mục đã được cập nhật',
      });

      // Close modal and refresh data
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error updating plan item:', error);

      // Handle specific errors
      if (error.response?.status === 400) {
        toast.error('Lỗi xác thực', {
          description: error.response?.data?.message || 'Thông tin không hợp lệ',
        });
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy hạng mục', {
          description: 'Hạng mục không tồn tại hoặc đã bị xóa',
        });
      } else if (error.response?.status === 409) {
        // Use backend error message directly (it explains the conflict clearly)
        const errorMessage = error.response?.data?.message || 'Không thể cập nhật hạng mục';
        toast.error('Không thể cập nhật hạng mục', {
          description: errorMessage,
        });
      } else {
        toast.error('Đã xảy ra lỗi', {
          description: error.response?.data?.message || 'Vui lòng thử lại sau',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setItemName('');
      setPrice(0);
      setEstimatedTimeMinutes(0);
      setErrors({});
    }
  }, [open]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cập nhật hạng mục</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin hạng mục: {item.itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors.general}
            </div>
          )}

          {/* Item Name */}
          <div>
            <Label htmlFor="itemName">Tên hạng mục</Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
                if (errors.itemName) {
                  setErrors({ ...errors, itemName: '' });
                }
              }}
              placeholder="Nhập tên hạng mục"
              disabled={loading}
            />
            {errors.itemName && (
              <p className="text-xs text-red-500 mt-1">{errors.itemName}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price">Giá (VND)</Label>
            <Input
              id="price"
              type="number"
              value={price || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setPrice(value);
                if (errors.price) {
                  setErrors({ ...errors, price: '' });
                }
              }}
              placeholder="Nhập giá"
              disabled={loading}
              min={0}
              step={1000}
            />
            {errors.price && (
              <p className="text-xs text-red-500 mt-1">{errors.price}</p>
            )}
          </div>

          {/* Estimated Time */}
          <div>
            <Label htmlFor="estimatedTimeMinutes">Thời gian ước tính (phút)</Label>
            <Input
              id="estimatedTimeMinutes"
              type="number"
              value={estimatedTimeMinutes || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setEstimatedTimeMinutes(value);
                if (errors.estimatedTimeMinutes) {
                  setErrors({ ...errors, estimatedTimeMinutes: '' });
                }
              }}
              placeholder="Nhập thời gian ước tính"
              disabled={loading}
              min={0}
            />
            {errors.estimatedTimeMinutes && (
              <p className="text-xs text-red-500 mt-1">{errors.estimatedTimeMinutes}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !canUpdate}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
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

