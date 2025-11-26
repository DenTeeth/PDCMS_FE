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
import { inventoryService, InventorySummary } from '@/services/inventoryService';
import { supplierService } from '@/services/supplierService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBox } from '@fortawesome/free-solid-svg-icons';

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
    address: '',
    phoneNumber: '',
    email: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Fetch full supplier detail when editing
  const { data: fullSupplierDetail, isLoading: loadingSupplierDetail } = useQuery({
    queryKey: ['supplierDetail', supplier?.supplierId],
    queryFn: () => supplierService.getById(supplier!.supplierId),
    enabled: isOpen && !!supplier?.supplierId,
  });

  // Fetch all inventory items
  const { data: allItemsResponse = [] } = useQuery({
    queryKey: ['inventorySummary', { search: itemSearchQuery }],
    queryFn: () => inventoryService.getSummary({ search: itemSearchQuery || undefined }),
    enabled: isOpen,
  });

  // Extract array from Page<T> response
  const filteredItems: InventorySummary[] = Array.isArray(allItemsResponse) 
    ? allItemsResponse 
    : (allItemsResponse as any)?.content || [];

  // Use full supplier detail if available, otherwise fallback to passed supplier
  const supplierData = fullSupplierDetail || supplier;

  useEffect(() => {
    if (supplierData && isOpen) {
      setFormData({
        supplierCode: supplierData.supplierCode || '',
        supplierName: supplierData.supplierName || '',
        address: supplierData.address || '',
        phoneNumber: supplierData.phoneNumber || '',
        email: supplierData.email || '',
        notes: supplierData.notes || '',
      });
      // Set selected items from supplier detail
      const itemIds = supplierData.suppliedItems?.map(item => item.itemMasterId).filter(Boolean) || [];
      setSelectedItemIds(itemIds);
    } else if (!supplierData && isOpen) {
      // Reset form when creating new supplier
      setFormData({
        supplierCode: '',
        supplierName: '',
        address: '',
        phoneNumber: '',
        email: '',
        notes: '',
      });
      setSelectedItemIds([]);
    }
    setItemSearchQuery('');
  }, [supplierData, isOpen]);

  const handleToggleItem = (itemId: number) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - Only required fields
    if (!formData.supplierCode.trim()) {
      alert('Mã nhà cung cấp là bắt buộc!');
      return;
    }
    if (!formData.supplierName.trim()) {
      alert('Tên nhà cung cấp là bắt buộc!');
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
      <DialogContent className={supplier ? "max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" : "max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"}>
        <DialogHeader>
          <DialogTitle>{supplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</DialogTitle>
          <DialogDescription>
            {supplier 
              ? 'Cập nhật thông tin nhà cung cấp và các vật tư cung cấp' 
              : 'Thêm mới nhà cung cấp vật tư y tế vào hệ thống'}
          </DialogDescription>
        </DialogHeader>

        {loadingSupplierDetail ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className={supplier ? "grid grid-cols-2 gap-6 overflow-hidden flex-1" : "overflow-hidden flex-1"}>
          {/* Left Column: Form */}
          <div className="overflow-y-auto pr-4">
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

              {/* Row 2: Address */}
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

              {/* Row 3: Phone & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber">Điện thoại</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="VD: 0901234567"
                    pattern="[0-9]{10,15}"
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
              </div>

              {/* Row 4: Notes */}
              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Nhập ghi chú về nhà cung cấp (nếu có)"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4 sticky bottom-0 bg-white pb-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu'}
                </Button>
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Hủy
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Item Selection (Only show when editing) */}
          {supplier && (
          <div className="border-l pl-6 flex flex-col overflow-hidden">
            <div className="mb-4">
              <Label className="text-sm font-semibold mb-2 block">
                Vật tư cung cấp ({selectedItemIds.length} đã chọn)
              </Label>
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm vật tư..."
                  className="pl-10"
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg bg-muted/30 p-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FontAwesomeIcon icon={faBox} className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Không tìm thấy vật tư</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.itemMasterId}
                      className="flex items-center gap-3 p-3 bg-white rounded border hover:border-primary/50 cursor-pointer"
                      onClick={() => handleToggleItem(item.itemMasterId)}
                    >
                      <Checkbox
                        checked={selectedItemIds.includes(item.itemMasterId)}
                        onCheckedChange={() => handleToggleItem(item.itemMasterId)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          Mã: {item.itemCode} | {item.unitOfMeasure}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
