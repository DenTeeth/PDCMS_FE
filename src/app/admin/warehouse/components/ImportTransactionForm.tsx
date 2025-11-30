'use client';

/**
 * Import Transaction Form - API 6.4
 * Complete implementation matching BE requirements
 * 
 * Features:
 * - Invoice number tracking (unique)
 * - Batch handling (auto create/update)
 * - Unit conversion support
 * - Purchase price tracking
 * - Expiry date validation
 * - Financial summary
 * - Warning system
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, ChevronsUpDown, Search, Plus, Trash2, Package, AlertCircle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SupplierSummaryResponse } from '@/types/supplier';
import { CreateImportTransactionDto, CreateImportItemDto, ItemUnitResponse } from '@/types/warehouse';
import inventoryService, { type ItemMasterV1 } from '@/services/inventoryService';
import supplierService from '@/services/supplierService';
import itemUnitService from '@/services/itemUnitService';

// ============================================
// VALIDATION SCHEMA (Matching BE)
// ============================================

const importItemSchema = z.object({
  itemMasterId: z.number({
    required_error: 'Vui lòng chọn vật tư',
    invalid_type_error: 'Vui lòng chọn vật tư',
  })
    .int('ID vật tư phải là số nguyên')
    .positive('Vui lòng chọn vật tư'),
  lotNumber: z.string().min(1, 'Số lô là bắt buộc').max(100, 'Số lô không được vượt quá 100 ký tự'),
  expiryDate: z.string().min(1, 'Hạn sử dụng là bắt buộc').refine(
    (date) => {
      if (!date) return false;
      const expiry = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiry > today;
    },
    { message: 'Hạn sử dụng phải sau ngày hiện tại' }
  ),
  quantity: z.number({
    required_error: 'Số lượng là bắt buộc',
    invalid_type_error: 'Số lượng phải là số',
  })
    .int('Số lượng phải là số nguyên')
    .positive('Số lượng phải lớn hơn 0')
    .max(1000000, 'Số lượng không được vượt quá 1,000,000'),
  unitId: z.number({
    required_error: 'Vui lòng chọn đơn vị',
    invalid_type_error: 'Vui lòng chọn đơn vị',
  })
    .int('ID đơn vị phải là số nguyên')
    .positive('Vui lòng chọn đơn vị (hệ thống đang tải đơn vị cơ sở...)'),
  purchasePrice: z.number({
    required_error: 'Đơn giá là bắt buộc',
    invalid_type_error: 'Đơn giá phải là số',
  })
    .positive('Đơn giá phải lớn hơn 0')
    .min(0.01, 'Đơn giá phải >= 0.01 VNĐ')
    .max(100000000, 'Đơn giá không được vượt quá 100,000,000 VNĐ'),
  binLocation: z.string().max(200, 'Vị trí kho không được vượt quá 200 ký tự').optional().or(z.literal('')),
  notes: z.string().max(500, 'Ghi chú không được vượt quá 500 ký tự').optional().or(z.literal('')),
});

const importFormSchema = z.object({
  supplierId: z.number().positive('Vui lòng chọn nhà cung cấp'),
  transactionDate: z.string().min(1, 'Ngày nhập là bắt buộc').refine(
    (date) => {
      const txDate = new Date(date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return txDate < tomorrow;
    },
    { message: 'Ngày nhập không được là tương lai' }
  ),
  invoiceNumber: z.string().min(1, 'Số hóa đơn là bắt buộc').max(100, 'Số hóa đơn không được vượt quá 100 ký tự'),
  expectedDeliveryDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(500, 'Ghi chú không được vượt quá 500 ký tự').optional().or(z.literal('')),
  items: z.array(importItemSchema).min(1, 'Phải có ít nhất 1 vật tư'),
});

type ImportFormData = z.infer<typeof importFormSchema>;

interface ImportTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

export default function ImportTransactionForm({
  isOpen,
  onClose,
  warehouseType,
}: ImportTransactionFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split('T')[0],
      supplierId: 0,
      invoiceNumber: '',
      expectedDeliveryDate: '',
      notes: '',
      items: [
        {
          itemMasterId: 0,
          lotNumber: '',
          expiryDate: '',
          quantity: 1,
          unitId: 0,
          purchasePrice: 0,
          binLocation: '',
          notes: '',
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

  // Fetch Suppliers
  const { data: suppliersResponse, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      try {
        const page = await supplierService.getAll({
          page: 0,
          size: 1000,
          sort: 'supplierName,asc',
        });
        return page;
      } catch (error: any) {
        console.error('❌ Failed to fetch suppliers:', error);
        toast.error('Không thể tải danh sách nhà cung cấp', {
          description: error.response?.data?.message || 'Vui lòng kiểm tra quyền truy cập',
        });
        return null;
      }
    },
    enabled: isOpen,
  });

  const suppliers: SupplierSummaryResponse[] = suppliersResponse?.content ?? [];

  // Fetch Item Masters
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['itemMasters', warehouseType],
    queryFn: async () => {
      try {
        const result = await inventoryService.getAll({
          warehouseType,
        });
        return result;
      } catch (error: any) {
        console.error('❌ Failed to fetch item masters:', error);
        toast.error('Không thể tải danh sách vật tư', {
          description: error.response?.data?.message || 'Vui lòng kiểm tra quyền truy cập',
        });
        return [];
      }
    },
    enabled: isOpen,
  });

  const fetchBaseUnitForItem = async (itemMasterId: number, rowIndex: number) => {
    if (!itemMasterId || itemMasterId <= 0) {
      console.warn('⚠️ Invalid itemMasterId:', itemMasterId);
      return;
    }

    // Check cache first
    if (unitCache[itemMasterId]) {
      const cachedUnit = unitCache[itemMasterId];
      setValue(`items.${rowIndex}.unitId`, Number(cachedUnit.unitId), { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      return;
    }

    try {
      setUnitLoading((prev) => ({ ...prev, [rowIndex]: true }));
      const baseUnit = await itemUnitService.getBaseUnit(itemMasterId);
      
      if (!baseUnit || !baseUnit.unitId) {
        throw new Error('Base unit không hợp lệ');
      }
      
      // Cache the unit
      setUnitCache((prev) => ({ ...prev, [itemMasterId]: baseUnit }));
      
      // Set unitId with validation (ensure it's a number)
      setValue(`items.${rowIndex}.unitId`, Number(baseUnit.unitId), { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch base unit:', error);
      toast.error('Không thể tải đơn vị cơ sở', {
        description: error.response?.data?.message || error.message || 'Vui lòng thử lại',
      });
      // Don't set unitId if fetch failed - let validation catch it
    } finally {
      setUnitLoading((prev) => ({ ...prev, [rowIndex]: false }));
    }
  };

  // Create Import Mutation
  const mutation = useMutation({
    mutationFn: (data: CreateImportTransactionDto) =>
      inventoryService.createImportTransaction(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['storageTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      
      // Show success with details
      toast.success('Nhập kho thành công!', {
        description: `Mã phiếu: ${response.transactionCode} | Tổng giá trị: ${response.totalValue.toLocaleString('vi-VN')} VNĐ`,
        duration: 5000,
      });

      // Show warnings if any
      if (response.warnings && response.warnings.length > 0) {
        response.warnings.forEach((warning) => {
          toast.warning(warning.message, {
            description: `Vật tư: ${warning.itemCode}`,
          });
        });
      }

      handleReset();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi nhập kho!';
      const errorCode = error.response?.data?.error || error.response?.data?.errorCode;
      
      if (errorCode === 'DUPLICATE_INVOICE') {
        toast.error('Số hóa đơn đã tồn tại', {
          description: 'Vui lòng sử dụng số hóa đơn khác',
        });
      } else if (errorCode === 'BATCH_EXPIRY_CONFLICT') {
        toast.error('Xung đột hạn sử dụng', {
          description: 'Cùng số lô phải có cùng hạn sử dụng',
        });
      } else if (errorCode === 'EXPIRED_ITEM') {
        toast.error('Không thể nhập hàng hết hạn', {
          description: 'Hạn sử dụng phải sau ngày hiện tại',
        });
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const handleReset = () => {
    reset();
    setUnitCache({});
    setUnitLoading({});
    setOpenPopovers({});
    setSearchQueries({});
  };

  const onSubmit = (data: ImportFormData) => {
    // Validate items before submit
    const validItems = data.items.filter((item) => {
      return item.itemMasterId > 0 && item.unitId > 0 && item.quantity > 0 && item.purchasePrice > 0;
    });

    if (validItems.length === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin cho ít nhất 1 vật tư');
      return;
    }

    if (validItems.length !== data.items.length) {
      toast.warning(`Có ${data.items.length - validItems.length} dòng chưa hợp lệ, chỉ gửi ${validItems.length} dòng hợp lệ`);
    }

    const payload: CreateImportTransactionDto = {
      supplierId: data.supplierId,
      transactionDate: `${data.transactionDate}T00:00:00`,
      invoiceNumber: data.invoiceNumber.trim(),
      expectedDeliveryDate: data.expectedDeliveryDate ? data.expectedDeliveryDate : undefined,
      notes: data.notes?.trim() || undefined,
      items: validItems.map((item) => ({
        itemMasterId: Number(item.itemMasterId),
        lotNumber: item.lotNumber.trim(),
        expiryDate: item.expiryDate,
        quantity: Number(item.quantity),
        unitId: Number(item.unitId),
        purchasePrice: Number(item.purchasePrice),
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
      expiryDate: '',
      quantity: 1,
      unitId: 0,
      purchasePrice: 0,
      binLocation: '',
      notes: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length === 1) {
      toast.error('Phải có ít nhất 1 dòng vật tư!');
      return;
    }
    remove(index);
  };

  // Calculate total value
  const totalValue = watch('items').reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.purchasePrice) || 0;
    return sum + (quantity * price);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6 text-emerald-600" />
            Phiếu Nhập Kho {warehouseType === 'COLD' ? '🧊 (Kho Lạnh)' : '📦 (Kho Thường)'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tạo phiếu nhập kho mới với tracking hóa đơn, giá nhập, xử lý lô hàng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          // Log validation errors for debugging
          console.error('❌ Form validation errors:', errors);
          // Show first error to user
          const firstError = Object.values(errors).find(Boolean);
          if (firstError) {
            const errorMessage = typeof firstError === 'object' && 'message' in firstError 
              ? firstError.message 
              : 'Vui lòng kiểm tra lại thông tin đã nhập';
            toast.error('Thông tin không hợp lệ', {
              description: errorMessage,
            });
          }
        })} className="space-y-6" noValidate>
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border">
            <div>
              <Label className="text-sm font-medium">
                Nhà Cung Cấp <span className="text-red-500">*</span>
              </Label>
              <Select
                value={String(watch('supplierId'))}
                onValueChange={(value) => setValue('supplierId', Number(value))}
                disabled={suppliersLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={suppliersLoading ? "Đang tải..." : suppliers.length === 0 ? "Không có dữ liệu" : "Chọn NCC"} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      {suppliersLoading ? "Đang tải..." : "Không có nhà cung cấp. Vui lòng tạo mới."}
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
              {errors.supplierId && (
                <p className="text-xs text-red-500 mt-1">{errors.supplierId.message}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">
                Ngày Nhập <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                {...register('transactionDate')}
                className={errors.transactionDate ? 'border-red-500' : ''}
              />
              {errors.transactionDate && (
                <p className="text-xs text-red-500 mt-1">{errors.transactionDate.message}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">
                Số Hóa Đơn <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('invoiceNumber')}
                placeholder="VD: INV-2025-001"
                className={errors.invoiceNumber ? 'border-red-500' : ''}
              />
              {errors.invoiceNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.invoiceNumber.message}</p>
              )}
            </div>

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
                      <th className="p-3 text-left w-[25%]">Vật Tư *</th>
                      <th className="p-3 text-left w-[15%]">Số Lô *</th>
                      <th className="p-3 text-left w-[12%]">Số Lượng *</th>
                      <th className="p-3 text-left w-[15%]">Đơn Giá (VNĐ) *</th>
                      <th className="p-3 text-left w-[15%]">Hạn Sử Dụng *</th>
                      <th className="p-3 text-left w-[13%]">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const selectedItemId = watch(`items.${index}.itemMasterId`);
                      const selectedItem = items.find((item) => item.id === selectedItemId);
                      const baseUnit = selectedItem ? unitCache[selectedItem.id!] : undefined;
                      const itemErrors = errors.items?.[index];
                      
                      return (
                        <tr key={field.id} className="border-t hover:bg-slate-50">
                          {/* Hidden inputs for form tracking */}
                          <Controller
                            name={`items.${index}.itemMasterId`}
                            control={control}
                            defaultValue={0}
                            render={({ field }) => (
                              <input 
                                type="hidden" 
                                {...field} 
                                value={Number(field.value) || 0}
                                onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                              />
                            )}
                          />
                          <Controller
                            name={`items.${index}.unitId`}
                            control={control}
                            defaultValue={0}
                            render={({ field }) => (
                              <input 
                                type="hidden" 
                                {...field} 
                                value={Number(field.value) || 0}
                                onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                              />
                            )}
                          />
                          
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
                                      Không có vật tư. Vui lòng tạo mới.
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
                                            onClick={async () => {
                                              const itemId = Number(item.id);
                                              if (!itemId || isNaN(itemId)) {
                                                toast.error('Lỗi: Không thể xác định ID vật tư');
                                                return;
                                              }
                                              
                                              // Set itemMasterId as number (ensure it's a number)
                                              setValue(`items.${index}.itemMasterId`, Number(itemId), { 
                                                shouldValidate: true,
                                                shouldDirty: true,
                                                shouldTouch: true
                                              });
                                              
                                              // Fetch and set unitId
                                              await fetchBaseUnitForItem(Number(itemId), index);
                                              
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
                            {itemErrors?.itemMasterId && (
                              <p className="text-xs text-red-500 mt-1">{itemErrors.itemMasterId.message}</p>
                            )}
                            {unitLoading[index] && (
                              <p className="text-xs text-blue-500 mt-1">Đang tải đơn vị...</p>
                            )}
                            {baseUnit && !unitLoading[index] && (
                              <p className="text-xs text-gray-500 mt-1">Đơn vị: {baseUnit.unitName}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              {...register(`items.${index}.lotNumber`)}
                              placeholder="LOT-2024-001"
                              className={itemErrors?.lotNumber ? 'border-red-500' : ''}
                            />
                            {itemErrors?.lotNumber && (
                              <p className="text-xs text-red-500 mt-1">{itemErrors.lotNumber.message}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="1"
                              max="1000000"
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                              placeholder="1"
                              className={itemErrors?.quantity ? 'border-red-500' : ''}
                            />
                            {itemErrors?.quantity && (
                              <p className="text-xs text-red-500 mt-1">{itemErrors.quantity.message}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              {...register(`items.${index}.purchasePrice`, { valueAsNumber: true })}
                              placeholder="0"
                              className={itemErrors?.purchasePrice ? 'border-red-500' : ''}
                            />
                            {itemErrors?.purchasePrice && (
                              <p className="text-xs text-red-500 mt-1">{itemErrors.purchasePrice.message}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              type="date"
                              {...register(`items.${index}.expiryDate`)}
                              className={itemErrors?.expiryDate ? 'border-red-500' : ''}
                            />
                            {itemErrors?.expiryDate && (
                              <p className="text-xs text-red-500 mt-1">{itemErrors.expiryDate.message}</p>
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
            {errors.items && typeof errors.items === 'object' && 'message' in errors.items && (
              <p className="text-xs text-red-500 mt-1">{errors.items.message as string}</p>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <Label className="text-sm font-semibold text-emerald-900">Tổng Giá Trị Phiếu Nhập</Label>
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                {totalValue.toLocaleString('vi-VN')} VNĐ
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
              className={errors.notes ? 'border-red-500' : ''}
            />
            {errors.notes && (
              <p className="text-xs text-red-500 mt-1">{errors.notes.message}</p>
            )}
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-blue-900">Lưu ý quan trọng</p>
              <ul className="text-blue-700 list-disc list-inside space-y-1">
                <li>Số hóa đơn phải là duy nhất (không trùng với phiếu nhập khác)</li>
                <li>Cùng số lô phải có cùng hạn sử dụng</li>
                <li>Hệ thống tự động tạo lô mới hoặc cập nhật lô cũ dựa trên số lô</li>
                <li>Đơn giá được dùng để tính COGS (Cost of Goods Sold)</li>
              </ul>
            </div>
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

