'use client';

/**
 * Export Transaction Form
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
import { Check, ChevronsUpDown, Search, Plus, Trash2, Calendar, AlertCircle, Box } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSnowflake, faBoxes } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DateInput } from '@/components/ui/date-input';
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
  availableUnits?: ItemUnitResponse[]; // Danh sách units có sẵn cho item này
}

interface ExportTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

export default function ExportTransactionForm({
  isOpen,
  onClose,
  warehouseType: initialWarehouseType,
}: ExportTransactionFormProps) {
  const queryClient = useQueryClient();

  // Form state
  const [selectedWarehouseType, setSelectedWarehouseType] = useState<'COLD' | 'NORMAL'>(
    initialWarehouseType || 'NORMAL'
  );
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [exportType, setExportType] = useState<ExportType>('USAGE');
  // referenceCode removed - no longer needed per BE API changes
  // departmentName removed - no longer needed per BE API changes
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
  const [unitCache, setUnitCache] = useState<Record<number, ItemUnitResponse[]>>({}); // Cache danh sách units
  const [unitLoading, setUnitLoading] = useState<Record<number, boolean>>({});

  // Fetch Item Masters - Using getSummary for better compatibility
  const { data: itemMastersResponse, isLoading: itemsLoading } = useQuery({
    queryKey: ['itemMasters', selectedWarehouseType],
    queryFn: async () => {
      try {
        // Use getSummary which returns paginated response with proper structure
        const result = await inventoryService.getSummary({
          warehouseType: selectedWarehouseType,
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
        console.error(' Failed to fetch item masters:', error);
        toast.error('Không thể tải danh sách vật tư', {
          description: error.response?.data?.message || 'Vui lòng thử lại',
        });
        return [];
      }
    },
    enabled: isOpen && !!selectedWarehouseType,
  });

  const itemMasters: ItemMasterV1[] = itemMastersResponse || [];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedWarehouseType(initialWarehouseType || 'NORMAL');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setExportType('USAGE');
      // referenceCode and departmentName removed
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
          availableUnits: undefined,
        },
      ]);
      setOpenPopovers({});
      setSearchQueries({});
      setUnitCache({});
      setUnitLoading({});
    }
  }, [isOpen]);

  // Fetch units for item (API 6.11)
  const fetchItemUnits = async (itemMasterId: number, rowIndex: number, item?: ItemMasterV1) => {
    if (!itemMasterId || itemMasterId <= 0) return;

    // Check cache
    if (unitCache[itemMasterId] && unitCache[itemMasterId].length > 0) {
      const cachedUnits = unitCache[itemMasterId];
      const baseUnit = cachedUnits.find(u => u.isBaseUnit) || cachedUnits[0];
      setItems((prev) => {
        const updated = [...prev];
        updated[rowIndex] = {
          ...updated[rowIndex],
          unitId: baseUnit.unitId,
          unitName: baseUnit.unitName,
          availableUnits: cachedUnits,
        };
        return updated;
      });
      return;
    }

    try {
      setUnitLoading((prev) => ({ ...prev, [rowIndex]: true }));

      // Try to get units using API 6.11
      const unitsResponse = await itemUnitService.getItemUnits(itemMasterId, 'active');

      if (!unitsResponse || !unitsResponse.units || unitsResponse.units.length === 0) {
        // Fallback: Try getBaseUnit
        try {
          const baseUnit = await itemUnitService.getBaseUnit(itemMasterId);
          if (baseUnit && baseUnit.unitId) {
            const units = [baseUnit];
            setUnitCache((prev) => ({ ...prev, [itemMasterId]: units }));
            setItems((prev) => {
              const updated = [...prev];
              updated[rowIndex] = {
                ...updated[rowIndex],
                unitId: baseUnit.unitId,
                unitName: baseUnit.unitName,
                availableUnits: units,
              };
              return updated;
            });
            return;
          }
        } catch (baseUnitError) {
          console.warn(' Both getItemUnits and getBaseUnit failed, BE will auto-create unit');
        }

        // If both fail, BE will auto-create base unit from unitOfMeasure
        const fallbackUnitName = item?.unitOfMeasure || 'Cái';
        const fallbackUnit: ItemUnitResponse = {
          unitId: 0, // Will be set by BE
          unitName: fallbackUnitName,
          conversionRate: 1,
          isBaseUnit: true,
          displayOrder: 1,
        };

        setItems((prev) => {
          const updated = [...prev];
          updated[rowIndex] = {
            ...updated[rowIndex],
            unitId: 0, // BE will auto-create and use correct unitId
            unitName: fallbackUnitName,
            availableUnits: [fallbackUnit],
          };
          return updated;
        });

        toast.warning('Chưa có đơn vị cho vật tư này', {
          description: `Hệ thống sẽ tự động tạo đơn vị cơ sở "${fallbackUnitName}" khi bạn xuất kho.`,
          duration: 5000,
        });
        return;
      }

      // Cache the units
      const units = unitsResponse.units.map(u => ({
        unitId: u.unitId,
        unitName: u.unitName,
        conversionRate: u.conversionRate,
        isBaseUnit: u.isBaseUnit,
        displayOrder: u.displayOrder,
        isActive: u.isActive,
        description: u.description,
      }));
      setUnitCache((prev) => ({ ...prev, [itemMasterId]: units }));

      // Set default to base unit (or first unit if no base unit found)
      const baseUnit = units.find(u => u.isBaseUnit) || units[0];

      // Update item with base unit and available units
      setItems((prev) => {
        const updated = [...prev];
        updated[rowIndex] = {
          ...updated[rowIndex],
          unitId: baseUnit.unitId,
          unitName: baseUnit.unitName,
          availableUnits: units,
        };
        return updated;
      });
    } catch (error: any) {
      console.error(' Failed to fetch units:', error);

      // Fallback: Try getBaseUnit
      try {
        const baseUnit = await itemUnitService.getBaseUnit(itemMasterId);
        if (baseUnit && baseUnit.unitId) {
          const units = [baseUnit];
          setUnitCache((prev) => ({ ...prev, [itemMasterId]: units }));
          setItems((prev) => {
            const updated = [...prev];
            updated[rowIndex] = {
              ...updated[rowIndex],
              unitId: baseUnit.unitId,
              unitName: baseUnit.unitName,
              availableUnits: units,
            };
            return updated;
          });
          return;
        }
      } catch (baseUnitError) {
        console.warn(' getBaseUnit also failed');
      }

      // Final fallback: BE will auto-create
      const fallbackUnitName = item?.unitOfMeasure || 'Cái';
      toast.warning('Không thể tải đơn vị', {
        description: `Hệ thống sẽ tự động tạo đơn vị "${fallbackUnitName}" khi xuất kho.`,
        duration: 5000,
      });

      setItems((prev) => {
        const updated = [...prev];
        updated[rowIndex] = {
          ...updated[rowIndex],
          unitId: 0, // BE will auto-create
          unitName: fallbackUnitName,
          availableUnits: [],
        };
        return updated;
      });
    } finally {
      setUnitLoading((prev) => ({ ...prev, [rowIndex]: false }));
    }
  };

  // Handle item selection
  const handleItemSelect = async (item: ItemMasterV1, rowIndex: number) => {
    // Check if item has valid id
    if (!item || item.id === undefined || item.id === null) {
      console.error(' Invalid item:', item);
      toast.error('Lỗi: Không thể xác định ID vật tư', {
        description: 'Vui lòng thử chọn lại vật tư khác',
      });
      return;
    }

    const itemId = Number(item.id);
    if (!itemId || isNaN(itemId) || itemId <= 0) {
      console.error(' Invalid itemId:', item.id, 'for item:', item);
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

    // Fetch units (pass item for fallback to unitOfMeasure)
    await fetchItemUnits(itemId, rowIndex, item);

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
        availableUnits: undefined,
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
      // Note: Inventory is NOT updated when creating transaction (only when approved)
      // So we only invalidate transaction queries, not inventory queries
      queryClient.invalidateQueries({ queryKey: ['storageTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });

      toast.success('Xuất kho thành công!', {
        description: `Mã phiếu: ${response.transactionCode}${response.totalValue ? ` | Tổng giá trị: ${response.totalValue.toLocaleString('vi-VN')} VNĐ` : ''} | Trạng thái: ${response.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' : response.status}`,
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
    // Note: BE sẽ auto-create base unit nếu unitId = 0 hoặc không tìm thấy
    // Nhưng theo BE validation, unitId phải là @Positive, nên FE cần đảm bảo unitId > 0
    const validItems = items.filter((item) => {
      // If unitId is 0, it means BE will auto-create, but BE validation requires @Positive
      // So we need to ensure unitId > 0 before submit
      if (item.unitId === 0) {
        toast.error(`Vật tư "${item.itemName}" chưa có đơn vị. Vui lòng đợi hệ thống tải đơn vị hoặc chọn vật tư khác.`);
        return false;
      }

      return (
        item.itemMasterId > 0 &&
        item.unitId > 0 && // Must be positive (BE validation @Positive)
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
      // referenceCode removed - no longer in BE API
      // departmentName removed - no longer in BE API
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
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Box className="h-5 w-5" />
            Phiếu xuất kho {selectedWarehouseType === 'COLD' ? (
              <>
                <FontAwesomeIcon icon={faSnowflake} className="mr-1" />
                (Kho lạnh)
              </>
            ) : '(Kho thường)'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tạo phiếu xuất kho mới với FEFO, auto-unpacking, và tracking tài chính
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouseType" className="text-sm font-medium mb-2 block">
                Loại kho <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedWarehouseType}
                onValueChange={(value: 'COLD' | 'NORMAL') => {
                  setSelectedWarehouseType(value);
                  // Reset items when warehouse type changes
                  setItems([
                    {
                      itemMasterId: 0,
                      itemCode: '',
                      itemName: '',
                      quantity: 1,
                      unitId: 0,
                      unitName: '',
                      notes: '',
                      availableUnits: undefined,
                    },
                  ]);
                  setOpenPopovers({});
                  setSearchQueries({});
                  setUnitCache({});
                  setUnitLoading({});
                }}
                required
              >
                <SelectTrigger id="warehouseType">
                  <SelectValue placeholder="Chọn loại kho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faBoxes} />
                      Kho thường
                    </div>
                  </SelectItem>
                  <SelectItem value="COLD">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faSnowflake} />
                      Kho lạnh
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionDate" className="text-sm font-medium mb-2 block">
                Ngày xuất kho <span className="text-red-500">*</span>
              </Label>
              <DateInput
                id="transactionDate"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exportType" className="text-sm font-medium mb-2 block">
                Loại xuất kho <span className="text-red-500">*</span>
              </Label>
              <Select value={exportType} onValueChange={(value: ExportType) => setExportType(value)}>
                <SelectTrigger id="exportType">
                  <SelectValue placeholder="Chọn loại xuất kho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USAGE"> Xuất Dùng (USAGE)</SelectItem>
                  <SelectItem value="DISPOSAL"> Xuất Hủy (DISPOSAL)</SelectItem>
                  <SelectItem value="RETURN">↩ Trả nhà cung cấp (RETURN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* referenceCode and departmentName fields removed per BE API changes */}

            <div className="space-y-2">
              <Label htmlFor="requestedBy" className="text-sm font-medium mb-2 block">
                Người yêu cầu
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
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
              Ghi chú
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Danh sách vật tư <span className="text-red-500">*</span>
              </Label>
              <Button type="button" size="sm" onClick={handleAddItem} className="gap-2 bg-purple-600 hover:bg-purple-700">
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
                      <th className="p-3 text-left w-[30%]">Vật tư <span className="text-red-500">*</span></th>
                      <th className="p-3 text-left w-[15%]">Số lượng <span className="text-red-500">*</span></th>
                      <th className="p-3 text-left w-[15%]">Đơn vị <span className="text-red-500">*</span></th>
                      <th className="p-3 text-left w-[25%]">Ghi chú</th>
                      <th className="p-3 text-center w-[10%]">Hành động</th>
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
                            ) : item.unitId > 0 && item.unitName ? (
                              <div className="text-sm font-medium text-slate-700">
                                {item.unitName}
                              </div>
                            ) : item.itemMasterId > 0 ? (
                              <div className="text-sm text-gray-400">Chưa có đơn vị</div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
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
              <div className="font-medium mb-1">Lưu ý!</div>
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
            <Button type="submit" disabled={mutation.isPending} className="bg-purple-600 hover:bg-purple-700">
              {mutation.isPending ? 'Đang xử lý...' : 'Tạo phiếu xuất'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
