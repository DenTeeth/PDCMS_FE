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
import inventoryService, { type InventorySummary, type BatchResponse } from '@/services/inventoryService';
import { Package, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

export interface SelectedBatchPayload {
  batch: BatchResponse;
  itemMasterId: number;
  itemCode?: string;
  itemName?: string;
}

interface BatchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: SelectedBatchPayload, quantity: number) => void;
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
  const { data: summaryPage } = useQuery({
    queryKey: ['itemMasters', warehouseType],
    queryFn: () => inventoryService.getSummary({ warehouseType, size: 1000 }),
    enabled: isOpen,
  });

  const items: InventorySummary[] = summaryPage?.content || [];

  // Fetch Batches for selected item (FEFO sorted from BE)
  const { data: batches = [], isLoading: loadingBatches } = useQuery<BatchResponse[]>({
    queryKey: ['itemBatches', selectedItemId],
    queryFn: () => inventoryService.getBatchesByItemId(selectedItemId!),
    enabled: !!selectedItemId,
  });

  // Auto-select FEFO batch (first batch = earliest expiry)
  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].batchId);
    } else if (batches.length === 0) {
      setSelectedBatchId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches.length]);

  const selectedItem = items.find((item) => item.itemMasterId === selectedItemId);

  const handleConfirm = () => {
    const selectedBatch = batches.find((b) => b.batchId === selectedBatchId);
    
    if (!selectedBatch) {
      toast.error('Vui lòng chọn lô hàng!');
      return;
    }

    if (quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0!');
      return;
    }

    if (quantity > selectedBatch.quantityOnHand) {
      toast.error(`Số lượng vượt quá tồn kho (Max: ${selectedBatch.quantityOnHand})!`);
      return;
    }

    if (!selectedItemId) {
      toast.error('Vui lòng chọn vật tư!');
      return;
    }

    onSelect(
      {
        batch: selectedBatch,
        itemMasterId: selectedItemId,
        itemCode: selectedItem?.itemCode,
        itemName: selectedItem?.itemName,
      },
      quantity
    );
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

  const selectedBatch = batches.find((b) => b.batchId === selectedBatchId);

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
                {items.map((item) => {
                  const totalQty = item.totalQuantityOnHand ?? item.totalQuantity ?? 0;
                  const isLowStock = totalQty <= (item.minStockLevel || 0);
                  const isOutOfStock = totalQty <= 0;
                  
                  return (
                    <SelectItem 
                      key={item.itemMasterId} 
                      value={String(item.itemMasterId)}
                      disabled={isOutOfStock}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className={isOutOfStock ? 'text-gray-400 line-through' : ''}>
                          {item.itemCode} - {item.itemName}
                        </span>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant={isOutOfStock ? 'destructive' : isLowStock ? 'secondary' : 'default'}
                            className={
                              isOutOfStock 
                                ? 'bg-red-100 text-red-800' 
                                : isLowStock 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            <span className="font-bold">{totalQty}</span>
                          </Badge>
                          {item.minStockLevel && (
                            <span className="text-xs text-gray-500">(Min: {item.minStockLevel})</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
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
                      key={batch.batchId}
                      className={`border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition ${
                        index === 0 ? 'border-violet-500 bg-violet-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={String(batch.batchId)} id={`batch-${batch.batchId}`} />
                        <Label htmlFor={`batch-${batch.batchId}`} className="flex-1 cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Lô: {batch.lotNumber}</span>
                                {index === 0 && (
                                  <Badge className="bg-violet-600 text-white text-xs">
                                    🤖 FEFO Suggest
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm flex items-center gap-3">
                                <span className={`font-bold text-lg ${
                                  batch.quantityOnHand <= 0 
                                    ? 'text-red-600' 
                                    : batch.quantityOnHand <= 10 
                                    ? 'text-orange-600' 
                                    : 'text-green-600'
                                }`}>
                                  Tồn kho: {batch.quantityOnHand}
                                </span>
                                {selectedItem?.minStockLevel && (
                                  <span className="text-xs text-gray-500">
                                    (Min: {selectedItem.minStockLevel})
                                  </span>
                                )}
                              </div>
                              {batch.expiryDate && (
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  HSD: {new Date(batch.expiryDate).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>
                            <div>{getExpiryBadge(batch.expiryDate)}</div>
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
              <div className="space-y-2">
                {/* Stock Info Highlight */}
                <div className={`border-2 rounded-lg p-3 ${
                  quantity > selectedBatch.quantityOnHand 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-blue-300 bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Tồn kho hiện tại:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedBatch.quantityOnHand}
                    </span>
                  </div>
                  {selectedItem?.minStockLevel && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Mức tối thiểu:</span>
                      <span className="text-sm font-medium text-orange-600">
                        {selectedItem.minStockLevel}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Quantity Input */}
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    max={selectedBatch.quantityOnHand}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    placeholder="Nhập số lượng"
                    className="flex-1 text-lg font-semibold"
                  />
                  <Badge variant="outline" className="text-sm whitespace-nowrap">
                    Max: {selectedBatch.quantityOnHand}
                  </Badge>
                </div>
                
                {/* Validation Messages */}
                {quantity > selectedBatch.quantityOnHand && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Số lượng vượt quá tồn kho!
                  </p>
                )}
                {selectedItem?.minStockLevel && 
                 quantity > 0 && 
                 (selectedBatch.quantityOnHand - quantity) < selectedItem.minStockLevel && (
                  <p className="text-xs text-orange-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Cảnh báo: Sau khi xuất sẽ dưới mức tối thiểu ({selectedItem.minStockLevel})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedBatch && quantity > 0 && quantity <= selectedBatch.quantityOnHand && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-emerald-900">✓ Sẵn sàng xuất kho</p>
                  <p className="text-emerald-700">
                    Lô: <strong>{selectedBatch.lotNumber}</strong> | 
                    Số lượng: <strong>{quantity}</strong>
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
              disabled={!selectedBatchId || quantity <= 0 || quantity > (selectedBatch?.quantityOnHand || 0)}
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
