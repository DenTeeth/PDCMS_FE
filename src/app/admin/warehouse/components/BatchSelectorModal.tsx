'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ItemMaster, ItemBatch } from '@/types/warehouse';
import { itemMasterService, itemBatchService } from '@/services/warehouseService';
import { Package, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface BatchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (batch: ItemBatch, quantity: number) => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

export default function BatchSelectorModal({
  isOpen,
  onClose,
  onSelect,
  warehouseType,
}: BatchSelectorModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Fetch Item Masters
  const { data: items = [] } = useQuery<ItemMaster[]>({
    queryKey: ['itemMasters', warehouseType],
    queryFn: async () => {
      const result = await itemMasterService.getSummary({
        warehouse_type: warehouseType,
      });
      return result;
    },
    enabled: isOpen,
  });

  // Fetch Batches for selected item (FEFO sorted from BE)
  const { data: batches = [], isLoading: loadingBatches } = useQuery<ItemBatch[]>({
    queryKey: ['itemBatches', selectedItemId],
    queryFn: () => itemBatchService.getBatchesByItemId(selectedItemId!),
    enabled: !!selectedItemId,
  });

  // Auto-select FEFO batch (first batch = earliest expiry)
  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].batch_id);
    } else if (batches.length === 0) {
      setSelectedBatchId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches.length]);

  const handleConfirm = () => {
    const selectedBatch = batches.find((b) => b.batch_id === selectedBatchId);
    
    if (!selectedBatch) {
      toast.error('Vui lòng chọn lô hàng!');
      return;
    }

    if (quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0!');
      return;
    }

    if (quantity > selectedBatch.quantity_on_hand) {
      toast.error(`Số lượng vượt quá tồn kho (Max: ${selectedBatch.quantity_on_hand})!`);
      return;
    }

    onSelect(selectedBatch, quantity);
    handleClose();
  };

  const handleClose = () => {
    setSelectedItemId(null);
    setSelectedBatchId(null);
    setQuantity(1);
    onClose();
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return <Badge variant="secondary">Không có HSD</Badge>;
    
    const days = getDaysUntilExpiry(expiryDate);
    if (!days) return null;

    if (days < 0) {
      return <Badge variant="destructive" className="animate-pulse">⚠️ Đã hết hạn</Badge>;
    } else if (days <= 30) {
      return <Badge variant="destructive">⚠️ {days} ngày</Badge>;
    } else if (days <= 90) {
      return <Badge className="bg-amber-500 text-white">⚡ {days} ngày</Badge>;
    } else {
      return <Badge variant="default" className="bg-emerald-500">✓ {days} ngày</Badge>;
    }
  };

  const selectedBatch = batches.find((b) => b.batch_id === selectedBatchId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-violet-600" />
            Chọn Lô Hàng Để Xuất (FEFO - First Expired, First Out)
          </DialogTitle>
          <DialogDescription className="sr-only">
            Chọn vật tư và lô hàng để xuất kho theo nguyên tắc FEFO
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Item */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Bước 1: Chọn Vật Tư <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedItemId ? String(selectedItemId) : ''}
              onValueChange={(value) => setSelectedItemId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vật tư cần xuất" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.item_master_id} value={String(item.item_master_id)}>
                    <div className="flex items-center justify-between w-full">
                      <span>{item.item_code} - {item.item_name}</span>
                      <Badge variant={item.total_quantity_on_hand > 0 ? 'default' : 'secondary'} className="ml-2">
                        Tồn: {item.total_quantity_on_hand}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Select Batch (FEFO) */}
          {selectedItemId && (
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Bước 2: Chọn Lô Hàng <span className="text-red-500">*</span>
                <span className="text-xs text-slate-500 ml-2">
                  (Lô đầu tiên = HSD sớm nhất - FEFO)
                </span>
              </Label>

              {loadingBatches ? (
                <div className="text-center py-8 text-slate-500">Đang tải danh sách lô...</div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                  ⚠️ Không có lô hàng nào tồn kho cho vật tư này!
                </div>
              ) : (
                <RadioGroup
                  value={selectedBatchId ? String(selectedBatchId) : ''}
                  onValueChange={(value: string) => setSelectedBatchId(Number(value))}
                  className="space-y-3"
                >
                  {batches.map((batch, index) => (
                    <div
                      key={batch.batch_id}
                      className={`border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition ${
                        index === 0 ? 'border-violet-500 bg-violet-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={String(batch.batch_id)} id={`batch-${batch.batch_id}`} />
                        <Label htmlFor={`batch-${batch.batch_id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Lô: {batch.lot_number}</span>
                                {index === 0 && (
                                  <Badge className="bg-violet-600 text-white text-xs">
                                    🤖 FEFO Suggest
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-slate-600 flex items-center gap-4">
                                <span>Tồn: <strong>{batch.quantity_on_hand}</strong></span>
                                <span>Giá: <strong>{batch.import_price.toLocaleString('vi-VN')} đ</strong></span>
                              </div>
                              {batch.expiry_date && (
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  HSD: {new Date(batch.expiry_date).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>
                            <div>{getExpiryBadge(batch.expiry_date)}</div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}

          {/* Step 3: Enter Quantity */}
          {selectedBatchId && selectedBatch && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Bước 3: Nhập Số Lượng Xuất <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max={selectedBatch.quantity_on_hand}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="Nhập số lượng"
                  className="flex-1"
                />
                <Badge variant="outline" className="text-sm">
                  Max: {selectedBatch.quantity_on_hand}
                </Badge>
              </div>
              {quantity > selectedBatch.quantity_on_hand && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Số lượng vượt quá tồn kho!
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          {selectedBatch && quantity > 0 && quantity <= selectedBatch.quantity_on_hand && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-emerald-900">✓ Sẵn sàng xuất kho</p>
                  <p className="text-emerald-700">
                    Lô: <strong>{selectedBatch.lot_number}</strong> | 
                    Số lượng: <strong>{quantity}</strong> | 
                    Tổng giá trị: <strong>{(quantity * selectedBatch.import_price).toLocaleString('vi-VN')} đ</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={!selectedBatchId || quantity <= 0 || quantity > (selectedBatch?.quantity_on_hand || 0)}
            >
              Xác Nhận
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Hủy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
