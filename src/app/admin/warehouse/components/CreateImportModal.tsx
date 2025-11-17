'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Supplier, ItemMaster, CreateImportTransactionDto, CreateImportItemDto } from '@/types/warehouse';
import { storageTransactionService, supplierServiceV3, itemMasterService } from '@/services/warehouseService';
import { Plus, Trash2, Package } from 'lucide-react';

interface CreateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

interface ImportFormData {
  transaction_date: string;
  supplier_id: number;
  reference_code: string;
  notes: string;
  items: CreateImportItemDto[];
}

export default function CreateImportModal({
  isOpen,
  onClose,
  warehouseType,
}: CreateImportModalProps) {
  const queryClient = useQueryClient();

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ImportFormData>({
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      supplier_id: 0,
      reference_code: '',
      notes: '',
      items: [
        {
          item_master_id: 0,
          lot_number: '',
          quantity: 1,
          import_price: 0,
          expiry_date: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Fetch Suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierServiceV3.getAll(),
    enabled: isOpen,
  });

  const suppliers = suppliersData || [];

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

  // Create Import Mutation
  const mutation = useMutation({
    mutationFn: (data: CreateImportTransactionDto) =>
      storageTransactionService.createImport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      toast.success('Nhập kho thành công!');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi nhập kho!');
    },
  });

  const onSubmit = (data: ImportFormData) => {
    // Validation
    if (!data.supplier_id || data.supplier_id === 0) {
      toast.error('Vui lòng chọn nhà cung cấp!');
      return;
    }

    if (data.items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 vật tư!');
      return;
    }

    // Validate each item
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const itemMaster = items.find((im) => im.item_master_id === item.item_master_id);

      if (!item.item_master_id || item.item_master_id === 0) {
        toast.error(`Dòng ${i + 1}: Vui lòng chọn vật tư!`);
        return;
      }

      if (!item.lot_number.trim()) {
        toast.error(`Dòng ${i + 1}: Số lô là bắt buộc!`);
        return;
      }

      if (item.quantity <= 0) {
        toast.error(`Dòng ${i + 1}: Số lượng phải > 0!`);
        return;
      }

      if (item.import_price <= 0) {
        toast.error(`Dòng ${i + 1}: Giá nhập phải > 0!`);
        return;
      }

      // HSD validation for COLD storage non-tools
      if (itemMaster?.warehouse_type === 'COLD' && !itemMaster.is_tool && !item.expiry_date) {
        toast.error(`Dòng ${i + 1}: Hạn sử dụng là bắt buộc cho kho lạnh (trừ dụng cụ)!`);
        return;
      }
    }

    const payload: CreateImportTransactionDto = {
      transaction_date: data.transaction_date,
      supplier_id: data.supplier_id,
      reference_code: data.reference_code || undefined,
      notes: data.notes || undefined,
      items: data.items,
    };

    mutation.mutate(payload);
  };

  const handleAddItem = () => {
    append({
      item_master_id: 0,
      lot_number: '',
      quantity: 1,
      import_price: 0,
      expiry_date: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length === 1) {
      toast.error('Phải có ít nhất 1 dòng vật tư!');
      return;
    }
    remove(index);
  };

  const calculateTotalValue = () => {
    const items = watch('items');
    return items.reduce((sum, item) => sum + (item.quantity * item.import_price), 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            Phiếu Nhập Kho {warehouseType === 'COLD' ? '🧊 (Kho Lạnh)' : '📦 (Kho Thường)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
            <div>
              <Label className="text-sm font-medium">
                Nhà Cung Cấp <span className="text-red-500">*</span>
              </Label>
              <Select
                value={String(watch('supplier_id'))}
                onValueChange={(value) => setValue('supplier_id', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn NCC" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier: Supplier) => (
                    <SelectItem key={supplier.supplierId} value={String(supplier.supplierId)}>
                      {supplier.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Ngày Nhập <span className="text-red-500">*</span>
              </Label>
              <Input type="date" {...register('transaction_date')} required />
            </div>

            <div>
              <Label className="text-sm font-medium">Mã Tham Chiếu</Label>
              <Input
                {...register('reference_code')}
                placeholder="VD: PO-2024-001"
              />
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">
                Danh Sách Vật Tư <span className="text-red-500">*</span>
              </Label>
              <Button type="button" size="sm" onClick={handleAddItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm Dòng
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr className="text-xs font-semibold text-slate-700">
                      <th className="p-3 text-left w-[5%]">STT</th>
                      <th className="p-3 text-left w-[25%]">Vật Tư *</th>
                      <th className="p-3 text-left w-[15%]">Số Lô *</th>
                      <th className="p-3 text-left w-[12%]">Số Lượng *</th>
                      <th className="p-3 text-left w-[15%]">Giá Nhập *</th>
                      <th className="p-3 text-left w-[18%]">Hạn Sử Dụng</th>
                      <th className="p-3 text-left w-[10%]">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const selectedItem = items.find(
                        (item) => item.item_master_id === watch(`items.${index}.item_master_id`)
                      );
                      const isHSDRequired = selectedItem?.warehouse_type === 'COLD' && !selectedItem.is_tool;

                      return (
                        <tr key={field.id} className="border-t hover:bg-slate-50">
                          <td className="p-3 text-center font-medium text-slate-600">
                            {index + 1}
                          </td>
                          <td className="p-3">
                            <Select
                              value={String(watch(`items.${index}.item_master_id`))}
                              onValueChange={(value) => setValue(`items.${index}.item_master_id`, Number(value))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn vật tư" />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map((item) => (
                                  <SelectItem key={item.item_master_id} value={String(item.item_master_id)}>
                                    {item.item_code} - {item.item_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Input
                              {...register(`items.${index}.lot_number`)}
                              placeholder="LOT-2024-001"
                              required
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="1"
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                              placeholder="1"
                              required
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="0"
                              step="1000"
                              {...register(`items.${index}.import_price`, { valueAsNumber: true })}
                              placeholder="0"
                              required
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="date"
                              {...register(`items.${index}.expiry_date`)}
                              required={isHSDRequired}
                              disabled={!isHSDRequired}
                              className={isHSDRequired ? 'border-amber-300' : 'bg-slate-100'}
                            />
                            {isHSDRequired && (
                              <p className="text-xs text-amber-600 mt-1">* Bắt buộc (kho lạnh)</p>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2">
                    <tr>
                      <td colSpan={6} className="p-3 text-right font-semibold">
                        Tổng Giá Trị:
                      </td>
                      <td className="p-3 font-bold text-emerald-600">
                        {calculateTotalValue().toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium">Ghi Chú</Label>
            <Textarea
              {...register('notes')}
              placeholder="Nhập ghi chú (nếu có)"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : 'Lưu Phiếu Nhập'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
