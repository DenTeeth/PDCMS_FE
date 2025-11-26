'use client';

/**
 * Import Transaction Form - NEW VERSION
 * Simplified and more reliable implementation
 * 
 * Features:
 * - Invoice number tracking (unique)
 * - Batch handling (auto create/update)
 * - Unit conversion support
 * - Purchase price tracking
 * - Expiry date validation
 * - Financial summary
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Search, Plus, Trash2, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SupplierSummaryResponse } from '@/types/supplier';
import { CreateImportTransactionDto, CreateImportItemDto, ItemUnitResponse } from '@/types/warehouse';
import inventoryService, { type ItemMasterV1, type InventorySummary } from '@/services/inventoryService';
import supplierService from '@/services/supplierService';
import itemUnitService from '@/services/itemUnitService';

interface ImportItem {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  lotNumber: string;
  expiryDate: string;
  quantity: number;
  unitId: number;
  unitName: string;
  purchasePrice: number;
  binLocation: string;
  notes: string;
}

interface ImportTransactionFormNewProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseType?: 'COLD' | 'NORMAL';
}

export default function ImportTransactionFormNew({
  isOpen,
  onClose,
  warehouseType,
}: ImportTransactionFormNewProps) {
  const queryClient = useQueryClient();

  // Form state
  const [supplierId, setSupplierId] = useState<number>(0);
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<ImportItem[]>([
    {
      itemMasterId: 0,
      itemCode: '',
      itemName: '',
      lotNumber: '',
      expiryDate: '',
      quantity: 1,
      unitId: 0,
      unitName: '',
      purchasePrice: 0,
      binLocation: '',
      notes: '',
    },
  ]);

  // UI state
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [unitCache, setUnitCache] = useState<Record<number, ItemUnitResponse>>({});
  const [unitLoading, setUnitLoading] = useState<Record<number, boolean>>({});

  // Fetch Suppliers
  const { data: suppliersResponse } = useQuery({
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
        toast.error('Không thể tải danh sách nhà cung cấp');
        return null;
      }
    },
    enabled: isOpen,
  });

  const suppliers: SupplierSummaryResponse[] = suppliersResponse?.content ?? [];

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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSupplierId(0);
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setInvoiceNumber('');
      setExpectedDeliveryDate('');
      setNotes('');
      setItems([
        {
          itemMasterId: 0,
          itemCode: '',
          itemName: '',
          lotNumber: '',
          expiryDate: '',
          quantity: 1,
          unitId: 0,
          unitName: '',
          purchasePrice: 0,
          binLocation: '',
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

    // Check cache
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
        lotNumber: '',
        expiryDate: '',
        quantity: 1,
        unitId: 0,
        unitName: '',
        purchasePrice: 0,
        binLocation: '',
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
  const updateItemField = (index: number, field: keyof ImportItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Calculate total value
  const totalValue = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.purchasePrice) || 0;
    return sum + qty * price;
  }, 0);

  // Create Import Mutation
  const mutation = useMutation({
    mutationFn: (data: CreateImportTransactionDto) =>
      inventoryService.createImportTransaction(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['storageTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      
      toast.success('Nhập kho thành công!', {
        description: `Mã phiếu: ${response.transactionCode} | Tổng giá trị: ${response.totalValue.toLocaleString('vi-VN')} VNĐ`,
        duration: 5000,
      });

      if (response.warnings && response.warnings.length > 0) {
        response.warnings.forEach((warning) => {
          toast.warning(warning.message, {
            description: `Vật tư: ${warning.itemCode}`,
          });
        });
      }

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
      } else {
        toast.error('Lỗi nhập kho', {
          description: errorMessage,
        });
      }
    },
  });

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!supplierId || supplierId <= 0) {
      toast.error('Vui lòng chọn nhà cung cấp');
      return;
    }

    if (!invoiceNumber.trim()) {
      toast.error('Vui lòng nhập số hóa đơn');
      return;
    }

    // Validate items
    const validItems = items.filter((item) => {
      return (
        item.itemMasterId > 0 &&
        item.unitId > 0 &&
        item.lotNumber.trim() !== '' &&
        item.expiryDate !== '' &&
        item.quantity > 0 &&
        item.purchasePrice > 0
      );
    });

    if (validItems.length === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin cho ít nhất 1 vật tư');
      return;
    }

    if (validItems.length !== items.length) {
      toast.warning(`Có ${items.length - validItems.length} dòng chưa hợp lệ, chỉ gửi ${validItems.length} dòng hợp lệ`);
    }

    // Validate expiry dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const item of validItems) {
      const expiryDate = new Date(item.expiryDate);
      if (expiryDate <= today) {
        toast.error(`Hạn sử dụng của vật tư "${item.itemName}" phải sau ngày hiện tại`);
        return;
      }
    }

    // Prepare payload
    const payload: CreateImportTransactionDto = {
      supplierId,
      transactionDate: `${transactionDate}T00:00:00`,
      invoiceNumber: invoiceNumber.trim(),
      expectedDeliveryDate: expectedDeliveryDate ? expectedDeliveryDate : undefined,
      notes: notes.trim() || undefined,
      items: validItems.map((item) => ({
        itemMasterId: Number(item.itemMasterId),
        lotNumber: item.lotNumber.trim(),
        expiryDate: item.expiryDate,
        quantity: Number(item.quantity),
        unitId: Number(item.unitId),
        purchasePrice: Number(item.purchasePrice),
        binLocation: item.binLocation.trim() || undefined,
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
            Phiếu Nhập Kho {warehouseType === 'COLD' ? '🧊 (Kho Lạnh)' : '📦 (Kho Thường)'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tạo phiếu nhập kho mới với tracking hóa đơn, giá nhập, xử lý lô hàng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplierId" className="text-sm font-medium">
                Nhà Cung Cấp <span className="text-red-500">*</span>
              </Label>
              <select
                id="supplierId"
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value={0}>-- Chọn nhà cung cấp --</option>
                {suppliers.map((sup) => (
                  <option key={sup.supplierId} value={sup.supplierId}>
                    {sup.supplierName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="transactionDate" className="text-sm font-medium">
                Ngày Nhập <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="transactionDate"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="pl-10"
                  required
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <Label htmlFor="invoiceNumber" className="text-sm font-medium">
                Số Hóa Đơn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2025-001"
                required
              />
            </div>

            <div>
              <Label htmlFor="expectedDeliveryDate" className="text-sm font-medium">
                Ngày Dự Kiến Giao
              </Label>
              <div className="relative">
                <Input
                  id="expectedDeliveryDate"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
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
                                    className="h-9 border-0 focus-visible:ring-0"
                                  />
                                </div>
                                <div className="max-h-[300px] overflow-auto">
                                  {itemsLoading ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                      Đang tải...
                                    </div>
                                  ) : filteredItems.length === 0 ? (
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
                                            key={`item-${index}-${itemId}-${itemIndex}`}
                                            className="flex items-center px-4 py-2 hover:bg-slate-100 cursor-pointer"
                                            onClick={() => handleItemSelect(im, index)}
                                          >
                                            <Check
                                              className={cn(
                                                'mr-2 h-4 w-4',
                                                item.itemMasterId === itemId ? 'opacity-100' : 'opacity-0'
                                              )}
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium">
                                                {im.itemCode || 'N/A'} - {im.itemName || 'N/A'}
                                              </div>
                                              {im.unitOfMeasure && (
                                                <div className="text-xs text-gray-500">
                                                  Đơn vị: {im.unitOfMeasure}
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
                            {unitLoading[index] && (
                              <p className="text-xs text-blue-500 mt-1">Đang tải đơn vị...</p>
                            )}
                            {item.unitName && !unitLoading[index] && (
                              <p className="text-xs text-gray-500 mt-1">Đơn vị: {item.unitName}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              value={item.lotNumber}
                              onChange={(e) => updateItemField(index, 'lotNumber', e.target.value)}
                              placeholder="LOT-2024-001"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="1"
                              max="1000000"
                              value={item.quantity}
                              onChange={(e) => updateItemField(index, 'quantity', Number(e.target.value))}
                              placeholder="1"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.purchasePrice}
                              onChange={(e) => updateItemField(index, 'purchasePrice', Number(e.target.value))}
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <Input
                                type="date"
                                value={item.expiryDate}
                                onChange={(e) => updateItemField(index, 'expiryDate', e.target.value)}
                                className="pl-10"
                              />
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                          </td>
                          <td className="p-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700"
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

          {/* Financial Summary */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <Label className="text-sm font-semibold text-emerald-900">
                  Tổng Giá Trị Phiếu Nhập
                </Label>
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú (nếu có)"
              rows={3}
            />
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1 text-sm text-blue-900">
                <p className="font-semibold mb-2">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Số hóa đơn phải là duy nhất (không trùng với phiếu nhập khác)</li>
                  <li>Cùng số lô phải có cùng hạn sử dụng</li>
                  <li>Hệ thống tự động tạo lô mới hoặc cập nhật lô cũ dựa trên số lô</li>
                  <li>Đơn giá được dùng để tính COGS (Cost of Goods Sold)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : 'Lưu Phiếu Nhập'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

