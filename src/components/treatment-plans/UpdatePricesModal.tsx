'use client';

/**
 * Update Prices Modal Component
 * API 5.13: Update Treatment Plan Prices (Finance/Manager only)
 * V21.4: Finance team controls all pricing adjustments
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, DollarSign, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { ItemDetailDTO, ItemPriceUpdate, UpdatePricesRequest, UpdatePricesResponse } from '@/types/treatmentPlan';
import { useAuth } from '@/contexts/AuthContext';

interface UpdatePricesModalProps {
  open: boolean;
  onClose: () => void;
  planCode: string;
  planName: string;
  items: ItemDetailDTO[];
  currentTotalCost: number;
  onSuccess: () => void; // Callback to refresh plan data
}

interface PriceUpdateFormData {
  itemId: number;
  itemName: string;
  currentPrice: number;
  newPrice: number;
  note: string;
  hasChanged: boolean;
}

export default function UpdatePricesModal({
  open,
  onClose,
  planCode,
  planName,
  items,
  currentTotalCost,
  onSuccess,
}: UpdatePricesModalProps) {
  const { user } = useAuth();
  const canManagePricing = user?.permissions?.includes('MANAGE_PLAN_PRICING') || false;

  const [loading, setLoading] = useState(false);
  const [priceUpdates, setPriceUpdates] = useState<Map<number, PriceUpdateFormData>>(new Map());
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && items.length > 0) {
      const initialUpdates = new Map<number, PriceUpdateFormData>();
      items.forEach((item) => {
        initialUpdates.set(item.itemId, {
          itemId: item.itemId,
          itemName: item.itemName,
          currentPrice: item.price,
          newPrice: item.price, // Start with current price
          note: '',
          hasChanged: false,
        });
      });
      setPriceUpdates(initialUpdates);
      setErrors({});
    }
  }, [open, items]);

  // Handle price change
  const handlePriceChange = (itemId: number, newPrice: number) => {
    const update = priceUpdates.get(itemId);
    if (!update) return;

    const updated = {
      ...update,
      newPrice,
      hasChanged: newPrice !== update.currentPrice,
    };

    // Validate price
    if (newPrice < 0) {
      setErrors((prev) => ({ ...prev, [itemId]: 'Giá phải lớn hơn hoặc bằng 0' }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[itemId];
        return newErrors;
      });
    }

    setPriceUpdates((prev) => new Map(prev).set(itemId, updated));
  };

  // Handle note change
  const handleNoteChange = (itemId: number, note: string) => {
    if (note.length > 500) return; // Max 500 chars

    const update = priceUpdates.get(itemId);
    if (!update) return;

    setPriceUpdates((prev) =>
      new Map(prev).set(itemId, {
        ...update,
        note: note.substring(0, 500),
      })
    );
  };

  // Calculate financial impact
  const calculateFinancialImpact = () => {
    let totalCostBefore = 0;
    let totalCostAfter = 0;

    priceUpdates.forEach((update) => {
      totalCostBefore += update.currentPrice;
      totalCostAfter += update.newPrice;
    });

    return {
      totalCostBefore,
      totalCostAfter,
      costDifference: totalCostAfter - totalCostBefore,
    };
  };

  // Get changed items
  const getChangedItems = (): PriceUpdateFormData[] => {
    return Array.from(priceUpdates.values()).filter((update) => update.hasChanged);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canManagePricing) {
      toast.error('Bạn không có quyền điều chỉnh giá');
      return;
    }

    // Validate
    const changedItems = getChangedItems();
    if (changedItems.length === 0) {
      toast.error('Vui lòng thay đổi ít nhất một giá');
      return;
    }

    // Check for errors
    if (Object.keys(errors).length > 0) {
      toast.error('Vui lòng sửa các lỗi trước khi lưu');
      return;
    }

    // Confirm dialog
    const { costDifference } = calculateFinancialImpact();
    const isDiscount = costDifference < 0;
    const confirmMessage = `Bạn có chắc muốn cập nhật giá cho ${changedItems.length} hạng mục?\n\n` +
      `Tổng chi phí trước: ${currentTotalCost.toLocaleString('vi-VN')} VND\n` +
      `Tổng chi phí sau: ${(currentTotalCost + costDifference).toLocaleString('vi-VN')} VND\n` +
      `${isDiscount ? 'Giảm' : 'Tăng'}: ${Math.abs(costDifference).toLocaleString('vi-VN')} VND`;

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      // Build request
      const request: UpdatePricesRequest = {
        items: changedItems.map((update) => ({
          itemId: update.itemId,
          newPrice: update.newPrice,
          note: update.note.trim() || undefined,
        })),
      };

      const response: UpdatePricesResponse = await TreatmentPlanService.updatePlanPrices(planCode, request);

      // Calculate cost difference
      const costDifference = response.totalCostAfter - response.totalCostBefore;

      toast.success('Đã cập nhật giá thành công', {
        description: `Đã cập nhật ${response.itemsUpdated} hạng mục. Tổng chi phí: ${response.totalCostAfter.toLocaleString('vi-VN')} VND`,
      });

      // Show financial impact
      if (costDifference !== 0) {
        const isDiscount = costDifference < 0;
        toast.info(
          isDiscount ? 'Đã áp dụng giảm giá' : 'Đã tăng giá',
          {
            description: `${isDiscount ? 'Giảm' : 'Tăng'} ${Math.abs(costDifference).toLocaleString('vi-VN')} VND`,
          }
        );
      }

      // Close modal and refresh
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error updating prices:', error);

      if (error.response?.status === 403) {
        toast.error('Không có quyền điều chỉnh giá', {
          description: 'Bạn cần có quyền MANAGE_PLAN_PRICING để thực hiện thao tác này',
        });
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy lộ trình điều trị', {
          description: error.response?.data?.message || 'Lộ trình không tồn tại hoặc đã bị xóa',
        });
      } else if (error.response?.status === 409) {
        toast.error('Không thể cập nhật giá', {
          description: error.response?.data?.message || 'Lộ trình đã hoàn thành hoặc đã bị hủy',
        });
      } else if (error.response?.status === 400) {
        toast.error('Dữ liệu không hợp lệ', {
          description: error.response?.data?.message || 'Vui lòng kiểm tra lại thông tin',
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

  const changedItems = getChangedItems();
  const { costDifference } = calculateFinancialImpact();
  const hasChanges = changedItems.length > 0;
  const isDiscount = costDifference < 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Điều chỉnh giá lộ trình điều trị
          </DialogTitle>
          <DialogDescription>
            {planName} - {planCode}
            <br />
            <span className="text-xs text-muted-foreground">
              Chỉ dành cho Finance/Manager. Tất cả thay đổi sẽ được ghi lại trong audit log.
            </span>
          </DialogDescription>
        </DialogHeader>

        {!canManagePricing ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Không có quyền</span>
            </div>
            <p className="text-sm text-red-800 mt-2">
              Bạn cần có quyền MANAGE_PLAN_PRICING để điều chỉnh giá. Vui lòng liên hệ quản trị viên.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Financial Impact Summary */}
            {hasChanges && (
              <div className={`p-4 border rounded-lg ${isDiscount ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-2 font-medium mb-2">
                  {isDiscount ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-green-700" />
                      <span className="text-green-900">Giảm giá</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 text-blue-700" />
                      <span className="text-blue-900">Tăng giá</span>
                    </>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Tổng chi phí hiện tại:</span>{' '}
                    {currentTotalCost.toLocaleString('vi-VN')} VND
                  </p>
                  <p>
                    <span className="font-medium">Tổng chi phí sau khi thay đổi:</span>{' '}
                    {(currentTotalCost + costDifference).toLocaleString('vi-VN')} VND
                  </p>
                  <p className={isDiscount ? 'text-green-700 font-medium' : 'text-blue-700 font-medium'}>
                    <span className="font-medium">Thay đổi:</span>{' '}
                    {isDiscount ? '-' : '+'}
                    {Math.abs(costDifference).toLocaleString('vi-VN')} VND
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Đã thay đổi {changedItems.length} / {items.length} hạng mục
                  </p>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Danh sách hạng mục</Label>
                <span className="text-xs text-muted-foreground">
                  {items.length} hạng mục
                </span>
              </div>

              <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                {Array.from(priceUpdates.values()).map((update) => {
                  const hasError = errors[update.itemId];
                  const isChanged = update.hasChanged;
                  const priceDiff = update.newPrice - update.currentPrice;

                  return (
                    <div
                      key={update.itemId}
                      className={`p-4 ${isChanged ? 'bg-blue-50' : ''} ${hasError ? 'bg-red-50' : ''}`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-start">
                        {/* Item Name */}
                        <div className="col-span-12 md:col-span-4">
                          <Label className="text-sm font-medium">{update.itemName}</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {update.itemId}
                          </p>
                        </div>

                        {/* Current Price */}
                        <div className="col-span-6 md:col-span-2">
                          <Label className="text-xs text-muted-foreground">Giá hiện tại</Label>
                          <p className="text-sm font-medium mt-1">
                            {update.currentPrice.toLocaleString('vi-VN')} VND
                          </p>
                        </div>

                        {/* New Price */}
                        <div className="col-span-6 md:col-span-2">
                          <Label className="text-xs">
                            Giá mới <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            value={update.newPrice || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              handlePriceChange(update.itemId, value);
                            }}
                            className={`h-9 text-sm ${hasError ? 'border-red-500' : ''} ${isChanged ? 'border-blue-500' : ''}`}
                            disabled={loading}
                          />
                          {hasError && (
                            <p className="text-xs text-red-500 mt-1">{hasError}</p>
                          )}
                          {isChanged && !hasError && (
                            <p className={`text-xs mt-1 ${priceDiff < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                              {priceDiff < 0 ? '↓' : '↑'} {Math.abs(priceDiff).toLocaleString('vi-VN')} VND
                            </p>
                          )}
                        </div>

                        {/* Note */}
                        <div className="col-span-12 md:col-span-4">
                          <Label className="text-xs">Lý do điều chỉnh (tùy chọn)</Label>
                          <Textarea
                            value={update.note}
                            onChange={(e) => handleNoteChange(update.itemId, e.target.value)}
                            placeholder="Nhập lý do điều chỉnh giá..."
                            className="h-16 text-sm resize-none"
                            disabled={loading}
                            maxLength={500}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {update.note.length}/500
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !canManagePricing || !hasChanges || Object.keys(errors).length > 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Cập nhật giá
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

