'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import storageService from '@/services/storageService';
import supplierService from '@/services/supplierService';
import inventoryService, { type InventorySummary } from '@/services/inventoryService';

interface EditImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number | null;
}

interface EditImportFormData {
  supplierId: number;
  transactionDate: string;
  notes: string;
  items: {
    itemMasterId: number;
    lotNumber: string;
    quantity: number;
    importPrice: number;
    expiryDate: string;
  }[];
}

export default function EditImportModal({
  isOpen,
  onClose,
  transactionId,
}: EditImportModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Fetch transaction detail
  const { data: transaction, isLoading: loadingTransaction } = useQuery({
    queryKey: ['storageTransaction', transactionId],
    queryFn: () => storageService.getById(transactionId!),
    enabled: isOpen && !!transactionId,
  });

  // Fetch suppliers
  const { data: suppliersPage } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () =>
      supplierService.getAll({
        page: 0,
        size: 1000,
        sort: 'supplierName,asc',
      }),
    enabled: isOpen,
  });

  const suppliers = suppliersPage?.content || [];

  // Fetch item masters
  const { data: itemSummaryPage } = useQuery({
    queryKey: ['itemMasters'],
    queryFn: async () => inventoryService.getSummary({ size: 1000, page: 0 }),
    enabled: isOpen,
  });

  const items: InventorySummary[] = itemSummaryPage?.content || [];

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<EditImportFormData>({
    defaultValues: {
      supplierId: 0,
      transactionDate: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Populate form when transaction loaded
  useEffect(() => {
    if (transaction && isOpen && transaction.transactionType === 'IMPORT') {
      // Map transaction data to form
      const formData: EditImportFormData = {
        supplierId: transaction.supplierId || transaction.supplier_id || 0,
        transactionDate: transaction.transactionDate?.split('T')[0] || 
                         transaction.transaction_date?.split('T')[0] || 
                         new Date().toISOString().split('T')[0],
        notes: transaction.notes || '',
        items: (transaction.items || []).map(item => ({
          itemMasterId: item.itemMasterId || item.item_master_id || 0,
          lotNumber: item.lotNumber || item.lot_number || '',
          quantity: item.quantityChange || item.quantity_change || 0,
          importPrice: item.unitPrice || item.unit_price || 0,
          expiryDate: item.expiryDate?.split('T')[0] || 
                      item.expiry_date?.split('T')[0] || 
                      '',
        })),
      };
      
      console.log('📝 Populating form with transaction data:', {
        transactionId,
        supplierId: formData.supplierId,
        itemsCount: formData.items.length,
        transaction,
      });
      
      reset(formData);
    } else if (isOpen && !transaction && !loadingTransaction) {
      // Reset form if modal opened but no transaction (shouldn't happen, but handle gracefully)
      reset({
        supplierId: 0,
        transactionDate: '',
        notes: '',
        items: [],
      });
    }
  }, [transaction, isOpen, reset, transactionId, loadingTransaction]);

  const onSubmit = async (data: EditImportFormData) => {
    if (!transactionId) return;

    // Validation
    if (!data.supplierId || data.supplierId === 0) {
      toast.error('Vui lòng chọn nhà cung cấp!');
      return;
    }

    if (data.items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 vật tư!');
      return;
    }

    // Validate transaction is not too old (30 days)
    const transactionDate = new Date(transaction!.transactionDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
      toast.error('Không thể sửa phiếu nhập quá 30 ngày!');
      return;
    }

    // Check for empty items
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.itemMasterId || !item.lotNumber || item.quantity <= 0) {
        toast.error(`Vui lòng điền đầy đủ thông tin vật tư dòng ${i + 1}!`);
        return;
      }
    }

    setLoading(true);
    try {
      // TODO: Call API to update full import transaction
      // Currently backend only supports updateNotes
      // For now, just update notes as workaround
      await storageService.updateNotes(transactionId, data.notes);
      
      toast.success('Cập nhật phiếu nhập thành công!');
      toast.warning('Lưu ý: Hiện tại chỉ cập nhật được ghi chú. Vui lòng liên hệ IT để cập nhật items.');
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storageTransaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật phiếu nhập!');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    append({
      itemMasterId: items.length > 0 ? items[0].itemMasterId : 0,
      lotNumber: '',
      quantity: 1,
      importPrice: 0,
      expiryDate: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length <= 1) {
      toast.error('Phải có ít nhất 1 vật tư trong phiếu!');
      return;
    }
    remove(index);
  };

  if (!transactionId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phiếu nhập #{transaction?.transactionCode}</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin phiếu nhập kho. Lưu ý: Không thể sửa phiếu quá 30 ngày.
          </DialogDescription>
        </DialogHeader>

        {loadingTransaction ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm text-gray-600">Đang tải thông tin phiếu nhập...</p>
          </div>
        ) : !transaction ? (
          <div className="flex flex-col justify-center items-center py-12">
            <p className="text-red-600 mb-2">Không thể tải thông tin phiếu nhập</p>
            <Button variant="outline" onClick={onClose}>Đóng</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierId">Nhà cung cấp *</Label>
                <select
                  id="supplierId"
                  {...register('supplierId', { required: true, valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value={0}>-- Chọn nhà cung cấp --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.supplierId} value={sup.supplierId}>
                      {sup.supplierName}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="text-sm text-red-600 mt-1">Vui lòng chọn nhà cung cấp</p>
                )}
              </div>

              <div>
                <Label htmlFor="transactionDate">Ngày nhập *</Label>
                <div className="relative">
                  <Input
                    id="transactionDate"
                    type="date"
                    {...register('transactionDate', { required: true })}
                    className="pl-10"
                  />
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
                  />
                </div>
                {errors.transactionDate && (
                  <p className="text-sm text-red-600 mt-1">Vui lòng chọn ngày nhập</p>
                )}
              </div>
            </div>

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base font-semibold">Danh sách vật tư</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                  Thêm vật tư
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vật tư</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Số lô</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Số lượng</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hạn sử dụng</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="px-4 py-2">
                          <select
                            {...register(`items.${index}.itemMasterId`, { valueAsNumber: true })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            <option value={0}>-- Chọn vật tư --</option>
                            {items.map((item) => (
                              <option key={item.itemMasterId} value={item.itemMasterId}>
                                {item.itemCode} - {item.itemName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            {...register(`items.${index}.lotNumber`)}
                            placeholder="LOT123"
                            className="text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            min={1}
                            className="text-sm w-24"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="date"
                            {...register(`items.${index}.expiryDate`)}
                            className="text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Nhập ghi chú..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
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
