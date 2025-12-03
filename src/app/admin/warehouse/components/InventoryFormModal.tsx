'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Inventory, CreateInventoryDto, UpdateInventoryDto, WarehouseType, UnitType, InventoryStatus } from '@/types/warehouse';
import supplierService from '@/services/supplierService';
import type { SupplierSummaryResponse } from '@/types/supplier';
import { toast } from 'sonner';

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInventoryDto | UpdateInventoryDto) => Promise<void>;
  inventory?: Inventory | null;
}

export default function InventoryFormModal({
  isOpen,
  onClose,
  onSave,
  inventory,
}: InventoryFormModalProps) {
  const [formData, setFormData] = useState<CreateInventoryDto>({
    supplierId: 0,
    itemName: '',
    warehouseType: WarehouseType.NORMAL,
    category: '',
    unitPrice: 0,
    unitOfMeasure: UnitType.CAI,
    stockQuantity: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    expiryDate: '',
    isCertified: false,
    certificationDate: '',
    status: InventoryStatus.ACTIVE,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierSummaryResponse[]>([]);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await supplierService.getAll({
          page: 0,
          size: 1000,
          sort: 'supplierName,asc',
        });
        setSuppliers(data?.content || []);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('Không thể tải danh sách nhà cung cấp');
      }
    };
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (inventory) {
      setFormData({
        supplierId: inventory.supplierId,
        itemName: inventory.itemName,
        warehouseType: inventory.warehouseType,
        category: inventory.category || '',
        unitPrice: inventory.unitPrice,
        unitOfMeasure: inventory.unitOfMeasure,
        stockQuantity: inventory.stockQuantity,
        minStockLevel: inventory.minStockLevel || 0,
        maxStockLevel: inventory.maxStockLevel || 0,
        expiryDate: inventory.expiryDate || '',
        isCertified: inventory.isCertified,
        certificationDate: inventory.certificationDate || '',
        status: inventory.status,
        notes: inventory.notes || '',
      });
    } else {
      setFormData({
        supplierId: 0,
        itemName: '',
        warehouseType: WarehouseType.NORMAL,
        category: '',
        unitPrice: 0,
        unitOfMeasure: UnitType.CAI,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        expiryDate: '',
        isCertified: false,
        certificationDate: '',
        status: InventoryStatus.ACTIVE,
        notes: '',
      });
    }
  }, [inventory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.warehouseType === WarehouseType.COLD && !formData.expiryDate) {
      toast.error('Kho lạnh bắt buộc phải có ngày hết hạn');
      return;
    }
    
    if (formData.stockQuantity <= 0) {
      toast.error('Số lượng tồn kho phải lớn hơn 0');
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inventory ? 'Chỉnh sửa vật tư' : 'Thêm vật tư mới'}</DialogTitle>
          <DialogDescription className="sr-only">
            {inventory ? 'Cập nhật thông tin tồn kho vật tư' : 'Thêm vật tư vào tồn kho'}
          </DialogDescription>
          <DialogDescription>
            {inventory 
              ? 'Cập nhật thông tin vật tư y tế trong kho' 
              : 'Thêm mới vật tư y tế vào kho'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="itemName">Tên vật tư *</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="VD: Thuốc tê Lidocaine 2%"
                required
              />
            </div>

            <div>
              <Label htmlFor="supplierId">Nhà cung cấp *</Label>
              <select
                id="supplierId"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: Number(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value={0}>Chọn nhà cung cấp</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.supplierId}>
                    {supplier.supplierName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="category">Nhóm vật tư</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="VD: Thuốc tê"
              />
            </div>

            <div>
              <Label htmlFor="warehouseType">Loại kho *</Label>
              <select
                id="warehouseType"
                value={formData.warehouseType}
                onChange={(e) => setFormData({ ...formData, warehouseType: e.target.value as WarehouseType })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value={WarehouseType.COLD}>Kho lạnh</option>
                <option value={WarehouseType.NORMAL}>Kho thường</option>
              </select>
            </div>

            <div>
              <Label htmlFor="unitOfMeasure">Đơn vị tính *</Label>
              <select
                id="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value as UnitType })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value={UnitType.CAI}>Cái</option>
                <option value={UnitType.HOP}>Hộp</option>
                <option value={UnitType.LO}>Lọ</option>
                <option value={UnitType.GOI}>Gói</option>
                <option value={UnitType.CHAI}>Chai</option>
                <option value={UnitType.THUNG}>Thùng</option>
              </select>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-sm mb-3">Giá & Tồn kho</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="unitPrice">Đơn giá *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  placeholder="150000"
                  required
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="stockQuantity">Số lượng *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                  placeholder="100"
                  required
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="minStockLevel">Tồn tối thiểu</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                  placeholder="20"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="maxStockLevel">Tồn tối đa</Label>
                <Input
                  id="maxStockLevel"
                  type="number"
                  value={formData.maxStockLevel}
                  onChange={(e) => setFormData({ ...formData, maxStockLevel: Number(e.target.value) })}
                  placeholder="500"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Expiry & Certification */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-sm mb-3">Hạn sử dụng & Chứng nhận</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expiryDate">
                  Hạn sử dụng {formData.warehouseType === WarehouseType.COLD && '*'}
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required={formData.warehouseType === WarehouseType.COLD}
                />
              </div>

              <div>
                <Label htmlFor="certificationDate">Ngày chứng nhận</Label>
                <Input
                  id="certificationDate"
                  type="date"
                  value={formData.certificationDate}
                  onChange={(e) => setFormData({ ...formData, certificationDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="status">Trạng thái *</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value={InventoryStatus.ACTIVE}>Hoạt động</option>
                  <option value={InventoryStatus.INACTIVE}>Ngưng</option>
                  <option value={InventoryStatus.OUT_OF_STOCK}>Hết hàng</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="isCertified" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="isCertified"
                  type="checkbox"
                  checked={formData.isCertified}
                  onChange={(e) => setFormData({ ...formData, isCertified: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Đã được chứng nhận</span>
              </Label>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-4 mt-4">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="VD: Bảo quản ở 2-8°C"
              rows={3}
            />
          </div>

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
