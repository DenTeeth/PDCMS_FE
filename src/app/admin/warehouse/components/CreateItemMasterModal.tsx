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
import { inventoryService, type ItemMasterV1, type CreateItemMasterRequest, type CategoryV1 } from '@/services/inventoryService';
import { Package, Snowflake, Box } from 'lucide-react';

interface CreateItemMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ItemMasterV1 | null;
}

export default function CreateItemMasterModal({
  isOpen,
  onClose,
  item,
}: CreateItemMasterModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateItemMasterRequest>({
    itemCode: '',
    itemName: '',
    unitOfMeasure: 'Cái',
    warehouseType: 'NORMAL',
    categoryId: 0,
    minStockLevel: 10,
    maxStockLevel: 100,
    isTool: false,
    notes: '',
  });

  // Fetch categories - API V1
  const { data: categories = [] } = useQuery<CategoryV1[]>({
    queryKey: ['categories'],
    queryFn: () => inventoryService.getCategories(),
  });

  // Create/Update mutation - API V1
  const mutation = useMutation({
    mutationFn: (data: CreateItemMasterRequest) =>
      item
        ? inventoryService.update(item.id, data)
        : inventoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      toast.success(item ? 'Cập nhật vật tư thành công!' : 'Thêm vật tư mới thành công!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          itemCode: item.itemCode,
          itemName: item.itemName,
          unitOfMeasure: item.unitOfMeasure,
          warehouseType: item.warehouseType,
          categoryId: item.categoryId || 0,
          minStockLevel: item.minStockLevel,
          maxStockLevel: item.maxStockLevel,
          isTool: item.isTool,
          notes: item.notes || '',
        });
      } else {
        setFormData({
          itemCode: '',
          itemName: '',
          unitOfMeasure: 'Cái',
          warehouseType: 'NORMAL',
          categoryId: categories.length > 0 ? categories[0].id : 0,
          minStockLevel: 10,
          maxStockLevel: 100,
          isTool: false,
          notes: '',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item]); // ✅ Removed categories from deps to prevent infinite loop

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
    if (formData.minStockLevel < 0) {
      toast.error('Tồn kho tối thiểu phải >= 0!');
      return;
    }
    if (formData.maxStockLevel < formData.minStockLevel) {
      toast.error('Tồn kho tối đa phải >= Tối thiểu!');
      return;
    }

    mutation.mutate(formData);
  };

  const unitOptions = ['Cái', 'Hộp', 'Lọ', 'Viên', 'Gói', 'Bộ', 'Chai'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category_id" className="text-sm font-medium">
                Nhóm Vật Tư <span className="text-red-500">*</span>
              </Label>
              <Select
                value={String(formData.categoryId)}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat, idx) => (
                    <SelectItem 
                      key={`cat-${cat.id}-${idx}`} 
                      value={String(cat.id || 0)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unit_of_measure" className="text-sm font-medium">
                Đơn Vị Tính <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.unitOfMeasure}
                onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <div key="normal-warehouse" className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50 cursor-pointer">
                <RadioGroupItem value="NORMAL" id="normal" />
                <Label htmlFor="normal" className="cursor-pointer flex items-center gap-2">
                  <Box className="h-4 w-4 text-slate-600" />
                  Kho Thường
                </Label>
              </div>
              <div key="cold-warehouse" className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-blue-50 cursor-pointer">
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
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
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
