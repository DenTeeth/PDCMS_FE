'use client';

/**
 * Export Transaction Form - API 6.5
 * Complete implementation matching BE requirements
 * 
 * Features:
 * - FEFO Algorithm (First Expired First Out)
 * - Auto-Unpacking support
 * - Multi-Batch Allocation
 * - Financial Tracking (COGS)
 * - Warning System
 * - Export Types: USAGE, DISPOSAL, RETURN
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Search, Plus, Trash2, TruckIcon, AlertCircle, DollarSign } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSnowflake } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { CreateExportTransactionDto, ExportType, ItemUnitResponse } from '@/types/warehouse';
import inventoryService, { type ItemMasterV1 } from '@/services/inventoryService';
import itemUnitService from '@/services/itemUnitService';

// ============================================
// VALIDATION SCHEMA (Matching BE)
// ============================================

const exportItemSchema = z.object({
  itemMasterId: z.number().positive('Vui lòng chọn vật tư'),
  quantity: z.number().min(1, 'Số lượng phải >= 1').max(1000000, 'Số lượng không được vượt quá 1,000,000'),
  unitId: z.number().positive('Đơn vị là bắt buộc'),
  notes: z.string().max(500, 'Ghi chú không được vượt quá 500 ký tự').optional().or(z.literal('')),
});

const exportFormSchema = z.object({
  transactionDate: z.string().min(1, 'Ngày xuất là bắt buộc').refine(
    (date) => {
      const txDate = new Date(date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return txDate < tomorrow;
    },
    { message: 'Ngày xuất không được là tương lai' }
  ),
  exportType: z.enum(['USAGE', 'DISPOSAL', 'RETURN'] as [string, ...string[]]),
  referenceCode: z.string().max(100, 'Mã tham chiếu không được vượt quá 100 ký tự').optional().or(z.literal('')),
  departmentName: z.string().max(200, 'Tên phòng ban không được vượt quá 200 ký tự').optional().or(z.literal('')),
  requestedBy: z.string().max(200, 'Người yêu cầu không được vượt quá 200 ký tự').optional().or(z.literal('')),
  notes: z.string().max(500, 'Ghi chú không được vượt quá 500 ký tự').optional().or(z.literal('')),
  allowExpired: z.boolean().default(false),
  items: z.array(exportItemSchema).min(1, 'Phải có ít nhất 1 vật tư'),
});

type ExportFormData = z.infer<typeof exportFormSchema>;

interface ExportTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

export default function ExportTransactionForm({
  isOpen,
  onClose,
  warehouseType,
}: ExportTransactionFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(exportFormSchema) as any,
    defaultValues: {
      transactionDate: new Date().toISOString().split('T')[0],
      exportType: 'USAGE',
      referenceCode: '',
      departmentName: '',
      requestedBy: '',
      notes: '',
      allowExpired: false,
      items: [
        {
          itemMasterId: 0,
          quantity: 1,
          unitId: 0,
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
        console.error(' Failed to fetch item masters:', error);
        toast.error('Không thể tải danh sách vật tư', {
          description: error.response?.data?.message || 'Vui lòng kiểm tra quyền truy cập',
        });
        return [];
      }
    },
    enabled: isOpen,
  });

  const fetchBaseUnitForItem = async (itemMasterId: number, rowIndex: number) => {
    if (!itemMasterId) return;

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
      console.error(' Failed to fetch base unit:', error);
      toast.error('Không thể tải đơn vị cơ sở', {
        description: error.response?.data?.message || 'Vui lòng thử lại',
      });
    } finally {
      setUnitLoading((prev) => ({ ...prev, [rowIndex]: false }));
    }
  };

  // Create Export Mutation
  const mutation = useMutation({
    mutationFn: (data: CreateExportTransactionDto) =>
      inventoryService.createExportTransaction(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['storageTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      queryClient.invalidateQueries({ queryKey: ['itemMasterSummary'] });
      
      // Show success with details
      toast.success('Xuất kho thành công!', {
        description: `Mã phiếu: ${response.transactionCode}${response.totalValue ? ` | Tổng giá trị: ${response.totalValue.toLocaleString('vi-VN')} VNĐ` : ''}`,
        duration: 5000,
      });

      // Show warnings if any
      if (response.warnings && response.warnings.length > 0) {
        response.warnings.forEach((warning) => {
          toast.warning(warning.message || 'Cảnh báo', {
            description: warning.itemCode ? `Vật tư: ${warning.itemCode}` : undefined,
          });
        });
      }

      handleReset();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xuất kho!';
      const errorCode = error.response?.data?.error || error.response?.data?.errorCode;
      
      if (errorCode === 'INSUFFICIENT_STOCK') {
        const details = error.response?.data?.details;
        toast.error('Không đủ hàng', {
          description: details?.availableNonExpired 
            ? `Còn: ${details.availableNonExpired} ${details.requestedUnit || ''}`
            : 'Vui lòng kiểm tra lại số lượng tồn kho',
        });
      } else if (errorCode === 'EXPIRED_STOCK_NOT_ALLOWED') {
        toast.error('Không thể xuất hàng hết hạn', {
          description: 'Vui lòng chọn loại xuất DISPOSAL hoặc bật "Cho phép hàng hết hạn"',
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

  const onSubmit: SubmitHandler<ExportFormData> = (data) => {
    const payload: CreateExportTransactionDto = {
      transactionDate: `${data.transactionDate}T00:00:00`,
      exportType: data.exportType as ExportType,
      referenceCode: data.referenceCode?.trim() || undefined,
      departmentName: data.departmentName?.trim() || undefined,
      requestedBy: data.requestedBy?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      allowExpired: data.exportType === 'DISPOSAL' ? true : data.allowExpired,
      items: data.items.map((item) => ({
        itemMasterId: item.itemMasterId,
        quantity: item.quantity,
        unitId: item.unitId,
        notes: item.notes?.trim() || undefined,
      })),
    };

    mutation.mutate(payload);
  };

  const handleAddItem = () => {
    append({
      itemMasterId: 0,
      quantity: 1,
      unitId: 0,
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

  const exportType = watch('exportType');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TruckIcon className="h-6 w-6 text-blue-600" />
            Phiếu xuất kho (FEFO) {warehouseType === 'COLD' ? (
              <>
                <FontAwesomeIcon icon={faSnowflake} className="mr-1" />
                (Kho lạnh)
              </>
            ) : '(Kho thường)'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tạo phiếu xuất kho với FEFO (First Expired, First Out) và auto-unpacking
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
            <div>
              <Label className="text-sm font-medium">
                Ngày xuất <span className="text-red-500">*</span>
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
                Loại phiếu <span className="text-red-500">*</span>
              </Label>
              <Select
                value={exportType}
                onValueChange={(value) => setValue('exportType', value as ExportType)}
              >
                <SelectTrigger className={errors.exportType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Chọn loại xuất" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USAGE">Xuất dùng (USAGE)</SelectItem>
                  <SelectItem value="DISPOSAL">Xuất hủy (DISPOSAL)</SelectItem>
                  <SelectItem value="RETURN">Trả nhà cung cấp (RETURN)</SelectItem>
                </SelectContent>
              </Select>
              {errors.exportType && (
                <p className="text-xs text-red-500 mt-1">{errors.exportType.message}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Bộ phận / khoa yêu cầu</Label>
              <Input
                {...register('departmentName')}
                placeholder="VD: Khoa Nội, Phòng khám tổng quát"
                className={errors.departmentName ? 'border-red-500' : ''}
              />
              {errors.departmentName && (
                <p className="text-xs text-red-500 mt-1">{errors.departmentName.message}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Người yêu cầu</Label>
              <Input
                {...register('requestedBy')}
                placeholder="VD: BS. Nguyễn Văn A"
                className={errors.requestedBy ? 'border-red-500' : ''}
              />
              {errors.requestedBy && (
                <p className="text-xs text-red-500 mt-1">{errors.requestedBy.message}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Mã tham chiếu / ca điều trị</Label>
              <Input
                {...register('referenceCode')}
                placeholder="VD: CASE-2025-001"
                className={errors.referenceCode ? 'border-red-500' : ''}
              />
              {errors.referenceCode && (
                <p className="text-xs text-red-500 mt-1">{errors.referenceCode.message}</p>
              )}
            </div>

            {exportType === 'USAGE' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowExpired"
                  {...register('allowExpired')}
                  className="h-4 w-4"
                />
                <Label htmlFor="allowExpired" className="text-sm font-medium cursor-pointer">
                  Cho phép xuất hàng hết hạn (yêu cầu phê duyệt!)
                </Label>
              </div>
            )}
          </div>

          {/* FEFO Info Alert */}
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-violet-600 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-violet-900">🤖 FEFO - First Expired, First Out</p>
              <p className="text-violet-700">
                Hệ thống tự động chọn lô hàng có HSD sớm nhất để xuất trước. 
                Nếu thiếu hàng lẻ, hệ thống sẽ tự động xé lẻ từ đơn vị lớn hơn.
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">
                Danh sách vật tư xuất <span className="text-red-500">*</span>
              </Label>
              <Button type="button" size="sm" onClick={handleAddItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm dòng
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr className="text-xs font-semibold text-slate-700">
                      <th className="p-3 text-left w-[5%]">STT</th>
                      <th className="p-3 text-left w-[40%]">Vật tư *</th>
                      <th className="p-3 text-left w-[25%]">Số lượng *</th>
                      <th className="p-3 text-left w-[20%]">Ghi chú</th>
                      <th className="p-3 text-center w-[10%]">Hành động</th>
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
                              {...register(`items.${index}.notes`)}
                              placeholder="Ghi chú (nếu có)"
                              className={itemErrors?.notes ? 'border-red-500' : ''}
                            />
                            {itemErrors?.notes && (
                              <p className="text-xs text-red-500 mt-1">{itemErrors.notes.message}</p>
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

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium">Ghi chú</Label>
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
              <p className="font-semibold text-blue-900">Lưu ý quan trọng!</p>
              <ul className="text-blue-700 list-disc list-inside space-y-1">
                <li>Hệ thống tự động chọn lô hàng theo FEFO (lô hết hạn trước được xuất trước)</li>
                <li>Nếu thiếu hàng lẻ, hệ thống sẽ tự động xé lẻ từ đơn vị lớn hơn</li>
                <li>Loại USAGE: Không cho phép xuất hàng hết hạn (trừ khi bật "Cho phép hàng hết hạn")</li>
                <li>Loại DISPOSAL: Cho phép xuất hàng hết hạn để tiêu hủy</li>
                <li>Giá trị xuất (COGS) sẽ được tính tự động dựa trên giá nhập ban đầu</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : 'Lưu phiếu xuất'}
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

