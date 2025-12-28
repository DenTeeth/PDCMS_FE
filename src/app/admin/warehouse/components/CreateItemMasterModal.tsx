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
  // Track original units to detect deletions (for Safety Lock)
  const [originalUnits, setOriginalUnits] = useState<Map<number, any>>(new Map());
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
  const { data: categories = [], isLoading: loadingCategories, error: categoriesError } = useQuery<CategoryV1[]>({
    queryKey: ['categories'],
    queryFn: () => inventoryService.getCategories(),
    retry: 2,
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
    onError: (error: any, variables: any) => {
      // Detailed error logging in component for BE debugging
      console.group(' [WAREHOUSE MODAL] Update Item Error');
      console.error(' Item ID:', item?.id);
      console.error(' Item Code:', item?.itemCode || 'N/A');
      console.error('[WAREHOUSE] Request Variables:', JSON.stringify(variables, null, 2));
      console.error('⏰ Timestamp:', new Date().toISOString());

      // Handle Safety Lock errors (409 CONFLICT)
      if (error.response?.status === 409) {
        const conflictData = error.response.data || {};
        console.error('� [WAREHOUSE MODAL] CONFLICT (409) Detected');
        console.error('� Conflict Details:', {
          itemId: item?.id,
          itemCode: item?.itemCode || 'N/A',
          status: 409,
          message: conflictData.message || conflictData.error || 'No message',
          errorCode: conflictData.errorCode || conflictData.error || 'NO_ERROR_CODE',
          fullErrorData: JSON.stringify(conflictData, null, 2),
          fullResponse: JSON.stringify(error.response, null, 2),
          timestamp: new Date().toISOString()
        });

        // Handle different error formats from BE
        let errorMessage = 'Không thể thực hiện thay đổi này vì vật tư đã có tồn kho.';

        if (conflictData.message) {
          errorMessage = conflictData.message;
        } else if (conflictData.error) {
          // BE might return error: "error.conflict" without message
          if (conflictData.error === 'error.conflict' || conflictData.error.includes('conflict')) {
            errorMessage = 'Không thể thực hiện thay đổi này vì vật tư đã có tồn kho (Safety Lock). ' +
              'Vui lòng kiểm tra: không thể thay đổi tỷ lệ quy đổi, đơn vị cơ bản, hoặc xóa đơn vị khi còn tồn kho.';
          } else {
            errorMessage = conflictData.error;
          }
        } else if (conflictData.details) {
          errorMessage = conflictData.details;
        }

        console.groupEnd();
        toast.error(errorMessage);
      } else if (error.response?.status === 400) {
        // Handle validation errors (400 Bad Request) with specific messages
        const errorData = error.response.data || {};
        const message = errorData.message || error.message || 'Lỗi validation';

        console.error(' [WAREHOUSE MODAL] Validation Error (400):', {
          status: 400,
          message: message,
          errorCode: errorData.errorCode || 'NO_ERROR_CODE',
          fullErrorData: JSON.stringify(errorData, null, 2),
          timestamp: new Date().toISOString()
        });

        // Map BE error messages to user-friendly Vietnamese messages
        let userMessage = message;
        if (message.includes('Unit name cannot be null') || message.includes('Unit name cannot be empty')) {
          userMessage = 'Tên đơn vị không được để trống';
        } else if (message.includes('isBaseUnit flag is required')) {
          userMessage = 'Phải chỉ định đơn vị cơ bản cho tất cả đơn vị';
        } else if (message.includes('Conversion rate must be >= 1')) {
          userMessage = 'Tỷ lệ quy đổi phải lớn hơn hoặc bằng 1';
        } else if (message.includes('isActive flag is required')) {
          userMessage = 'Phải chỉ định trạng thái hoạt động cho tất cả đơn vị';
        } else if (message.includes('duplicated') || message.includes('duplicate')) {
          userMessage = 'Tên đơn vị bị trùng lặp';
        } else if (message.includes('Exactly one base unit')) {
          userMessage = 'Phải có đúng 1 đơn vị cơ bản';
        } else if (message.includes('Safety Lock')) {
          userMessage = 'Không thể thay đổi đơn vị khi còn tồn kho. Vui lòng liên hệ quản lý.';
        } else if (message.includes('Min stock level must be less than max stock level')) {
          userMessage = 'Tồn kho tối thiểu phải nhỏ hơn tồn kho tối đa';
        }

        console.groupEnd();
        toast.error(userMessage);
      } else {
        // Log other errors
        console.error(' [WAREHOUSE MODAL] Other Error:', {
          status: error.response?.status || 'NO_STATUS',
          message: error.message || 'NO_MESSAGE',
          errorCode: error.response?.data?.errorCode || 'NO_ERROR_CODE',
          responseData: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'NO_RESPONSE_DATA',
          timestamp: new Date().toISOString()
        });

        console.groupEnd();
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
          isActive: unit.isActive !== undefined ? unit.isActive : true, // Preserve isActive from API
          isDefaultImportUnit: false,
          isDefaultExportUnit: false,
        }));
        setUnits(loadedUnits);

        // Store original units with their IDs for Safety Lock detection
        const originalMap = new Map<number, any>();
        existingUnitsData.units.forEach((unit) => {
          if (unit.unitId) {
            originalMap.set(unit.unitId, unit);
          }
        });
        setOriginalUnits(originalMap);
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
          isActive: true, //  FIX: Required field - new units are active by default
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
          isActive: true, // New units are active by default
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
      isActive: true, // New units are active by default
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

    // Check if item has stock (Safety Lock)
    const hasStock = item && (item.currentStock !== undefined && item.currentStock > 0);

    if (hasStock) {
      // Safety Lock: Use soft delete instead of hard delete
      const unitToRemove = units[index];
      // Find original unit by name to get unitId
      const originalUnit = Array.from(originalUnits.values()).find(
        (u) => u.unitName === unitToRemove.unitName
      );

      if (originalUnit && originalUnit.unitId) {
        // Soft delete: Set isActive = false instead of removing
        const newUnits = units.map((unit, i) => {
          if (i === index) {
            return { ...unit, isActive: false };
          }
          return unit;
        });
        setUnits(newUnits);
        toast.info('Vật tư đã có tồn kho. Đơn vị sẽ được vô hiệu hóa (isActive=false) thay vì xóa.');
      } else {
        // New unit (not from API), can be removed
        const newUnits = units.filter((_, i) => i !== index).map((unit, i) => ({
          ...unit,
          displayOrder: i + 1,
        }));
        setUnits(newUnits);
      }
    } else {
      // No stock: Can hard delete
      const newUnits = units.filter((_, i) => i !== index).map((unit, i) => ({
        ...unit,
        displayOrder: i + 1,
      }));
      setUnits(newUnits);
    }
  };

  const updateUnit = (index: number, field: keyof ItemUnitRequest, value: any) => {
    const newUnits = [...units];
    const unitToUpdate = newUnits[index];

    // Safety Lock: Check if item has stock
    const hasStock = item && (item.currentStock !== undefined && item.currentStock > 0);

    if (hasStock && item) {
      // Find original unit to check if it's an existing unit
      const originalUnit = Array.from(originalUnits.values()).find(
        (u) => u.unitName === unitToUpdate.unitName
      );

      if (originalUnit) {
        // Existing unit: Block dangerous changes
        if (field === 'conversionRate') {
          const numValue = Number(value);
          if (numValue !== originalUnit.conversionRate) {
            toast.error(
              `Không thể thay đổi tỷ lệ quy đổi của đơn vị "${unitToUpdate.unitName}" ` +
              `vì vật tư đã có tồn kho (Safety Lock). Tỷ lệ hiện tại: ${originalUnit.conversionRate}`
            );
            return;
          }
        }
        if (field === 'isBaseUnit') {
          if (value !== originalUnit.isBaseUnit) {
            toast.error(
              `Không thể thay đổi đơn vị cơ sở của "${unitToUpdate.unitName}" ` +
              `vì vật tư đã có tồn kho (Safety Lock).`
            );
            return;
          }
        }
      }
    }

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

  // Validation function for units (matching BE requirements)
  const validateUnitsBeforeUpdate = (unitsToValidate: ItemUnitRequest[]): void => {
    // Check if units array is provided
    if (!unitsToValidate || unitsToValidate.length === 0) {
      return; // OK - will keep existing units (for update without units field)
    }

    // Validate each unit - all required fields must be present
    unitsToValidate.forEach((unit, index) => {
      // unitName is REQUIRED - cannot be null/empty
      if (!unit.unitName || !unit.unitName.trim()) {
        throw new Error(`Đơn vị ${index + 1}: Tên đơn vị không được để trống`);
      }

      // conversionRate is REQUIRED - must be >= 1
      if (unit.conversionRate == null || unit.conversionRate < 1) {
        throw new Error(`Đơn vị ${index + 1}: Tỷ lệ quy đổi phải >= 1`);
      }

      // isBaseUnit is REQUIRED - cannot be null
      if (unit.isBaseUnit == null) {
        throw new Error(`Đơn vị ${index + 1}: Phải chỉ định đơn vị cơ bản`);
      }

      // isActive is REQUIRED - cannot be null
      if (unit.isActive == null) {
        throw new Error(`Đơn vị ${index + 1}: Phải chỉ định trạng thái hoạt động`);
      }
    });

    // Check exactly one base unit
    const baseUnitCount = unitsToValidate.filter(u => u.isBaseUnit === true).length;
    if (baseUnitCount !== 1) {
      throw new Error('Phải có đúng 1 đơn vị cơ bản');
    }

    // Base unit must have conversionRate = 1
    const baseUnit = unitsToValidate.find(u => u.isBaseUnit === true);
    if (baseUnit && baseUnit.conversionRate !== 1) {
      throw new Error('Đơn vị cơ bản phải có tỷ lệ quy đổi = 1');
    }

    // Check unique unit names (case-insensitive)
    const unitNames = unitsToValidate.map(u => u.unitName.trim().toLowerCase());
    const duplicates = unitNames.filter((name, index) =>
      unitNames.indexOf(name) !== index
    );
    if (duplicates.length > 0) {
      const uniqueDuplicates = [...new Set(duplicates)];
      throw new Error(`Tên đơn vị bị trùng: ${uniqueDuplicates.join(', ')}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
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

    // Validate units using BE-compatible validation
    try {
      validateUnitsBeforeUpdate(units);
    } catch (validationError: any) {
      toast.error(validationError.message || 'Lỗi validation đơn vị');
      return;
    }

    // Safety Lock: Check if item has stock and validate unit changes
    const hasStock = item && (item.currentStock !== undefined && item.currentStock > 0);
    if (hasStock && item) {
      // Check for dangerous changes that Safety Lock blocks
      for (const unit of units) {
        // Find original unit
        const originalUnit = Array.from(originalUnits.values()).find(
          (u) => u.unitName === unit.unitName
        );

        if (originalUnit) {
          // Existing unit: Check for blocked changes
          if (originalUnit.conversionRate !== unit.conversionRate) {
            toast.error(
              `Không thể thay đổi tỷ lệ quy đổi của đơn vị "${unit.unitName}" vì vật tư đã có tồn kho (Safety Lock). ` +
              `Tỷ lệ cũ: ${originalUnit.conversionRate}, Tỷ lệ mới: ${unit.conversionRate}`
            );
            return;
          }
          if (originalUnit.isBaseUnit !== unit.isBaseUnit) {
            toast.error(
              `Không thể thay đổi đơn vị cơ sở của "${unit.unitName}" vì vật tư đã có tồn kho (Safety Lock).`
            );
            return;
          }
        }
      }

      // Check for hard-deleted units (should be soft-deleted instead)
      const currentUnitNames = new Set(units.filter(u => u.isActive !== false).map(u => u.unitName.trim()));
      const originalUnitNames = new Set(Array.from(originalUnits.values()).map(u => u.unitName));

      for (const originalName of originalUnitNames) {
        if (!currentUnitNames.has(originalName)) {
          // Unit was removed but should be soft-deleted
          toast.error(
            `Không thể xóa đơn vị "${originalName}" vì vật tư đã có tồn kho. ` +
            `Vui lòng vô hiệu hóa đơn vị (isActive=false) thay vì xóa.`
          );
          return;
        }
      }
    }

    // Prepare request data
    const requestData: CreateItemMasterRequest | UpdateItemMasterRequest = {
      ...formData,
    };

    // Handle units field according to BE requirements:
    // - If creating: always include units
    // - If updating: include units only if we want to update them
    //   (If units is undefined, BE will keep existing units)
    if (!item) {
      // Creating: always include units
      requestData.units = units
        .filter((unit) => unit.isActive !== false)
        .map((unit) => ({
          ...unit,
          unitName: unit.unitName.trim(),
          isActive: unit.isActive !== undefined ? unit.isActive : true,
        }));
    } else {
      // Updating: include units only if we want to update them
      // Map units with all required fields and include unitId for existing units
      requestData.units = units
        .filter((unit) => {
          // When updating with stock, include all units (even inactive ones) so BE can track changes
          if (hasStock) {
            return true;
          }
          // When no stock: only include active units
          return unit.isActive !== false;
        })
        .map((unit) => {
          // Find original unit to get unitId - try multiple matching strategies
          let originalUnit = Array.from(originalUnits.values()).find(
            (u) => u.unitName?.toLowerCase().trim() === unit.unitName?.toLowerCase().trim()
          );

          // If not found by name, try to find by index or other means
          if (!originalUnit && existingUnitsData?.units) {
            // Try to match by position/index if names don't match
            const unitIndex = units.indexOf(unit);
            if (unitIndex < existingUnitsData.units.length) {
              originalUnit = existingUnitsData.units[unitIndex];
            }
          }

          const unitData: any = {
            unitName: unit.unitName.trim(),
            conversionRate: unit.conversionRate,
            isBaseUnit: unit.isBaseUnit,
            isActive: unit.isActive !== undefined ? unit.isActive : true,
            displayOrder: unit.displayOrder,
            isDefaultImportUnit: unit.isDefaultImportUnit || false,
            isDefaultExportUnit: unit.isDefaultExportUnit || false,
          };

          // Include unitId if we found the original unit
          if (originalUnit?.unitId) {
            unitData.unitId = originalUnit.unitId;
          }

          return unitData;
        });

      // Log units mapping for debugging
      console.log('[WAREHOUSE] Units mapping for update:', {
        originalUnitsCount: originalUnits.size,
        requestUnitsCount: requestData.units.length,
        unitsWithId: requestData.units.filter((u: any) => u.unitId).length,
        unitsWithoutId: requestData.units.filter((u: any) => !u.unitId).length,
        units: requestData.units.map((u: any) => ({
          unitId: u.unitId || 'NEW',
          unitName: u.unitName,
          isBaseUnit: u.isBaseUnit
        }))
      });
    }

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
            {item ? 'Chỉnh sửa vật tư' : 'Thêm vật tư mới'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {item ? 'Form chỉnh sửa thông tin vật tư' : 'Form thêm vật tư mới vào hệ thống'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mã & Tên */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemCode" className="text-sm font-medium mb-2 block">
                Mã vật tư <span className="text-red-500">*</span>
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
              <Label htmlFor="itemName" className="text-sm font-medium mb-2 block">
                Tên vật tư <span className="text-red-500">*</span>
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
            <Label htmlFor="category_id" className="text-sm font-medium mb-2 block">
              Nhóm vật tư <span className="text-red-500">*</span>
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
                {loadingCategories ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Đang tải danh mục...
                  </div>
                ) : categoriesError ? (
                  <div className="px-3 py-2 text-sm text-red-500">
                    Lỗi tải danh mục: {categoriesError instanceof Error ? categoriesError.message : 'Unknown error'}
                  </div>
                ) : categories.length === 0 ? (
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
                Đơn vị tính <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addUnit}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Thêm đơn vị
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
                      <Label className="text-xs text-gray-600">Tên đơn vị</Label>
                      <Input
                        value={unit.unitName}
                        onChange={(e) => updateUnit(index, 'unitName', e.target.value)}
                        placeholder="VD: Hộp, Vỉ, Viên"
                        list="unit-names-list"
                        required
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs text-gray-600">Tỷ lệ quy đổi</Label>
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
                      <Label className="text-xs text-gray-600">Thứ tự hiển thị</Label>
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
              Loại kho <span className="text-red-500">*</span>
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
                  Kho thường
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-blue-50 cursor-pointer">
                <RadioGroupItem value="COLD" id="cold" />
                <Label htmlFor="cold" className="cursor-pointer flex items-center gap-2">
                  <Snowflake className="h-4 w-4 text-blue-600" />
                  Kho lạnh
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Min & Max Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_stock_level" className="text-sm font-medium mb-2 block">
                Tồn kho tối thiểu
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
              <Label htmlFor="max_stock_level" className="text-sm font-medium mb-2 block">
                Tồn kho tối đa
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
              Đây là <strong>dụng cụ</strong> (không cần HSD khi nhập kho lạnh)
            </Label>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
              Ghi chú
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
              {mutation.isPending ? 'Đang lưu...' : item ? 'Cập nhật' : 'Thêm mới'}
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
