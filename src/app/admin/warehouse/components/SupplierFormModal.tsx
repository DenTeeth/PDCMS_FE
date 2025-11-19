'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreateSupplierRequest, UpdateSupplierRequest, SupplierDetailResponse } from '@/types/supplier';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateSupplierRequest | UpdateSupplierRequest) => Promise<void>;
  supplier?: SupplierDetailResponse | null;
}

export default function SupplierFormModal({
  isOpen,
  onClose,
  onSave,
  supplier,
}: SupplierFormModalProps) {
  const [formData, setFormData] = useState<CreateSupplierRequest>({
    supplierCode: '',
    supplierName: '',
    phoneNumber: '',
    email: '',
    address: '',
    contactPerson: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplierCode: supplier.supplierCode,
        supplierName: supplier.supplierName,
        phoneNumber: supplier.phoneNumber || '',
        email: supplier.email || '',
        address: supplier.address || '',
        contactPerson: supplier.contactPerson || '',
        notes: supplier.notes || '',
      });
    } else {
      setFormData({
        supplierCode: '',
        supplierName: '',
        phoneNumber: '',
        email: '',
        address: '',
        contactPerson: '',
        notes: '',
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.supplierCode.trim()) {
      alert('Mã nhà cung cấp là bắt buộc!');
      return;
    }
    if (!formData.supplierName.trim()) {
      alert('Tên nhà cung cấp là bắt buộc!');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      alert('Số điện thoại là bắt buộc!');
      return;
    }
    if (!formData.email.trim()) {
      alert('Email là bắt buộc!');
      return;
    }
    if (!formData.address.trim()) {
      alert('Địa chỉ là bắt buộc!');
      return;
    }
    

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
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplierCode">Mã NCC <span className="text-red-500">*</span></Label>
              <Input
                id="supplierCode"
                value={formData.supplierCode}
                onChange={(e) => setFormData({ ...formData, supplierCode: e.target.value })}
                placeholder="Ví dụ: SUP001"
                required
              />
            </div>
            <div>
              <Label htmlFor="supplierName">Tên nhà cung cấp <span className="text-red-500">*</span></Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="VD: Công ty TNHH ABC"
                required
              />
            </div>
          </div>

          {/* Row 2: Contact Person & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phoneNumber">Điện thoại <span className="text-red-500">*</span></Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="VD: 0901234567"
                pattern="[0-9]{10,15}"
                required
              />
            </div>
          </div>

          {/* Row 3: Email */}
          <div>
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="VD: contact@abc.com"
              required
            />
          </div>

          {/* Row 4: Address */}
          <div>
            <Label htmlFor="address">Địa chỉ <span className="text-red-500">*</span></Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM"
              rows={2}
              required
            />
          </div>

          {/* Row 5: Notes */}
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
