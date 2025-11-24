'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ItemBatch, CreateExportTransactionDto, CreateExportItemDto } from '@/types/warehouse';
import { storageTransactionService } from '@/services/warehouseService';
import { Plus, Trash2, TruckIcon, AlertCircle } from 'lucide-react';
import BatchSelectorModal from './BatchSelectorModal';

interface CreateExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

interface ExportItem {
  batch_id: number;
  batch_lot_number: string;
  item_name?: string;
  quantity: number;
  import_price: number;
  expiry_date?: string;
}

export default function CreateExportModal({
  isOpen,
  onClose,
  warehouseType,
}: CreateExportModalProps) {
  const queryClient = useQueryClient();
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<ExportItem[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Create Export Mutation
  const mutation = useMutation({
    mutationFn: (data: CreateExportTransactionDto) =>
      storageTransactionService.createExport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      queryClient.invalidateQueries({ queryKey: ['itemMasterSummary'] });
      toast.success('Xuất kho thành công!');
      handleReset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xuất kho!');
    },
  });

  const handleReset = () => {
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setItems([]);
    setEditingIndex(null);
  };

  const handleAddBatch = () => {
    setEditingIndex(null);
    setIsBatchModalOpen(true);
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setIsBatchModalOpen(true);
  };

  const handleBatchSelected = (batch: ItemBatch, quantity: number) => {
    const newItem: ExportItem = {
      batch_id: batch.batch_id,
      batch_lot_number: batch.lot_number,
      item_name: batch.item_name ?? '',
      quantity,
      import_price: batch.import_price,
      expiry_date: batch.expiry_date,
    };

    if (editingIndex !== null) {
      // Edit existing item
      const updatedItems = [...items];
      updatedItems[editingIndex] = newItem;
      setItems(updatedItems);
    } else {
      // Add new item
      setItems([...items, newItem]);
    }

    setEditingIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 lô hàng để xuất!');
      return;
    }

    const payload: CreateExportTransactionDto = {
      transaction_date: transactionDate,
      notes: notes || undefined,
      items: items.map((item): CreateExportItemDto => ({
        batch_id: item.batch_id,
        quantity: item.quantity,
      })),
    };

    mutation.mutate(payload);
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return <Badge variant="secondary">Không HSD</Badge>;
    
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-blue-600" />
              Phiếu Xuất Kho (FEFO) {warehouseType === 'COLD' ? '🧊 (Kho Lạnh)' : '📦 (Kho Thường)'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Tạo phiếu xuất kho với FEFO (First Expired, First Out)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <Label className="text-sm font-medium">
                  Ngày Xuất <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Ghi Chú</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Xuất cho khoa Nội"
                />
              </div>
            </div>

            {/* FEFO Info Alert */}
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-violet-600 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-violet-900">🤖 FEFO - First Expired, First Out</p>
                <p className="text-violet-700">
                  Hệ thống tự động gợi ý lô hàng có HSD sớm nhất để xuất trước. 
                  Bạn có thể chọn lô khác nếu cần.
                </p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">
                  Danh Sách Lô Hàng Xuất <span className="text-red-500">*</span>
                </Label>
                <Button type="button" size="sm" onClick={handleAddBatch} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Chọn Lô Hàng
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center text-slate-500">
                  <TruckIcon className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="font-medium">Chưa có lô hàng nào được chọn</p>
                  <p className="text-sm mt-1">Bấm "Chọn Lô Hàng" để thêm vật tư cần xuất</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr className="text-xs font-semibold text-slate-700">
                        <th className="p-3 text-left w-[5%]">STT</th>
                        <th className="p-3 text-left w-[30%]">Vật Tư</th>
                        <th className="p-3 text-left w-[20%]">Số Lô</th>
                        <th className="p-3 text-left w-[15%]">Số Lượng</th>
                        <th className="p-3 text-left w-[20%]">Hạn Sử Dụng</th>
                        <th className="p-3 text-center w-[10%]">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-t hover:bg-slate-50">
                          <td className="p-3 text-center font-medium text-slate-600">
                            {index + 1}
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{item.item_name}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.batch_lot_number}
                            </Badge>
                          </td>
                          <td className="p-3 font-semibold">{item.quantity}</td>
                          <td className="p-3">
                            {getExpiryBadge(item.expiry_date)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(index)}
                              >
                                ✏️
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={mutation.isPending || items.length === 0}
              >
                {mutation.isPending ? 'Đang lưu...' : 'Lưu Phiếu Xuất'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Selector Modal (FEFO) */}
      <BatchSelectorModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setEditingIndex(null);
        }}
        onSelect={handleBatchSelected}
        warehouseType={warehouseType}
      />
    </>
  );
}
