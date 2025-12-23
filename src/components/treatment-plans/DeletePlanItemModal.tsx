'use client';

/**
 * Delete Plan Item Modal Component
 * Phase 3.5: API 5.11 - Delete an item from a phase
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { ItemDetailDTO } from '@/types/treatmentPlan';
import { useAuth } from '@/contexts/AuthContext';

interface DeletePlanItemModalProps {
  open: boolean;
  onClose: () => void;
  item: ItemDetailDTO | null;
  onSuccess: () => void; // Callback to refresh item/plan data
}

export default function DeletePlanItemModal({
  open,
  onClose,
  item,
  onSuccess,
}: DeletePlanItemModalProps) {
  const { user } = useAuth();
  const canUpdate = user?.permissions?.includes('MANAGE_TREATMENT_PLAN') || false; // ✅ BE: MANAGE_TREATMENT_PLAN covers create/update/delete

  const [loading, setLoading] = useState(false);

  // Format currency
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null || amount === 0) {
      return '-';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!item || !canUpdate) return;

    // Confirm dialog
    const priceText = item.price != null && item.price > 0 
      ? `Giá trị: ${formatCurrency(item.price)}\n` 
      : '';
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa hạng mục "${item.itemName}"?\n` +
        priceText +
        `Hành động này không thể hoàn tác. Chi phí lộ trình sẽ giảm.`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await TreatmentPlanService.deletePlanItem(item.itemId);

      // Show success toast with financial impact
      toast.success('Xóa hạng mục thành công', {
        description: response.financialImpact
          ? `Chi phí lộ trình đã giảm ${response.priceReduction.toLocaleString('vi-VN')} VND`
          : 'Hạng mục đã được xóa',
      });

      // Close modal and refresh data
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting plan item:', error);

      // Handle specific errors
      if (error.response?.status === 400) {
        toast.error('Lỗi xác thực', {
          description: error.response?.data?.message || 'Không thể xóa hạng mục',
        });
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy hạng mục', {
          description: 'Hạng mục không tồn tại hoặc đã bị xóa',
        });
      } else if (error.response?.status === 409) {
        toast.error('Xung đột', {
          description: error.response?.data?.message || 'Không thể xóa hạng mục do có lịch hẹn đang hoạt động',
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

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa hạng mục</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa hạng mục này?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-red-900">Cảnh báo</p>
                <p className="text-red-700">
                  Hành động này không thể hoàn tác. Hạng mục sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>
          </div>

          {/* Item Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
            <div>
              <span className="font-medium">Tên hạng mục:</span>
              <p className="text-muted-foreground">{item.itemName}</p>
            </div>
            {item.price != null && item.price > 0 && (
              <div>
                <span className="font-medium">Giá:</span>
                <p className="text-muted-foreground">{formatCurrency(item.price)}</p>
              </div>
            )}
            <div>
              <span className="font-medium">Thời gian ước tính:</span>
              <p className="text-muted-foreground">{item.estimatedTimeMinutes} phút</p>
            </div>
            {item.linkedAppointments && item.linkedAppointments.length > 0 && (
              <div>
                <span className="font-medium text-orange-600">Lưu ý:</span>
                <p className="text-orange-600">
                  Hạng mục này có {item.linkedAppointments.length} lịch hẹn liên kết. 
                  Vui lòng hủy các lịch hẹn trước khi xóa.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !canUpdate || (item.linkedAppointments && item.linkedAppointments.length > 0)}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xóa hạng mục'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

