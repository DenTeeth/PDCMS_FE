'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItem, CreateInventoryItemDto, UnitType, WarehouseType, Category } from '@/types/warehouse';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInventoryItemDto) => Promise<void>;
  categories: Category[];
  warehouseType: WarehouseType;
  item?: InventoryItem | null;
}

const unitOptions = Object.values(UnitType).map((unit) => ({
  value: unit,
  label: unit,
}));

export default function ItemFormModal({
  isOpen,
  onClose,
  onSave,
  categories,
  warehouseType,
  item,
}: ItemFormModalProps) {
  const [formData, setFormData] = useState<CreateInventoryItemDto>({
    name: '',
    categoryId: '',
    unitPrice: 0,
    unit: UnitType.CAI,
    minStock: 10,
    warehouseType,
    expiryDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        categoryId: item.categoryId,
        unitPrice: item.unitPrice,
        unit: item.unit,
        minStock: item.minStock,
        warehouseType: item.warehouseType,
        expiryDate: item.expiryDate || '',
      });
    } else {
      setFormData({
        name: '',
        categoryId: categories.length > 0 ? categories[0].id || '' : '',
        unitPrice: 0,
        unit: UnitType.CAI,
        minStock: 10,
        warehouseType,
        expiryDate: '',
      });
    }
  }, [item, categories, warehouseType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate expiry date for cold storage
    if (warehouseType === WarehouseType.COLD && !formData.expiryDate) {
      alert('Hạn sử dụng là bắt buộc đối với kho lạnh');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: String(cat.categoryId ?? cat.id ?? ''),
    label: cat.categoryName ?? cat.name ?? '',
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Chỉnh sửa vật tư' : 'Thêm vật tư mới'}</DialogTitle>
          <DialogDescription className="sr-only">
            {item ? 'Cập nhật thông tin vật tư' : 'Thêm vật tư mới vào danh mục'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="categoryId">Danh mục *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value: string) => setFormData({ ...formData, categoryId: value })}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Tên vật tư *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên vật tư"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitPrice">Đơn giá *</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="1000"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="unit">Đơn vị tính *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value: string) => setFormData({ ...formData, unit: value as UnitType })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="minStock">Tồn kho tối thiểu</Label>
            <Input
              id="minStock"
              type="number"
              min="0"
              value={formData.minStock || 0}
              onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
              placeholder="10"
            />
            <p className="text-xs text-gray-500 mt-1">Cảnh báo khi tồn kho dưới mức này</p>
          </div>

          {warehouseType === WarehouseType.COLD && (
            <div>
              <Label htmlFor="expiryDate">Hạn sử dụng *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
              <p className="text-xs text-red-500 mt-1">Bắt buộc đối với kho lạnh</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
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
