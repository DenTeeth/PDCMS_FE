'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateSupplierRequest, UpdateSupplierRequest, SupplierDetailResponse } from '@/types/supplier';
import { supplierService } from '@/services/supplierService';

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
  const [formData, setFormData] = useState<CreateSupplierRequest | UpdateSupplierRequest>({
    supplierName: '',
    phone: '',
    address: '',
    email: '',
    notes: '',
    isBlacklisted: false,
  });
  const [loading, setLoading] = useState(false);

  // Fetch full supplier detail when editing
  const { data: fullSupplierDetail, isLoading: loadingSupplierDetail, error: supplierDetailError } = useQuery({
    queryKey: ['supplierDetail', supplier?.supplierId],
    queryFn: () => supplierService.getById(supplier!.supplierId),
    enabled: isOpen && !!supplier?.supplierId,
    retry: 1,
  });

  // Use full supplier detail if available, otherwise fallback to passed supplier
  const supplierData = fullSupplierDetail || supplier;

  useEffect(() => {
    if (supplierData && isOpen) {
      // For update, use UpdateSupplierRequest format
      setFormData({
        supplierName: supplierData.supplierName || '',
        phoneNumber: supplierData.phoneNumber || '',
        address: supplierData.address || '',
        email: supplierData.email || '',
        contactPerson: supplierData.contactPerson || '',
        notes: supplierData.notes || '',
        isActive: supplierData.isActive ?? true,
        isBlacklisted: (supplierData as any).isBlacklisted ?? false,
      } as UpdateSupplierRequest);
    } else if (!supplierData && isOpen) {
      // Reset form when creating new supplier
      setFormData({
        supplierName: '',
        phone: '',
        address: '',
        email: '',
        notes: '',
        isBlacklisted: false,
      } as CreateSupplierRequest);
    }
  }, [supplierData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - Only required fields
    if (!formData.supplierName?.trim()) {
      alert('Tên nhà cung cấp là bắt buộc!');
      return;
    }

    // Check phone field (different for create vs update)
    const phone = (formData as any).phone || (formData as any).phoneNumber;
    if (!phone?.trim()) {
      alert('Số điện thoại là bắt buộc!');
      return;
    }

    // Validate phone format (10-11 digits)
    if (!/^[0-9]{10,11}$/.test(phone)) {
      alert('Số điện thoại phải có 10-11 chữ số!');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</DialogTitle>
          <DialogDescription>
            {supplier
              ? 'Cập nhật thông tin nhà cung cấp'
              : 'Thêm mới nhà cung cấp vật tư y tế vào hệ thống'}
          </DialogDescription>
        </DialogHeader>

        {loadingSupplierDetail ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : supplierDetailError ? (
          <div className="text-center py-12 text-red-500">
            <p className="font-semibold">Không thể tải thông tin nhà cung cấp</p>
            <p className="text-sm text-gray-500 mt-2">
              {(supplierDetailError as any)?.response?.data?.message || 'Vui lòng thử lại sau'}
            </p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-1">
              <div className="space-y-4">
                {/* Row 1: Name */}
                <div className="space-y-1">
                  <Label htmlFor="supplierName">Tên nhà cung cấp <span className="text-red-500">*</span></Label>
                  <Input
                    id="supplierName"
                    value={formData.supplierName || ''}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="VD: Công ty TNHH ABC"
                    required
                  />
                  {supplier && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Mã NCC: {supplierData?.supplierCode} (tự động tạo)
                    </p>
                  )}
                </div>

                {/* Row 1.5: Contact Person (only for update) */}
                {supplier && (
                  <div className="space-y-1">
                    <Label htmlFor="contactPerson">Người liên hệ</Label>
                    <Input
                      id="contactPerson"
                      value={(formData as UpdateSupplierRequest).contactPerson || ''}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value } as UpdateSupplierRequest)}
                      placeholder="VD: Nguyễn Văn A - Sales Manager"
                    />
                  </div>
                )}

                {/* Row 2: Address */}
                <div className="space-y-1">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM"
                    className="resize-none"
                    rows={2}
                  />
                </div>

                {/* Row 3: Phone & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="phone">Điện thoại <span className="text-red-500">*</span></Label>
                    <Input
                      id="phone"
                      value={(formData as any).phone || (formData as any).phoneNumber || ''}
                      onChange={(e) => {
                        if (supplier) {
                          setFormData({ ...formData, phoneNumber: e.target.value } as UpdateSupplierRequest);
                        } else {
                          setFormData({ ...formData, phone: e.target.value } as CreateSupplierRequest);
                        }
                      }}
                      placeholder="VD: 0901234567"
                      pattern="[0-9]{10,11}"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">10-11 chữ số</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="VD: contact@abc.com"
                    />
                  </div>
                </div>

                {/* Row 3.5: Risk Management Flags (only for update) */}
                {supplier && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={(formData as UpdateSupplierRequest).isActive ?? true}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isActive: checked as boolean } as UpdateSupplierRequest)
                        }
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        Đang hoạt động
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isBlacklisted"
                        checked={(formData as UpdateSupplierRequest).isBlacklisted ?? false}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isBlacklisted: checked as boolean } as UpdateSupplierRequest)
                        }
                      />
                      <Label htmlFor="isBlacklisted" className="cursor-pointer text-red-600">
                        Đưa vào danh sách đen
                      </Label>
                    </div>
                  </div>
                )}

                {/* Row 4: Notes */}
                <div className="space-y-1">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Nhập ghi chú về nhà cung cấp (nếu có)"
                    className="resize-none"
                    rows={3}
                  />
                </div>

                {/* Info for create mode */}
                {!supplier && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <p className="font-semibold mb-1">Lưu ý:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Mã nhà cung cấp sẽ được tự động tạo (SUP-001, SUP-002, ...)</li>
                      <li>Tên nhà cung cấp phải là duy nhất (không phân biệt hoa thường)</li>
                      <li>Email nếu có cũng phải là duy nhất</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky footer with buttons */}
            <div className="flex gap-2 pt-4 border-t mt-4 bg-white">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Hủy
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
