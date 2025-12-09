'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import inventoryService from '@/services/inventoryService';
import type { BatchResponse } from '@/types/warehouse';
import type {
  CreateExportTransactionDto,
  ExportType,
} from '@/types/warehouse';
import itemUnitService from '@/services/itemUnitService';
import { Plus, Trash2, TruckIcon, AlertCircle } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSnowflake } from '@fortawesome/free-solid-svg-icons';
import BatchSelectorModal, { type SelectedBatchPayload } from './BatchSelectorModal';

interface CreateExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

interface ExportItem {
  batchId: number;
  batchLotNumber: string;
  itemName?: string;
  itemCode?: string;
  itemMasterId: number;
  unitId?: number;
  quantity: number;
  importPrice?: number;
  expiryDate?: string;
}

export default function CreateExportModal({
  isOpen,
  onClose,
  warehouseType,
}: CreateExportModalProps) {
  const queryClient = useQueryClient();
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [exportType, setExportType] = useState<ExportType>('USAGE');
  const [departmentName, setDepartmentName] = useState<string>('');
  const [requestedBy, setRequestedBy] = useState<string>('');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<ExportItem[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [unitCache, setUnitCache] = useState<Record<number, number>>({});

  // Create Export Mutation
  const mutation = useMutation({
    mutationFn: (data: CreateExportTransactionDto) =>
      inventoryService.createExportTransaction(data),
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
      const errorCode = error.code || error.response?.data?.error;
      const errorMessage = error.message || error.response?.data?.message || 'Có lỗi xảy ra khi xuất kho!';

      // Handle specific error codes
      if (errorCode === 'INSUFFICIENT_STOCK') {
        toast.error('Không đủ tồn kho để xuất!', {
          description: 'Vui lòng kiểm tra lại số lượng tồn kho hiện có.',
        });
      } else if (errorCode === 'INVALID_QUANTITY') {
        toast.error('Số lượng không hợp lệ!', {
          description: errorMessage,
        });
      } else if (errorCode === 'ITEM_NOT_FOUND') {
        toast.error('Vật tư không tồn tại!', {
          description: 'Vui lòng chọn lại vật tư.',
        });
      } else if (errorCode === 'UNIT_NOT_FOUND') {
        toast.error('Đơn vị không tồn tại!', {
          description: 'Vui lòng chọn lại đơn vị.',
        });
      } else {
        toast.error(errorMessage);
      }

      console.error('Export transaction error:', {
        code: errorCode,
        message: errorMessage,
        status: error.status || error.response?.status,
        data: error.response?.data,
      });
    },
  });

  const ensureUnitId = async (itemMasterId: number): Promise<number> => {
    if (unitCache[itemMasterId]) {
      return unitCache[itemMasterId];
    }
    try {
      const baseUnit = await itemUnitService.getBaseUnit(itemMasterId);
      setUnitCache((prev) => ({ ...prev, [itemMasterId]: baseUnit.unitId }));
      return baseUnit.unitId;
    } catch (error: any) {
      console.error(' Failed to fetch base unit for export:', error);
      toast.error('Không thể lấy đơn vị cơ sở của vật tư', {
        description: error.response?.data?.message || 'Vui lòng thử lại hoặc liên hệ admin',
      });
      throw error;
    } finally {
      // no-op
    }
  };

  const handleReset = () => {
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setExportType('USAGE');
    setDepartmentName('');
    setRequestedBy('');
    setReferenceCode('');
    setNotes('');
    setItems([]);
    setEditingIndex(null);
    setUnitCache({});
  };

  const handleAddBatch = () => {
    setEditingIndex(null);
    setIsBatchModalOpen(true);
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setIsBatchModalOpen(true);
  };

  const handleBatchSelected = async (selection: SelectedBatchPayload, quantity: number) => {
    if (!selection.itemMasterId) {
      toast.error('Không xác định được vật tư đã chọn');
      return;
    }

    try {
      const unitId = await ensureUnitId(selection.itemMasterId);
      const newItem: ExportItem = {
        batchId: selection.batch.batchId,
        batchLotNumber: selection.batch.lotNumber,
        itemName: selection.itemName ?? selection.itemCode ?? '',
        itemCode: selection.itemCode,
        itemMasterId: selection.itemMasterId,
        unitId,
        quantity,
        importPrice: undefined,
        expiryDate: selection.batch.expiryDate,
      };

      if (editingIndex !== null) {
        const updatedItems = [...items];
        updatedItems[editingIndex] = newItem;
        setItems(updatedItems);
      } else {
        setItems((prev) => [...prev, newItem]);
      }

      setEditingIndex(null);
    } catch {
      // ensureUnitId already handles toast
    }
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

    for (const item of items) {
      if (!item.unitId) {
        toast.error(`Không tìm thấy đơn vị cơ sở cho vật tư ${item.itemName || ''}`);
        return;
      }
    }

    const payload: CreateExportTransactionDto = {
      transactionDate: `${transactionDate}T00:00:00`,
      exportType,
      referenceCode: referenceCode.trim() || undefined,
      departmentName: departmentName.trim() || undefined,
      requestedBy: requestedBy.trim() || undefined,
      notes: notes.trim() || undefined,
      allowExpired: exportType === 'DISPOSAL' ? true : undefined,
      items: items.map((item) => ({
        itemMasterId: item.itemMasterId,
        unitId: item.unitId as number,
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
      return <Badge variant="destructive" className="animate-pulse">Đã hết hạn</Badge>;
    } else if (days <= 30) {
      return <Badge variant="destructive">{days} ngày</Badge>;
    } else if (days <= 90) {
      return <Badge className="bg-amber-500 text-white">{days} ngày</Badge>;
    } else {
      return <Badge variant="default" className="bg-emerald-500">{days} ngày</Badge>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-blue-600" />
              Phiếu Xuất Kho (FEFO) {warehouseType === 'COLD' ? (
                <>
                  <FontAwesomeIcon icon={faSnowflake} className="mr-1" />
                  (Kho Lạnh)
                </>
              ) : '(Kho Thường)'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Tạo phiếu xuất kho với FEFO (First Expired, First Out)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div className="flex flex-col gap-2">
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

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Loại Phiếu <span className="text-red-500">*</span>
                </Label>
                <Select value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại xuất" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USAGE">Xuất dùng (USAGE)</SelectItem>
                    <SelectItem value="DISPOSAL">Xuất hủy (DISPOSAL)</SelectItem>
                    <SelectItem value="RETURN">Trả NCC (RETURN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Bộ Phận / Khoa Yêu Cầu</Label>
                <Input
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="VD: Khoa Nội, Phòng khám tổng quát"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Người Yêu Cầu</Label>
                <Input
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  placeholder="VD: BS. Nguyễn Văn A"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Mã Tham Chiếu / Ca Điều Trị</Label>
                <Input
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="VD: CASE-2025-001"
                />
              </div>

              <div className="flex flex-col gap-2">
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
                            <div className="font-medium">{item.itemName}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.batchLotNumber}
                            </Badge>
                          </td>
                          <td className="p-3 font-semibold">{item.quantity}</td>
                          <td className="p-3">
                            {getExpiryBadge(item.expiryDate)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(index)}
                              >
                                ✏
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
