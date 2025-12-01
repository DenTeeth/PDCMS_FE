'use client';

/**
 * Export Transaction Form - NEW VERSION
 * Simplified and more reliable implementation
 * 
 * Features:
 * - Export types: USAGE, DISPOSAL, RETURN
 * - FEFO algorithm (handled by BE)
 * - Auto-unpacking (handled by BE)
 * - Multi-batch allocation (handled by BE)
 * - Financial tracking (COGS)
 * - Warning system
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Check, ChevronsUpDown, Search, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CreateExportTransactionDto, CreateExportItemDto, ExportType, ItemUnitResponse } from '@/types/warehouse';
import inventoryService, { type ItemMasterV1, type InventorySummary } from '@/services/inventoryService';
import itemUnitService from '@/services/itemUnitService';

interface ExportItem {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitId: number;
  unitName: string;
  notes: string;
}

interface ExportTransactionFormNewProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

export default function ExportTransactionFormNew({
  isOpen,
  onClose,
  warehouseType,
}: ExportTransactionFormNewProps) {
  const queryClient = useQueryClient();

  // Form state
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [exportType, setExportType] = useState<ExportType>('USAGE');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [departmentName, setDepartmentName] = useState<string>('');
  const [requestedBy, setRequestedBy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [allowExpired, setAllowExpired] = useState<boolean>(false);
  const [items, setItems] = useState<ExportItem[]>([
    {
      itemMasterId: 0,
      itemCode: '',
      itemName: '',
      quantity: 1,
      unitId: 0,
      unitName: '',
      notes: '',
    },
  ]);

  // UI state
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [unitCache, setUnitCache] = useState<Record<number, ItemUnitResponse>>({});
  const [unitLoading, setUnitLoading] = useState<Record<number, boolean>>({});

  // Fetch Item Masters - Using getSummary for better compatibility
  const { data: itemMastersResponse, isLoading: itemsLoading } = useQuery({
    queryKey: ['itemMasters', warehouseType],
    queryFn: async () => {
      try {
        // Use getSummary which returns paginated response with proper structure
        const result = await inventoryService.getSummary({
          warehouseType,
          size: 1000, // Get all items
          page: 0,
        });
        // Map InventorySummary to ItemMasterV1 format
        return (result.content || []).map((item) => ({
          id: item.itemMasterId,
          itemMasterId: item.itemMasterId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          categoryId: 0, // Not available in summary
          categoryName: item.categoryName,
          unitOfMeasure: item.unitOfMeasure,
          warehouseType: item.warehouseType,
          minStockLevel: item.minStockLevel,
          maxStockLevel: item.maxStockLevel,
          currentStock: item.totalQuantity,
          stockStatus: item.stockStatus,
          isTool: item.isTool || false,
          notes: '',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
      } catch (error: any) {
        console.error('❌ Failed to fetch item masters:', error);
        toast.error('Không thể tải danh sách vật tư', {
          description: error.response?.data?.message || 'Vui lòng thử lại',
        });
        return [];
      }
    },
    enabled: isOpen,
  });

  const itemMasters: ItemMasterV1[] = itemMastersResponse || [];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setExportType('USAGE');
      setReferenceCode('');
      setDepartmentName('');
      setRequestedBy('');
      setNotes('');
      setAllowExpired(false);
      setItems([
        {
          itemMasterId: 0,
          itemCode: '',
          itemName: '',
          quantity: 1,
          unitId: 0,
          unitName: '',
          notes: '',
        },
      ]);
      setOpenPopovers({});
      setSearchQueries({});
      setUnitCache({});
      setUnitLoading({});
    }
  }, [isOpen]);

  // Fetch base unit for item
  const fetchBaseUnit = async (itemMasterId: number, rowIndex: number) => {
    if (!itemMasterId || itemMasterId <= 0) return;

    // Check cache first
    if (unitCache[itemMasterId]) {
      const cachedUnit = unitCache[itemMasterId];
      setItems((prev) => {
        const updated = [...prev];
        updated[rowIndex] = {
          ...updated[rowIndex],
          unitId: cachedUnit.unitId,
          unitName: cachedUnit.unitName,
        };
        return updated;
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

      // Update item with unit
      setItems((prev) => {
        const updated = [...prev];
        updated[rowIndex] = {
          ...updated[rowIndex],
          unitId: baseUnit.unitId,
          unitName: baseUnit.unitName,
        };
        return updated;
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch base unit:', error);
      toast.error('Không thể tải đơn vị cơ sở', {
        description: error.response?.data?.message || error.message || 'Vui lòng thử lại',
      });
    } finally {
      setUnitLoading((prev) => ({ ...prev, [rowIndex]: false }));
    }
  };

  // Handle item selection
  const handleItemSelect = async (item: ItemMasterV1, rowIndex: number) => {
    // Check if item has valid id
    if (!item || item.id === undefined || item.id === null) {
      console.error('❌ Invalid item:', item);
      toast.error('Lỗi: Không thể xác định ID vật tư', {
        description: 'Vui lòng thử chọn lại vật tư khác',
      });
      return;
    }

    const itemId = Number(item.id);
    if (!itemId || isNaN(itemId) || itemId <= 0) {
      console.error('❌ Invalid itemId:', item.id, 'for item:', item);
      toast.error('Lỗi: ID vật tư không hợp lệ', {
        description: `ID: ${item.id}`,
      });
      return;
    }

    // Update item
    setItems((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        itemMasterId: itemId,
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
      };
      return updated;
    });

    // Fetch base unit
    await fetchBaseUnit(itemId, rowIndex);

    // Close popover
    setOpenPopovers((prev) => ({ ...prev, [rowIndex]: false }));
    setSearchQueries((prev) => ({ ...prev, [rowIndex]: '' }));
  };

  // Add new item row
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemMasterId: 0,
        itemCode: '',
        itemName: '',
        quantity: 1,
        unitId: 0,
        unitName: '',
        notes: '',
      },
    ]);
  };

  // Remove item row
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Phải có ít nhất 1 dòng vật tư!');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const updateItemField = (index: number, field: keyof ExportItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Create Export Mutation
  const mutation = useMutation({
    mutationFn: (data: CreateExportTransactionDto) =>
      inventoryService.createExportTransaction(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['storageTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      
      toast.success('Xuất kho thành công!', {
        description: `Mã phiếu: ${response.transactionCode}${response.totalValue ? ` | Tổng giá trị: ${response.totalValue.toLocaleString('vi-VN')} VNĐ` : ''}`,
        duration: 5000,
      });

      if (response.warnings && response.warnings.length > 0) {
        response.warnings.forEach((warning) => {
          toast.warning(warning.message, {
            description: warning.itemCode ? `Vật tư: ${warning.itemCode}` : undefined,
          });
        });
      }

      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xuất kho!';
      const errorCode = error.response?.data?.error || error.response?.data?.errorCode;
      
      if (errorCode === 'INSUFFICIENT_STOCK') {
        toast.error('Không đủ hàng tồn kho', {
          description: errorMessage,
        });
      } else if (errorCode === 'EXPIRED_STOCK_NOT_ALLOWED') {
        toast.error('Không thể xuất hàng hết hạn', {
          description: 'Vui lòng chọn loại xuất DISPOSAL hoặc bật "Cho phép xuất hàng hết hạn"',
        });
      } else if (errorCode === 'ITEM_NOT_FOUND') {
        toast.error('Vật tư không tồn tại', {
          description: errorMessage,
        });
      } else if (errorCode === 'UNIT_MISMATCH') {
        toast.error('Đơn vị không hợp lệ', {
          description: errorMessage,
        });
      } else if (errorCode === 'EMPLOYEE_NOT_FOUND') {
        toast.error('Không tìm thấy nhân viên', {
          description: 'Tài khoản của bạn chưa được liên kết với nhân viên. Vui lòng liên hệ quản trị viên.',
        });
      } else if (errorCode === 'EMPLOYEE_INACTIVE') {
        toast.error('Nhân viên không hoạt động', {
          description: 'Tài khoản nhân viên của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        });
      } else {
        toast.error('Lỗi xuất kho', {
          description: errorMessage,
        });
      }
    },
  });

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!exportType) {
      toast.error('Vui lòng chọn loại xuất kho');
      return;
    }

    // Validate items
    const validItems = items.filter((item) => {
      return (
        item.itemMasterId > 0 &&
        item.unitId > 0 &&
        item.quantity > 0
      );
    });

    if (validItems.length === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin cho ít nhất 1 vật tư');
      return;
    }

    if (validItems.length !== items.length) {
      toast.warning(`Có ${items.length - validItems.length} dòng chưa hợp lệ, chỉ gửi ${validItems.length} dòng hợp lệ`);
    }

    // Prepare payload
    // Convert date to LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
    const transactionDateTime = `${transactionDate}T00:00:00`;
    
    const payload: CreateExportTransactionDto = {
      transactionDate: transactionDateTime,
      exportType,
      referenceCode: referenceCode.trim() || undefined,
      departmentName: departmentName.trim() || undefined,
      requestedBy: requestedBy.trim() || undefined,
      notes: notes.trim() || undefined,
      allowExpired: exportType === 'DISPOSAL' ? true : allowExpired,
      items: validItems.map((item) => ({
        itemMasterId: Number(item.itemMasterId),
        quantity: Number(item.quantity),
        unitId: Number(item.unitId),
        notes: item.notes.trim() || undefined,
      })),
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Phiếu Xuất Kho {warehouseType === 'COLD' ? '🧊 (Kho Lạnh)' : '📦 (Kho Thường)'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tạo phiếu xuất kho mới với FEFO, auto-unpacking, và tracking tài chính
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transactionDate" className="text-sm font-medium">
                Ngày Xuất Kho <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="transactionDate"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="pl-10"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <Label htmlFor="exportType" className="text-sm font-medium">
                Loại Xuất Kho <span className="text-red-500">*</span>
              </Label>
              <Select value={exportType} onValueChange={(value: ExportType) => setExportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại xuất kho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USAGE">📋 Xuất Dùng (USAGE)</SelectItem>
                  <SelectItem value="DISPOSAL">🗑️ Xuất Hủy (DISPOSAL)</SelectItem>
                  <SelectItem value="RETURN">↩️ Trả NCC (RETURN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="referenceCode" className="text-sm font-medium">
                Mã Tham Chiếu
              </Label>
              <Input
                id="referenceCode"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="REQ-2025-001"
              />
            </div>

            <div>
              <Label htmlFor="departmentName" className="text-sm font-medium">
                Phòng Ban
              </Label>
              <Input
                id="departmentName"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Phòng khám tổng hợp"
              />
            </div>

            <div>
              <Label htmlFor="requestedBy" className="text-sm font-medium">
                Người Yêu Cầu
              </Label>
              <Input
                id="requestedBy"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="Dr. Nguyen Van A"
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="allowExpired"
                checked={allowExpired}
                onChange={(e) => setAllowExpired(e.target.checked)}
                disabled={exportType === 'DISPOSAL'}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="allowExpired" className="text-sm font-medium cursor-pointer">
                Cho phép xuất hàng hết hạn
                {exportType === 'DISPOSAL' && (
                  <span className="text-xs text-gray-500 ml-1">(Tự động bật cho DISPOSAL)</span>
                )}
              </Label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Ghi Chú
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú chung cho phiếu xuất..."
              rows={2}
            />
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
                      <th className="p-3 text-left w-[15%]">Số Lượng *</th>
                      <th className="p-3 text-left w-[15%]">Đơn Vị</th>
                      <th className="p-3 text-left w-[25%]">Ghi Chú</th>
                      <th className="p-3 text-left w-[10%]">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const searchQuery = (searchQueries[index] || '').toLowerCase();
                      const filteredItems = itemMasters.filter(
                        (im) =>
                          im.itemCode?.toLowerCase().includes(searchQuery) ||
                          im.itemName?.toLowerCase().includes(searchQuery)
                      );

                      return (
                        <tr key={index} className="border-t hover:bg-slate-50">
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
                                  type="button"
                                >
                                  {item.itemMasterId > 0
                                    ? `${item.itemCode} - ${item.itemName}`
                                    : itemsLoading
                                    ? 'Đang tải...'
                                    : itemMasters.length === 0
                                    ? 'Không có dữ liệu'
                                    : 'Chọn vật tư'}
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
                                    className="border-0 focus-visible:ring-0"
                                  />
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                  {filteredItems.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                      Không tìm thấy vật tư
                                    </div>
                                  ) : (
                                    filteredItems
                                      .filter((im) => im && im.id !== undefined && im.id !== null)
                                      .map((im, itemIndex) => {
                                        const itemId = Number(im.id);
                                        if (!itemId || isNaN(itemId)) {
                                          return null;
                                        }
                                        return (
                                          <div
                                            key={im.id || `item-${index}-${itemIndex}`}
                                            className="flex items-center px-3 py-2 hover:bg-slate-100 cursor-pointer"
                                            onClick={() => handleItemSelect(im, index)}
                                          >
                                            <Check
                                              className={cn(
                                                'mr-2 h-4 w-4',
                                                item.itemMasterId === itemId ? 'opacity-100' : 'opacity-0'
                                              )}
                                            />
                                            <div className="flex-1">
                                              <div className="text-sm font-medium">
                                                {im.itemCode} - {im.itemName}
                                              </div>
                                              {im.currentStock !== undefined && (
                                                <div className="text-xs text-gray-500">
                                                  Tồn kho: {im.currentStock} {im.unitOfMeasure}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || ''}
                              onChange={(e) => updateItemField(index, 'quantity', Number(e.target.value) || 0)}
                              placeholder="0"
                              required
                              className="w-full"
                            />
                          </td>
                          <td className="p-3">
                            {unitLoading[index] ? (
                              <div className="text-sm text-gray-500">Đang tải...</div>
                            ) : item.unitId > 0 ? (
                              <div className="text-sm font-medium text-slate-700">
                                {item.unitName}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">Chưa chọn</div>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updateItemField(index, 'notes', e.target.value)}
                              placeholder="Ghi chú..."
                              className="w-full"
                            />
                          </td>
                          <td className="p-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-blue-800">
              <div className="font-medium mb-1">Lưu ý:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Hệ thống tự động áp dụng FEFO (xuất hàng gần hết hạn trước)</li>
                <li>Tự động xé lẻ từ đơn vị lớn khi thiếu hàng lẻ</li>
                <li>Phân bổ từ nhiều lô nếu cần thiết</li>
                {exportType === 'USAGE' && (
                  <li className="text-orange-600 font-medium">Không cho phép xuất hàng hết hạn (trừ khi bật "Cho phép xuất hàng hết hạn")</li>
                )}
                {exportType === 'DISPOSAL' && (
                  <li className="text-orange-600 font-medium">Cho phép xuất hàng hết hạn (tự động bật)</li>
                )}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang xử lý...' : 'Tạo Phiếu Xuất'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

