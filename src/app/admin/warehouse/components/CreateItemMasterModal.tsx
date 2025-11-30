'use client';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { inventoryService, type ItemMasterV1, type CreateItemMasterRequest, type UpdateItemMasterRequest, type ItemUnitRequest, type CategoryV1 } from '@/services/inventoryService';
import { itemUnitService } from '@/services/itemUnitService';
import { Package, Snowflake, Box, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface CreateItemMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ItemMasterV1 | null;
}

// Common unit names for autocomplete suggestions
const COMMON_UNIT_NAMES = [
  'Viên',      // Pill/Tablet (base unit)
  'Vỉ',        // Blister
  'Hộp',       // Box
  'Lọ',        // Bottle/Jar
  'Gói',       // Package
  'Tuýp',      // Tube
  'Cái'       // Piece
];

export default function CreateItemMasterModal({
  isOpen,
  onClose,
  item,
}: CreateItemMasterModalProps) {
  const queryClient = useQueryClient();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [units, setUnits] = useState<ItemUnitRequest[]>([]);
  const [formData, setFormData] = useState<CreateItemMasterRequest>({
    itemCode: '',
    itemName: '',
    unitOfMeasure: 'Cái', // Legacy field - will be mapped to units array
    warehouseType: 'NORMAL',
    categoryId: 0,
    minStockLevel: 10,
    maxStockLevel: 100,
    isTool: false,
    notes: '',
    units: [], // Required for API 6.9
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<CategoryV1[]>({
    queryKey: ['categories'],
    queryFn: () => inventoryService.getCategories(),
  });

  // Fetch existing units when editing
  const { data: existingUnitsData, isLoading: loadingUnits } = useQuery({
    queryKey: ['itemUnits', item?.id],
    queryFn: () => itemUnitService.getItemUnits(item!.id, 'all'),
    enabled: !!item && isOpen,
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: CreateItemMasterRequest | UpdateItemMasterRequest) =>
      item
        ? inventoryService.update(item.id, data as UpdateItemMasterRequest)
        : inventoryService.create(data as CreateItemMasterRequest),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['itemUnits', item?.id] });
      
      // Show Safety Lock warning if applicable
      if (item && response?.safetyLockApplied) {
        toast.warning('Một số thay đổi đã bị chặn do Safety Lock (vật tư đã có tồn kho)');
      }
      
      toast.success(item ? 'Cập nhật vật tư thành công!' : 'Thêm vật tư mới thành công!');
      onClose();
    },
    onError: (error: any) => {
      // Handle Safety Lock errors (409 CONFLICT)
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.message || 
          'Không thể thực hiện thay đổi này vì vật tư đã có tồn kho. Vui lòng kiểm tra lại.';
        toast.error(errorMessage);
      } else {
        toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra!');
      }
    },
  });

  // Initialize form data and units
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      setUnits([]);
      return;
    }

    if (item) {
      // Editing mode - load existing data
      setFormData({
        itemCode: item.itemCode,
        itemName: item.itemName,
        unitOfMeasure: item.unitOfMeasure || 'Cái',
        warehouseType: item.warehouseType,
        categoryId: item.categoryId || 0,
        minStockLevel: item.minStockLevel,
        maxStockLevel: item.maxStockLevel,
        isTool: item.isTool,
        notes: item.notes || '',
        units: [], // Will be loaded from API
      });
      
      // Load existing units
      if (existingUnitsData?.units) {
        const loadedUnits: ItemUnitRequest[] = existingUnitsData.units.map((unit, index) => ({
          unitName: unit.unitName,
          conversionRate: unit.conversionRate,
          isBaseUnit: unit.isBaseUnit,
          displayOrder: unit.displayOrder || index + 1,
          isDefaultImportUnit: false,
          isDefaultExportUnit: false,
        }));
        setUnits(loadedUnits);
      }
      setHasInitialized(true);
      return;
    }

    // Create mode - initialize with default unit
    if (!hasInitialized && categories.length > 0) {
      const defaultCategoryId =
        categories[0]?.categoryId ??
        categories[0]?.id ??
        (categories[0] as any)?.category_id ??
        0;

      setFormData({
        itemCode: '',
        itemName: '',
        unitOfMeasure: 'Cái',
        warehouseType: 'NORMAL',
        categoryId: defaultCategoryId,
        minStockLevel: 10,
        maxStockLevel: 100,
        isTool: false,
        notes: '',
        units: [],
      });

      // Initialize with one base unit
      setUnits([
        {
          unitName: 'Cái',
          conversionRate: 1,
          isBaseUnit: true,
          displayOrder: 1,
          isDefaultImportUnit: true,
          isDefaultExportUnit: true,
        },
      ]);
      setHasInitialized(true);
    } else if (!hasInitialized && categories.length === 0) {
      setFormData({
        itemCode: '',
        itemName: '',
        unitOfMeasure: 'Cái',
        warehouseType: 'NORMAL',
        categoryId: 0,
        minStockLevel: 10,
        maxStockLevel: 100,
        isTool: false,
        notes: '',
        units: [],
      });

      // Initialize with one base unit
      setUnits([
        {
          unitName: 'Cái',
          conversionRate: 1,
          isBaseUnit: true,
          displayOrder: 1,
          isDefaultImportUnit: true,
          isDefaultExportUnit: true,
        },
      ]);
    }
  }, [isOpen, item, categories, hasInitialized, existingUnitsData]);

  // Update formData.units when units state changes
  useEffect(() => {
    if (units.length > 0) {
      setFormData((prev) => ({ ...prev, units }));
    }
  }, [units]);

  // Unit management functions
  const addUnit = () => {
    const newUnit: ItemUnitRequest = {
      unitName: '',
      conversionRate: 1,
      isBaseUnit: false,
      displayOrder: units.length + 1,
      isDefaultImportUnit: false,
      isDefaultExportUnit: false,
    };
    setUnits([...units, newUnit]);
  };

  const removeUnit = (index: number) => {
    if (units.length <= 1) {
      toast.error('Phải có ít nhất 1 đơn vị!');
      return;
    }
    if (units[index].isBaseUnit) {
      toast.error('Không thể xóa đơn vị cơ sở! Hãy đặt đơn vị khác làm cơ sở trước.');
      return;
    }
    const newUnits = units.filter((_, i) => i !== index).map((unit, i) => ({
      ...unit,
      displayOrder: i + 1,
    }));
    setUnits(newUnits);
  };

  const updateUnit = (index: number, field: keyof ItemUnitRequest, value: any) => {
    const newUnits = [...units];
    
    if (field === 'isBaseUnit' && value === true) {
      // Unset other base units
      newUnits.forEach((unit, i) => {
        if (i !== index) {
          unit.isBaseUnit = false;
        }
      });
      // Base unit must have conversionRate = 1
      newUnits[index].conversionRate = 1;
    } else if (field === 'conversionRate') {
      const numValue = Number(value);
      if (newUnits[index].isBaseUnit && numValue !== 1) {
        toast.error('Đơn vị cơ sở phải có tỷ lệ quy đổi = 1');
        return;
      }
      if (!newUnits[index].isBaseUnit && numValue <= 1) {
        toast.error('Đơn vị không phải cơ sở phải có tỷ lệ quy đổi > 1');
        return;
      }
    }
    
    newUnits[index] = { ...newUnits[index], [field]: value };
    setUnits(newUnits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.itemCode.trim()) {
      toast.error('Mã vật tư là bắt buộc!');
      return;
    }
    if (!formData.itemName.trim()) {
      toast.error('Tên vật tư là bắt buộc!');
      return;
    }
    if (!formData.categoryId || formData.categoryId === 0) {
      toast.error('Nhóm vật tư là bắt buộc!');
      return;
    }
    if (formData.minStockLevel < 0) {
      toast.error('Tồn kho tối thiểu phải >= 0!');
      return;
    }
    if (formData.maxStockLevel < formData.minStockLevel) {
      toast.error('Tồn kho tối đa phải >= Tối thiểu!');
      return;
    }

    // Validate units
    if (units.length === 0) {
      toast.error('Phải có ít nhất 1 đơn vị!');
      return;
    }

    const baseUnits = units.filter((u) => u.isBaseUnit);
    if (baseUnits.length === 0) {
      toast.error('Phải có ít nhất 1 đơn vị cơ sở (isBaseUnit = true)!');
      return;
    }
    if (baseUnits.length > 1) {
      toast.error('Chỉ được có 1 đơn vị cơ sở!');
      return;
    }

    // Validate unit names
    const unitNames = units.map((u) => u.unitName.trim());
    if (unitNames.some((name) => !name)) {
      toast.error('Tất cả đơn vị phải có tên!');
      return;
    }
    const uniqueNames = new Set(unitNames);
    if (uniqueNames.size !== unitNames.length) {
      toast.error('Tên đơn vị không được trùng nhau!');
      return;
    }

    // Validate conversion rates
    for (const unit of units) {
      if (unit.isBaseUnit && unit.conversionRate !== 1) {
        toast.error('Đơn vị cơ sở phải có tỷ lệ quy đổi = 1');
        return;
      }
      if (!unit.isBaseUnit && unit.conversionRate <= 1) {
        toast.error(`Đơn vị "${unit.unitName}" phải có tỷ lệ quy đổi > 1`);
        return;
      }
    }

    // Prepare request data
    const requestData: CreateItemMasterRequest | UpdateItemMasterRequest = {
      ...formData,
      units: units.map((unit) => ({
        ...unit,
        unitName: unit.unitName.trim(),
      })),
    };

    // Remove legacy unitOfMeasure if units array is provided
    if (requestData.units && requestData.units.length > 0) {
      delete (requestData as any).unitOfMeasure;
    }

    mutation.mutate(requestData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-violet-600" />
            {item ? 'Chỉnh sửa Vật Tư' : 'Thêm Vật Tư Mới'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {item ? 'Form chỉnh sửa thông tin vật tư' : 'Form thêm vật tư mới vào hệ thống'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mã & Tên */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemCode" className="text-sm font-medium">
                Mã Vật Tư <span className="text-red-500">*</span>
              </Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                placeholder="VD: VT001"
                required
                disabled={!!item} // Disable when editing
              />
            </div>

            <div>
              <Label htmlFor="itemName" className="text-sm font-medium">
                Tên Vật Tư <span className="text-red-500">*</span>
              </Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="VD: Lidocaine 2%"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category_id" className="text-sm font-medium">
              Nhóm Vật Tư <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.categoryId ? String(formData.categoryId) : undefined}
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: Number(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhóm" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Chưa có danh mục. Hãy tạo trong BE trước.
                  </div>
                ) : (
                  categories.map((cat, index) => {
                    const categoryId = cat.categoryId ?? cat.id ?? (cat as any).category_id;
                    const categoryName = cat.categoryName ?? cat.name ?? `Danh mục ${index + 1}`;
                    const optionKey = categoryId ?? `cat-${index}`;
                    const optionValue = categoryId ?? `cat-${index}`;

                    return (
                      <SelectItem key={`category-${optionKey}-${index}`} value={String(optionValue)}>
                        {categoryName}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Units Management Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Đơn Vị Tính <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addUnit}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Thêm Đơn Vị
              </Button>
            </div>

            {loadingUnits && item ? (
              <div className="text-sm text-gray-500 py-4">Đang tải đơn vị...</div>
            ) : (
              <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                {/* Datalist for unit name autocomplete */}
                <datalist id="unit-names-list">
                  {COMMON_UNIT_NAMES.map((unitName) => (
                    <option key={unitName} value={unitName} />
                  ))}
                </datalist>
                
                {units.map((unit, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-start p-3 bg-white rounded border"
                  >
                    <div className="col-span-4">
                      <Label className="text-xs text-gray-600">Tên Đơn Vị</Label>
                      <Input
                        value={unit.unitName}
                        onChange={(e) => updateUnit(index, 'unitName', e.target.value)}
                        placeholder="VD: Hộp, Vỉ, Viên"
                        list="unit-names-list"
                        required
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs text-gray-600">Tỷ Lệ Quy Đổi</Label>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={unit.conversionRate}
                        onChange={(e) => updateUnit(index, 'conversionRate', Number(e.target.value))}
                        disabled={unit.isBaseUnit}
                        required
                      />
                      {unit.isBaseUnit && (
                        <p className="text-xs text-gray-500 mt-1">Đơn vị cơ sở = 1</p>
                      )}
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs text-gray-600">Thứ Tự Hiển Thị</Label>
                      <Input
                        type="number"
                        min="1"
                        value={unit.displayOrder}
                        onChange={(e) => updateUnit(index, 'displayOrder', Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="col-span-1 flex items-center justify-center pt-6">
                      <input
                        type="checkbox"
                        checked={unit.isBaseUnit}
                        onChange={(e) => updateUnit(index, 'isBaseUnit', e.target.checked)}
                        className="rounded border-gray-300"
                        title="Đơn vị cơ sở"
                      />
                      <Label className="ml-1 text-xs cursor-pointer" title="Đơn vị cơ sở">
                        Cơ sở
                      </Label>
                    </div>

                    <div className="col-span-1 flex items-center justify-center pt-6">
                      {units.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUnit(index)}
                          className="text-red-600 hover:text-red-700"
                          disabled={unit.isBaseUnit}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {units.length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Chưa có đơn vị nào. Hãy thêm đơn vị đầu tiên.
                  </div>
                )}

                {units.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">Lưu ý về đơn vị:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Phải có đúng 1 đơn vị cơ sở (tỷ lệ quy đổi = 1)</li>
                          <li>Đơn vị không phải cơ sở phải có tỷ lệ quy đổi &gt; 1</li>
                          <li>Ví dụ: 1 Hộp = 10 Vỉ, 1 Vỉ = 10 Viên (Viên là đơn vị cơ sở)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warehouse Type (Radio) */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Loại Kho <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={formData.warehouseType}
              onValueChange={(value: 'COLD' | 'NORMAL') =>
                setFormData({ ...formData, warehouseType: value })
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50 cursor-pointer">
                <RadioGroupItem value="NORMAL" id="normal" />
                <Label htmlFor="normal" className="cursor-pointer flex items-center gap-2">
                  <Box className="h-4 w-4 text-slate-600" />
                  Kho Thường
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-blue-50 cursor-pointer">
                <RadioGroupItem value="COLD" id="cold" />
                <Label htmlFor="cold" className="cursor-pointer flex items-center gap-2">
                  <Snowflake className="h-4 w-4 text-blue-600" />
                  Kho Lạnh
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Min & Max Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_stock_level" className="text-sm font-medium">
                Tồn Kho Tối Thiểu
              </Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) =>
                  setFormData({ ...formData, minStockLevel: Number(e.target.value) })
                }
                placeholder="10"
              />
            </div>

            <div>
              <Label htmlFor="max_stock_level" className="text-sm font-medium">
                Tồn Kho Tối Đa
              </Label>
              <Input
                id="maxStockLevel"
                type="number"
                min="0"
                value={formData.maxStockLevel}
                onChange={(e) =>
                  setFormData({ ...formData, maxStockLevel: Number(e.target.value) })
                }
                placeholder="100"
              />
            </div>
          </div>

          {/* Is Tool Checkbox */}
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <input
              type="checkbox"
              id="is_tool"
              checked={formData.isTool}
              onChange={(e) => setFormData({ ...formData, isTool: e.target.checked })}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <Label htmlFor="is_tool" className="cursor-pointer text-sm text-amber-900">
              ✓ Đây là <strong>Dụng cụ</strong> (không cần HSD khi nhập kho lạnh)
            </Label>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Ghi Chú
            </Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Nhập ghi chú (nếu có)"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={mutation.isPending || loadingUnits}>
              {mutation.isPending ? 'Đang lưu...' : item ? 'Cập Nhật' : 'Thêm Mới'}
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
