'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faCalendar, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import storageService, { StorageTransaction } from '@/services/storageService';

interface EditExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number | null;
}

interface EditExportItem {
  batch_id: number;
  lot_number: string;
  item_name?: string;
  quantity: number;
  max_quantity?: number; // Available quantity in batch
  expiry_date?: string;
}

export default function EditExportModal({
  isOpen,
  onClose,
  transactionId,
}: EditExportModalProps) {
  const queryClient = useQueryClient();
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<EditExportItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch transaction detail
  const { data: transaction, isLoading: loadingTransaction } = useQuery({
    queryKey: ['storageTransaction', transactionId],
    queryFn: () => storageService.getById(transactionId!),
    enabled: isOpen && !!transactionId,
  });

  // Populate form when transaction loaded
  useEffect(() => {
    if (transaction && isOpen) {
      setTransactionDate(transaction.transactionDate?.split('T')[0] || '');
      setNotes(transaction.notes || '');
      
      // Map transaction items to edit items
      setItems(transaction.items.map(item => ({
        batch_id: item.transactionItemId || 0, // Assuming batch_id is stored somewhere
        lot_number: item.lotNumber,
        item_name: item.itemName,
        quantity: Math.abs(item.quantityChange), // Export is negative
        max_quantity: Math.abs(item.quantityChange), // Original export quantity
        expiry_date: item.expiryDate,
      })));
    }
  }, [transaction, isOpen]);

  const handleSubmit = async () => {
    if (!transactionId || !transaction) return;

    // Validation: transaction not too old
    const txnDate = new Date(transaction.transactionDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
      toast.error('Không thể sửa phiếu xuất quá 30 ngày!');
      return;
    }

    if (items.length === 0) {
      toast.error('Phải có ít nhất 1 vật tư trong phiếu!');
      return;
    }

    // Validate quantities
    for (const item of items) {
      if (item.quantity <= 0) {
        toast.error(`Số lượng xuất phải lớn hơn 0 (${item.item_name})`);
        return;
      }
    }

    setLoading(true);
    try {
      // TODO: Call API to update full export transaction
      // Currently backend only supports updateNotes
      await storageService.updateNotes(transactionId, notes);
      
      toast.success('Cập nhật phiếu xuất thành công!');
      toast.warning('Lưu ý: Hiện tại chỉ cập nhật được ghi chú. Vui lòng liên hệ IT để cập nhật items.');
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storageTransaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật phiếu xuất!');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Phải có ít nhất 1 vật tư trong phiếu!');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = newQuantity;
    setItems(updatedItems);
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (expiryDate?: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return null;

    if (days < 0) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3" />
          Đã hết hạn
        </span>
      );
    } else if (days <= 30) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 flex items-center gap-1">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3" />
          Còn {days} ngày
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
        Còn {days} ngày
      </span>
    );
  };

  if (!transactionId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phiếu xuất #{transaction?.transactionCode}</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin phiếu xuất kho. Lưu ý: Không thể sửa phiếu quá 30 ngày.
          </DialogDescription>
        </DialogHeader>

        {loadingTransaction ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transaction_date">Ngày xuất</Label>
                <div className="relative">
                  <Input
                    id="transaction_date"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="pl-10"
                  />
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
                  />
                </div>
              </div>
            </div>

            {/* Items List */}
            <div>
              <Label className="text-base font-semibold mb-4 block">Danh sách vật tư</Label>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vật tư</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Số lô</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Số lượng</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hạn dùng</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Chưa có vật tư nào
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">{item.item_name || '-'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-600">{item.lot_number}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                              min={1}
                              className="w-24 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {getExpiryBadge(item.expiry_date)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Lưu ý khi chỉnh sửa phiếu xuất:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Không được sửa số lượng vượt quá tồn kho hiện tại</li>
                      <li>Phiếu quá 30 ngày không thể chỉnh sửa</li>
                      <li>Hiện tại chỉ cập nhật được ghi chú, items cần liên hệ IT</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Hủy
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
