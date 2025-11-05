'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '@/types/warehouse';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateSupplierDto | UpdateSupplierDto) => Promise<void>;
  supplier?: Supplier | null;
}

export default function SupplierFormModal({
  isOpen,
  onClose,
  onSave,
  supplier,
}: SupplierFormModalProps) {
  const [formData, setFormData] = useState<CreateSupplierDto>({
    supplierName: '',
    phoneNumber: '',
    address: '',
    email: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplierName: supplier.supplierName,
        phoneNumber: supplier.phoneNumber,
        address: supplier.address,
        email: supplier.email || '',
        notes: supplier.notes || '',
      });
    } else {
      setFormData({
        supplierName: '',
        phoneNumber: '',
        address: '',
        email: '',
        notes: '',
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</DialogTitle>
          <DialogDescription>
            {supplier 
              ? 'Cập nhật thông tin nhà cung cấp vật tư y tế' 
              : 'Thêm mới nhà cung cấp vật tư y tế vào hệ thống'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="supplierName">Tên nhà cung cấp *</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="VD: Công ty TNHH Thiết bị Y tế ABC"
                required
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Số điện thoại *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="VD: 0901234567"
                pattern="[0-9]{10,15}"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="VD: contact@abc.com"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Địa chỉ *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM"
                rows={2}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-4 mt-4">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Nhập ghi chú về nhà cung cấp (nếu có)"
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
