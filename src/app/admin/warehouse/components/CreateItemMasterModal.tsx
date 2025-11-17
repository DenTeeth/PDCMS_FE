'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ItemMaster, CreateItemMasterDto, Category } from '@/types/warehouse';
import { itemMasterService, categoryService } from '@/services/warehouseService';
import { Package, Snowflake, Box } from 'lucide-react';

interface CreateItemMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ItemMaster | null;
}

export default function CreateItemMasterModal({
  isOpen,
  onClose,
  item,
}: CreateItemMasterModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateItemMasterDto>({
    item_code: '',
    item_name: '',
    unit_of_measure: 'Cái',
    warehouse_type: 'NORMAL',
    category_id: 0,
    min_stock_level: 10,
    max_stock_level: 100,
    is_tool: false,
    notes: '',
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: CreateItemMasterDto) =>
      item
        ? itemMasterService.update(item.item_master_id, data)
        : itemMasterService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemMasterSummary'] });
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
          item_code: item.item_code,
          item_name: item.item_name,
          unit_of_measure: item.unit_of_measure,
          warehouse_type: item.warehouse_type,
          category_id: item.category_id,
          min_stock_level: item.min_stock_level,
          max_stock_level: item.max_stock_level,
          is_tool: item.is_tool,
          notes: item.notes || '',
        });
      } else {
        setFormData({
          item_code: '',
          item_name: '',
          unit_of_measure: 'Cái',
          warehouse_type: 'NORMAL',
          category_id: categories.length > 0 && categories[0].id ? Number(categories[0].id) : 0,
          min_stock_level: 10,
          max_stock_level: 100,
          is_tool: false,
          notes: '',
        });
      }
    }
  }, [isOpen, item, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.item_code.trim()) {
      toast.error('Mã vật tư là bắt buộc!');
      return;
    }
    if (!formData.item_name.trim()) {
      toast.error('Tên vật tư là bắt buộc!');
      return;
    }
    if (formData.min_stock_level < 0) {
      toast.error('Tồn kho tối thiểu phải >= 0!');
      return;
    }
    if (formData.max_stock_level < formData.min_stock_level) {
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
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mã & Tên */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item_code" className="text-sm font-medium">
                Mã Vật Tư <span className="text-red-500">*</span>
              </Label>
              <Input
                id="item_code"
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                placeholder="VD: VT001"
                required
                disabled={!!item} // Disable when editing
              />
            </div>

            <div>
              <Label htmlFor="item_name" className="text-sm font-medium">
                Tên Vật Tư <span className="text-red-500">*</span>
              </Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
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
                value={String(formData.category_id)}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
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
                value={formData.unit_of_measure}
                onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
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
              value={formData.warehouse_type}
              onValueChange={(value: 'COLD' | 'NORMAL') =>
                setFormData({ ...formData, warehouse_type: value })
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
                id="min_stock_level"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) =>
                  setFormData({ ...formData, min_stock_level: Number(e.target.value) })
                }
                placeholder="10"
              />
            </div>

            <div>
              <Label htmlFor="max_stock_level" className="text-sm font-medium">
                Tồn Kho Tối Đa
              </Label>
              <Input
                id="max_stock_level"
                type="number"
                min="0"
                value={formData.max_stock_level}
                onChange={(e) =>
                  setFormData({ ...formData, max_stock_level: Number(e.target.value) })
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
              checked={formData.is_tool}
              onChange={(e) => setFormData({ ...formData, is_tool: e.target.checked })}
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
              value={formData.notes}
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
