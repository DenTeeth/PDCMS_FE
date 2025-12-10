'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import {
  StorageTransaction,
  CreateTransactionDto,
  TransactionItem,
  TransactionType,
  WarehouseType,
  Supplier,
  InventoryItem,
} from '@/types/warehouse';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTransactionDto) => Promise<void>;
  type: TransactionType;
  warehouseType: WarehouseType;
  suppliers: Supplier[];
  inventoryItems: InventoryItem[];
  transaction?: StorageTransaction | null;
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  onSave,
  type,
  warehouseType,
  suppliers,
  inventoryItems,
  transaction,
}: TransactionFormModalProps) {
  const [formData, setFormData] = useState<CreateTransactionDto>({
    type,
    warehouseType,
    supplierId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    items: [],
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        warehouseType: transaction.warehouseType,
        supplierId: transaction.supplierId || '',
        transactionDate: transaction.transactionDate,
        items: transaction.items,
        notes: transaction.notes || '',
      });
    } else {
      setFormData({
        type,
        warehouseType,
        supplierId: '',
        transactionDate: new Date().toISOString().split('T')[0],
        items: [],
        notes: '',
      });
    }
  }, [transaction, type, warehouseType, isOpen]);

  const handleAddItem = () => {
    const newItem: TransactionItem = {
      itemId: inventoryItems.length > 0 ? inventoryItems[0].id : '',
      quantity: 1,
      unitPrice: inventoryItems.length > 0 ? inventoryItems[0].unitPrice : 0,
      expiryDate: '',
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill unit price when item is selected
    if (field === 'itemId') {
      const selectedItem = inventoryItems.find((item) => item.id === value);
      if (selectedItem) {
        newItems[index].unitPrice = selectedItem.unitPrice;
        newItems[index].itemName = selectedItem.name;
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (type === TransactionType.IMPORT && !formData.supplierId) {
      alert('Vui lòng chọn nhà cung cấp cho phiếu nhập');
      return;
    }

    if (formData.items.length === 0) {
      alert('Vui lòng thêm ít nhất một vật tư');
      return;
    }

    // Validate expiry date for cold storage IN transactions
    if (type === TransactionType.IMPORT && warehouseType === WarehouseType.COLD) {
      const missingExpiryDate = formData.items.some((item) => !item.expiryDate);
      if (missingExpiryDate) {
        alert('Hạn sử dụng là bắt buộc cho phiếu nhập kho lạnh');
        return;
      }
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      alert(error.message || 'Lỗi khi lưu phiếu');
    } finally {
      setLoading(false);
    }
  };

  const supplierOptions = suppliers.map((sup) => ({
    value: String(sup.supplierId),
    label: sup.supplierName,
  }));

  const itemOptions = inventoryItems.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})`,
  }));

  const totalCost = formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction
              ? 'Chỉnh sửa phiếu'
              : type === TransactionType.IMPORT
              ? 'Thêm phiếu nhập'
              : 'Thêm phiếu xuất'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {transaction ? 'Cập nhật thông tin phiếu giao dịch' : type === TransactionType.IMPORT ? 'Tạo phiếu nhập kho mới' : 'Tạo phiếu xuất kho mới'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {type === TransactionType.IMPORT && (
              <div>
                <Label htmlFor="supplierId">Nhà cung cấp *</Label>
                <Select
                  value={formData.supplierId || ''}
                  onValueChange={(value: string) => setFormData({ ...formData, supplierId: value })}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {supplierOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="transactionDate">
                {type === TransactionType.IMPORT ? 'Ngày nhập' : 'Ngày xuất'} *
              </Label>
              <Input
                id="transactionDate"
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Danh sách vật tư *</Label>
              <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm vật tư
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Vật tư</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 w-24">Số lượng</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 w-32">Đơn giá</th>
                    {type === TransactionType.IMPORT && warehouseType === WarehouseType.COLD && (
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 w-32">Hạn SD</th>
                    )}
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 w-32">Thành tiền</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-600 w-16">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-3">
                        <Select
                          value={item.itemId}
                          onValueChange={(value: string) => handleItemChange(index, 'itemId', value)}
                          required
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn vật tư" />
                          </SelectTrigger>
                          <SelectContent align="start">
                            {itemOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          required
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          required
                        />
                      </td>
                      {type === TransactionType.IMPORT && warehouseType === WarehouseType.COLD && (
                        <td className="py-2 px-3">
                          <Input
                            type="date"
                            value={item.expiryDate || ''}
                            onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                            required
                          />
                        </td>
                      )}
                      <td className="py-2 px-3 text-sm font-medium">
                        {(item.quantity * item.unitPrice).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td
                      colSpan={
                        type === TransactionType.IMPORT && warehouseType === WarehouseType.COLD ? 4 : 3
                      }
                      className="py-2 px-3 text-right font-medium"
                    >
                      Tổng chi phí:
                    </td>
                    <td className="py-2 px-3 text-sm font-bold text-blue-600">
                      {totalCost.toLocaleString('vi-VN')} đ
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              {formData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Chưa có vật tư nào</p>
                  <p className="text-sm">Click "Thêm vật tư" để bắt đầu</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Nhập ghi chú (tùy chọn)"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu phiếu'}
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
