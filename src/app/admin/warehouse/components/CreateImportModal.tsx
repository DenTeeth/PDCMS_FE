'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SupplierSummaryResponse } from '@/types/supplier';
import { CreateImportTransactionDto, CreateImportItemDto, ItemUnitResponse } from '@/types/warehouse';
import inventoryService, { type ItemMasterV1 } from '@/services/inventoryService';
import supplierService from '@/services/supplierService';
import itemUnitService from '@/services/itemUnitService';
import { Plus, Trash2, Package } from 'lucide-react';

interface CreateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

interface ImportItemForm extends Omit<CreateImportItemDto, 'unitId'> {
  unitId?: number;
  purchasePrice: number;
}

interface ImportFormData {
  transactionDate: string;
  supplierId: number;
  invoiceNumber: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: ImportItemForm[];
}

export default function CreateImportModal({
  isOpen,
  onClose,
  warehouseType,
}: CreateImportModalProps) {
  const queryClient = useQueryClient();

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ImportFormData>({
    defaultValues: {
      transactionDate: new Date().toISOString().split('T')[0],
      supplierId: 0,
      invoiceNumber: '',
      expectedDeliveryDate: undefined,
      notes: '',
      items: [
        {
          itemMasterId: 0,
          lotNumber: '',
          quantity: 1,
          expiryDate: '',
          purchasePrice: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const [unitCache, setUnitCache] = useState<Record<number, ItemUnitResponse>>({});
  const [unitLoading, setUnitLoading] = useState<Record<number, boolean>>({});
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});

  const fetchBaseUnitForItem = async (itemMasterId: number, rowIndex: number) => {
    if (!itemMasterId) {
      return;
    }

    if (unitCache[itemMasterId]) {
      setValue(`items.${rowIndex}.unitId`, unitCache[itemMasterId].unitId);
      return;
    }

    try {
      setUnitLoading((prev) => ({ ...prev, [rowIndex]: true }));
      const baseUnit = await itemUnitService.getBaseUnit(itemMasterId);
      setUnitCache((prev) => ({ ...prev, [itemMasterId]: baseUnit }));
      setValue(`items.${rowIndex}.unitId`, baseUnit.unitId);
    } catch (error: any) {
      console.error('❌ Failed to fetch base unit:', error);
      toast.error('Không thể tải đơn vị cơ sở của vật tư', {
        description: error.response?.data?.message || 'Vui lòng thử lại hoặc liên hệ admin',
      });
    } finally {
      setUnitLoading((prev) => ({ ...prev, [rowIndex]: false }));
    }
  };

  // Fetch Suppliers
  const { data: suppliersResponse, isLoading: suppliersLoading, error: suppliersError } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      try {
        const page = await supplierService.getAll({
          page: 0,
          size: 1000,
          sort: 'supplierName,asc',
        });
        console.log('📦 Suppliers fetched:', page.content?.length || 0);
        return page;
      } catch (error: any) {
        console.error('❌ Failed to fetch suppliers:', error);
        toast.error('Không thể tải danh sách nhà cung cấp', {
          description: error.response?.data?.message || 'Vui lòng kiểm tra quyền truy cập hoặc liên hệ admin',
        });
        return null;
      }
    },
    enabled: isOpen,
  });

  const suppliers: SupplierSummaryResponse[] = suppliersResponse?.content ?? [];

  console.log('📦 Processed suppliers:', suppliers.length, suppliers.length === 0 ? '⚠️ EMPTY - Có thể thiếu dữ liệu hoặc quyền truy cập' : '✅ OK');

  // Fetch Item Masters
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ['itemMasters', warehouseType],
    queryFn: async () => {
      try {
        const result = await inventoryService.getAll({
          warehouseType,
        });
        console.log('📦 Item Masters fetched:', result.length, 'items');
        return result;
      } catch (error: any) {
        console.error('❌ Failed to fetch item masters:', error);
        toast.error('Không thể tải danh sách vật tư', {
          description: error.response?.data?.message || 'Vui lòng kiểm tra quyền truy cập hoặc liên hệ admin',
        });
        return [];
      }
    },
    enabled: isOpen,
  });
  console.log('📦 Processed items:', items.length, items.length === 0 ? '⚠️ EMPTY - Có thể thiếu dữ liệu hoặc quyền truy cập' : '✅ OK');

  // Create Import Mutation
  const mutation = useMutation({
    mutationFn: (data: CreateImportTransactionDto) =>
      inventoryService.createImportTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      toast.success('Nhập kho thành công!');
      reset();
      setUnitCache({});
      setUnitLoading({});
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi nhập kho!');
    },
  });

  const onSubmit = (data: ImportFormData) => {
    if (!data.supplierId || data.supplierId === 0) {
      toast.error('Vui lòng chọn nhà cung cấp!');
      return;
    }

    if (!data.invoiceNumber.trim()) {
      toast.error('Vui lòng nhập số hóa đơn!');
      return;
    }

    if (data.items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 vật tư!');
      return;
    }

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const itemMaster = items.find((im) => im.id === item.itemMasterId);

      if (!item.itemMasterId || item.itemMasterId === 0) {
        toast.error(`Dòng ${i + 1}: Vui lòng chọn vật tư!`);
        return;
      }

      if (!item.lotNumber.trim()) {
        toast.error(`Dòng ${i + 1}: Số lô là bắt buộc!`);
        return;
      }

      if (item.quantity <= 0) {
        toast.error(`Dòng ${i + 1}: Số lượng phải > 0!`);
        return;
      }

      if (!item.unitId) {
        toast.error(`Dòng ${i + 1}: Không tìm thấy đơn vị quy đổi cho vật tư này.`);
        return;
      }

      if (item.purchasePrice <= 0) {
        toast.error(`Dòng ${i + 1}: Đơn giá phải lớn hơn 0!`);
        return;
      }

      const isExpiryRequired = !itemMaster?.isTool;
      if (isExpiryRequired && !item.expiryDate) {
        toast.error(`Dòng ${i + 1}: Hạn sử dụng là bắt buộc!`);
        return;
      }
    }

    const payload: CreateImportTransactionDto = {
      supplierId: data.supplierId,
      transactionDate: `${data.transactionDate}T00:00:00`,
      invoiceNumber: data.invoiceNumber.trim(),
      expectedDeliveryDate: data.expectedDeliveryDate ? `${data.expectedDeliveryDate}T00:00:00` : undefined,
      notes: data.notes?.trim() || undefined,
      items: data.items.map((item) => ({
        itemMasterId: item.itemMasterId,
        lotNumber: item.lotNumber.trim(),
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        unitId: item.unitId as number,
        purchasePrice: item.purchasePrice,
        binLocation: item.binLocation?.trim() || undefined,
        notes: item.notes?.trim() || undefined,
      })),
    };

    mutation.mutate(payload);
  };

  const handleAddItem = () => {
    append({
      itemMasterId: 0,
      lotNumber: '',
      quantity: 1,
      purchasePrice: 0,
      expiryDate: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length === 1) {
      toast.error('Phải có ít nhất 1 dòng vật tư!');
      return;
    }
    remove(index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            Phiếu Nhập Kho {warehouseType === 'COLD' ? '🧊 (Kho Lạnh)' : '📦 (Kho Thường)'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tạo phiếu nhập kho mới với thông tin nhà cung cấp và danh sách vật tư
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
            <div>
              <Label className="text-sm font-medium">
                Nhà Cung Cấp <span className="text-red-500">*</span>
              </Label>
              <Select
                value={String(watch('supplierId'))}
                onValueChange={(value) => setValue('supplierId', Number(value))}
                disabled={suppliersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={suppliersLoading ? "Đang tải..." : suppliers.length === 0 ? "Không có dữ liệu" : "Chọn NCC"} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      {suppliersLoading ? "Đang tải..." : suppliersError ? "Lỗi khi tải dữ liệu" : "Không có nhà cung cấp. Vui lòng tạo mới."}
                    </div>
                  ) : (
                    suppliers.map((supplier: SupplierSummaryResponse) => (
                      <SelectItem key={supplier.supplierId} value={String(supplier.supplierId)}>
                        {supplier.supplierName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {suppliers.length === 0 && !suppliersLoading && (
                <p className="text-xs text-red-500 mt-1">
                  Không có dữ liệu. Có thể do: (1) Thiếu quyền truy cập, (2) Database chưa có seed data, (3) API endpoint không tồn tại
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">
                Ngày Nhập <span className="text-red-500">*</span>
              </Label>
              <Input type="date" {...register('transactionDate')} required />
            </div>

            <div>
              <Label className="text-sm font-medium">
                Số Hóa Đơn <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('invoiceNumber', { required: true })}
                placeholder="VD: INV-2025-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Ngày Dự Kiến Giao</Label>
              <Input
                type="date"
                {...register('expectedDeliveryDate')}
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
                      <th className="p-3 text-left w-[30%]">Vật Tư *</th>
                      <th className="p-3 text-left w-[20%]">Số Lô *</th>
                      <th className="p-3 text-left w-[15%]">Số Lượng *</th>
                      <th className="p-3 text-left w-[15%]">Đơn Giá (VNĐ) *</th>
                      <th className="p-3 text-left w-[15%]">Hạn Sử Dụng *</th>
                      <th className="p-3 text-left w-[10%]">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const selectedItemId = watch(`items.${index}.itemMasterId`);
                      const selectedItem = items.find(
                        (item) => item.id === selectedItemId
                      );
                      const baseUnit = selectedItem ? unitCache[selectedItem.id!] : undefined;
                      const isExpiryRequired = !selectedItem?.isTool;
                      return (
                        <tr key={field.id} className="border-t hover:bg-slate-50">
                          <td className="p-3 text-center font-medium text-slate-600">
                            {index + 1}
                          </td>
                          <td className="p-3">
                            <Popover
                              open={openPopovers[index] || false}
                              onOpenChange={(open) => {
                                setOpenPopovers((prev) => ({ ...prev, [index]: open }));
                                if (!open) {
                                  setSearchQueries((prev) => ({ ...prev, [index]: '' }));
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                  disabled={itemsLoading}
                                >
                                  {selectedItem
                                    ? `${selectedItem.itemCode} - ${selectedItem.itemName}`
                                    : itemsLoading
                                      ? "Đang tải..."
                                      : items.length === 0
                                        ? "Không có dữ liệu"
                                        : "Chọn vật tư"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0" align="start">
                                <div className="flex items-center border-b px-3">
                                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                  <Input
                                    placeholder="Tìm kiếm vật tư..."
                                    value={searchQueries[index] || ''}
                                    onChange={(e) => {
                                      setSearchQueries((prev) => ({ ...prev, [index]: e.target.value }));
                                    }}
                                    className="h-9 border-0 focus-visible:ring-0"
                                  />
                                </div>
                                <div className="max-h-[300px] overflow-auto">
                                  {itemsLoading ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                      Đang tải...
                                    </div>
                                  ) : items.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                      {itemsError ? "Lỗi khi tải dữ liệu" : "Không có vật tư. Vui lòng tạo mới."}
                                    </div>
                                  ) : (
                                    (() => {
                                      const query = (searchQueries[index] || '').toLowerCase();
                                      const filteredItems = items.filter(
                                        (item) =>
                                          item.itemCode?.toLowerCase().includes(query) ||
                                          item.itemName?.toLowerCase().includes(query)
                                      );
                                      return filteredItems.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                          Không tìm thấy vật tư
                                        </div>
                                      ) : (
                                        filteredItems.map((item) => (
                                          <div
                                            key={item.id}
                                            className="flex items-center px-4 py-2 hover:bg-slate-100 cursor-pointer"
                                            onClick={() => {
                                              const itemId = item.id!;
                                              setValue(`items.${index}.itemMasterId`, itemId);
                                              fetchBaseUnitForItem(itemId, index);
                                              setOpenPopovers((prev) => ({ ...prev, [index]: false }));
                                              setSearchQueries((prev) => ({ ...prev, [index]: '' }));
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedItemId === item.id ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium">{item.itemCode} - {item.itemName}</div>
                                              {item.unitOfMeasure && (
                                                <div className="text-xs text-gray-500">Đơn vị: {item.unitOfMeasure}</div>
                                              )}
                                            </div>
                                          </div>
                                        ))
                                      );
                                    })()
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                            {items.length === 0 && !itemsLoading && index === 0 && (
                              <p className="text-xs text-red-500 mt-1">
                                Không có dữ liệu. Có thể do: (1) Thiếu quyền truy cập, (2) Database chưa có seed data, (3) API endpoint không tồn tại
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              {...register(`items.${index}.lotNumber`)}
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
                            <input
                              type="hidden"
                              {...register(`items.${index}.unitId`, { valueAsNumber: true })}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {unitLoading[index]
                                ? 'Đang tải đơn vị...'
                                : baseUnit?.unitName
                                  ? `Đơn vị: ${baseUnit.unitName}`
                                  : selectedItem?.unitOfMeasure
                                    ? `Đơn vị: ${selectedItem.unitOfMeasure}`
                                    : 'Chưa chọn vật tư'}
                            </p>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="0"
                              step="1000"
                              {...register(`items.${index}.purchasePrice`, { valueAsNumber: true })}
                              placeholder="0"
                              required
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="date"
                              {...register(`items.${index}.expiryDate`)}
                              required={isExpiryRequired}
                              className={isExpiryRequired ? 'border-amber-300' : undefined}
                            />
                            {isExpiryRequired && (
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

